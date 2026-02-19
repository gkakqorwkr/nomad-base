/**
 * 노마드 베이스 - 파밍 엔진
 * 시간 경과에 따른 자원 자동 생성 및 보너스 계산을 담당합니다.
 */
// import { dataManager } from './dataManager.js';
// import { REGIONS } from './regions.js';

class FarmingEngine {
    constructor() {
        this.BASE_SCRAP_RATE = 0.5; // 초당 0.5 고철
        this.updateInterval = null;
    }

    /** 엔진 시작 */
    start() {
        if (this.updateInterval) return;

        console.log("Nomad Base: Farming Engine Started");
        this.calculateOfflineProgress();

        this.updateInterval = setInterval(() => {
            this.update(1); // 1초 단위 업데이트
        }, 1000);
    }

    /** 게임 업데이트 로직 */
    update(dt) {
        const state = dataManager.state;
        if (state.travel && state.travel.isMoving) return; // 이동 중에는 파밍 중단

        const companions = this.getActiveCompanionData();
        const currentRegion = REGIONS.find(r => r.id === state.currentRegionId) || REGIONS[0];

        // 1. 파밍 배율 계산 (기본 0.5 + 지역 보너스) * 동료 보너스
        let companionBonus = 1.0;
        companions.forEach(c => {
            if (c.bonus) companionBonus += (c.bonus - 1.0);
        });

        // 지역 보너스가 곱셉으로 적용되어 위험 지역의 메리트 부각
        const totalMultiplier = (currentRegion.bonus || 1.0) * companionBonus;
        const scrapGain = this.BASE_SCRAP_RATE * totalMultiplier * dt;

        state.resources.scrap += scrapGain;

        // 2. 희귀 아이템 드롭 판정 (지역 드롭 확률 + 동료 보정)
        this.checkLuckyDrop(companions, currentRegion.rareDropChance || 1); // 기본 1%라도 보장

        // 주기적 저장 (10초마다 또는 획득량이 많을 때)
        if (Math.floor(Date.now() / 1000) % 10 === 0) {
            dataManager.save();
        }

        window.dispatchEvent(new CustomEvent('gameUpdate', { detail: { scrapGain } }));
    }

    /** 현재 파밍에 투입된 동료 데이터 추출 */
    getActiveCompanionData() {
        const state = dataManager.state;
        if (!state || !state.companions) return [];

        // activeCompanions에 담긴 ID와 일치하는 동료 객체들을 찾아 반환
        return state.companions.filter(c => state.activeCompanions.includes(c.id));
    }

    /** 럭키 드롭 (지역 확률 + 레어도 기반) */
    checkLuckyDrop(companions, regionBaseChance) {
        const state = dataManager.state;
        companions.forEach(c => {
            let dropChance = regionBaseChance * 0.01; // 지역 기반 기본 가공 (전수조사 시 0.01배)
            if (c.rarity === 'Super Rare') dropChance *= 5; // SR은 5배 확률
            else if (c.rarity === 'Rare') dropChance *= 2;

            if (Math.random() < dropChance) {
                // 식재료 획득 로직 실체화
                const allIngKeys = Object.keys(INGREDIENTS);
                const randomIngId = allIngKeys[Math.floor(Math.random() * allIngKeys.length)];

                if (!state.ingredients[randomIngId]) state.ingredients[randomIngId] = 0;
                state.ingredients[randomIngId] += 1;

                console.log(`[파밍 성공] ${c.name}이(가) ${INGREDIENTS[randomIngId].icon} ${INGREDIENTS[randomIngId].name}을(를) 찾았습니다!`);

                // 알림 표시 (너무 잦으면 방해되므로 확률적으로 또는 중요도에 따라)
                this.showDropNotification(INGREDIENTS[randomIngId]);
            }
        });
    }

    /** 획득 알림 연출 */
    showDropNotification(item) {
        const notify = document.getElementById('notification-area');
        if (notify) {
            notify.style.display = 'block';
            notify.style.opacity = '1';
            notify.textContent = `🍀 탐사 중 ${item.icon} ${item.name} 획득!`;
            setTimeout(() => { notify.style.opacity = '0'; }, 2000);
        }
    }

    /** 오프라인 보상 계산 */
    calculateOfflineProgress() {
        const now = Date.now();
        const lastUpdate = dataManager.state.lastUpdate;
        const offlineTime = Math.floor((now - lastUpdate) / 1000);

        if (offlineTime > 10) { // 10초 이상 오프라인일 때
            console.log(`${offlineTime}초 동안 자리를 비우셨군요.`);
            this.update(offlineTime);
        }
    }
}

// export const farmingEngine = new FarmingEngine();
window.farmingEngine = new FarmingEngine();

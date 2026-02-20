/**
 * 노마드 베이스 - 파밍 엔진 2.1 (안정화 버전)
 */
class FarmingEngine {
    constructor() {
        this.BASE_SCRAP_RATE = 0.5;
        this.lastUpdate = Date.now(); // 마지막 업데이트 시간 기록
    }

    start() {
        this.lastUpdate = Date.now();
        this.calculateOfflineProgress();
        console.log("Farming Engine Online");
        // [수정] setInterval을 제거합니다. 
        // 메인 루프(main.js)에서 이미 update를 호출하고 있기 때문입니다.
    }

    /**
     * @param {number} now - main.js에서 전달받는 현재 타임스탬프
     */
    update(now) {
        const state = dataManager.state;
        
        // 1. 시간 간격 계산 (초 단위)
        const dt = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        // 너무 짧은 간격이거나 비정상적인 dt(음수 등) 방지
        if (dt <= 0 || dt > 100) return; 

        // 2. 이동 중에는 생산 중단
        if (state.travel && state.travel.isMoving) return;

        const companions = this.getActiveCompanionData();
        const currentRegion = REGIONS.find(r => r.id === state.currentRegionId) || REGIONS[0];

        // 3. 보너스 계산
        let companionBonus = 1.0;
        companions.forEach(c => {
            // 보너스 값이 1.2(20%증가) 형태라고 가정
            companionBonus += (Number(c.bonus || 1.0) - 1.0);
        });

        const relicBonus = itemManager.getRelicBonus ? itemManager.getRelicBonus('scrapMultiplier') : 1.0;
        const totalMultiplier = (currentRegion.bonus || 1.0) * companionBonus * relicBonus;

        // 4. 자원 추가 (반드시 Number로 강제 형변환하여 글자 붙음 방지)
        const currentScrap = Number(state.resources.scrap || 0);
        const gainedScrap = this.BASE_SCRAP_RATE * totalMultiplier * dt;
        
        state.resources.scrap = currentScrap + gainedScrap;

        // 5. 10초마다 자동 저장
        if (Math.floor(now / 1000) % 10 === 0) {
            dataManager.save();
        }

        window.dispatchEvent(new CustomEvent('gameUpdate'));
    }

    /** 수동 탐사 행위 (Scavenge) */
    scavenge() {
        const state = dataManager.state;
        const COST = 5;

        if (Number(state.resources.energy) < COST) {
            return { success: false, message: "에너지가 부족합니다! 요리를 먹어 회복하세요." };
        }

        state.resources.energy = Number(state.resources.energy) - COST;
        if (!state.stats.totalScavenges) state.stats.totalScavenges = 0;
        state.stats.totalScavenges++;

        const rand = Math.random();
        let result = { type: 'nothing', message: "황무지에서 아무것도 찾지 못했습니다." };

        if (rand < 0.4) {
            const allIng = Object.keys(INGREDIENTS);
            const id = allIng[Math.floor(Math.random() * allIng.length)];
            if (!state.inventory.ingredients[id]) state.inventory.ingredients[id] = 0;
            state.inventory.ingredients[id]++;
            result = { type: 'ingredient', item: INGREDIENTS[id], message: `🍀 ${INGREDIENTS[id].icon} ${INGREDIENTS[id].name} 발견!` };
        } else if (rand < 0.7) {
            const partId = 'part_' + (Math.floor(Math.random() * 3) + 1);
            const partNames = ["녹슨 톱니", "낡은 회로", "강철 파편"];
            const partIcons = ["⚙️", "🔌", "🔩"];
            const idx = Math.floor(Math.random() * 3);

            itemManager.addItem(partId, 1, 'items');
            result = { type: 'item', message: `🛠️ 합성 부품: ${partIcons[idx]} ${partNames[idx]} 획득!` };
        } else if (rand < 0.9) {
            const gain = Math.floor(20 + Math.random() * 30);
            state.resources.scrap = Number(state.resources.scrap) + gain;
            result = { type: 'scrap', message: `💰 고철 더미 발견! +${gain}S` };
        } else {
            const damage = 10;
            state.resources.energy = Math.max(0, Number(state.resources.energy) - damage);
            result = { type: 'event', message: `⚠️ 함정에 걸려 에너지를 ${damage} 소모했습니다!` };
        }

        dataManager.save();
        return { success: true, ...result };
    }

    getActiveCompanionData() {
        const state = dataManager.state;
        if (!state.activeCompanions) return [];
        return state.companions.filter(c => state.activeCompanions.includes(c.id));
    }

    calculateOfflineProgress() {
        const now = Date.now();
        const lastUpdate = Number(dataManager.state.lastUpdate || now);
        const offlineTime = Math.floor((now - lastUpdate) / 1000);
        
        // 최대 24시간까지만 방치 수익 허용 (버그 방지)
        const safeOfflineTime = Math.min(offlineTime, 86400);
        
        if (safeOfflineTime > 10) {
            console.log(`오프라인 수익 발생: ${safeOfflineTime}초`);
            this.update(now); // 현재 시점으로 갱신
        }
    }
}

window.farmingEngine = new FarmingEngine();

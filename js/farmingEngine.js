/**
 * 노마드 베이스 - 파밍 엔전 2.0
 * 실시간 고철 획득 + 턴제 탐사(Scavenge) 시스템 통합
 */

class FarmingEngine {
    constructor() {
        this.BASE_SCRAP_RATE = 0.5;
        this.updateInterval = null;
    }

    start() {
        if (this.updateInterval) return;
        this.calculateOfflineProgress();
        this.updateInterval = setInterval(() => this.update(1), 1000);
    }

    update(dt) {
        const state = dataManager.state;
        if (state.travel && state.travel.isMoving) return;

        const companions = this.getActiveCompanionData();
        const currentRegion = REGIONS.find(r => r.id === state.currentRegionId) || REGIONS[0];

        // 동료 보너스 + 유물 보너스
        let companionBonus = 1.0;
        companions.forEach(c => companionBonus += (c.bonus - 1.0));

        const relicBonus = itemManager.getRelicBonus('scrapMultiplier');
        const totalMultiplier = (currentRegion.bonus || 1.0) * companionBonus * relicBonus;

        state.resources.scrap += this.BASE_SCRAP_RATE * totalMultiplier * dt;

        if (Math.floor(Date.now() / 1000) % 10 === 0) dataManager.save();
        window.dispatchEvent(new CustomEvent('gameUpdate'));
    }

    /** 수동 탐사 행위 (Scavenge) */
    scavenge() {
        const state = dataManager.state;
        const COST = 5; // 에너지 소모

        if (state.resources.energy < COST) {
            return { success: false, message: "에너지가 부족합니다! 요리를 먹어 회복하세요." };
        }

        state.resources.energy -= COST;
        state.stats.totalScavenges++;

        // 보상 추첨
        const rand = Math.random();
        let result = { type: 'nothing', message: "황무지에서 아무것도 찾지 못했습니다." };

        if (rand < 0.4) {
            // 식재료 획득
            const allIng = Object.keys(INGREDIENTS);
            const id = allIng[Math.floor(Math.random() * allIng.length)];
            if (!state.inventory.ingredients[id]) state.inventory.ingredients[id] = 0;
            state.inventory.ingredients[id]++;
            result = { type: 'ingredient', item: INGREDIENTS[id], message: `🍀 ${INGREDIENTS[id].icon} ${INGREDIENTS[id].name} 발견!` };
        } else if (rand < 0.7) {
            // 합성 부품 획득
            const partId = 'part_' + (Math.floor(Math.random() * 3) + 1);
            const partNames = ["녹슨 톱니", "낡은 회로", "강철 파편"];
            const partIcons = ["⚙️", "🔌", "🔩"];
            const idx = Math.floor(Math.random() * 3);

            itemManager.addItem(partId, 1, 'items');
            result = { type: 'item', message: `🛠️ 합성 부품: ${partIcons[idx]} ${partNames[idx]} 획득!` };
        } else if (rand < 0.9) {
            // 대량 고철
            const gain = Math.floor(20 + Math.random() * 30);
            state.resources.scrap += gain;
            result = { type: 'scrap', message: `💰 고철 더미 발견! +${gain}S` };
        } else {
            // 돌발 이벤트 (몬스터 등)
            const damage = 10;
            state.resources.energy = Math.max(0, state.resources.energy - damage);
            result = { type: 'event', message: `⚠️ 함정에 걸려 에너지를 ${damage} 소모했습니다!` };
        }

        dataManager.save();
        return { success: true, ...result };
    }

    getActiveCompanionData() {
        const state = dataManager.state;
        return state.companions.filter(c => state.activeCompanions.includes(c.id));
    }

    calculateOfflineProgress() {
        const now = Date.now();
        const offlineTime = Math.floor((now - dataManager.state.lastUpdate) / 1000);
        if (offlineTime > 10) this.update(offlineTime);
    }
}

window.farmingEngine = new FarmingEngine();

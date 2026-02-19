/**
 * 노마드 베이스 - 아이템 및 합성 매니저
 * 유물 합성 및 인벤토리 아이템을 관리합니다.
 */

class ItemManager {
    constructor() {
        this.SYNTHESIS_COST = 100; // 합성 비용
        this.TRASH_ITEM = { id: 'trash', name: '고철 부스러기', icon: '🔩', desc: '아무데도 쓸데없는 쓰레기입니다.' };
    }

    /** 아이템 추가 */
    addItem(id, count = 1, type = 'items') {
        const inv = dataManager.state.inventory[type];
        if (!inv[id]) inv[id] = 0;
        inv[id] += count;
        dataManager.save();
    }

    /** 아이템 제거 */
    removeItem(id, count = 1, type = 'items') {
        const inv = dataManager.state.inventory[type];
        if (inv[id] >= count) {
            inv[id] -= count;
            if (inv[id] === 0) delete inv[id];
            dataManager.save();
            return true;
        }
        return false;
    }

    /** 합성(Forge) 실행 */
    synthesize(itemIds) {
        const state = dataManager.state;
        if (itemIds.length < 3) return { success: false, message: "재료가 3개 필요합니다!" };
        if (state.resources.scrap < this.SYNTHESIS_COST) return { success: false, message: "합성 비용(100S)이 부족합니다!" };

        // 재료 소모
        for (const id of itemIds) {
            if (!this.removeItem(id, 1, 'items')) return { success: false, message: "재료 아이템이 부족합니다!" };
        }
        state.resources.scrap -= this.SYNTHESIS_COST;

        // 결과 결정 (10% 확률로 유물, 90% 확률로 쓰레기)
        const isSuccess = Math.random() < 0.15; // 15%로 상향
        let result;

        if (isSuccess) {
            // 아직 발견하지 못한 유물 우선 선발
            const availableRelics = RELICS.filter(r => !state.inventory.relics.includes(r.id));
            if (availableRelics.length > 0) {
                result = availableRelics[Math.floor(Math.random() * availableRelics.length)];
                state.inventory.relics.push(result.id);
                state.stats.relicsFound++;
            } else {
                // 모든 유물 발견 시 무작위 유물 (또는 특별 보상)
                result = RELICS[Math.floor(Math.random() * RELICS.length)];
            }
        } else {
            result = this.TRASH_ITEM;
            this.addItem(result.id, 1, 'items');
        }

        dataManager.save();
        return { success: true, result };
    }

    /** 보유 유물 효과 합산 반환 */
    getRelicBonus(type) {
        let total = 1.0;
        const owned = dataManager.state.inventory.relics;
        owned.forEach(id => {
            const relic = RELICS.find(r => r.id === id);
            if (relic && relic.bonusType === type) {
                if (relic.bonus < 1) total *= relic.bonus; // 할인 등
                else total += (relic.bonus - 1);
            }
        });
        return total;
    }
}

window.itemManager = new ItemManager();

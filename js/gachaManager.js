/**
 * 노마드 베이스 - 가챠 시스템 2.0
 */

class GachaManager {
    constructor() {
        this.BASE_PRICE = 50;
        this.INC_PRICE = 10;
        this.PROBABILITIES = {
            'Super Rare': 0.05,
            'Rare': 0.20,
            'Common': 0.45,
            'Fail': 0.30 // 30% 확률로 꽝(고물 더미)
        };
    }

    /** 현재 가챠 가격 계산 */
    getCurrentPrice() {
        const count = dataManager.state.stats.gachaCount || 0;
        return this.BASE_PRICE + (count * this.INC_PRICE);
    }

    /** 가챠 실행 */
    roll() {
        const state = dataManager.state;
        const price = this.getCurrentPrice();

        if (state.resources.scrap < price) {
            return { success: false, message: `고철이 부족합니다! (${price}S 필요)` };
        }

        state.resources.scrap -= price;
        state.stats.gachaCount++;

        const rand = Math.random();
        let result = null;

        if (rand < this.PROBABILITIES['Super Rare']) {
            result = this.pickFromPool('Super Rare');
        } else if (rand < this.PROBABILITIES['Super Rare'] + this.PROBABILITIES['Rare']) {
            result = this.pickFromPool('Rare');
        } else if (rand < this.PROBABILITIES['Super Rare'] + this.PROBABILITIES['Rare'] + this.PROBABILITIES['Common']) {
            result = this.pickFromPool('Common');
        } else {
            // 꽝 처리 (고물 부품 하나 지급)
            itemManager.addItem('part_1', 1, 'items');
            dataManager.save();
            return { success: true, isFail: true, message: "고물 더미만 발견했습니다... (부품 +1)" };
        }

        this.saveCompanion(result);
        return { success: true, isFail: false, companion: result };
    }

    pickFromPool(rarity) {
        const pool = COMPANION_POOL.filter(c => c.rarity === rarity);
        return pool[Math.floor(Math.random() * pool.length)];
    }

    saveCompanion(companion) {
        const state = dataManager.state;
        state.companions.push({
            ...companion,
            obtainDate: Date.now()
        });
        if (state.activeCompanions.length < 3) {
            state.activeCompanions.push(companion.id);
        }
        dataManager.save();
    }

    getRarityEffectClass(rarity) {
        switch (rarity) {
            case 'Super Rare': return 'gacha-effect-sr';
            case 'Rare': return 'gacha-effect-r';
            default: return 'gacha-effect-c';
        }
    }
}

window.gachaManager = new GachaManager();

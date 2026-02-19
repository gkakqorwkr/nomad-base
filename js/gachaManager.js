/**
 * 노마드 베이스 - 가챠 시스템
 * 확률에 기반하여 동료를 선발하고 화려한 효과를 연출합니다.
 */
// import { COMPANION_POOL } from './companions.js';
// import { dataManager } from './dataManager.js';

class GachaManager {
    constructor() {
        this.PROBABILITIES = {
            'Super Rare': 0.05,
            'Rare': 0.25,
            'Common': 0.70
        };
    }

    /** 단일 가챠 실행 */
    roll() {
        const rand = Math.random();
        let selectedRarity = 'Common';

        if (rand < this.PROBABILITIES['Super Rare']) {
            selectedRarity = 'Super Rare';
        } else if (rand < this.PROBABILITIES['Super Rare'] + this.PROBABILITIES['Rare']) {
            selectedRarity = 'Rare';
        }

        const pool = COMPANION_POOL.filter(c => c.rarity === selectedRarity);
        const result = pool[Math.floor(Math.random() * pool.length)];

        // 데이터 저장
        this.saveCompanion(result);

        return result;
    }

    /** 획득한 동료 저장 */
    saveCompanion(companion) {
        const state = dataManager.state;
        // 이미 소유했으면 레벨업이나 보상으로 대체 가능 (여기선 중복 허용 또는 목록 추가)
        state.companions.push({
            ...companion,
            obtainDate: Date.now()
        });

        // 투입 가능 동료가 없었으면 자동으로 첫 동료 투입
        if (state.activeCompanions.length < 3) {
            state.activeCompanions.push(companion.id);
        }

        dataManager.save();
    }

    /** 가챠 연출 배경 생성 (CSS 클래스 반환) */
    getRarityEffectClass(rarity) {
        switch (rarity) {
            case 'Super Rare': return 'gacha-effect-sr';
            case 'Rare': return 'gacha-effect-r';
            default: return 'gacha-effect-c';
        }
    }
}

// export const gachaManager = new GachaManager();
window.gachaManager = new GachaManager();

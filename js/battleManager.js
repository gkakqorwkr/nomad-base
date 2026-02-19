/**
 * 노마드 베이스 - 전투 매니저
 * 보스와의 전투 로직을 담당합니다.
 */
// import { dataManager } from './dataManager.js';

class BattleManager {
    constructor() {
        this.currentBoss = null;
        this.bossHp = 0;
    }

    startBattle(boss) {
        this.currentBoss = boss;
        this.bossHp = boss.hp;
        return { message: `${boss.name}이(가) 나타났습니다!`, boss };
    }

    /** 공격 수행 (차량 공격력 및 동료 보너스 합산) */
    attack() {
        if (!this.currentBoss) return null;

        const state = dataManager.state;
        // 차량 레벨 및 동료 보너스 기반 공격력 계산
        let power = 10 * state.vehicle.level;

        // 동료들의 공격 기여도 (Rare 이상 동료 한정 등 전략적 요소 추가 가능)
        state.companions.forEach(c => {
            if (c.rarity === 'Super Rare') power += 50;
            else if (c.rarity === 'Rare') power += 20;
            else power += 5;
        });

        const damage = Math.floor(power * (0.8 + Math.random() * 0.4)); // ±20% 변동
        this.bossHp -= damage;

        if (this.bossHp <= 0) {
            this.bossHp = 0;
            const reward = this.currentBoss.reward;
            state.resources.scrap += reward;
            dataManager.save();
            return { status: 'win', damage, reward };
        }

        // 보스의 반격 (장갑에 의해 경감됨, 100% -> 1.0, 20% -> 0.2)
        const armorReduction = vehicleManager.getBonus('armor') * 0.01;
        const bossDamage = Math.floor(10 * armorReduction);
        state.resources.energy = Math.max(0, state.resources.energy - bossDamage);

        return { status: 'hit', damage, hp: this.bossHp, bossDamage };
    }
}

// export const battleManager = new BattleManager();
window.battleManager = new BattleManager();

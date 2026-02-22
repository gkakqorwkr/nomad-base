/**
 * 노마드 베이스 - 전투 매니저
 * 보스와의 전투 로직을 담당합니다.
 */
// import { dataManager } from './dataManager.js';

class BattleManager {
    constructor() {
        this.currentEnemy = null;
        this.enemyHp = 0;
    }

    startBattle(enemy) {
        this.currentEnemy = enemy;
        this.enemyHp = enemy.hp;
        return { message: `${enemy.name}이(가) 나타났습니다!`, enemy };
    }

    /** 공격 수행 (차량 공격력 및 동료 보너스 + [신규] 거점 보너스) */
    attack() {
        if (!this.currentEnemy) return null;

        const state = dataManager.state;
        // 차량 레벨 및 동료 보너스 기반 공격력 계산
        let power = 10 * state.vehicle.level;

        state.companions.forEach(c => {
            const compId = typeof c === 'string' ? c : c.id;
            const comp = window.COMPANION_POOL ? window.COMPANION_POOL.find(p => p.id === compId) : null;
            if (comp) {
                if (comp.rarity === 'Super Rare') power += 50;
                else if (comp.rarity === 'Rare') power += 20;
                else power += 5;
            }
        });

        // [신규] 거점 강화: 대구경 포탑 (공격력 증가)
        if (state.vehicle.fortification && state.vehicle.fortification.heavy_turret > 0) {
            power *= (1 + state.vehicle.fortification.heavy_turret * 1.0); // 1단계당 100% 증가
        }

        const damage = Math.floor(power * (0.8 + Math.random() * 0.4)); // ±20% 변동
        this.enemyHp -= damage;

        if (this.enemyHp <= 0) {
            this.enemyHp = 0;
            const reward = this.currentEnemy.reward;
            state.resources.scrap += reward;
            this.currentEnemy = null; // 전투 종료
            dataManager.save();
            return { status: 'win', damage, reward };
        }

        // 적의 반격 (장갑 경감 + 동료 시너지 + [신규] 거점 보너스)
        const armorReduction = vehicleManager.getBonus('armor') * 0.01;
        const synergy = window.game ? window.game.getSynergyBonus() : { damageReduction: 0 };

        // [신규] 거점 강화: 장갑 보강 (피해 감소)
        let fortBonus = 0;
        if (state.vehicle.fortification && state.vehicle.fortification.armor_plate > 0) {
            fortBonus = state.vehicle.fortification.armor_plate * 0.2; // 단계당 20% 감소
        }

        // 기본 데미지 설정 (보스면 강하게, 일반 적이면 적절하게)
        const baseAtk = this.currentEnemy.atk || 10;
        const finalDamage = Math.max(1, Math.floor(baseAtk * (1 - armorReduction) * (1 - synergy.damageReduction) * (1 - fortBonus)));

        state.resources.energy = Math.max(0, state.resources.energy - finalDamage);

        // [신규] 피격 연출 호출
        if (window.game && window.game.triggerHitEffect) {
            window.game.triggerHitEffect();
        }

        return { status: 'hit', damage, hp: this.enemyHp, bossDamage: finalDamage };
    }
}

// export const battleManager = new BattleManager();
window.battleManager = new BattleManager();

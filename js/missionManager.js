/**
 * 노마드 베이스 - 미션 매니저
 */

window.MISSIONS_POOL = [
    {
        id: "m1",
        name: "생존자 구조",
        type: "rescue",
        desc: "불타는 폐허에서 구조 신호가 옵니다. 에너지를 소모해 도울까요?",
        cost: { energy: 20 },
        reward: { scrap: 300, recipes: ["cook_13"] }
    },
    {
        id: "m2",
        name: "부품 조달",
        type: "delivery",
        desc: "옆 구역 노마드가 고철 100개가 급히 필요하다고 합니다.",
        cost: { scrap: 100 },
        reward: { ingredients: ["zombie_octopus", "blue_oil"] }
    },
    {
        id: "m3",
        name: "길 잃은 로봇 수리",
        type: "fix",
        desc: "길가에 고장 난 로봇이 있습니다. 수리해주면 유용한 정보를 줄지도 모릅니다.",
        cost: { energy: 30 },
        reward: { items: ["trash"], scrap: 500 }
    }
];

class MissionManager {
    constructor() {
        this.missionChance = 0.05; // 탐사 시 발생 확률
    }

    tryTriggerMission(boost = 1) {
        const state = dataManager.state;
        if (state.missions.active) return false;

        if (Math.random() < (this.missionChance * boost)) {
            const mission = MISSIONS_POOL[Math.floor(Math.random() * MISSIONS_POOL.length)];
            state.missions.active = mission;
            dataManager.save();

            if (window.game && window.game.showToast) {
                window.game.showToast("📻 무전기 신호 수신됨!", 'info');
            }
            return true;
        }
        return false;
    }

    completeMission(id) {
        const state = dataManager.state;
        const mission = state.missions.active;
        if (!mission || mission.id !== id) return { success: false, message: "잘못된 미션입니다." };

        // 비용 지불
        if (mission.cost.energy && state.resources.energy < mission.cost.energy) {
            return { success: false, message: "에너지가 부족합니다!" };
        }
        if (mission.cost.scrap && state.resources.scrap < mission.cost.scrap) {
            return { success: false, message: "고철이 부족합니다!" };
        }

        if (mission.cost.energy) state.resources.energy -= mission.cost.energy;
        if (mission.cost.scrap) state.resources.scrap -= mission.cost.scrap;

        // 보상 지급
        if (mission.reward.scrap) state.resources.scrap += mission.reward.scrap;
        if (mission.reward.ingredients) {
            mission.reward.ingredients.forEach(ing => {
                state.inventory.ingredients[ing] = (state.inventory.ingredients[ing] || 0) + 1;
            });
        }
        if (mission.reward.items) {
            mission.reward.items.forEach(itm => {
                state.inventory.items[itm] = (state.inventory.items[itm] || 0) + 1;
            });
        }

        state.missions.completed.push(id);
        state.missions.active = null;
        dataManager.save();

        return { success: true, message: "미션 완료! 보상을 획득했습니다." };
    }
}

window.missionManager = new MissionManager();

/**
 * 노마드 베이스 - 차량 업그레이드 매니저
 * 엔진, 장갑, 적재함 등 부품의 강화 및 효과를 관리합니다.
 */
// import { dataManager } from './dataManager.js';

window.VEHICLE_PARTS = {
    engine: {
        name: "엔진",
        icon: "🚂",
        effectName: "이동 시간",
        unit: "%",
        levels: [
            { level: 1, name: "고물 엔진", cost: 0, bonus: 100, desc: "겨우 움직이는 수준입니다." },
            { level: 2, name: "디젤 엔진", cost: 200, bonus: 90, desc: "소음은 크지만 힘이 좋습니다." },
            { level: 3, name: "터보 엔진", cost: 500, bonus: 70, desc: "아포칼립스의 바람을 가릅니다." },
            { level: 4, name: "V8 슈퍼차저", cost: 1200, bonus: 50, desc: "광기의 질주가 시작됩니다." }
        ]
    },
    armor: {
        name: "장갑",
        icon: "🛡️",
        effectName: "받는 피해",
        unit: "%",
        levels: [
            { level: 1, name: "녹슨 철판", cost: 0, bonus: 100, desc: "바람막이 정도의 기능입니다." },
            { level: 2, name: "강화 강철", cost: 300, bonus: 80, desc: "괴수의 공격을 어느 정도 버팁니다." },
            { level: 3, name: "복합 장갑", cost: 700, bonus: 50, desc: "웬만한 충격에는 끄떡없습니다." },
            { level: 4, name: "티타늄 합금", cost: 1500, bonus: 20, desc: "움직이는 요새입니다." }
        ]
    },
    storage: {
        name: "적재함",
        icon: "📦",
        effectName: "최대 고철",
        unit: "S",
        levels: [
            { level: 1, name: "작은 상자", cost: 0, bonus: 5000, desc: "자원을 담을 공간이 부족합니다." },
            { level: 2, name: "나무 궤짝", cost: 100, bonus: 15000, desc: "조금 더 넉넉해졌습니다." },
            { level: 3, name: "컨테이너", cost: 400, bonus: 50000, desc: "대량의 자원을 보관합니다." },
            { level: 4, name: "차원이동 창고", cost: 1000, bonus: 999999, desc: "공간의 제약이 사라집니다." }
        ]
    }
};


/** 🚜 차량 특수 모듈 데이터 (Phase 3) */
window.VEHICLE_MODULES = {
    greenhouse: { name: "자동 온실", icon: "🌱", desc: "이동 중 무작위 식재료를 수확합니다.", maxLevel: 5, cost: { scrap: 300 }, baseEffect: 0.05, bonusPerLevel: 0.05 },
    sonar: { name: "고성능 소나", icon: "📡", desc: "미션 및 암시장 발견 확률이 증가합니다.", maxLevel: 5, cost: { scrap: 500 }, baseEffect: 1.1, bonusPerLevel: 0.2 },
    fridge: { name: "특수 냉장고", icon: "🧊", desc: "요리 섭취 시 에너지 회복량이 증폭됩니다.", maxLevel: 5, cost: { scrap: 400 }, baseEffect: 1.1, bonusPerLevel: 0.2 }
};

class VehicleManager {
    /** 특정 부품 업그레이드 시도 */
    upgradePart(partKey) {
        const state = dataManager.state;
        if (!state.vehicle.parts[partKey]) return { success: false, message: "부품 정보를 찾을 수 없습니다." };

        const currentLevel = state.vehicle.parts[partKey].level;
        const partData = VEHICLE_PARTS[partKey];

        if (currentLevel >= partData.levels.length) {
            return { success: false, message: "이미 최대 레벨입니다!" };
        }

        const nextLevelData = partData.levels[currentLevel];

        if (state.resources.scrap >= nextLevelData.cost) {
            state.resources.scrap -= nextLevelData.cost;
            state.vehicle.parts[partKey].level += 1;
            state.vehicle.parts[partKey].name = nextLevelData.name;
            dataManager.save();
            return { success: true, message: `${nextLevelData.name}(으)로 개조 완료!` };
        } else {
            return { success: false, message: `고철이 부족합니다! (${nextLevelData.cost}S 필요)` };
        }
    }

    /** 특수 모듈 업그레이드 (Phase 3) */
    upgradeModule(id) {
        const state = dataManager.state;
        const m = window.VEHICLE_MODULES[id];
        if (!m) return { success: false, message: "모듈 정보를 찾을 수 없습니다." };

        const currentLevel = state.vehicle.modules[id] || 0;
        if (currentLevel >= m.maxLevel) return { success: false, message: "이미 최대 레벨입니다!" };

        const cost = m.cost.scrap;
        if (state.resources.scrap >= cost) {
            state.resources.scrap -= cost;
            state.vehicle.modules[id] = currentLevel + 1;
            dataManager.save();
            return { success: true, message: `${m.name} 업그레이드 완료 (Lv.${currentLevel + 1})` };
        } else {
            return { success: false, message: `고철이 부족합니다! (${cost}S 필요)` };
        }
    }

    /** 모듈 보너스 수치 계산 */
    getModuleEffect(id) {
        const state = dataManager.state;
        const m = window.VEHICLE_MODULES[id];
        if (!m) return 1;

        const level = state.vehicle.modules[id] || 0;
        if (level === 0) return (id === 'greenhouse' ? 0 : 1);

        return m.baseEffect + ((level - 1) * m.bonusPerLevel);
    }

    /** 현재 특정 파츠의 보너스 수치 반환 */
    getBonus(partKey) {
        const level = dataManager.state.vehicle.parts[partKey].level;
        const part = VEHICLE_PARTS[partKey];
        return part.levels[level - 1].bonus;
    }

    /** 레벨 반환 유틸 */
    getPartLevel(key) {
        return dataManager.state.vehicle.parts[key].level;
    }

    /** 현재 차량 정보 요약 */
    getVehicleSummary() {
        const state = dataManager.state;
        return Object.keys(VEHICLE_PARTS).map(key => {
            const currentLevel = state.vehicle.parts[key].level;
            return {
                key,
                ...VEHICLE_PARTS[key],
                current: VEHICLE_PARTS[key].levels[currentLevel - 1],
                next: VEHICLE_PARTS[key].levels[currentLevel] || null
            };
        });
    }
}

window.vehicleManager = new VehicleManager();

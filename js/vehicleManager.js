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

/** 🏠 거점 영구 강화 데이터 (고철 대량 소모용) */
window.FORTIFICATION_UPGRADES = {
    armor_plate: { name: "전술 장갑 보강", icon: "🛡️", desc: "전투 시 에너지 피해를 영구적으로 감소시킵니다.", cost: 30000, costStep: 20000, maxLevel: 5 },
    overload_engine: { name: "엔진 과부하 모듈", icon: "⚡", desc: "이동 시간을 영구적으로 단축시킵니다.", cost: 50000, costStep: 30000, maxLevel: 5 },
    rad_purifier: { name: "방사능 정화조", icon: "💎", desc: "방사능 축적을 늦추고 자동으로 정화합니다.", cost: 40000, costStep: 25000, maxLevel: 5 },
    heavy_turret: { name: "대구경 포탑", icon: "⚔️", desc: "전투 시 대미지를 2배 이상 강화합니다.", cost: 80000, costStep: 50000, maxLevel: 3 }
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

    /** [신규] 거점 강화 업그레이드 */
    upgradeFortification(key) {
        const state = dataManager.state;
        const upgrade = window.FORTIFICATION_UPGRADES[key];
        if (!upgrade) return { success: false, message: "강화 정보를 찾을 수 없습니다." };

        const currentLevel = state.vehicle.fortification[key] || 0;
        if (currentLevel >= upgrade.maxLevel) return { success: false, message: "이미 한계치까지 강화되었습니다!" };

        const currentCost = upgrade.cost + (currentLevel * upgrade.costStep);
        if (state.resources.scrap >= currentCost) {
            state.resources.scrap -= currentCost;
            state.vehicle.fortification[key] = currentLevel + 1;
            dataManager.save();
            return { success: true, message: `${upgrade.name} (Lv.${currentLevel + 1}) 강화 성공!` };
        } else {
            return { success: false, message: `고철이 부족합니다! (${currentCost.toLocaleString()}S 필요)` };
        }
    }

    /** 차량/거점 업그레이드 메뉴 통합 렌더링 */
    openUpgradeMenu(tab = 'parts') {
        const state = dataManager.state;
        let html = `
            <div style="padding:15px;">
                <div style="display:flex; gap:5px; margin-bottom:15px;">
                    <button onclick="window.vehicleManager.openUpgradeMenu('parts')" style="flex:1; padding:10px; font-size:0.8rem; background:${tab === 'parts' ? 'var(--accent-color)' : '#333'}; border:none; border-radius:5px; color:white; cursor:pointer;">부품</button>
                    <button onclick="window.vehicleManager.openUpgradeMenu('modules')" style="flex:1; padding:10px; font-size:0.8rem; background:${tab === 'modules' ? 'var(--accent-color)' : '#333'}; border:none; border-radius:5px; color:white; cursor:pointer;">모듈</button>
                    <button onclick="window.vehicleManager.openUpgradeMenu('fort')" style="flex:1; padding:10px; font-size:0.8rem; background:${tab === 'fort' ? '#e74c3c' : '#333'}; border:none; border-radius:5px; color:white; cursor:pointer;">거점강화</button>
                </div>
                <div style="max-height:50vh; overflow-y:auto;">
        `;

        if (tab === 'parts') {
            this.getVehicleSummary().forEach(p => {
                const nxt = p.next;
                html += `
                    <div class="upgrade-card" style="margin-bottom:10px; padding:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="text-align:left;">
                                <div style="font-weight:bold;">${p.icon} ${p.name} (Lv.${p.current.level})</div>
                                <div style="font-size:0.7rem; color:#888;">${p.effectName}: ${p.current.bonus}${p.unit} ${nxt ? `→ ${nxt.bonus}${p.unit}` : ''}</div>
                            </div>
                            <button class="upgrade-btn ${state.resources.scrap >= (nxt ? nxt.cost : Infinity) ? 'can-afford' : ''}" 
                                    onclick="window.game.handleUpgrade('${p.key}')" ${nxt ? '' : 'disabled'}>
                                ${nxt ? `${nxt.cost}S` : 'MAX'}
                            </button>
                        </div>
                    </div>`;
            });
        } else if (tab === 'modules') {
            Object.keys(window.VEHICLE_MODULES).forEach(id => {
                const m = window.VEHICLE_MODULES[id];
                const lv = state.vehicle.modules[id] || 0;
                const isMax = lv >= m.maxLevel;
                html += `
                    <div class="upgrade-card" style="margin-bottom:10px; padding:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="text-align:left;">
                                <div style="font-weight:bold;">${m.icon} ${m.name} (Lv.${lv})</div>
                                <div style="font-size:0.7rem; color:#888;">${m.desc}</div>
                            </div>
                            <button class="upgrade-btn ${state.resources.scrap >= (isMax ? Infinity : m.cost.scrap) ? 'can-afford' : ''}" 
                                    onclick="window.game.handleModuleUpgrade('${id}')" ${isMax ? 'disabled' : ''}>
                                ${isMax ? 'MAX' : `${m.cost.scrap}S`}
                            </button>
                        </div>
                    </div>`;
            });
        } else if (tab === 'fort') {
            Object.keys(window.FORTIFICATION_UPGRADES).forEach(key => {
                const u = window.FORTIFICATION_UPGRADES[key];
                const lv = state.vehicle.fortification[key] || 0;
                const isMax = lv >= u.maxLevel;
                const cost = u.cost + (lv * u.costStep);
                html += `
                    <div class="upgrade-card" style="margin-bottom:10px; padding:15px; border-left:4px solid #e74c3c;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="text-align:left; flex:1; margin-right:10px;">
                                <div style="font-weight:bold; color:#e74c3c;">${u.icon} ${u.name} (Lv.${lv}/${u.maxLevel})</div>
                                <div style="font-size:0.75rem; color:#aaa; margin-top:3px;">${u.desc}</div>
                            </div>
                            <button class="upgrade-btn ${state.resources.scrap >= cost ? 'can-afford' : ''}" 
                                    onclick="window.game.handleFortUpgrade('${key}')" ${isMax ? 'disabled' : ''} 
                                    style="background:#c0392b; min-width:80px;">
                                ${isMax ? 'MAX' : `${cost.toLocaleString()}S`}
                            </button>
                        </div>
                    </div>`;
            });
        }

        html += `</div></div>`;
        window.game.showModal("🚛 개조 및 거점 관리", html);
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

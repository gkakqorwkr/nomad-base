/**
 * 노마드 베이스 - 데이터 매니저 (시스템 2.0 대응)
 */
class DataManager {
    constructor() {
        this.SAVE_KEY = 'nomad_base_save_data_v2';
        this.state = this.load();
    }

    getInitialState() {
        return {
            resources: {
                scrap: 50,     // 시작 시 가챠 한 번 가능하도록
                energy: 100,
                mutogen: 0,
                radiation: 0   // [신규] 방사능 수치 (0-100)
            },
            inventory: {
                ingredients: {}, // { id: count }
                items: {},       // { id: count } - 합성 재료 등
                food: {},        // { id: count } - 제작된 요리
                relics: []       // [ id ] - 보유한 유물
            },
            stats: {
                totalScavenges: 0,
                gachaCount: 0,
                relicsFound: 0
            },
            companions: [],
            activeCompanions: [],
            currentRegionId: "reg_1",
            travel: {
                targetRegionId: null,
                startTime: null,
                endTime: null,
                isMoving: false,
                isEventActive: false,
                isBattleActive: false,
                bossEncountered: false
            },
            vehicle: {
                level: 1,
                parts: {
                    engine: { level: 1, name: '낡은 엔진' },
                    armor: { level: 1, name: '녹슨 철판' },
                    storage: { level: 1, name: '작은 상자' }
                },
                modules: {},      // { id: { level: 1, ... } },
                fortification: {  // [신규] 거점 영구 강화
                    armor_plate: 0,  // 피해 감소
                    overload_engine: 0, // 이동 속도
                    rad_purifier: 0,  // 방사능 정화
                    heavy_turret: 0   // 공격력 2배
                }
            },
            world: {
                weather: "clear", // clear, acid_rain, emp_storm, sandstorm
                weatherEndTime: 0
            },
            missions: {
                active: null,      // { id, type, deadline, ... }
                completed: []
            },
            discovered: {
                recipes: [],
                relics: []
            },
            lastUpdate: Date.now()
        };
    }

    save() {
        try {
            this.state.lastUpdate = Date.now();
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.error('Save failed:', e);
        }
    }

    load() {
        try {
            const savedData = localStorage.getItem(this.SAVE_KEY);
            if (savedData) {
                const data = JSON.parse(savedData);
                // v2 구조로의 마이그레이션 및 안전 점검
                if (!data.inventory) data.inventory = {};
                if (Array.isArray(data.inventory)) data.inventory = { relics: data.inventory };

                // 필수 필드 강제 초기화 (누락 방지)
                if (!data.inventory.ingredients) data.inventory.ingredients = {};
                if (!data.inventory.items) data.inventory.items = {};
                if (!data.inventory.food) data.inventory.food = {};
                if (!data.inventory.relics) data.inventory.relics = [];
                if (!data.stats) data.stats = { totalScavenges: 0, gachaCount: 0, relicsFound: 0 };
                if (!data.discovered) data.discovered = { recipes: [], relics: [] };

                // v2.0 신규 필드 마이그레이션
                if (!data.vehicle.modules) data.vehicle.modules = {};
                if (!data.world) data.world = { weather: "clear", weatherEndTime: 0 };
                if (!data.missions) data.missions = { active: null, completed: [] };

                return data;
            }
        } catch (e) {
            console.error('Load failed:', e);
        }
        return this.getInitialState();
    }

    reset() {
        localStorage.removeItem(this.SAVE_KEY);
        location.reload();
    }
}

window.dataManager = new DataManager();

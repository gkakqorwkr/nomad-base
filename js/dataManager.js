/**
 * 노마드 베이스 - 데이터 매니저 (비모듈 버전)
 * LocalStorage를 활용하여 게임 상태를 영구 저장하고 로드합니다.
 */
class DataManager {
    constructor() {
        this.SAVE_KEY = 'nomad_base_save_data';
        this.state = this.load();
    }

    /** 기본 게임 상태 생성 */
    getInitialState() {
        return {
            resources: {
                scrap: 0,     // 고철 (기본 자원)
                energy: 100,  // 에너지
                mutogen: 0   // 변이원 (희귀 자원)
            },
            inventory: [],    // 일반 아이템 (장비 등)
            ingredients: {},  // 식재료 보유 현황 { "id": 수량 }
            companions: [],   // 소유한 동료
            activeCompanions: [], // 파밍에 투입된 동료 ID
            currentRegionId: "reg_1", // 현재 위치
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
                }
            },
            discovered: {
                recipes: [],
                crops: []
            },
            lastUpdate: Date.now()
        };
    }

    /** 데이터 저장 */
    save() {
        try {
            this.state.lastUpdate = Date.now();
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.state));
            // console.log('게임이 성공적으로 저장되었습니다.');
        } catch (e) {
            console.error('게임 저장 중 오류 발생:', e);
        }
    }

    /** 데이터 로드 */
    load() {
        try {
            const savedData = localStorage.getItem(this.SAVE_KEY);
            if (savedData) {
                const data = JSON.parse(savedData);
                // 하위 호환성을 위해 누락된 필드 보충
                if (!data.ingredients) data.ingredients = {};
                return data;
            }
        } catch (e) {
            console.error('데이터 로드 중 오류 발생:', e);
        }
        console.log('신규 게임을 시작합니다.');
        return this.getInitialState();
    }

    /** 초기화 (데이터 삭제) */
    reset() {
        localStorage.removeItem(this.SAVE_KEY);
        this.state = this.getInitialState();
        this.save();
        location.reload();
    }
}

// export const dataManager = new DataManager();
window.dataManager = new DataManager();

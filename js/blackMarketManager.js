/**
 * 노마드 베이스 - 황무지 암시장 (Phase 6)
 * 희귀 재료 및 모듈 설계도를 거래합니다.
 */

window.BLACK_MARKET_ITEMS = [
    { id: 'bm1', name: '티타늄 조각', cost: 500, type: 'material', icon: '🔩', desc: '고급 장갑의 재료입니다.' },
    { id: 'bm2', name: '연구 데이터', cost: 1200, type: 'artifact', icon: '💾', desc: '모듈 업그레이드에 필요합니다.' },
    { id: 'bm3', name: '고밀도 연료', cost: 300, type: 'resource', icon: '🔥', desc: '에너지를 즉시 50 회복합니다.' }
];

class BlackMarketManager {
    constructor() {
        this.isOpen = false;
        this.stock = [];
    }

    /** 암시장 등장 트리거 */
    tryTriggerMarket() {
        if (Math.random() < 0.1) { // 10% 확률로 암시장 조우
            this.refreshStock();
            return true;
        }
        return false;
    }

    refreshStock() {
        // 랜덤하게 2~3개 아이템 진열
        this.stock = [...BLACK_MARKET_ITEMS].sort(() => 0.5 - Math.random()).slice(0, 3);
    }

    buyItem(itemId) {
        const state = dataManager.state;
        const item = this.stock.find(i => i.id === itemId);

        if (!item) return { success: false, message: "아이템을 찾을 수 없습니다." };
        if (state.resources.scrap < item.cost) return { success: false, message: "고철이 부족합니다." };

        state.resources.scrap -= item.cost;

        // 아이템 타입별 처리
        if (item.type === 'resource') {
            state.resources.energy = Math.min(100, state.resources.energy + 50);
        } else {
            if (!state.inventory.items[item.id]) state.inventory.items[item.id] = 0;
            state.inventory.items[item.id]++;
        }

        dataManager.save();
        return { success: true, message: `${item.name} 구매 완료!` };
    }
}

window.blackMarketManager = new BlackMarketManager();

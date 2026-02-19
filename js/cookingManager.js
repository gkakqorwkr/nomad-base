/**
 * 노마드 베이스 - 무한 요리 매니저
 * 어떤 조합이든 요리로 만들어내며, 발견되지 않은 조합도 이름을 자동 생성합니다.
 */
// import { INGREDIENTS, SPECIAL_RECIPES, COOKING_METHODS } from './cooking.js';
// import { dataManager } from './dataManager.js';

class CookingManager {
    /** 요리 시도: 정해진 레시피 검색 -> 없으면 절차적 생성 */
    cook(ingredientIds) {
        if (!ingredientIds || ingredientIds.length === 0) return null;

        const state = dataManager.state;

        // 재료 소모 체크
        for (const id of ingredientIds) {
            if (!state.ingredients[id] || state.ingredients[id] <= 0) {
                return { success: false, message: "재료가 부족합니다!" };
            }
        }

        // 재료 실제 소모
        ingredientIds.forEach(id => {
            state.ingredients[id] -= 1;
        });

        // 1. 특별 레시피 확인
        const special = SPECIAL_RECIPES.find(r =>
            r.ingredients.length === ingredientIds.length &&
            r.ingredients.every(id => ingredientIds.includes(id))
        );

        if (special) {
            this.addToCollection(special.id, special.name);
            return { ...special, success: true, isSpecial: true };
        }

        // 2. 절차적 요리 생성
        const result = this.generateProceduralDish(ingredientIds);
        this.addToCollection(result.id, result.name);
        return { ...result, success: true };
    }

    /** 재료 정보를 기반으로 이름과 효과를 자동 생성 */
    generateProceduralDish(ids) {
        const items = ids.map(id => INGREDIENTS[id]).filter(x => x);
        if (items.length === 0) return null;

        // 이름 결정 로직
        const adj = items[0].adj || "이상한";
        const main = items[items.length - 1].name;

        // 조리법 결정 (마지막 재료의 타입에 따라)
        const method = COOKING_METHODS.find(m => m.type === items[items.length - 1].type) || COOKING_METHODS[0];

        const dishName = `${adj} ${main} ${method.suffix}`;
        const dishIcon = items[items.length - 1].icon;

        // 파워 계산
        const totalPower = items.reduce((sum, item) => sum + (item.power || 5), 0);

        // 고유 ID 생성 (조합 기반)
        const dishId = "gen_" + ids.sort().join("_");

        return {
            id: dishId,
            name: dishName,
            icon: dishIcon,
            desc: `${items.map(i => i.name).join(", ")}을(를) 섞어 만든 요리입니다.`,
            effect: `에너지 회복 +${totalPower}`,
            power: totalPower,
            isSpecial: false
        };
    }

    /** 도감 등록 */
    addToCollection(id, name) {
        const state = dataManager.state;
        if (!state.discovered.recipes.includes(id)) {
            state.discovered.recipes.push(id);
            if (!state.discovered.customNames) state.discovered.customNames = {};
            state.discovered.customNames[id] = name;
            dataManager.save();
        }
    }

    /** 도감 목록 반환 (특별 레시피 + 유저가 발견한 절차적 요리) */
    getFullCollection() {
        const state = dataManager.state;
        const collection = SPECIAL_RECIPES.map(r => ({
            ...r,
            isDiscovered: state.discovered.recipes.includes(r.id),
            isSpecial: true
        }));

        // 유저가 발견한 절차적 요리들 추가
        state.discovered.recipes.forEach(id => {
            if (id.startsWith('gen_')) {
                collection.push({
                    id: id,
                    name: state.discovered.customNames[id] || "알 수 없는 요리",
                    icon: "🍲",
                    isDiscovered: true,
                    isSpecial: false
                });
            }
        });

        return collection;
    }
}

// export const cookingManager = new CookingManager();
window.cookingManager = new CookingManager();

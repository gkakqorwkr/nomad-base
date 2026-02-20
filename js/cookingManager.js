/**
 * 노마드 베이스 - 요리 매니저 2.0
 */

class CookingManager {
    constructor() {
        this.selectedIngredients = [];
    }

    /** 요리하기 */
    cook(ingredientIds) {
        const state = dataManager.state;

        // 재료 소모 체크
        for (const id of ingredientIds) {
            if (!state.inventory.ingredients[id] || state.inventory.ingredients[id] <= 0) {
                return { success: false, message: "재료가 부족합니다!" };
            }
        }

        // 재료 실제 소모
        ingredientIds.forEach(id => {
            state.inventory.ingredients[id] -= 1;
        });

        const recipeMatch = SPECIAL_RECIPES.find(r =>
            r.ingredients.length === ingredientIds.length &&
            // 순서 상관없이 모든 재료가 포함되어 있는지 확인
            r.ingredients.every(id => ingredientIds.includes(id)) &&
            ingredientIds.every(id => r.ingredients.includes(id))
        );

        let result;
        if (recipeMatch) {
            result = { ...recipeMatch };
            // 도감 해금
            if (!state.discovered.recipes.includes(result.id)) {
                state.discovered.recipes.push(result.id);
            }
        } else {
            // 특별 레시피가 아니면 절차적 요리 생성
            const recovery = ingredientIds.length === 1 ? 5 : 10;
            const ings = ingredientIds.map(id => INGREDIENTS[id]);
            const method = COOKING_METHODS[Math.floor(Math.random() * COOKING_METHODS.length)];

            let name = "";
            let icon = "🍲";

            if (ingredientIds.length === 1) {
                name = `${ings[0].adj} ${ings[0].name} ${method.suffix}`;
                icon = ings[0].icon;
            } else {
                // 재료가 2개인 경우
                name = `${ings[0].name} ${ings[1].name} ${method.suffix}`;
                icon = "🍲";
            }

            result = {
                id: `gen_${ingredientIds.sort().join('_')}`,
                name: name,
                icon: icon,
                recovery: recovery,
                desc: '황무지에서 모은 재료로 대충 만들어낸 요리입니다.'
            };
        }

        // 인벤토리에 보관 (객체 형태로 저장하여 메타데이터 유지)
        if (!state.inventory.food[result.id]) {
            state.inventory.food[result.id] = {
                count: 0,
                name: result.name,
                icon: result.icon,
                recovery: result.recovery,
                desc: result.desc
            };
        }
        state.inventory.food[result.id].count++;

        dataManager.save();
        return { success: true, dish: result };
    }

    /** 요리 섭취 (에너지 회복) */
    eat(foodId) {
        const state = dataManager.state;
        const foodData = state.inventory.food[foodId];

        if (!foodData) return { success: false };

        // 객체 형태(count 포함) 또는 숫자 형태 대응
        let count = (typeof foodData === 'object') ? foodData.count : foodData;
        let recoveryAmount = (typeof foodData === 'object') ? (foodData.recovery || 10) : 10;

        // 만약 숫자 형태인데 스페셜 레시피라면 데이터에서 찾아옴
        if (typeof foodData !== 'object') {
            const recipe = SPECIAL_RECIPES.find(r => r.id === foodId) || { recovery: 10 };
            recoveryAmount = recipe.recovery || 10;
        }

        if (count <= 0) return { success: false };

        // 개수 감소
        if (typeof foodData === 'object') {
            foodData.count--;
            if (foodData.count <= 0) delete state.inventory.food[foodId];
        } else {
            state.inventory.food[foodId]--;
            if (state.inventory.food[foodId] === 0) delete state.inventory.food[foodId];
        }

        // [모듈 효과] 특수 냉장고 보정 (Phase 3)
        const fridgeBoost = window.vehicleManager ? window.vehicleManager.getModuleEffect('fridge') : 1;
        const totalRecovery = Math.floor(recoveryAmount * fridgeBoost);

        state.resources.energy = Math.min(100, state.resources.energy + totalRecovery);
        dataManager.save();

        return { success: true, amount: totalRecovery };
    }

    openCookingMenu() {
        const state = dataManager.state;
        this.selectedIngredients = [];

        const grid = document.createElement('div');
        grid.className = 'inventory-grid';

        let hasIngredients = false;
        Object.keys(state.inventory.ingredients).forEach(id => {
            const count = state.inventory.ingredients[id];
            if (count > 0) {
                hasIngredients = true;
                const div = document.createElement('div');
                div.className = 'inventory-slot';
                div.innerHTML = `<div>${INGREDIENTS[id].icon}</div><div class="slot-count">${count}</div>`;
                div.onclick = () => {
                    if (this.selectedIngredients.includes(id)) {
                        this.selectedIngredients = this.selectedIngredients.filter(x => x !== id);
                        div.style.borderColor = '';
                    } else if (this.selectedIngredients.length < 2) {
                        this.selectedIngredients.push(id);
                        div.style.borderColor = 'var(--accent-color)';
                    }
                    document.getElementById('cook-slots').textContent = this.selectedIngredients.map(i => INGREDIENTS[i].icon).join(' ') || '??';
                };
                grid.appendChild(div);
            }
        });

        if (window.game && window.game.showModal) {
            window.game.showModal("🍳 황무지 주방", `
                <div style="padding:5px;">
                    <div class="collection-hint">재료 1~2개를 조합하세요. 제작한 요리는 '도감'에서 섭취 가능합니다.</div>
                    
                    <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:12px; margin:15px 0; text-align:center;">
                        <div id="cook-slots" style="font-size:3rem; margin-bottom:15px; letter-spacing:10px;">??</div>
                        <button class="upgrade-btn" onclick="window.game.handleCook()" style="width:120px;">요리 시작</button>
                    </div>

                    <h3 style="margin-bottom:10px;">📦 보유한 식재료</h3>
                    ${hasIngredients ? '' : '<p style="color:#666;">식재료가 없습니다. 탐사에서 구해보세요!</p>'}
                    <div id="cooking-grid-container"></div>
                </div>
            `);
            const container = document.getElementById('cooking-grid-container');
            if (container) container.appendChild(grid);
        }
    }
}

window.cookingManager = new CookingManager();

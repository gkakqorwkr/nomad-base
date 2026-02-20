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
            r.ingredients.every(id => ingredientIds.includes(id))
        );

        let result;
        if (recipeMatch) {
            result = recipeMatch;
            // 도감 해금
            if (!state.discovered.recipes.includes(result.id)) {
                state.discovered.recipes.push(result.id);
            }
        } else {
            // 특별 레시피가 아니면 일반 '죽' 생성
            result = {
                id: 'porridge',
                name: '황무지 죽',
                icon: '🥣',
                recovery: 20,
                desc: '맛은 없지만 생존을 위해 먹습니다.'
            };
        }

        // 인벤토리에 보관
        if (!state.inventory.food[result.id]) state.inventory.food[result.id] = 0;
        state.inventory.food[result.id]++;

        dataManager.save();
        return { success: true, dish: result };
    }

    /** 요리 섭취 (에너지 회복) */
    eat(foodId) {
        const state = dataManager.state;
        if (!state.inventory.food[foodId] || state.inventory.food[foodId] <= 0) return { success: false };

        const recipe = SPECIAL_RECIPES.find(r => r.id === foodId) || { id: 'porridge', recovery: 20 };
        const recoveryAmount = recipe.recovery || 30;

        state.inventory.food[foodId]--;
        if (state.inventory.food[foodId] === 0) delete state.inventory.food[foodId];

        state.resources.energy = Math.min(100, state.resources.energy + recoveryAmount);
        dataManager.save();

        return { success: true, amount: recoveryAmount };
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

        document.getElementById('modal-body').innerHTML = `
            <div style="padding:15px;">
                <h2 style="margin-bottom:10px;">🍳 황무지 주방</h2>
                <div class="collection-hint">재료 1~2개를 조합하세요. 제작한 요리는 '도감'에서 섭취 가능합니다.</div>
                
                <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:12px; margin:15px 0; text-align:center;">
                    <div id="cook-slots" style="font-size:3rem; margin-bottom:15px; letter-spacing:10px;">??</div>
                    <button class="upgrade-btn" onclick="window.game.handleCook()" style="width:120px;">요리 시작</button>
                </div>

                <h3 style="margin-bottom:10px;">📦 보유한 식재료</h3>
                ${hasIngredients ? '' : '<p style="color:#666;">식재료가 없습니다. 탐사에서 구해보세요!</p>'}
            </div>
        `;
        document.querySelector('#modal-body > div').appendChild(grid);
        document.getElementById('modal-container').classList.remove('hidden');
    }
}

window.cookingManager = new CookingManager();

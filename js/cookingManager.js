/**
 * 노마드 베이스 - 요리 매니저 2.0 (밸런스 패치 버전)
 */

class CookingManager {
    constructor() {
        this.selectedIngredients = [];
    }

    /** 요리하기 */
    /** 요리하기 */
    cook(ingredientIds) {
        const state = dataManager.state;

        if (ingredientIds.length === 0) return { success: false, message: "재료를 선택해주세요!" };

        // 1. 재료 소모 체크
        for (const id of ingredientIds) {
            if (!state.inventory.ingredients[id] || state.inventory.ingredients[id] <= 0) {
                return { success: false, message: "재료가 부족합니다!" };
            }
        }

        // 2. 재료 실제 소모
        ingredientIds.forEach(id => {
            state.inventory.ingredients[id] -= 1;
        });

        // 3. 레시피 일치 확인 (SPECIAL_RECIPES 우선 순위)
        const recipeMatch = SPECIAL_RECIPES.find(r =>
            r.ingredients.length === ingredientIds.length &&
            r.ingredients.every(id => ingredientIds.includes(id))
        );

        let result;

        if (recipeMatch) {
            // 정해진 레시피가 있는 경우
            result = { ...recipeMatch, recovery: 35 };
            if (!state.discovered.recipes.includes(result.id)) {
                state.discovered.recipes.push(result.id);
            }
        } else {
            // 4. [핵심 수정] 자유 조합 시스템 (기상천외한 요리 생성)
            const ings = ingredientIds.map(id => INGREDIENTS[id]);
            
            // 이름 조합: 첫 번째 재료의 형용사(adj) + 두 번째 재료의 이름(name) + 랜덤 조리법
            const firstAdj = ings[0].adj || "수상한";
            const secondName = ings[1] ? ings[1].name : ings[0].name;
            const method = COOKING_METHODS[Math.floor(Math.random() * COOKING_METHODS.length)].suffix;
            
            // 회복량: 재료들의 power 합산
            const totalPower = ings.reduce((sum, curr) => sum + (curr.power || 10), 0);

            result = {
                id: `custom_${ingredientIds.sort().join('_')}`, // 조합마다 고유 ID 생성
                name: `${firstAdj} ${secondName} ${method}`,
                icon: ings[0].type === 'meat' ? '🍲' : '🥗', // 대략적인 아이콘 설정
                recovery: totalPower,
                desc: `${ings.map(i => i.icon).join(' ')} 조합으로 연금술을 부렸습니다.`
            };
        }

        // 5. 인벤토리에 보관 (이제 고유 ID를 키값으로 사용하여 모든 요리가 다르게 저장됨)
        const foodKey = result.id;
        
        if (!state.inventory.food[foodKey]) {
            state.inventory.food[foodKey] = { 
                count: 0, 
                recovery: result.recovery, 
                icon: result.icon, 
                name: result.name 
            };
        }
        state.inventory.food[foodKey].count++;

        dataManager.save();
        return { success: true, dish: result };
    }

    /** 요리 섭취 (에너지 회복) */
    eat(foodKey) {
        const state = dataManager.state;
        const foodItem = state.inventory.food[foodKey];

        if (!foodItem || foodItem.count <= 0) return { success: false };

        // [변경] 저장된 recovery 수치를 사용하여 회복
        const recoveryAmount = foodItem.recovery || 15;

        foodItem.count--;
        if (foodItem.count === 0) delete state.inventory.food[foodKey];

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




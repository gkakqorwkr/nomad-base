/**
 * 노마드 베이스 - 요리 매니저 2.0 (밸런스 패치 버전)
 */

class CookingManager {
    constructor() {
        this.selectedIngredients = [];
    }

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

    // 3. 레시피 일치 확인
    const recipeMatch = SPECIAL_RECIPES.find(r =>
        r.ingredients.length === ingredientIds.length &&
        r.ingredients.every(id => ingredientIds.includes(id))
    );

    let result;
    if (recipeMatch) {
        // [결과 A] 도감에 있는 특별 요리
        result = { ...recipeMatch, recovery: 35 };
        if (!state.discovered.recipes.includes(result.id)) {
            state.discovered.recipes.push(result.id);
        }
    } else {
        // [결과 B] 절차적 요리 생성 (말도 안 되는 이름 만들기)
        const ings = ingredientIds.map(id => INGREDIENTS[id]);
        
        // 이름 구성: [첫 번째 재료의 형용사] + [마지막 재료의 이름] + [랜덤 조리법 접미사]
        // 예: 바삭한(adj) + 산나물(name) + 화단(suffix)
        const firstAdj = ings[0].adj || "수상한"; 
        const secondName = ings[ings.length - 1].name;
        
        // cooking.js의 COOKING_METHODS에서 랜덤하게 하나 선택
        const randomMethod = COOKING_METHODS[Math.floor(Math.random() * COOKING_METHODS.length)];
        const methodSuffix = randomMethod.suffix || "조림";

        // 회복량: 재료들의 power 합산
        const totalRecovery = ings.reduce((sum, curr) => sum + (curr.power || 10), 0);

        result = {
            id: `custom_${ingredientIds.sort().join('_')}`, // 재료 조합별 고유 ID
            name: `${firstAdj} ${secondName} ${methodSuffix}`, // 동적 이름 생성
            icon: ings[0].type === 'meat' ? '🍲' : '🥗',
            recovery: totalRecovery,
            desc: `조합 결과: ${ings.map(i => i.icon).join(' + ')}`
        };
    }

    // 4. 인벤토리 저장 (아이템별로 고유한 name과 recovery를 보존)
    const foodKey = result.id;
    
    if (!state.inventory.food[foodKey]) {
        state.inventory.food[foodKey] = { 
            count: 0, 
            recovery: result.recovery, 
            icon: result.icon, 
            name: result.name // 생성된 이름이 저장됨
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





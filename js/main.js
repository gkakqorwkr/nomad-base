/**
 * 노마드 베이스 - 메인 게임 루프 및 UI 컨트롤러 (System 2.0)
 */

class Game {
    constructor() {
        this.initializeManagers();
        this.setupEventListeners();
        this.startLoop();
    }

    initializeManagers() {
        // 전역 객체로 이미 생성된 매니저들 연결 확인
        this.dataManager = window.dataManager;
        this.farmingEngine = window.farmingEngine;
        this.travelManager = window.travelManager;
        this.vehicleManager = window.vehicleManager;
        this.cookingManager = window.cookingManager;
        this.gachaManager = window.gachaManager;
        this.itemManager = window.itemManager;

        this.farmingEngine.start();
    }

    setupEventListeners() {
        window.addEventListener('gameUpdate', () => this.updateUI());
        // 모달 닫기 (배경 클릭)
        document.getElementById('modal-container').onclick = (e) => {
            if (e.target.id === 'modal-container') this.closeModal();
        };
    }

    startLoop() {
        const tick = () => {
            const now = Date.now();
            
            // 1. 자동 자원 생산 엔진 업데이트
            if (this.farmingEngine && typeof this.farmingEngine.update === 'function') {
                this.farmingEngine.update(now);
            }
            
            // 2. 이동 상태 업데이트
            const travelStatus = this.travelManager.update(now);

            // 3. 이동 결과 처리
            if (travelStatus && travelStatus.status) {
                this.handleTravelStatus(travelStatus);
            }

            // 4. UI 실시간 갱신 (성능을 위해 필요할 때만 호출하거나 수치 최적화)
            this.updateUI();

            requestAnimationFrame(tick);
        };
        // 중복 실행을 방지하기 위해 외부에서 한 번만 호출하도록 구조 확인
        requestAnimationFrame(tick);
    }
    
    updateUI() {
        const state = this.dataManager.state;
        document.getElementById('scrap-value').textContent = Math.floor(state.resources.scrap);
        document.getElementById('energy-value').textContent = Math.floor(state.resources.energy);
        document.getElementById('region-name').textContent = this.travelManager.getCurrentRegion().name;

        // 이동 프로그레스바
        const progress = document.getElementById('travel-progress');
        const fill = document.getElementById('progress-bar-fill');
        if (state.travel.isMoving) {
            progress.classList.remove('hidden');
            const total = state.travel.endTime - state.travel.startTime;
            const current = Date.now() - state.travel.startTime;
            fill.style.width = Math.min(100, (current / total) * 100) + '%';
        } else {
            progress.classList.add('hidden');
        }
    }

/** 수동 탐사 처리 (하이리스크 하이리턴 + 식재료 드롭) */
    handleScavenge() {
        const state = this.dataManager.state;
        const region = window.REGIONS.find(r => r.id === state.currentRegionId);

        if (state.resources.energy < 5) {
            this.showToast("에너지가 부족합니다!", 'error');
            return;
        }

        state.resources.energy -= 5;

        // 1. 패널티 계산
        let damage = 0;
        if (Math.random() * 20 < region.danger) {
            damage = region.danger * 2;
            state.resources.energy = Math.max(0, state.resources.energy - damage);
        }

        // 2. 고철 보상 계산
        const baseScrap = Math.floor(Math.random() * 11) + 5;
        const gainedScrap = Math.floor(baseScrap * region.bonus);
        state.resources.scrap += gainedScrap;

        // 3. [추가] 식재료 보상 계산 (기존 farmingEngine의 역할을 대신함)
        let dropMsg = "";
        if (Math.random() < (0.3 + region.rareDropChance)) {
            const ingredientKeys = Object.keys(window.INGREDIENTS);
            const randomKey = ingredientKeys[Math.floor(Math.random() * ingredientKeys.length)];
            
            if (!state.inventory.ingredients[randomKey]) state.inventory.ingredients[randomKey] = 0;
            state.inventory.ingredients[randomKey]++;
            
            const ing = window.INGREDIENTS[randomKey];
            dropMsg = ` | ${ing.icon} ${ing.name} 발견!`;
        }

        // 결과 알림
        let msg = `🔩 고철 +${gainedScrap}${dropMsg}`;
        if (damage > 0) msg += ` (⚠️ 위험! 에너지 -${damage})`;
        
        this.showToast(msg, damage > 0 ? 'warning' : 'info');
        
        this.dataManager.save();
        this.updateUI();
    }
    //

    /** 가챠 메뉴 열기 */
    openGachaMenu() {
        const price = this.gachaManager.getCurrentPrice();
        const count = this.dataManager.state.stats.gachaCount;

        document.getElementById('modal-body').innerHTML = `
            <div style="padding:20px; text-align:center;">
                <h2>🤖 대원 본부 (HQ)</h2>
                <p style="color:#aaa; margin:10px 0;">황무지의 유능한 생존자들을 포섭하세요.</p>
                
                <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:12px; margin:20px 0;">
                    <div style="font-size:0.9rem; color:#888;">다음 모집 비용</div>
                    <div style="font-size:2.5rem; color:var(--accent-color); font-weight:bold;">${price}S</div>
                    <div style="font-size:0.8rem; color:#666; margin-top:5px;">(지금까지 ${count}회 모집함)</div>
                    <button class="upgrade-btn" onclick="window.game.handleGacha()" style="margin-top:20px; width:150px;">모집 시작</button>
                    <div style="font-size:0.8rem; color:#ff4444; margin-top:10px;">* 실패할 확률(30%)이 있습니다.</div>
                </div>

                <div id="companion-list" style="max-height:30vh; overflow-y:auto; border-top:1px solid #333; padding-top:15px;">
                    <!-- 보유 동료 목록 -->
                </div>
            </div>
        `;
        this.renderCompanionList();
        document.getElementById('modal-container').classList.remove('hidden');
    }

    handleGacha() {
        const result = this.gachaManager.roll();
        if (result.success) {
            if (result.isFail) {
                this.showGachaEffect(null, true);
            } else {
                this.showGachaEffect(result.companion);
            }
        } else {
            this.showToast(result.message, 'error');
        }
    }

    /** 가챠 연출 */
    showGachaEffect(companion, isFail = false) {
        const modalBody = document.getElementById('modal-body');
        const effectClass = isFail ? 'gacha-effect-fail' : this.gachaManager.getRarityEffectClass(companion.rarity);

        modalBody.innerHTML = `
            <div class="gacha-reveal ${effectClass}" style="padding:40px; text-align:center; height:100%;">
                <div class="gacha-card scale-up">
                    <div style="font-size:5rem;">${isFail ? '🔩' : (companion.type === 'animal' ? '🐾' : '👤')}</div>
                    <h2 style="margin-top:20px;">${isFail ? '고물 더미' : companion.name}</h2>
                    <p style="color:#ddd; margin:10px 0;">${isFail ? '대원은 없고 쓸모없는 부품만 찾았습니다.' : companion.desc}</p>
                    ${isFail ? '' : `<div style="color:var(--accent-color); font-weight:bold;">보너스: ${companion.effect} x${companion.bonus}</div>`}
                    <button class="upgrade-btn" onclick="window.game.openGachaMenu()" style="margin-top:30px;">확인</button>
                </div>
            </div>
        `;
    }

    /** 요리 메뉴 (이미 cookingManager에 정의됨) */
    openCookingMenu() {
        this.cookingManager.openCookingMenu();
    }

    handleCook() {
        const result = this.cookingManager.cook(this.cookingManager.selectedIngredients);
        if (result.success) {
            this.showToast(`${result.dish.icon} ${result.dish.name} 제작 완료! (창고에 보관됨)`);
            this.openCookingMenu(); // 갱신
        } else {
            this.showToast(result.message, 'error');
        }
    }

    /** 도감/인벤토리 메뉴 */
        /** 도감/인벤토리 메뉴 (수정본) */
    openCollectionMenu() {
        const state = this.dataManager.state;
        const foodInv = state.inventory.food || {};
        const relicInv = state.inventory.relics || [];
        const itemInv = state.inventory.items || {};

        // 1. 요리 레시피 섹션
        let recipeHtml = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-height:200px; overflow-y:auto; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; margin-bottom:20px;">';
        window.SPECIAL_RECIPES.forEach(recipe => {
            const ingredientIcons = recipe.ingredients.map(ingId => {
                const ing = window.INGREDIENTS[ingId];
                return ing ? ing.icon : '❓';
            }).join(' + ');
            recipeHtml += `
                <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:6px; border:1px solid #444;">
                    <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px;">
                        <span>${recipe.icon}</span>
                        <strong style="font-size:0.75rem;">${recipe.name}</strong>
                    </div>
                    <div style="font-size:0.7rem; color:var(--accent-color); text-align:center;">${ingredientIcons}</div>
                </div>`;
        });
        recipeHtml += '</div>';

        // 2. 식품 보관함 섹션 (Object 오류 수정 및 클릭 시 상세 정보창 호출)
        let foodHtml = '<div class="inventory-grid">';
        Object.keys(foodInv).forEach(id => {
            const foodData = foodInv[id];
            // [수정] 데이터가 객체({count:1...})면 .count를 사용, 숫자면 그대로 사용
            const count = (typeof foodData === 'object') ? foodData.count : foodData;
            const recipe = SPECIAL_RECIPES.find(r => r.id === id) || { icon: '🥣', name: '황무지 죽' };
            
            foodHtml += `
                <div class="inventory-slot" onclick="window.game.showFoodDetail('${id}')">
                    <div style="font-size:1.5rem;">${recipe.icon}</div>
                    <div class="slot-count">${count}</div>
                    <div style="font-size:0.55rem; color:#aaa; margin-top:2px;">정보</div>
                </div>`;
        });
        if (Object.keys(foodInv).length === 0) foodHtml = '<p style="color:#666; padding:10px;">저장된 요리가 없습니다.</p>';
        foodHtml += '</div>';

        // 3. 유물 섹션 (기존 코드 유지)
        let relicHtml = '<div class="inventory-grid">';
        window.RELICS.forEach(r => {
            const isOwned = relicInv.includes(r.id);
            relicHtml += `
                <div class="inventory-slot ${isOwned ? '' : 'locked'}" style="opacity:${isOwned ? 1 : 0.2}">
                    <div>${isOwned ? r.icon : '❓'}</div>
                    <div style="font-size:0.55rem; width:100%; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; margin-top:5px;">${isOwned ? r.name : ''}</div>
                </div>`;
        });
        relicHtml += '</div>';

        // 4. 합성 재료 섹션 (기존 코드 유지)
        let itemsHtml = '<div class="inventory-grid" id="forge-selection">';
        Object.keys(itemInv).forEach(id => {
            const count = itemInv[id];
            itemsHtml += `
                <div class="inventory-slot" onclick="window.game.toggleForgeItem('${id}', this)">
                    <div>🔩</div>
                    <div class="slot-count">${count}</div>
                </div>`;
        });
        if (Object.keys(itemInv).length === 0) itemsHtml = '<p style="color:#666; padding:10px;">합성 재료가 없습니다.</p>';
        itemsHtml += '</div>';

        // 5. 전체 레이아웃 (상세 설명 팝업 공간 추가)
        document.getElementById('modal-body').innerHTML = `
            <div style="padding:15px; max-height:80vh; overflow-y:auto;">
                <h2 style="margin-bottom:15px;">📜 생존 도감</h2>
                
                <h3 style="margin:0 0 10px; font-size:0.9rem; color:#aaa;">🍳 요리 레시피 (조합법)</h3>
                ${recipeHtml}

                <h3 style="margin:20px 0 10px; font-size:0.9rem; color:#aaa;">🍞 보유 중인 요리</h3>
                ${foodHtml}

                <div id="food-detail-view" class="hidden" style="margin-top:15px; padding:15px; border:1px solid var(--accent-color); border-radius:10px; background:rgba(255,165,0,0.1); text-align:center;"></div>

                <h3 style="margin:30px 0 10px; font-size:0.9rem; color:#aaa;">🗿 발견한 유물 (${state.inventory.relics.length}/30)</h3>
                ${relicHtml}

                <h3 style="margin:20px 0 10px; font-size:0.9rem; color:#aaa;">⚒️ 아이템 합성</h3>
                <div style="background:rgba(255,165,0,0.1); padding:10px; border-radius:8px; margin-bottom:10px; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center;">
                    <span id="forge-count">선택: 0/3</span>
                    <button class="upgrade-btn" onclick="window.game.handleSynthesis()" style="font-size:0.7rem; padding:4px 10px;">합성 (100S)</button>
                </div>
                ${itemsHtml}
            </div>
        `;
        this.forgeSelected = [];
        document.getElementById('modal-container').classList.remove('hidden');
    }

    /** [추가] 요리 상세 정보 표시 기능 */
    showFoodDetail(id) {
        const foodData = this.dataManager.state.inventory.food[id];
        const recipe = window.SPECIAL_RECIPES.find(r => r.id === id) || { icon: '🥣', name: '황무지 죽', desc: '평범한 음식입니다.' };
        const detailView = document.getElementById('food-detail-view');

        const count = (typeof foodData === 'object') ? foodData.count : foodData;
        const recovery = (typeof foodData === 'object') ? foodData.recovery : 10;

        detailView.innerHTML = `
            <div style="font-size:2.5rem; margin-bottom:10px;">${recipe.icon}</div>
            <h4 style="color:var(--accent-color); font-weight:bold;">${recipe.name}</h4>
            <p style="font-size:0.8rem; color:#ddd; margin:10px 0;">${recipe.desc || '생존을 위한 소중한 식량입니다.'}</p>
            <div style="font-size:0.8rem; margin-bottom:15px;">회복량: <span style="color:var(--accent-color); font-weight:bold;">⚡ +${recovery}</span> (보유: ${count}개)</div>
            <button class="upgrade-btn" onclick="window.game.handleEat('${id}')" style="width:100%; padding:10px;">이 아이템 먹기</button>
        `;
        detailView.classList.remove('hidden');
        detailView.scrollIntoView({ behavior: 'smooth' });
    }

    /** 먹기 처리 (기존 handleEat 수정) */
    handleEat(foodId) {
        const result = this.cookingManager.eat(foodId);
        if (result.success) {
            this.showToast(`에너지가 ${result.amount} 회복되었습니다!`);
            this.openCollectionMenu(); // UI 갱신
        } else {
            this.showToast("사용할 수 있는 아이템이 없습니다.", "error");
        }
    } //


    /** 합성용 아이템 선택 */
    toggleForgeItem(id, el) {
        if (this.forgeSelected.includes(id)) {
            this.forgeSelected = this.forgeSelected.filter(x => x !== id);
            el.style.borderColor = '';
        } else if (this.forgeSelected.length < 3) {
            this.forgeSelected.push(id);
            el.style.borderColor = 'var(--accent-color)';
        }
        document.getElementById('forge-count').textContent = `선택: ${this.forgeSelected.length}/3`;
    }

    handleSynthesis() {
        const result = this.itemManager.synthesize(this.forgeSelected);
        if (result.success) {
            this.showToast(`💎 합성 결과: ${result.result.icon} ${result.result.name}!`);
            this.openCollectionMenu();
        } else {
            this.showToast(result.message, 'error');
        }
    }

    /** 기타 UI 함수들 */
    openRegionMenu() {
        let list = '';
        REGIONS.forEach(r => {
            const isCurrent = this.dataManager.state.currentRegionId === r.id;
            list += `
                <div class="upgrade-card" style="opacity:${isCurrent ? 1 : 0.8}; border-color:${isCurrent ? 'var(--accent-color)' : ''}">
                    <h4>${r.name}</h4>
                    <p style="font-size:0.8rem; color:#aaa;">${r.desc}</p>
                    <button class="upgrade-btn" onclick="window.game.handleTravel('${r.id}')" ${isCurrent ? 'disabled' : ''}>
                        ${isCurrent ? '현재 위치' : '이동'}
                    </button>
                </div>
            `;
        });
        document.getElementById('modal-body').innerHTML = `<div style="padding:20px;"><h2>🗺️ 지역 이동</h2>${list}</div>`;
        document.getElementById('modal-container').classList.remove('hidden');
    }

    handleTravel(id) {
        const result = this.travelManager.startTravel(id);
        if (result.success) {
            this.showToast(result.message);
            this.closeModal();
        } else {
            this.showToast(result.message, 'error');
        }
    }

    openUpgradeMenu() {
        this.vehicleManager.openUpgradeMenu ? this.vehicleManager.openUpgradeMenu() : this.renderUpgradeMenu();
    }

    // fallback용
    renderUpgradeMenu() {
        const summary = this.vehicleManager.getVehicleSummary();
        let list = '<div class="upgrade-list" style="max-height:60vh; overflow-y:auto;">';
        summary.forEach(p => {
            const cur = p.current;
            const nxt = p.next;
            list += `
                <div class="upgrade-card" style="padding:15px; border-bottom:1px solid #444;">
                    <div style="display:flex; justify-content:space-between;">
                        <h4>${p.icon} ${p.name} (Lv.${cur.level})</h4>
                        <button class="upgrade-btn ${this.dataManager.state.resources.scrap >= (nxt ? nxt.cost : Infinity) ? 'can-afford' : ''}" 
                                onclick="window.game.handleUpgrade('${p.key}')" ${nxt ? '' : 'disabled'}>
                            ${nxt ? `${nxt.cost}S` : 'MAX'}
                        </button>
                    </div>
                    <div style="font-size:0.8rem; color:var(--accent-color); margin-top:5px;">
                        ${p.effectName}: ${cur.bonus}${p.unit} ${nxt ? `➔ ${nxt.bonus}${p.unit}` : '(최대)'}
                    </div>
                </div>
            `;
        });
        document.getElementById('modal-body').innerHTML = `<div style="padding:15px;"><h2>🔧 차량 개조</h2>${list}</div>`;
        document.getElementById('modal-container').classList.remove('hidden');
    }

    handleUpgrade(key) {
        const result = this.vehicleManager.upgradePart(key);
        if (result.success) {
            this.showToast(result.message);
            this.renderUpgradeMenu();
        } else {
            this.showToast(result.message, 'error');
        }
    }

    handleTravelStatus(status) {
        const state = this.dataManager.state;

        if (status.status === 'arrived') {
            // 위치 및 상태 갱신
            state.currentRegionId = state.travel.targetRegionId; 
            state.travel.isMoving = false; 
            
            // [중요] 매니저 내부의 이동 데이터도 초기화 (필요시)
            if(this.travelManager.finishTravel) {
                this.travelManager.finishTravel();
            }

            this.showToast(`🚚 ${this.travelManager.getCurrentRegion().name}에 도착했습니다!`);
            
            this.dataManager.save();
            this.updateUI(); 
        } else if (status.status === 'event_triggered') {
            this.showToast("⚠️ 도중에 돌발 상황이 발생했습니다!", 'warning');
        }
    }


    renderCompanionList() {
        const companions = this.dataManager.state.companions;
        const target = document.getElementById('companion-list');
        if (!target) return;

        if (companions.length === 0) {
            target.innerHTML = '<p style="color:#666;">합류한 대원이 없습니다.</p>';
            return;
        }

        let html = '';
        companions.forEach(c => {
            html += `
                <div style="display:flex; align-items:center; padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; margin-bottom:8px;">
                    <div style="font-size:2rem; margin-right:15px;">${c.type === 'animal' ? '🐾' : '👤'}</div>
                    <div style="flex:1; text-align:left;">
                        <div style="font-weight:bold;">${c.name} <span style="font-size:0.7rem; color:#888;">[${c.rarity}]</span></div>
                        <div style="font-size:0.7rem; color:var(--accent-color);">${c.effect} x${c.bonus}</div>
                    </div>
                </div>
            `;
        });
        target.innerHTML = html;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
    }
}

// GUI 초기화 및 전역 할당
window.game = new Game();













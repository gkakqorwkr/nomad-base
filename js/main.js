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
            const travelStatus = this.travelManager.update(now);

            if (travelStatus) {
                this.handleTravelStatus(travelStatus);
            }

            requestAnimationFrame(tick);
        };
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

    /** 수동 탐사 처리 */
    handleScavenge() {
        const result = this.farmingEngine.scavenge();
        if (result.success) {
            this.showToast(result.message);
            this.updateUI();
        } else {
            this.showToast(result.message, 'error');
        }
    }

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
    openCollectionMenu() {
        const state = this.dataManager.state;

        let foodHtml = '<div class="inventory-grid">';
        Object.keys(state.inventory.food).forEach(id => {
            const count = state.inventory.food[id];
            const recipe = SPECIAL_RECIPES.find(r => r.id === id) || { icon: '🥣', name: '황무지 죽' };
            foodHtml += `
                <div class="inventory-slot" onclick="window.game.handleEat('${id}')">
                    <div>${recipe.icon}</div>
                    <div class="slot-count">${count}</div>
                    <div style="font-size:0.6rem; color:#aaa; margin-top:2px;">먹기</div>
                </div>
            `;
        });
        foodHtml += '</div>';

        let relicHtml = '<div class="inventory-grid">';
        RELICS.forEach(r => {
            const isOwned = state.inventory.relics.includes(r.id);
            relicHtml += `
                <div class="inventory-slot ${isOwned ? '' : 'locked'}" style="opacity:${isOwned ? 1 : 0.3}">
                    <div>${isOwned ? r.icon : '❓'}</div>
                    <div style="font-size:0.55rem; width:100%; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">${isOwned ? r.name : ''}</div>
                </div>
            `;
        });
        relicHtml += '</div>';

        // 합성 재료
        let itemsHtml = '<div class="inventory-grid" id="forge-selection">';
        Object.keys(state.inventory.items).forEach(id => {
            const count = state.inventory.items[id];
            itemsHtml += `
                <div class="inventory-slot" onclick="window.game.toggleForgeItem('${id}', this)">
                    <div>🔩</div>
                    <div class="slot-count">${count}</div>
                </div>
            `;
        });
        itemsHtml += '</div>';

        document.getElementById('modal-body').innerHTML = `
            <div style="padding:15px;">
                <h2>📜 생존 가방</h2>
                
                <h3 style="margin:15px 0 10px;">🍞 식품 보관함 (클릭 시 섭취)</h3>
                ${foodHtml}

                <h3 style="margin:20px 0 10px;">🗿 발견한 유물 (${state.inventory.relics.length}/30)</h3>
                ${relicHtml}

                <h3 style="margin:20px 0 10px;">⚒️ 아이템 합성 (재료 3개 선택)</h3>
                <div style="background:rgba(255,165,0,0.1); padding:10px; border-radius:8px; margin-bottom:10px; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center;">
                    <span id="forge-count">선택: 0/3</span>
                    <button class="upgrade-btn" onclick="window.game.handleSynthesis()" style="font-size:0.7rem; padding:4px 10px;">합성 실행 (100S)</button>
                </div>
                ${itemsHtml}
            </div>
        `;
        this.forgeSelected = [];
        document.getElementById('modal-container').classList.remove('hidden');
    }

    handleEat(foodId) {
        const result = this.cookingManager.eat(foodId);
        if (result.success) {
            this.showToast(`에너지가 ${result.amount} 회복되었습니다!`);
            this.openCollectionMenu(); // 갱신
        }
    }

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
        if (status.status === 'arrived') {
            this.showToast(`🚚 ${this.travelManager.getCurrentRegion().name}에 도착했습니다!`);
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

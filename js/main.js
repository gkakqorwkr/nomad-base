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

            // 1. 이동 상태 업데이트
            const travelStatus = this.travelManager.update(now);

            // 2. 이동 결과 처리
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

        // [수정] Number()를 사용하여 문자열 결합 방지 및 소수점 제거
        const currentScrap = Math.floor(Number(state.resources.scrap) || 0);
        const currentEnergy = Math.floor(Number(state.resources.energy) || 0);

        document.getElementById('scrap-value').textContent = currentScrap.toLocaleString(); // 세자리 콤마 추가
        document.getElementById('energy-value').textContent = currentEnergy;

        const region = this.travelManager.getCurrentRegion();
        document.getElementById('region-name').textContent = region.name;

        // [신규] 배경 전환
        const mainView = document.getElementById('main-view');
        // 기존 배경 클래스 제거 후 새 클래스 추가
        window.REGIONS.forEach(r => mainView.classList.remove(`bg-${r.id}`));
        mainView.classList.add(`bg-${region.id}`);

        // [신규] 방사능 바 업데이트
        const radFill = document.getElementById('radiation-fill');
        if (radFill) {
            const radPercent = state.resources.radiation || 0;
            radFill.style.width = radPercent + '%';
            // 수치에 따라 색상 변경 (노랑 -> 빨강)
            radFill.style.background = radPercent > 70 ? '#ff4444' : (radPercent > 30 ? '#ffeb3b' : '#00ff00');
        }

        // 기후 표시 업데이트
        const currentWeather = window.weatherManager ? window.weatherManager.getCurrentWeather() : null;
        if (currentWeather) {
            const weatherEl = document.getElementById('weather-info');
            if (weatherEl) {
                weatherEl.innerHTML = `<span title="${currentWeather.desc}">${currentWeather.icon} ${currentWeather.name}</span>`;
                weatherEl.style.color = currentWeather.color;
            }
        }

        // 미션 알림 업데이트
        const activeMission = state.missions.active;
        const radioBtn = document.getElementById('radio-mission-btn');
        if (radioBtn) {
            if (activeMission) {
                radioBtn.classList.add('glow-pulse');
                radioBtn.classList.remove('hidden');
            } else {
                radioBtn.classList.remove('glow-pulse');
                radioBtn.classList.add('hidden');
            }
        }

        // 이동 프로그레스바 로직
        const progress = document.getElementById('travel-progress');
        const fill = document.getElementById('progress-bar-fill');

        if (state.travel.isMoving) {
            progress.classList.remove('hidden');
            const total = state.travel.endTime - state.travel.startTime;
            const current = Date.now() - state.travel.startTime;
            // 0으로 나누기 방지 및 범위 제한
            const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0;
            fill.style.width = percent + '%';
        } else {
            progress.classList.add('hidden');
            fill.style.width = '0%';
        }
    }

    /** 수동 탐사 처리 (하이리스크 하이리턴 + 식재료 드롭) */
    handleScavenge() {
        const state = this.dataManager.state;
        const region = window.REGIONS.find(r => r.id === state.currentRegionId);

        // 기후 배율 적용
        const weather = window.weatherManager ? window.weatherManager.getCurrentWeather() : { energyMult: 1, dropMult: 1 };
        const energyCost = Math.floor(5 * weather.energyMult);

        if (state.resources.energy < energyCost) {
            this.showToast("에너지가 부족합니다!", 'error');
            return;
        }

        state.resources.energy -= energyCost;

        // [신규] 탐색 중 적 조우 체크 (20% 확률)
        if (Math.random() < 0.2 && region.enemies && region.enemies.length > 0) {
            const enemy = region.enemies[Math.floor(Math.random() * region.enemies.length)];
            this.showToast(`⚠️ 정찰 중 ${enemy.name}과 마주쳤습니다!`, 'warning');
            this.openBattleMenu(enemy); // 보스전과 동일한 메뉴 재사용
            return;
        }

        // 1. 패널티 계산
        let damage = 0;
        if (Math.random() * 20 < region.danger) {
            damage = region.danger * 2;
            state.resources.energy = Math.max(0, state.resources.energy - damage);
        }

        // 2. 고철 보상 계산 (Researcher 시너지 반영)
        const synergy = this.getSynergyBonus();
        const baseScrap = Math.floor(Math.random() * 11) + 5;
        const gainedScrap = Math.floor(baseScrap * region.bonus * weather.dropMult * (1 + synergy.scrapBonus));
        state.resources.scrap += gainedScrap;

        window.logger.log(`탐사 수행: 고철 +${gainedScrap} 획득 (시너지 보너스: ${Math.round(synergy.scrapBonus * 100)}%)`);

        // 3. [추가] 식재료 보상 계산
        let dropMsg = "";
        if (Math.random() < (0.6 + region.rareDropChance)) {
            const ingredientKeys = Object.keys(window.INGREDIENTS);
            const randomKey = ingredientKeys[Math.floor(Math.random() * ingredientKeys.length)];

            if (!state.inventory.ingredients[randomKey]) state.inventory.ingredients[randomKey] = 0;
            state.inventory.ingredients[randomKey]++;

            const ing = window.INGREDIENTS[randomKey];
            dropMsg = ` | ${ing.icon} ${ing.name} 발견!`;
        }

        // 4. [추가] 합성용 아이템 드롭 로직
        if (Math.random() < 0.3) {
            this.itemManager.addItem('trash', 1, 'items');
            dropMsg += ` | 🔩 고철 부스러기 획득!`;
        }

        this.showToast(`🦾 탐사 완료: +${gainedScrap}S${dropMsg}`, 'success');
        this.updateUI();
        this.dataManager.save();
    }

    /** 📻 미션 모달 열기 */
    openMissionModal() {
        const mission = this.dataManager.state.missions.active;
        if (!mission) return;

        const html = `
            <div class="mission-card" style="background: rgba(40, 40, 40, 0.9); padding: 15px; border-radius: 8px; border-left: 4px solid #ff4500; margin-bottom: 20px;">
                <h3 style="color:#ff4500;">📻 긴급 무전: ${mission.name}</h3>
                <p style="margin:10px 0;">${mission.desc}</p>
                <hr style="opacity:0.2;">
                <div style="margin: 10px 0;">
                    <strong>비용:</strong> ${mission.cost.energy ? `⚡${mission.cost.energy}` : ''} 
                    ${mission.cost.scrap ? `🪙${mission.cost.scrap}S` : ''}
                </div>
                <div style="color: #ffd700;">
                    <strong>보상 예정:</strong> ${mission.reward.scrap ? `${mission.reward.scrap}S ` : ''} 
                    ${mission.reward.ingredients ? '무작위 식재료 ' : ''}
                </div>
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button onclick="window.game.handleMissionConfirm('${mission.id}')" style="background:#ff4500; flex:1; padding:10px; border:none; border-radius:5px; color:white; font-weight:bold; cursor:pointer;">도와주기</button>
                    <button onclick="window.game.closeModal()" style="flex:1; padding:10px; border:none; border-radius:5px; background:#444; color:white; cursor:pointer;">무시하기</button>
                </div>
            </div>
        `;
        this.showModal("긴급 무선 주파수 수신 중...", html);
    }

    handleMissionConfirm(id) {
        const result = window.missionManager.completeMission(id);
        if (result.success) {
            this.showToast(result.message, 'success');
            this.closeModal();
            this.updateUI();
        } else {
            this.showToast(result.message, 'error');
        }
    }
    /** 가챠 메뉴 열기 */
    openGachaMenu() {
        const price = this.gachaManager.getCurrentPrice();
        const count = this.dataManager.state.stats.gachaCount;

        const html = `
            <div style="padding:10px; text-align:center;">
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
        this.showModal("🤖 대원 본부 (HQ)", html);
        this.renderCompanionList();
    }

    handleGacha() {
        const result = this.gachaManager.roll();
        if (result.success) {
            if (result.isFail) {
                // 실패 시에도 합성 재료 지급
                this.itemManager.addItem('trash', 1, 'items');
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
            const isObj = typeof foodData === 'object';
            const count = isObj ? foodData.count : foodData;

            // 인벤토리에 저장된 데이터 우선, 없으면 레시피에서 검색, 그것도 없으면 기본값
            const displayName = isObj ? (foodData.name || '알 수 없는 요리') : (window.SPECIAL_RECIPES.find(r => r.id === id)?.name || '황무지 죽');
            const displayIcon = isObj ? (foodData.icon || '🥣') : (window.SPECIAL_RECIPES.find(r => r.id === id)?.icon || '🥣');

            foodHtml += `
                <div class="inventory-slot" onclick="window.game.showFoodDetail('${id}')">
                    <div style="font-size:1.5rem;">${displayIcon}</div>
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

        // UI 일관성을 위해 showModal 사용
        this.showModal("📜 생존 기록 및 도감", `
            <div style="padding:10px; max-height:80vh; overflow-y:auto;">
                <h4 style="margin-bottom:10px;">🍲 특별 레시피 (해금: ${state.discovered.recipes.length}/${window.SPECIAL_RECIPES.length})</h4>
                ${recipeHtml}
                
                <h4 style="margin-bottom:10px;">📦 식품 보관함</h4>
                ${foodHtml}
                <div id="food-detail-view" class="hidden" style="margin-top:20px; padding:15px; background:rgba(255,165,0,0.1); border-radius:10px; border:1px solid var(--accent-color); text-align:center;"></div>

                <h4 style="margin:20px 0 10px 0;">💎 유물 도감 (${relicInv.length}/${window.RELICS.length})</h4>
                ${relicHtml}

                <h4 style="margin:20px 0 10px 0;">🔩 정비용 고물</h4>
                <div style="background:rgba(255,165,0,0.1); padding:10px; border-radius:8px; margin-bottom:10px; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center;">
                    <span id="forge-count">선택: 0/3</span>
                    <button class="upgrade-btn" onclick="window.game.handleSynthesis()" style="font-size:0.7rem; padding:4px 10px;">합성 (100S)</button>
                </div>
                ${itemsHtml}
            </div>
        `);
        this.forgeSelected = [];
    }

    /** [추가] 요리 상세 정보 표시 기능 */
    showFoodDetail(id) {
        const foodData = this.dataManager.state.inventory.food[id];
        const isObj = typeof foodData === 'object';

        // 데이터 우선 참조
        const recipe = window.SPECIAL_RECIPES.find(r => r.id === id);
        const name = isObj ? (foodData.name || '알 수 없는 요리') : (recipe?.name || '황무지 죽');
        const icon = isObj ? (foodData.icon || '🥣') : (recipe?.icon || '🥣');
        const desc = isObj ? (foodData.desc || '정보가 없습니다.') : (recipe?.desc || '으... 이걸 먹어야 한다고요?');
        const count = isObj ? foodData.count : foodData;
        const recovery = isObj ? (foodData.recovery || 10) : (recipe?.recovery || 10);

        const detailView = document.getElementById('food-detail-view');

        detailView.innerHTML = `
            <div style="font-size:2.5rem; margin-bottom:10px;">${icon}</div>
            <h4 style="color:var(--accent-color); font-weight:bold;">${name}</h4>
            <p style="font-size:0.8rem; color:#ddd; margin:10px 0;">${desc}</p>
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
            this.openCollectionMenu(); // 인벤토리 갱신
            this.updateUI(); // 상단 바 에너지 즉시 반영
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
        this.showModal("🗺️ 지역 이동", `<div style="padding:5px;">${list}</div>`);
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

    // 차량 업그레이드/모듈 메뉴 렌더링
    renderUpgradeMenu(tab = 'parts') {
        const summary = this.vehicleManager.getVehicleSummary();
        const modules = window.VEHICLE_MODULES;
        const state = this.dataManager.state;

        let html = `
            <div style="padding:20px;">
                <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid #333; padding-bottom:10px;">
                    <button onclick="window.game.renderUpgradeMenu('parts')" style="flex:1; padding:8px; background:${tab === 'parts' ? 'var(--accent-color)' : '#333'}; border:none; border-radius:5px; color:white; font-weight:bold; cursor:pointer;">차량 부품</button>
                    <button onclick="window.game.renderUpgradeMenu('modules')" style="flex:1; padding:8px; background:${tab === 'modules' ? 'var(--accent-color)' : '#333'}; border:none; border-radius:5px; color:white; font-weight:bold; cursor:pointer;">특수 모듈</button>
                </div>
                <div class="upgrade-list" style="max-height:60vh; overflow-y:auto;">
        `;

        if (tab === 'parts') {
            summary.forEach(p => {
                const cur = p.current;
                const nxt = p.next;
                html += `
                    <div class="upgrade-card" style="padding:15px; border-bottom:1px solid #444; margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <h4 style="margin:0;">${p.icon} ${p.name} (Lv.${cur.level})</h4>
                                <div style="font-size:0.75rem; color:#888;">${p.effectName}: ${cur.bonus}${p.unit} ${nxt ? `→ ${nxt.bonus}${p.unit}` : ''}</div>
                            </div>
                            <button class="upgrade-btn ${state.resources.scrap >= (nxt ? nxt.cost : Infinity) ? 'can-afford' : ''}" 
                                    onclick="window.game.handleUpgrade('${p.key}')" 
                                    ${nxt ? '' : 'disabled'}>
                                ${nxt ? `${nxt.cost}S` : 'MAX'}
                            </button>
                        </div>
                    </div>`;
            });
        } else {
            Object.keys(modules).forEach(id => {
                const m = modules[id];
                const level = state.vehicle.modules[id] || 0;
                const isMax = level >= m.maxLevel;
                html += `
                    <div class="upgrade-card" style="padding:15px; border-bottom:1px solid #444; margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <h4 style="margin:0;">${m.icon} ${m.name} (Lv.${level})</h4>
                                <div style="font-size:0.75rem; color:#888;">${m.desc}</div>
                            </div>
                            <button class="upgrade-btn ${state.resources.scrap >= (isMax ? Infinity : m.cost.scrap) ? 'can-afford' : ''}" 
                                    onclick="window.game.handleModuleUpgrade('${id}')" 
                                    ${isMax ? 'disabled' : ''}>
                                ${isMax ? 'MAX' : `${m.cost.scrap}S`}
                            </button>
                        </div>
                    </div>`;
            });
        }

        html += `</div></div>`;
        this.showModal("🚛 차량 관리 스테이션", html);
    }

    handleUpgrade(key) {
        const result = this.vehicleManager.upgradePart(key);
        if (result.success) {
            this.showToast(result.message, 'success');
            this.renderUpgradeMenu('parts');
            this.updateUI();
        } else {
            this.showToast(result.message, 'error');
        }
    }

    handleModuleUpgrade(id) {
        const result = this.vehicleManager.upgradeModule(id);
        if (result.success) {
            this.showToast(result.message, 'success');
            this.vehicleManager.openUpgradeMenu('modules');
            this.updateUI();
        } else {
            this.showToast(result.message, 'error');
        }
    }

    /** [신규] 거점 강화 핸들러 */
    handleFortUpgrade(key) {
        const result = this.vehicleManager.upgradeFortification(key);
        if (result.success) {
            this.showToast(result.message, 'success');
            this.vehicleManager.openUpgradeMenu('fort');
            this.updateUI();
        } else {
            this.showToast(result.message, 'error');
        }
    }

    handleTravelStatus(status) {
        if (status.status === 'arrived') {
            this.showToast(`🚚 ${status.name}에 도착했습니다!`);
            if (status.market) {
                setTimeout(() => {
                    this.showToast("🌑 유량 상인의 암시장을 발견했습니다!", 'success');
                    this.openBlackMarket();
                }, 1000);
            }
            this.updateUI();
        } else if (status.status === 'event_triggered') {
            this.showToast("⚠️ 도중에 돌발 상황이 발생했습니다!", 'warning');
            this.openEventModal();
        } else if (status.status === 'boss_triggered') {
            this.showToast("🚨 경고! 구역의 우두머리가 나타났습니다!", 'error');
            this.openBattleMenu(status.boss);
        }
    }

    /** 돌발 이벤트 모달 */
    openEventModal() {
        const event = TRAVEL_EVENTS[Math.floor(Math.random() * TRAVEL_EVENTS.length)];
        let optionsHtml = '';
        event.options.forEach((opt, idx) => {
            optionsHtml += `<button class="upgrade-btn" style="margin: 5px; width: 100%;" onclick="window.game.handleEventOption(${JSON.stringify(opt).replace(/"/g, '&quot;')})">${opt.text}</button>`;
        });

        const html = `
            <div style="padding:10px; text-align:center;">
                <p style="margin:20px 0; line-height:1.6;">${event.desc}</p>
                <div style="display:flex; flex-direction:column; align-items:center;">
                    ${optionsHtml}
                </div>
            </div>
        `;
        this.showModal(`⚠️ 돌발 상황: ${event.name}`, html);
    }

    handleEventOption(option) {
        let message = "상황이 종료되었습니다.";
        let penaltyTime = 0;

        if (option.action === 'loot') {
            this.dataManager.state.resources.scrap += option.reward.scrap;
            message = `💰 고철 ${option.reward.scrap}개를 획득했습니다!`;
        } else if (option.action === 'speed') {
            this.dataManager.state.resources.energy = Math.max(0, this.dataManager.state.resources.energy - option.penalty.energy);
            message = `⚡ 에너지를 ${option.penalty.energy} 소모하여 빠르게 빠져나왔습니다.`;
        } else if (option.action === 'wait') {
            penaltyTime = option.penalty.time;
            message = `⏰ ${penaltyTime}초 동안 비를 피하며 정비했습니다.`;
        }

        this.showToast(message);
        this.travelManager.resumeTravel(penaltyTime);
        this.closeModal();
        this.dataManager.save();
    }

    /** 보스 전투 메뉴 (사용자 코드 naming 준수) */
    openBattleMenu(boss) {
        window.battleManager.startBattle(boss);
        this.renderBossBattle();
        document.getElementById('modal-container').classList.remove('hidden');
    }

    renderBossBattle() {
        const boss = window.battleManager.currentBoss;
        const hpPercent = (window.battleManager.bossHp / boss.hp) * 100;

        document.getElementById('modal-body').innerHTML = `
            <div style="padding:20px; text-align:center;">
                <h2 style="color:#ff4444;">🚨 보스 출현: ${boss.name}</h2>
                <div style="font-size:5rem; margin:20px 0;">${boss.icon || '👾'}</div>
                
                <div style="width:100%; height:20px; background:#333; border-radius:10px; margin-bottom:10px; overflow:hidden;">
                    <div id="boss-hp-fill" style="width:${hpPercent}%; height:100%; background:#ff4444; transition: width 0.3s;"></div>
                </div>
                <div style="font-size:0.8rem; color:#aaa; margin-bottom:20px;">HP: ${window.battleManager.bossHp} / ${boss.hp}</div>

                <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:10px; margin-bottom:20px;">
                    <p style="font-size:0.9rem; color:#ddd;">앞길을 막는 거대 괴수를 물리쳐야 합니다!</p>
                </div>

                <button class="upgrade-btn" style="width:100%; height:60px; font-size:1.2rem;" onclick="window.game.handleBossAttack()">공격하기!</button>
            </div>
        `;
    }

    handleBossAttack() {
        const result = window.battleManager.attack();
        if (!result) return;

        if (result.status === 'hit') {
            this.showToast(`💥 ${result.damage}의 피해를 입혔습니다! (반격: -${result.bossDamage}E)`, 'warning');
            this.renderBossBattle();
        } else if (result.status === 'win') {
            this.showToast(`🏆 ${window.battleManager.currentBoss.name}을(를) 격퇴했습니다! 보상: ${result.reward}S`, 'info');
            this.travelManager.resumeAfterBattle();
            this.closeModal();
            this.updateUI();
        }

        if (this.dataManager.state.resources.energy <= 0) {
            this.showToast("😱 에너지가 고갈되었습니다! 전투 불능!", "error");
            this.travelManager.resumeAfterBattle();
            this.closeModal();
        }
    }


    /** 동료 목록 렌더링 (시너지 정보 포함 - Phase 5) */
    renderCompanionList() {
        const state = this.dataManager.state;
        const companions = state.companions || [];
        const container = document.getElementById('companion-list');
        if (!container) return;

        const synergyInfo = this.getSynergyBonus();

        let synergyHtml = '<div style="background:rgba(243, 156, 18, 0.1); padding:10px; border-radius:8px; margin-bottom:15px; border:1px solid var(--accent-color);">';
        synergyHtml += '<div style="font-size:0.8rem; font-weight:bold; margin-bottom:5px;">현재 활성화된 시너지</div>';

        let activeSynergies = 0;
        if (synergyInfo.damageReduction > 0) { synergyHtml += `<div>⚔️ 정예 파견 (Soldier x2): 피해 -${Math.round(synergyInfo.damageReduction * 100)}%</div>`; activeSynergies++; }
        if (synergyInfo.energySave > 0) { synergyHtml += `<div>🔧 정비 팀 (Engineer x2): 소모 -${Math.round(synergyInfo.energySave * 100)}%</div>`; activeSynergies++; }
        if (synergyInfo.scrapBonus > 0) { synergyHtml += `<div>🧬 탐구 루틴 (Researcher x2): 획득 +${Math.round(synergyInfo.scrapBonus * 100)}%</div>`; activeSynergies++; }
        if (synergyInfo.speedBonus > 0) { synergyHtml += `<div>📡 선발대 (Scout x2): 시간 -${Math.round(synergyInfo.speedBonus * 100)}%</div>`; activeSynergies++; }

        if (activeSynergies === 0) synergyHtml += '<div style="color:#666; font-size:0.75rem;">동일한 직업의 대원을 2명 이상 모으세요.</div>';
        synergyHtml += '</div>';

        let listHtml = synergyHtml + '<div style="display:grid; grid-template-columns:1fr; gap:8px;">';
        companions.forEach(c => {
            // ID 또는 객체 형태 모두 대응
            const compId = typeof c === 'string' ? c : c.id;
            const comp = window.COMPANION_POOL.find(p => p.id === compId);
            if (!comp) return;
            listHtml += `
                <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="text-align:left;">
                        <span style="color:${comp.color || '#fff'}; font-weight:bold;">[${comp.rarity}]</span> ${comp.name}
                        <div style="font-size:0.7rem; color:#888;">${comp.role || '무직'} | ${comp.desc}</div>
                    </div>
                </div>`;
        });
        if (companions.length === 0) listHtml += '<p style="color:#666; font-size:0.8rem; text-align:center;">아직 합류한 대원이 없습니다.</p>';
        listHtml += '</div>';
        container.innerHTML = listHtml;
    }

    /** 📊 시너지 보너스 수치 계산 (System 2.0) */
    getSynergyBonus() {
        const state = this.dataManager.state;
        const companions = state.companions || [];
        const roles = {};
        companions.forEach(c => {
            const compId = typeof c === 'string' ? c : c.id;
            const comp = window.COMPANION_POOL.find(p => p.id === compId);
            if (comp && comp.role) roles[comp.role] = (roles[comp.role] || 0) + 1;
        });
        return {
            damageReduction: (roles['Soldier'] >= 2) ? 0.3 : 0,
            energySave: (roles['Engineer'] >= 2) ? 0.1 : 0,
            scrapBonus: (roles['Researcher'] >= 2) ? 0.2 : 0,
            speedBonus: (roles['Scout'] >= 2) ? 0.15 : 0
        };
    }

    /** 🏪 황무지 암시장 UI (Phase 6) */
    openBlackMarket() {
        const stock = window.blackMarketManager.stock;
        let itemsHtml = '<div style="display:grid; gap:10px;">';
        stock.forEach(item => {
            itemsHtml += `
                <div class="upgrade-card" style="padding:15px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="text-align:left;">
                        <div style="font-weight:bold;">${item.icon} ${item.name}</div>
                        <div style="font-size:0.75rem; color:#888;">${item.desc}</div>
                    </div>
                    <button class="upgrade-btn ${this.dataManager.state.resources.scrap >= item.cost ? 'can-afford' : ''}" 
                            onclick="window.game.handleBuyItem('${item.id}')">${item.cost}S</button>
                </div>`;
        });
        itemsHtml += '</div>';
        this.showModal("🌑 황무지 암시장", `<div style="padding:20px;"><p style="margin-bottom:15px;">유량 상인이 귀한 물건들을 보여줍니다.</p>${itemsHtml}</div>`);
    }

    handleBuyItem(id) {
        const result = window.blackMarketManager.buyItem(id);
        if (result.success) {
            this.showToast(result.message, 'success');
            this.openBlackMarket(); // 리스트 갱신
            this.updateUI();
        } else {
            this.showToast(result.message, 'error');
        }
    }

    /** 🖼️ 통합 모달 호출 함수 */
    showModal(title, contentHtml) {
        const modal = document.getElementById('modal-container');
        const body = document.getElementById('modal-body');
        if (!modal || !body) return;

        body.innerHTML = `<h3>${title}</h3><hr style="opacity:0.1; margin:10px 0;">${contentHtml}`;
        modal.classList.remove('hidden');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    closeModal() {
        const modal = document.getElementById('modal-container');
        if (modal) modal.classList.add('hidden');
    }

    /** [신규] 피격 연출 (화면 흔들림 및 붉은 틴트) */
    triggerHitEffect() {
        const container = document.getElementById('game-container');
        if (!container) return;

        container.classList.add('hit-active');
        setTimeout(() => {
            container.classList.remove('hit-active');
        }, 300); // 애니메이션 시간과 일치
    }
}

// GUI 초기화 및 전역 할당
window.game = new Game();
















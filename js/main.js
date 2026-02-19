/**
 * 노마드 베이스 - 메인 엔트리 포인트 (비모듈 버전)
 */
// import { dataManager } from './dataManager.js';

class Game {
    constructor() {
        this.selectedIngredients = [];
        this.updateInterval = null;
    }

    async init() {
        console.log('Nomad Base: Starting initialization...');
        const notify = document.getElementById('notification-area');

        // 1. 이벤트 바인딩 (최우선: 버튼 상호작용 보장)
        try {
            this.bindEvents();
            console.log('Nomad Base: Events Bound');
        } catch (e) {
            console.error('Nomad Base: Event Binding Failed', e);
        }

        // 2. 각 시스템 엔진 시작 (개별 시도)
        try {
            farmingEngine.start();
            console.log('Nomad Base: Farming Engine Started');
        } catch (e) {
            console.error('Nomad Base: Farming Engine Start Failed', e);
        }

        try {
            this.startMainLoop();
            this.updateUI();
            console.log('Nomad Base: Main Loop & UI Updated');
        } catch (e) {
            console.error('Nomad Base: Core Logic Start Failed', e);
        }

        if (notify) {
            notify.style.display = 'block';
            notify.style.opacity = '1';
            notify.textContent = "🚛 시스템 가동 완료! 고철 파밍을 시작합니다.";
            setTimeout(() => { notify.style.opacity = '0'; }, 3000);
        }
        console.log('Nomad Base: Initialization Process Completed');
    }

    startMainLoop() {
        this.updateInterval = setInterval(() => {
            const now = Date.now();
            const travelRes = travelManager.update(now);

            if (travelRes) {
                if (travelRes.status === 'arrived') {
                    alert(`${travelManager.getCurrentRegion().name}에 도착했습니다!`);
                    this.updateUI();
                } else if (travelRes.status === 'event_triggered') {
                    this.triggerTravelEvent();
                } else if (travelRes.status === 'boss_triggered') {
                    this.triggerBossBattle(travelRes.boss);
                }
                this.updateTravelOverlay(travelRes);
            }
        }, 1000);
    }

    triggerBossBattle(boss) {
        battleManager.startBattle(boss);
        const modalContainer = document.getElementById('modal-container');
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = `
            <div class="battle-container">
                <div class="boss-display">
                    <div class="boss-icon shaking" id="boss-visual">${boss.icon}</div>
                    <h2 id="boss-name">${boss.name}</h2>
                    <div class="hp-bar-container"><div class="hp-bar" id="boss-hp-bar"></div></div>
                    <p id="boss-hp-text">HP: ${boss.hp} / ${boss.hp}</p>
                </div>
                <div class="attack-log" id="battle-log">길을 막는 자가 나타났습니다!</div>
                <button class="battle-action-btn" id="btn-attack">차량 공격 가동!</button>
            </div>
        `;

        modalContainer.classList.remove('hidden');
        document.getElementById('btn-attack').onclick = () => this.handleAttack();
    }

    handleAttack() {
        const res = battleManager.attack();
        const hpBar = document.getElementById('boss-hp-bar');
        const hpText = document.getElementById('boss-hp-text');
        const log = document.getElementById('battle-log');
        const bossVisual = document.getElementById('boss-visual');

        bossVisual.style.filter = 'brightness(2) saturate(2)';
        setTimeout(() => bossVisual.style.filter = '', 100);

        if (res.status === 'hit' || res.status === 'win') {
            const boss = battleManager.currentBoss;
            hpBar.style.width = `${(battleManager.bossHp / boss.hp) * 100}%`;
            hpText.textContent = `HP: ${battleManager.bossHp} / ${boss.hp}`;
            log.textContent = `💥 보스에게 ${res.damage}의 피해를 입혔습니다!`;
        }

        if (res.status === 'win') {
            log.textContent = `🏆 승리! 보성을 물리쳤습니다. 보상: ${res.reward}S`;
            setTimeout(() => {
                alert(`${res.reward} 고철을 획득하고 이동을 계속합니다.`);
                document.getElementById('modal-container').classList.add('hidden');
                travelManager.resumeAfterBattle();
                this.updateUI();
            }, 1500);
        }
    }

    bindEvents() {
        window.addEventListener('gameUpdate', () => this.updateUI());

        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = btn.dataset.target;
                if (target === 'cooking') this.selectedIngredients = [];

                switch (target) {
                    case 'companions': this.openGachaMenu(); break;
                    case 'collection': this.openCollectionMenu(); break;
                    case 'cooking': this.openCookingMenu(); break;
                    case 'upgrade': this.openUpgradeMenu(); break;
                    case 'farming': this.openRegionMenu(); break;
                }
            });
        });

        const modalContainer = document.getElementById('modal-container');
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) closeBtn.onclick = () => modalContainer.classList.add('hidden');
        modalContainer.onclick = (e) => { if (e.target === modalContainer) modalContainer.classList.add('hidden'); };
    }

    updateUI() {
        const state = dataManager.state;
        const curReg = travelManager.getCurrentRegion();
        const scrapEl = document.getElementById('scrap-count');
        const energyEl = document.getElementById('energy-count');

        if (scrapEl) scrapEl.innerHTML = `${Math.floor(state.resources.scrap).toLocaleString()} <span style="font-size:0.75rem; color:#888;">(${curReg.name})</span>`;
        if (energyEl) energyEl.textContent = Math.floor(state.resources.energy);

        const isMoving = state.travel && state.travel.isMoving && !state.travel.isBattleActive;
        const overlay = document.getElementById('travel-overlay');
        if (isMoving) {
            if (!overlay) this.createTravelOverlay();
        } else if (overlay) {
            overlay.remove();
        }
    }

    createTravelOverlay() {
        const container = document.getElementById('game-container');
        const overlay = document.createElement('div');
        overlay.id = 'travel-overlay';
        overlay.className = 'traveling-overlay';
        overlay.innerHTML = `
            <div class="truck-shaking" style="font-size:4rem;">🚚💨</div>
            <h2 id="travel-dest-name">탐사 구역으로 이동 중</h2>
            <div class="travel-progress-container"><div class="travel-progress-bar" id="travel-progress"></div></div>
        `;
        container.appendChild(overlay);
    }

    updateTravelOverlay(res) {
        const bar = document.getElementById('travel-progress');
        if (bar && res.progress) bar.style.width = `${res.progress * 100}%`;
    }

    openRegionMenu() {
        const modalContainer = document.getElementById('modal-container');
        const modalBody = document.getElementById('modal-body');
        let listHtml = '<div class="region-list">';
        REGIONS.forEach(reg => {
            const isCurrent = dataManager.state.currentRegionId === reg.id;
            const canUnlock = dataManager.state.resources.scrap >= reg.unlockCost;
            listHtml += `<div class="region-card ${isCurrent ? 'current' : ''}">
                <div class="region-info">
                    <h4>${reg.name} ${reg.boss ? '💀' : ''}</h4>
                    <p>${reg.desc}</p>
                    <div class="region-stats">보너스: x${reg.bonus} | 보스: ${reg.boss ? reg.boss.name : '없음'}</div>
                </div>
                <button class="upgrade-btn ${canUnlock ? 'can-afford' : ''}" onclick="window.game.handleTravel('${reg.id}')" ${canUnlock && !isCurrent ? '' : 'disabled'}>${isCurrent ? '현재위치' : `${reg.unlockCost}S`}</button>
            </div>`;
        });
        modalBody.innerHTML = `<div style="padding:20px;"><h2>🗺️ 탐사 지도</h2>${listHtml}</div>`;
        modalContainer.classList.remove('hidden');
    }

    handleTravel(id) {
        const res = travelManager.startTravel(id);
        if (res.success) {
            document.getElementById('modal-container').classList.add('hidden');
            this.updateUI();
        } else alert(res.message);
    }

    openGachaMenu() {
        const state = dataManager.state;
        const modalBody = document.getElementById('modal-body');
        let listHtml = '';
        state.companions.forEach(c => {
            const rarityCode = c.rarity === 'Super Rare' ? 'SR' : (c.rarity === 'Rare' ? 'R' : 'C');
            listHtml += `<div class="companion-card ${rarityCode}"><div class="comp-icon-large">${c.type === 'animal' ? '🐾' : '👤'}</div><div class="comp-info"><h4>${c.name} <span class="rarity-tag ${rarityCode.toLowerCase()}">${rarityCode}</span></h4><p>${c.desc}</p><div class="comp-bonus">🚀 파밍 효율 x${c.bonus}</div></div></div>`;
        });
        modalBody.innerHTML = `<div style="padding:15px;"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;"><h2>🤖 대원 본부 (${state.companions.length}/20)</h2><button class="roll-again-btn" style="padding:10px 20px; font-size:1rem;" onclick="window.game.handleRoll()">모집 (50S)</button></div><div class="companion-list" style="max-height:60vh; overflow-y:auto;">${listHtml || '<p style="text-align:center; padding:40px; color:#666;">아직 합류한 대원이 없습니다.</p>'}</div></div>`;
        document.getElementById('modal-container').classList.remove('hidden');
    }

    handleRoll() {
        if (dataManager.state.resources.scrap < 50) { alert("자원이 부족합니다!"); return; }
        dataManager.state.resources.scrap -= 50;
        const res = gachaManager.roll();
        this.showGachaEffect(res);
        this.updateUI();
    }

    showGachaEffect(companion) {
        const modalBody = document.getElementById('modal-body');
        const rStyle = companion.rarity === 'Super Rare' ? 'sr' : (companion.rarity === 'Rare' ? 'r' : 'c');
        modalBody.innerHTML = `<div class="gacha-result"><div class="gacha-card ${rStyle}"><div class="rarity-tag ${rStyle}">${companion.rarity}</div><div style="font-size:5rem; margin:20px 0;">${companion.type === 'animal' ? '🐾' : '👤'}</div><h2 style="color:#fff; margin-bottom:10px;">${companion.name}</h2><p style="color:#aaa; font-size:0.9rem; padding:0 20px;">"${companion.desc}"</p><div style="margin-top:20px; color:var(--accent-color); font-weight:bold; font-size:1.2rem;">파밍 효율 +${(companion.bonus - 1).toFixed(2)}배</div></div><button class="roll-again-btn" onclick="window.game.openGachaMenu()">본부로 돌아가기</button></div>`;
    }

    openCollectionMenu() {
        const recipes = cookingManager.getFullCollection();
        const companions = COMPANION_POOL;
        const state = dataManager.state;
        let recipeGrid = '<div class="collection-grid">';
        recipes.forEach(i => recipeGrid += `<div class="collection-item ${i.isDiscovered ? '' : 'locked'}"><div>${i.isDiscovered ? i.icon : '❓'}</div></div>`);
        recipeGrid += '</div>';
        let compGrid = '<div class="collection-grid">';
        companions.forEach(c => {
            const isOwned = state.companions.some(sc => sc.id === c.id);
            compGrid += `<div class="collection-item ${isOwned ? '' : 'locked'}"><div>${isOwned ? (c.type === 'animal' ? '🐾' : '👤') : '👤'}</div></div>`;
        });
        compGrid += '</div>';
        document.getElementById('modal-body').innerHTML = `<div style="padding:15px;"><h2>📜 생존 도감</h2><div class="collection-hint">새로운 요리와 동료를 찾아 아포칼립스 생존법을 완성하세요!</div><h3 style="margin:20px 0 10px;">🍲 발견한 요리 (${recipes.filter(x => x.isDiscovered).length}/${recipes.length})</h3>${recipeGrid}<h3 style="margin:20px 0 10px;">👤 합류한 대원 (${state.companions.length}/${companions.length})</h3>${compGrid}</div>`;
        document.getElementById('modal-container').classList.remove('hidden');
    }

    /** 주방 메뉴 개편: 보유한 재료만 표시 */
    openCookingMenu() {
        this.selectedIngredients = [];
        const state = dataManager.state;
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = `
            <div class="cooking-ui">
                <h2>🍳 주방</h2>
                <div class="collection-hint">탐사를 통해 획득한 재료로 요리할 수 있습니다. <br>재료 2개를 선택하세요.</div>
                <div id="cook-slots" style="font-size:2rem; margin:10px;">??</div>
                <button class="cooking-btn roll-again-btn" style="width:100%; margin-bottom:20px;" onclick="window.game.handleCook()">조리 시작</button>
                <h3>📥 신선한 재료 (보유 중)</h3>
                <div class="inventory-grid" id="inv-grid"></div>
            </div>
        `;

        const grid = document.getElementById('inv-grid');
        let hasIngredients = false;

        Object.keys(state.ingredients).forEach(id => {
            const count = state.ingredients[id];
            if (count > 0) {
                hasIngredients = true;
                const div = document.createElement('div');
                div.className = 'inventory-slot';
                div.innerHTML = `<div>${INGREDIENTS[id].icon}</div><div style="font-size:0.7rem; color:#fff;">${count}</div>`;
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

        if (!hasIngredients) {
            grid.innerHTML = '<p style="grid-column: span 4; padding:20px; color:#666;">보유 중인 재료가 없습니다. 탐사를 진행하세요!</p>';
        }

        document.getElementById('modal-container').classList.remove('hidden');
    }

    handleCook() {
        if (this.selectedIngredients.length < 2) {
            alert("재료를 2개 선택해주세요!");
            return;
        }
        const res = cookingManager.cook(this.selectedIngredients);
        if (res.success) {
            this.showCookingResult(res);
            this.updateUI();
        } else {
            alert(res.message);
        }
    }

    showCookingResult(dish) {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <div style="text-align:center; padding:30px;">
                <div style="font-size:5rem; margin-bottom:20px; animation: popIn 0.5s;">${dish.icon}</div>
                <h2 style="color:var(--accent-color);">${dish.name} 완성!</h2>
                <p style="margin:15px 0;">"${dish.desc}"</p>
                <div class="collection-hint" style="font-size:1.1rem;">✨ 효과: ${dish.effect}</div>
                <button class="roll-again-btn" style="width:100%;" onclick="window.game.openCookingMenu()">주방으로 돌아가기</button>
            </div>
        `;
    }

    openUpgradeMenu() {
        const summary = vehicleManager.getVehicleSummary();
        let list = '<div class="upgrade-list" style="max-height:60vh; overflow-y:auto;">';

        summary.forEach(p => {
            const cur = p.current;
            const nxt = p.next;

            list += `
                <div class="upgrade-card" style="display:block; padding:15px; border-bottom:1px solid #444;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0;">${p.icon} ${p.name} (Lv.${cur.level})</h4>
                        <button class="upgrade-btn ${dataManager.state.resources.scrap >= (nxt ? nxt.cost : Infinity) ? 'can-afford' : ''}" 
                                onclick="window.game.handleUpgrade('${p.key}')" 
                                ${nxt ? '' : 'disabled'}
                                style="padding:5px 15px;">
                            ${nxt ? `${nxt.cost}S` : 'MAX'}
                        </button>
                    </div>
                    <div style="font-size:0.85rem; color:#aaa; margin-top:8px;">${cur.name} &gt; ${nxt ? nxt.name : '최고 단계'}</div>
                    <div style="margin-top:5px; font-weight:bold; color:var(--accent-color);">
                        ${p.effectName}: ${cur.bonus}${p.unit} 
                        ${nxt ? ` <span style="color:#fff;">➔</span> ${nxt.bonus}${p.unit}` : ' (최대)'}
                    </div>
                </div>
            `;
        });

        document.getElementById('modal-body').innerHTML = `
            <div style="padding:15px;">
                <h2 style="margin-bottom:15px;">🔧 차량 개조 본부</h2>
                <div class="collection-hint">엔진은 이동을 빠르게, 장갑은 피해를 줄여줍니다.</div>
                ${list}
            </div>
        `;
        document.getElementById('modal-container').classList.remove('hidden');
    }
    handleUpgrade(key) {
        const res = vehicleManager.upgradePart(key);
        alert(res.message); this.openUpgradeMenu(); this.updateUI();
    }
}

window.onerror = function (msg, url, line) { alert("오류 발생: " + msg + "\n위치: " + line); return false; };
window.game = new Game();
if (document.readyState === 'complete' || document.readyState === 'interactive') { window.game.init(); }
else { window.addEventListener('DOMContentLoaded', () => window.game.init()); }

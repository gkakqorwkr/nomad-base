/**
 * 노마드 베이스 - 이동 매니저
 * 지역 간의 이동 시간을 계산하고 괴수 조우 이벤트를 처리합니다.
 */

class TravelManager {
    /** 이동 시작 */
    startTravel(regionId) {
        const state = dataManager.state;
        const targetRegion = REGIONS.find(r => r.id === regionId);

        // 1. 기본 예외 처리
        if (!targetRegion) return { success: false, message: "잘못된 지역입니다." };
        if (state.currentRegionId === regionId) return { success: false, message: "이미 그곳에 있습니다." };
        if (state.travel.isMoving) return { success: false, message: "이미 이동 중입니다." };

        // [중요] 2. 에너지 체크 (이동 시 에너지가 10 필요하다고 가정)
        const travelEnergyCost = 10;
        if (state.resources.energy < travelEnergyCost) {
            return { success: false, message: `에너지가 부족합니다! (필요: ${travelEnergyCost})` };
        }

        // 3. 해금 비용 확인
        const cost = targetRegion.unlockCost || 0;
        if (state.resources.scrap < cost) {
            return { success: false, message: `해금 비용 ${cost} 고철이 부족합니다.` };
        }

        // 4. 자원 차감
        state.resources.scrap -= cost;
        state.resources.energy -= travelEnergyCost;

        // 5. 엔진 레벨에 따른 시간 계산 (보너스 수치 적용 방식 확인 필요)
        // 만약 bonus가 20이라면 20% 단축을 의미하도록 (1 - 0.2) 처리
        const engineBonus = window.vehicleManager ? vehicleManager.getBonus('engine') : 0;
        const reductionFactor = Math.max(0.5, 1 - (engineBonus * 0.01)); // 최대 50%까지만 단축
        const actualTime = targetRegion.travelTime * reductionFactor;

        const now = Date.now();
        state.travel = {
            targetRegionId: regionId,
            startTime: now,
            endTime: now + (actualTime * 1000),
            isMoving: true,
            bossEncountered: false,
            isEventActive: false,
            isBattleActive: false
        };

        dataManager.save();
        return { success: true, message: `${targetRegion.name}(으)로 출발합니다!`, duration: actualTime };
    }

    /** 이동 진행률 업데이트 및 완료 체크 */
    update(now) {
        const state = dataManager.state;

        // 이동 중이 아니거나 이벤트/전투 중이면 즉시 중단
        if (!state || !state.travel.isMoving || state.travel.isEventActive || state.travel.isBattleActive) {
            return null;
        }

        // 기후 엔진 업데이트
        if (window.weatherManager) window.weatherManager.update();
        const currentWeather = window.weatherManager ? window.weatherManager.getCurrentWeather() : { energyMult: 1 };

        const total = state.travel.endTime - state.travel.startTime;
        const current = now - state.travel.startTime;
        let progress = current / total;

        const targetRegion = REGIONS.find(r => r.id === state.travel.targetRegionId);

        // 0. 미션 발생 체크 (이동 중일 때만)
        if (window.missionManager && window.missionManager.tryTriggerMission()) {
            // 특별한 상태 변경은 missionManager 내부에서 처리
        }

        // 1. 보스 조우 체크 (진행률 50% 지점)
        if (targetRegion && targetRegion.boss && progress >= 0.5 && !state.travel.bossEncountered) {
            state.travel.isBattleActive = true;
            state.travel.bossEncountered = true;
            dataManager.save();
            return { status: 'boss_triggered', boss: targetRegion.boss };
        }

        // 2. 도착 체크 (시간 완료 시)
        if (now >= state.travel.endTime) {
            const result = this.completeTravel();
            return { ...result, name: this.getCurrentRegion().name };
        }

        // 3. 일반 돌발 이벤트 (확률 0.5% -> 0.05%로 하향 조정)
        if (targetRegion && !targetRegion.boss && Math.random() < 0.0005) {
            state.travel.isEventActive = true;
            dataManager.save();
            return { status: 'event_triggered' };
        }

        return { status: 'moving', progress: Math.min(1, progress) };
    }

    /** 도착 처리 */
    completeTravel() {
        const state = dataManager.state;

        // 목적지 저장
        const targetId = state.travel.targetRegionId;

        // 상태 완전 초기화 (순서 중요: 초기화 후 현재 지역 변경)
        state.travel.isMoving = false;
        state.travel.startTime = 0;
        state.travel.endTime = 0;
        state.travel.targetRegionId = null;
        state.travel.bossEncountered = false;

        state.currentRegionId = targetId;

        // [Phase 6] 암시장 등장 체크
        let marketTriggered = false;
        if (window.blackMarketManager && window.blackMarketManager.tryTriggerMarket()) {
            marketTriggered = true;
        }

        dataManager.save();
        return { status: 'arrived', name: REGIONS.find(r => r.id === targetId).name, market: marketTriggered };
    }

    /** 강제 종료 및 상태 초기화 (오류 복구용) */
    finishTravel() {
        const state = dataManager.state;
        state.travel = {
            isMoving: false,
            isEventActive: false,
            isBattleActive: false,
            targetRegionId: null,
            startTime: 0,
            endTime: 0,
            bossEncountered: false
        };
        dataManager.save();
    }

    getCurrentRegion() {
        const state = dataManager.state;
        return REGIONS.find(r => r.id === state.currentRegionId) || REGIONS[0];
    }

    /** 전투 승리 후 이동 재개 */
    resumeAfterBattle() {
        const state = dataManager.state;
        state.travel.isBattleActive = false;
        dataManager.save();
    }

    /** 이벤트 해결 후 이동 재개 */
    resumeTravel(penaltyTime = 0) {
        const state = dataManager.state;
        state.travel.isEventActive = false;
        if (penaltyTime > 0) {
            state.travel.endTime += penaltyTime * 1000;
        }
        dataManager.save();
    }
}

// 전역 할당
window.travelManager = new TravelManager();




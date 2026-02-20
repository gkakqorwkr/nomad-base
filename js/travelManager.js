/**
 * 노마드 베이스 - 이동 매니저
 * 지역 간의 이동 시간을 계산하고 괴수 조우 이벤트를 처리합니다.
 */

class TravelManager {
    /** 이동 시작 */
    startTravel(regionId) {
        const state = dataManager.state;
        const targetRegion = REGIONS.find(r => r.id === regionId);

        if (!targetRegion) return { success: false, message: "잘못된 지역입니다." };
        if (state.currentRegionId === regionId) return { success: false, message: "이미 그곳에 있습니다." };
        if (state.travel.isMoving) return { success: false, message: "이미 이동 중입니다." };

        // 해금 비용 확인
        if (state.resources.scrap < (targetRegion.unlockCost || 0)) {
            return { success: false, message: `해금 비용 ${targetRegion.unlockCost} 고철이 부족합니다.` };
        }

        // 엔진 레벨에 따른 이동 시간 단축 보너스 적용
        const bonus = window.vehicleManager ? vehicleManager.getBonus('engine') * 0.01 : 1.0;
        const actualTime = targetRegion.travelTime * bonus;

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
        
        // 이동 중이 아니거나 이벤트/전투 중이면 체크 중단
        if (!state.travel.isMoving || state.travel.isEventActive || state.travel.isBattleActive) return null;

        const total = state.travel.endTime - state.travel.startTime;
        const current = now - state.travel.startTime;
        const progress = current / total;

        const targetRegion = REGIONS.find(r => r.id === state.travel.targetRegionId);

        // 1. 보스 조우 체크
        if (targetRegion && targetRegion.boss && progress >= 0.5 && !state.travel.bossEncountered) {
            state.travel.isBattleActive = true;
            state.travel.bossEncountered = true;
            dataManager.save();
            return { status: 'boss_triggered', boss: targetRegion.boss };
        }

        // 2. 도착 체크 (시간 완료 시)
        if (now >= state.travel.endTime) {
            return this.completeTravel();
        }

        // 3. 일반 돌발 이벤트 (낮은 확률)
        if (targetRegion && !targetRegion.boss && Math.random() < 0.005) {
            state.travel.isEventActive = true;
            dataManager.save();
            return { status: 'event_triggered' };
        }

        return { status: 'moving', progress: Math.min(1, progress) };
    }

    /** 도착 처리 */
    completeTravel() {
        const state = dataManager.state;
        
        // 데이터 업데이트: 현재 지역을 목적지로 변경
        state.currentRegionId = state.travel.targetRegionId; 
        
        // 이동 상태 초기화
        state.travel.isMoving = false;
        state.travel.startTime = 0;
        state.travel.endTime = 0;
        state.travel.targetRegionId = null;
        state.travel.bossEncountered = false;
        
        dataManager.save(); 
        return { status: 'arrived' };
    }

    /** 강제 종료 및 상태 초기화 (오류 복구용) */
    finishTravel() {
        const state = dataManager.state;
        state.travel.isMoving = false;
        state.travel.isEventActive = false;
        state.travel.isBattleActive = false;
        state.travel.targetRegionId = null;
        state.travel.startTime = 0;
        state.travel.endTime = 0;
        dataManager.save();
    }

    /** 현재 위치 데이터 반환 */
    getCurrentRegion() {
        return REGIONS.find(r => r.id === dataManager.state.currentRegionId) || REGIONS[0];
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

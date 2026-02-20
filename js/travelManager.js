/**
 * 노마드 베이스 - 이동 매니저
 * 지역 간의 이동 시간을 계산하고 괴수 조우 이벤트를 처리합니다.
 */
// import { REGIONS } from './regions.js';
// import { dataManager } from './dataManager.js';

class TravelManager {
    /** 이동 시작 */
    startTravel(regionId) {
        const state = dataManager.state;
        const targetRegion = REGIONS.find(r => r.id === regionId);

        if (!targetRegion) return { success: false, message: "잘못된 지역입니다." };
        if (state.currentRegionId === regionId) return { success: false, message: "이미 그곳에 있습니다." };
        if (state.travel.isMoving) return { success: false, message: "이미 이동 중입니다." };

        // 해금 비용 확인 (나중에 구현 가능)
        if (state.resources.scrap < targetRegion.unlockCost) {
            return { success: false, message: `해금 비용 ${targetRegion.unlockCost} 고철이 부족합니다.` };
        }

        // 엔진 레벨에 따른 이동 시간 단축 보너스 적용 (100% -> 1.0, 50% -> 0.5)
        const bonus = vehicleManager.getBonus('engine') * 0.01;
        const actualTime = targetRegion.travelTime * bonus;

        const now = Date.now();
        state.travel = {
            targetRegionId: regionId,
            startTime: now,
            endTime: now + (actualTime * 1000),
            isMoving: true
        };

        dataManager.save();
        return { success: true, message: `${targetRegion.name}(으)로 출발합니다!`, duration: actualTime };
    }

    /** 이동 진행률 업데이트 및 완료 체크 */
    update(now) {
        const state = dataManager.state;
        if (!state.travel.isMoving || state.travel.isEventActive || state.travel.isBattleActive) return null;

        // 보스 조우 체크 (중간 지점에서 90% 확률로 발생하도록 설정)
        const total = state.travel.endTime - state.travel.startTime;
        const current = now - state.travel.startTime;
        const progress = current / total;

        const targetRegion = REGIONS.find(r => r.id === state.travel.targetRegionId);
        if (targetRegion && targetRegion.boss && progress >= 0.5 && !state.travel.bossEncountered) {
            state.travel.isBattleActive = true;
            state.travel.bossEncountered = true;
            dataManager.save();
            return { status: 'boss_triggered', boss: targetRegion.boss };
        }

        // 도착 체크
        if (now >= state.travel.endTime) {
            this.completeTravel();
            return { status: 'arrived', regionId: state.currentRegionId };
        }

        // 일반 돌발 이벤트 (보스 지역이 아닐 때만)
        if (!targetRegion.boss && Math.random() < 0.01) {
            state.travel.isEventActive = true;
            dataManager.save();
            return { status: 'event_triggered' };
        }

        return { status: 'moving', progress: Math.min(1, progress) };
    }

    /** 연계 처리 (전투 승리 후 호출) */
    resumeAfterBattle() {
        const state = dataManager.state;
        state.travel.isBattleActive = false;
        dataManager.save();
    }

    /** 이벤트 해결 처리 */
    resumeTravel(penaltyTime = 0) {
        const state = dataManager.state;
        state.travel.isEventActive = false;
        if (penaltyTime > 0) {
            state.travel.endTime += penaltyTime * 1000;
        }
        dataManager.save();
    }

    /** 도착 처리 */
// TravelManager.js 내부의 update 메서드 혹은 도착 처리 부분
completeTravel() {
    const state = this.dataManager.state;
    // 실제로 데이터 매니저의 상태를 목적지 ID로 변경
    state.currentRegionId = state.travel.targetRegionId; 
    state.travel.isMoving = false;
    state.travel.startTime = 0;
    state.travel.endTime = 0;
    
    this.dataManager.save(); // 변경된 지역 저장
    return { status: 'arrived' };
}

    /** 현재 위치 데이터 */
    getCurrentRegion() {
        return REGIONS.find(r => r.id === dataManager.state.currentRegionId);
    }
}

// export const travelManager = new TravelManager();
window.travelManager = new TravelManager();


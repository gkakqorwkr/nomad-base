/**
 * 노마드 베이스 - 통합 로거 (규약 준수)
 * 게임 내 모든 주요 이벤트를 기록합니다.
 */

class GameLogger {
    constructor() {
        this.logData = [];
        this.MAX_LOGS = 100;
    }

    /** 📝 로그 기록 (메모리 및 콘솔) */
    log(message, level = 'INFO') {
        const timestamp = new Date().toLocaleString('ko-KR');
        const logEntry = `[${timestamp}] [${level}] ${message}`;

        console.log(logEntry);
        this.logData.unshift(logEntry);

        // 최대 로그 수 제한
        if (this.logData.length > this.MAX_LOGS) {
            this.logData.pop();
        }

        // 브라우저 환경이므로 localStorage에 임시 파일 형태로 보관 (추후 추출 가능)
        this.syncToStorage();
    }

    syncToStorage() {
        localStorage.setItem('nomad_game_logs', JSON.stringify(this.logData));
    }

    /** 📁 로그 데이터 반환 (파일 저장을 위해 사용 가능) */
    getLogs() {
        return this.logData.join('\n');
    }
}

window.logger = new GameLogger();

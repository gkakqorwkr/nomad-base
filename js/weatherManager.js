/**
 * 노마드 베이스 - 기후 및 환경 매니저
 */

window.WEATHER_TYPES = {
    clear: {
        name: "맑음",
        icon: "☀️",
        desc: "방사능 수치가 안정적입니다.",
        energyMult: 1.0,
        dropMult: 1.0,
        color: "#ffd700"
    },
    acid_rain: {
        name: "산성비",
        icon: "🌧️",
        desc: "장갑이 부식됩니다. 에너지 소모가 1.5배 증가합니다.",
        energyMult: 1.5,
        dropMult: 1.2,
        color: "#7cfc00"
    },
    emp_storm: {
        name: "EMP 폭풍",
        icon: "⚡",
        desc: "전자 장비가 오작동합니다. 탐사 효율이 감소합니다.",
        energyMult: 1.2,
        dropMult: 0.8,
        color: "#00bfff"
    },
    sandstorm: {
        name: "모래바람",
        icon: "🌪️",
        desc: "시야가 확보되지 않습니다. 길을 찾기 어렵습니다.",
        energyMult: 1.3,
        dropMult: 1.5,
        color: "#f4a460"
    }
};

class WeatherManager {
    constructor() {
        this.updateInterval = 5 * 60 * 1000; // 5분마다 변경 시도
    }

    update() {
        const state = dataManager.state;
        const now = Date.now();

        if (now > state.world.weatherEndTime) {
            this.changeWeather();
        }
    }

    changeWeather() {
        const keys = Object.keys(WEATHER_TYPES);
        const newWeather = keys[Math.floor(Math.random() * keys.length)];

        dataManager.state.world.weather = newWeather;
        dataManager.state.world.weatherEndTime = Date.now() + this.updateInterval;

        dataManager.save();

        // 기후 변경 알림 (동적으로 호출될 수 있도록 이벤트 처리 검토)
        if (window.game && window.game.showToast) {
            const w = WEATHER_TYPES[newWeather];
            window.game.showToast(`${w.icon} 기후 변화: ${w.name}`, 'warning');
        }
    }

    getCurrentWeather() {
        return WEATHER_TYPES[dataManager.state.world.weather || "clear"];
    }
}

window.weatherManager = new WeatherManager();

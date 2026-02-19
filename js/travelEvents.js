/**
 * 노마드 베이스 - 이동 중 돌발 이벤트 데이터
 */

window.TRAVEL_EVENTS = [
    {
        id: "ev_1",
        name: "버려진 보급 상자",
        desc: "길가에 낡은 상자가 떨어져 있습니다. 열어보시겠습니까?",
        options: [
            { text: "열어본다", action: "loot", reward: { scrap: 100 } },
            { text: "무시한다", action: "ignore" }
        ]
    },
    {
        id: "ev_2",
        name: "방사능 비",
        desc: "갑자기 방사능 비가 내립니다! 장갑이 부식될 수 있습니다.",
        options: [
            { text: "속도를 높여 빠져나간다", action: "speed", penalty: { energy: 10 } },
            { text: "잠시 멈춰 비를 피한다", action: "wait", penalty: { time: 30 } }
        ]
    }
];

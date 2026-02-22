/**
 * 노마드 베이스 - 지역 데이터베이스 (보스 정보 포함)
 */

// export const REGIONS = [
window.REGIONS = [
    {
        id: "reg_1",
        name: "평온한 캠프",
        bgClass: "bg-reg_1",
        radRate: 0.01, // 매우 낮음
        desc: "비교적 안전하며 기본적인 고철을 주울 수 있습니다.",
        danger: 0,
        bonus: 1.0,
        rareDropChance: 0.05,
        travelTime: 0,
        unlockCost: 0,
        boss: null,
        enemies: [
            { name: "어슬렁거리는 들개", hp: 20, atk: 2, reward: 20, icon: "🐕" }
        ]
    },
    {
        id: "reg_2",
        name: "버려진 도심",
        bgClass: "bg-reg_2",
        radRate: 0.05,
        desc: "좀비 개체들이 보이지만 자원이 풍부합니다.",
        danger: 2,
        bonus: 2.0,
        rareDropChance: 0.15,
        travelTime: 60,
        unlockCost: 500,
        boss: {
            name: "굶주린 알파 좀비",
            hp: 100,
            icon: "🧟‍♂️",
            reward: 1000
        },
        enemies: [
            { name: "허기진 좀비", hp: 40, atk: 5, reward: 50, icon: "🧟" },
            { name: "약탈자 척후병", hp: 35, atk: 7, reward: 80, icon: "🥷" }
        ]
    },
    {
        id: "reg_3",
        name: "방사능 안개 숲",
        bgClass: "bg-reg_3",
        radRate: 0.15,
        desc: "시야가 좁고 위험하지만 변이 식물이 가득합니다.",
        danger: 5,
        bonus: 4.5,
        rareDropChance: 0.35,
        travelTime: 180,
        unlockCost: 2000,
        boss: {
            name: "거대 돌연변이 식물",
            hp: 300,
            icon: "🪴",
            reward: 5000
        },
        enemies: [
            { name: "방사능 변이견", hp: 80, atk: 12, reward: 200, icon: "🐕‍🦺" },
            { name: "독성 덩굴", hp: 60, atk: 15, reward: 150, icon: "🌿" }
        ]
    },
    {
        id: "reg_4",
        name: "괴수 군락지",
        bgClass: "bg-reg_4",
        radRate: 0.4,
        desc: "가장 위험한 곳입니다. 목숨을 걸어야 할 것입니다.",
        danger: 10,
        bonus: 10.0,
        rareDropChance: 0.65,
        travelTime: 600,
        unlockCost: 10000,
        boss: {
            name: "아포칼립스 파괴룡",
            hp: 1000,
            icon: "🐲",
            reward: 50000
        },
        enemies: [
            { name: "하급 용족 괴수", hp: 200, atk: 25, reward: 800, icon: "🦎" },
            { name: "기계화 약탈단", hp: 150, atk: 35, reward: 1200, icon: "⚙️" }
        ]
    }
];

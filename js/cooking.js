/**
 * 노마드 베이스 - 절차적 요리 및 재료 데이터
 */

window.INGREDIENTS = {
    // 식물류 (접두어/접미어 힌트 포함)
    "wild_herb": { name: "비명지르는 산나물", icon: "🌿", type: "veg", adj: "신선한", power: 10 },
    "glow_mushroom": { name: "발광 버섯", icon: "🍄", type: "veg", adj: "번쩍이는", power: 15 },
    "radioactive_tomato": { name: "방사능 토마토", icon: "🍅", type: "veg", adj: "톡 쏘는", power: 12 },
    "dead_cactus": { name: "선인장이었던 것", icon: "🌵", type: "veg", adj: "거친", power: 8 },
    "mutant_corn": { name: "변이 옥수수. 유전자 조작이나 아동 착취와는 관계가 없다.", icon: "🌽", type: "veg", adj: "팝핀", power: 10 },
    "acid_lemon": { name: "염기성 레몬", icon: "🍋", type: "veg", adj: "시큼한", power: 12 },
    "ghost_flower": { name: "식인 꽃", icon: "🌷", type: "veg", adj: "오싹한", power: 15 },

    // 동물/괴수류
    "zombie_octopus": { name: "문어좀비의 다리", icon: "🐙", type: "meat", adj: "꿈틀대는", power: 20 },
    "monster_meat": { name: "괴수? 고기", icon: "🍖", type: "meat", adj: "질긴", power: 18 },
    "giant_egg": { name: "거대...알", icon: "🥚", type: "meat", adj: "묵직한", power: 15 },
    "dry_worm": { name: "말린 지렁이", icon: "🐛", type: "meat", adj: "바삭한", power: 10 },
    "poison_stinger": { name: "잘린 독침", icon: "🦂", type: "meat", adj: "치명적인", power: 12 },
    "flying_fish_eye": { name: "날치 눈알", icon: "👁️", type: "meat", adj: "지켜보는", power: 14 },
    "armored_crab": { name: "철갑 게", icon: "🦀", type: "meat", adj: "단단한", power: 18 },

    // 가공/특수류 (조리 도구/방법의 역할)
    "water": { name: "물", icon: "💧", type: "fluid", adj: "맑은", power: 5 },
    "blue_oil": { name: "푸른 식용유", icon: "🧪", type: "fluid", adj: "매끈한", power: 8 },
    "rusty_salt": { name: "녹슨 소금", icon: "🧂", type: "fluid", adj: "짭짤한", power: 5 },
    "sugar_cube": { name: "설탕 조각", icon: "🧊", type: "fluid", adj: "달콤한", power: 5 },
    "honey_goo": { name: "꿀맛 타르", icon: "🍯", type: "fluid", adj: "진득한", power: 8 },
    "engine_grease": { name: "엔진 기름", icon: "⛽", type: "fluid", adj: "미끌한", power: 7 }
};

/** 특별한 레시피 (절차적 결과보다 우선됨) */
window.SPECIAL_RECIPES = [
    { id: "cook_1", name: "문어좀비 타코야끼", ingredients: ["zombie_octopus", "blue_oil"], icon: "🍡", desc: "고전적인 아포칼립스 별미." },
    { id: "cook_2", name: "발광 버섯 스프", ingredients: ["glow_mushroom", "water"], icon: "🥣", desc: "밤길을 밝혀주는 따뜻한 한 그릇." },
    { id: "cook_3", name: "방사능 토마토 파스타", ingredients: ["radioactive_tomato", "water"], icon: "🍝", desc: "톡 쏘는 맛이 일품입니다." },
    { id: "cook_4", name: "지렁이 튀김", ingredients: ["dry_worm", "blue_oil"], icon: "🍟", desc: "바삭바삭한 단백질 덩어리." },
    { id: "cook_5", name: "독침 찜", ingredients: ["poison_stinger", "rusty_salt"], icon: "🍲", desc: "둘이 먹다 하나가 죽...? 어억." },
    { id: "cook_6", name: "거대 🔥알 오므라이스", ingredients: ["giant_egg", "sugar_cube"], icon: "🍛", desc: "와... 크네요. 든든한 한 끼." },
    { id: "cook_7", name: "철갑 게 그릴", ingredients: ["armored_crab", "engine_grease"], icon: "🦀", desc: "고열로 구워낸 단단한 속살." },
    { id: "cook_8", name: "식인 꽃 차", ingredients: ["ghost_flower", "water"], icon: "🍵", desc: "정신을 맑게(또는 아찔하게) 해줍니다." },
    { id: "cook_9", name: "형광으로 번쩍이는 샐러드", ingredients: ["glow_mushroom", "acid_lemon"], icon: "🥗", desc: "야광인간의 꿈에 가까워져요." },
    { id: "cook_10", name: "비명 나올 만큼 맛있는 나물 무침", ingredients: ["wild_herb", "honey_goo"], icon: "🥗", desc: "피로 해소에 즉효입니다." },
    { id: "cook_11", name: "괴수 등갈비", ingredients: ["monster_meat", "rusty_salt"], icon: "🍖", desc: "이건 무슨 고기인가요?" },
    { id: "cook_12", name: "레모네이드", ingredients: ["acid_lemon", "sugar_cube"], icon: "🍹", desc: "갈증을 날려버리는 상큼함." }
];

/** 조리법 종류 */
window.COOKING_METHODS = [
    { name: "볶음", suffix: "볶음", type: "meat" },
    { name: "스프", suffix: "스프", type: "veg" },
    { name: "찜", suffix: "찜", type: "meat" },
    { name: "차", suffix: "차", type: "veg" },
    { name: "튀김", suffix: "튀김", type: "fluid" },
    { name: "샐러드", suffix: "샐러드", type: "veg" }
];


/**
 * 노마드 베이스 - 동료 데이터베이스
 * 20종의 다양한 동료(사람/동물) 정보를 정의합니다.
 */
// export const COMPANION_POOL = [
window.COMPANION_POOL = [
    // --- Super Rare (5%) ---
    { id: 'sr1', name: '전설의 안드로이드 A-9', type: 'humanoid', rarity: 'Super Rare', bonus: 2.5, desc: '구시대의 정점이자 기계의 신입니다.', color: '#ffea00' },
    { id: 'sr2', name: '심해 변이 거대 문어', type: 'animal', rarity: 'Super Rare', bonus: 2.3, desc: '지능이 매우 높고 여덟 팔로 모든 일을 돕습니다.', color: '#ffea00' },
    { id: 'sr3', name: '최후의 기사 아서', type: 'human', rarity: 'Super Rare', bonus: 2.2, desc: '검 하나로 초토화된 도시를 지켜온 생존자입니다.', color: '#ffea00' },

    // --- Rare (25%) ---
    { id: 'r1', name: '특수부대 정찰견', type: 'animal', rarity: 'Rare', bonus: 1.6, desc: '훈련된 감각으로 위험을 미리 감지합니다.', color: '#00f2ff' },
    { id: 'r2', name: '방랑하는 사이보그', type: 'humanoid', rarity: 'Rare', bonus: 1.5, desc: '자신의 부품을 게임기로 개조하고 싶어 합니다.', color: '#00f2ff' },
    { id: 'r3', name: '독수리 마스터', type: 'human', rarity: 'Rare', bonus: 1.5, desc: '하늘에서 내려다보는 시야를 공유합니다.', color: '#00f2ff' },
    { id: 'r4', name: '변이된 흰 사슴', type: 'animal', rarity: 'Rare', bonus: 1.7, desc: '성스러운 기운이 주변 정화 작용을 돕습니다.', color: '#00f2ff' },
    { id: 'r5', name: '천재 해커 베티', type: 'human', rarity: 'Rare', bonus: 1.4, desc: '고장 난 기계를 말로 설득해서 고칩니다.', color: '#00f2ff' },

    // --- Common (70%) ---
    { id: 'c1', name: '시골 누렁이', type: 'animal', rarity: 'Common', bonus: 1.1, desc: '꼬리를 흔들며 사기를 북돋아 줍니다.', color: '#ffffff' },
    { id: 'c2', name: '고철 수집가 잭', type: 'human', rarity: 'Common', bonus: 1.2, desc: '쓰레기 더미에서 보물을 찾는 달인입니다.', color: '#ffffff' },
    { id: 'c3', name: '버려진 프로토타입 봇', type: 'humanoid', rarity: 'Common', bonus: 1.1, desc: '자꾸 "치킨 먹고 싶다"는 로그를 출력합니다.', color: '#ffffff' },
    { id: 'c4', name: '길거리 고양이', type: 'animal', rarity: 'Common', bonus: 1.1, desc: '쥐(또는 좀비 쥐)를 잘 잡습니다.', color: '#ffffff' },
    { id: 'c5', name: '전직 배달원 킴', type: 'human', rarity: 'Common', bonus: 1.2, desc: '어떤 험지도 빠르게 돌파하는 운전병입니다.', color: '#ffffff' },
    { id: 'c6', name: '숲의 여우', type: 'animal', rarity: 'Common', bonus: 1.1, desc: '영리하게 필요한 식재료를 물어옵니다.', color: '#ffffff' },
    { id: 'c7', name: '은퇴한 농부 할아버지', type: 'human', rarity: 'Common', bonus: 1.3, desc: '방사능 토양에서도 싹을 틔웁니다.', color: '#ffffff' },
    { id: 'c8', name: '방어구 전문 대장장이', type: 'human', rarity: 'Common', bonus: 1.2, desc: '냄비 뚜껑으로도 방패를 만듭니다.', color: '#ffffff' },
    { id: 'c9', name: '까칠한 라쿤', type: 'animal', rarity: 'Common', bonus: 1.1, desc: '남의 가방을 뒤지는 속도가 일품입니다.', color: '#ffffff' },
    { id: 'c10', name: '명상 중인 생존자', type: 'human', rarity: 'Common', bonus: 1.1, desc: '가만히 있어도 정신력을 회복시켜 줍니다.', color: '#ffffff' },
    { id: 'c11', name: '강인한 말', type: 'animal', rarity: 'Common', bonus: 1.3, desc: '기지를 끄는 데 큰 도움이 됩니다.', color: '#ffffff' },
    { id: 'c12', name: '무전기 수리공', type: 'human', rarity: 'Common', bonus: 1.2, desc: '잡음 섞인 신호에서 정보를 읽어냅니다.', color: '#ffffff' }
];

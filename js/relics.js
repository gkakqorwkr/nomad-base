/**
 * 노마드 베이스 - 고대 유물 데이터베이스
 * 30종의 고대 유물을 정의합니다. 보유 시 특정 패시브 효과를 제공합니다.
 */

window.RELICS = [
    { id: 'rel_1', name: '녹슨 나침반', icon: '🧭', desc: '항상 북쪽을 가리키지 않지만 탐사 속도를 미세하게 올립니다.', bonusType: 'travelSpeed', bonus: 1.05 },
    { id: 'rel_2', name: '구시대 방독면', icon: '🎭', desc: '위험 지역에서의 정화 효율이 올라갑니다.', bonusType: 'hazardResist', bonus: 1.1 },
    { id: 'rel_3', name: '금이 간 렌즈', icon: '🔍', desc: '멀리 있는 고철 더미를 더 잘 찾아냅니다.', bonusType: 'scrapFind', bonus: 1.15 },
    { id: 'rel_4', name: '행운의 동전', icon: '🪙', desc: '왠지 좋은 일이 생길 것 같은 예감이 듭니다.', bonusType: 'luckyChance', bonus: 1.2 },
    { id: 'rel_5', name: '아이언 렌치', icon: '🔧', desc: '차량 수리 및 개조 효율이 소폭 상승합니다.', bonusType: 'upgradeDiscount', bonus: 0.95 },
    { id: 'rel_6', name: '휴대용 라디오', icon: '📻', desc: '잡음 속에서 다른 생존자의 위치를 찾습니다.', bonusType: 'eventChance', bonus: 1.1 },
    { id: 'rel_7', name: '방사능 배지', icon: '☢️', desc: '방사능 수치를 측정해 안전한 경로를 찾습니다.', bonusType: 'travelSafety', bonus: 1.1 },
    { id: 'rel_8', name: '골동품 시계', icon: '⌚', desc: '시간이 비정상적으로 흐르는 것 같습니다.', bonusType: 'offlineGain', bonus: 1.2 },
    { id: 'rel_9', name: '찢어진 지도', icon: '🗺️', desc: '새로운 지역 발견 확률이 올라갑니다.', bonusType: 'unlockSpeed', bonus: 1.05 },
    { id: 'rel_10', name: '작은 망원경', icon: '🔭', desc: '미리 위험을 감지해 피해를 줄입니다.', bonusType: 'damageAvoid', bonus: 1.1 },
    { id: 'rel_11', name: '은색 호루라기', icon: '😙', desc: '동료들과의 결속력이 강해집니다.', bonusType: 'companionPower', bonus: 1.1 },
    { id: 'rel_12', name: '기름진 장갑', icon: '🧤', desc: '재료 수집 시 손이 미끄러지지 않습니다.', bonusType: 'ingredientFind', bonus: 1.15 },
    { id: 'rel_13', name: '부러진 안테나', icon: '📡', desc: '가끔 아주 먼 곳의 신호를 수신합니다.', bonusType: 'luckyDrop', bonus: 1.2 },
    { id: 'rel_14', name: '나침반 펜던트', icon: '📿', desc: '길을 잃지 않게 도와주는 행운의 상징입니다.', bonusType: 'travelSpeed', bonus: 1.1 },
    { id: 'rel_15', name: '강철 배지', icon: '🛡️', desc: '차량의 방어력이 소폭 상승하는 느낌입니다.', bonusType: 'armorBonus', bonus: 1.1 },
    { id: 'rel_16', name: '오래된 전구', icon: '💡', desc: '어두운 밤에도 더 멀리 탐색합니다.', bonusType: 'nightFarming', bonus: 1.2 },
    { id: 'rel_17', name: '황금 고철', icon: '🏆', desc: '고철 수집의 전설적인 물건입니다.', bonusType: 'scrapMultiplier', bonus: 1.5 },
    { id: 'rel_18', name: '수정 구슬', icon: '🔮', desc: '알 수 없는 에너지가 흘러나옵니다.', bonusType: 'energyRegen', bonus: 1.1 },
    { id: 'rel_19', name: '부적 인형', icon: '🎎', desc: '나쁜 기운을 대신 받아주는 인형입니다.', bonusType: 'hazardResist', bonus: 1.2 },
    { id: 'rel_20', name: '만능 칼', icon: '🔪', desc: '재료 손질 시 더 많은 전리품을 얻습니다.', bonusType: 'cookBonus', bonus: 1.1 },
    { id: 'rel_21', name: '작은 나침반', icon: '🗺️', desc: '단순하지만 확실하게 방향을 잡아줍니다.', bonusType: 'travelSpeed', bonus: 1.05 },
    { id: 'rel_22', name: '녹슨 열쇠', icon: '🔑', desc: '언젠가 잠긴 상자를 열 것 같습니다.', bonusType: 'chestFind', bonus: 1.2 },
    { id: 'rel_23', name: '빛나는 돌', icon: '💎', desc: '방 안을 은은하게 비춰줍니다.', bonusType: 'energyRegen', bonus: 1.05 },
    { id: 'rel_24', name: '고대 동전', icon: '🪙', desc: '희귀한 가치를 지닌 동전입니다.', bonusType: 'gachaLuck', bonus: 1.1 },
    { id: 'rel_25', name: '찢어진 깃발', icon: '🚩', desc: '긍지를 잃지 않게 해줍니다.', bonusType: 'companionPower', bonus: 1.15 },
    { id: 'rel_26', name: '구겨진 사진', icon: '📷', desc: '그리운 기억이 에너지를 줍니다.', bonusType: 'energyMax', bonus: 1.2 },
    { id: 'rel_27', name: '고장난 시계', icon: '🌚', desc: '멈춘 시간이 보물을 가져다줄지 모릅니다.', bonusType: 'offlineGain', bonus: 1.3 },
    { id: 'rel_28', name: '빈 연병장 머그컵', icon: '☕', desc: '차 한 잔의 여유를 줍니다.', bonusType: 'energyRegen', bonus: 1.2 },
    { id: 'rel_29', name: '메커닉 슈트', icon: '👕', desc: '기계를 다루는 속도가 빨라집니다.', bonusType: 'upgradeSpeed', bonus: 1.2 },
    { id: 'rel_30', name: '최후의 성배', icon: '🍷', desc: '모든 생존자들의 꿈이자 희망입니다.', bonusType: 'allStats', bonus: 2.0 }
];

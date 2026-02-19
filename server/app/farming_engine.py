import random
from .logger import get_logger

logger = get_logger("farming_engine")

class FarmingEngine:
    """
    방치형 파밍 및 동료 투입 로직을 담당하는 클래스.
    레어도에 따른 보너스를 계산함.
    """
    BASE_RESOURCE_RATE = 1.0  # 기본 초당 자원 획득량

    @staticmethod
    def calculate_loot(elapsed_seconds, active_companions):
        """
        경과 시간과 투입된 동료에 따른 자원 획득량을 계산함.
        active_companions: 투입된 동료 객체 리스트
        """
        total_bonus = 1.0
        for companion in active_companions:
            total_bonus *= companion.get('farming_bonus', 1.0)
        
        total_loot = FarmingEngine.BASE_RESOURCE_RATE * elapsed_seconds * total_bonus
        logger.info(f"{elapsed_seconds}초 동안 {total_loot:.2f} 자원을 획득했습니다. (배율: {total_bonus:.2f})")
        
        # 희귀 아이템 드롭 판정 (등급에 따른 확률)
        dropped_items = []
        for companion in active_companions:
            rarity = companion.get('rarity', 'Common')
            if rarity == 'Super Rare' and random.random() < 0.1: # 10%
                dropped_items.append("희귀 괴수 간")
            elif rarity == 'Rare' and random.random() < 0.05: # 5%
                dropped_items.append("이상한 버섯")
                
        return total_loot, dropped_items

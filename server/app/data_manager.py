import json
import os
from .logger import get_logger

logger = get_logger("data_manager")
DATA_PATH = r"C:\Users\A\.gemini\antigravity\scratch\nomad-base\server\data\initial_data.json"

class DataManager:
    """
    게임 데이터를 로드하고 관리하는 클래스.
    동료 정보 및 아이템 도감을 담당함.
    """
    def __init__(self):
        self.data = self._load_data()

    def _load_data(self):
        try:
            if os.path.exists(DATA_PATH):
                with open(DATA_PATH, "r", encoding="utf-8") as f:
                    logger.info("게임 데이터를 성공적으로 로드하였습니다.")
                    return json.load(f)
            else:
                logger.warning("데이터 파일을 찾을 수 없습니다. 빈 데이터를 생성합니다.")
                return {"companions": [], "items": []}
        except Exception as e:
            logger.error(f"데이터 로드 중 오류 발생: {e}")
            return {"companions": [], "items": []}

    def get_companions(self):
        """등록된 모든 동료 목록 반환"""
        return self.data.get("companions", [])

    def get_items(self):
        """등록된 모든 아이템 목록 반환"""
        return self.data.get("items", [])

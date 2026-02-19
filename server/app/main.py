from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .data_manager import DataManager
from .farming_engine import FarmingEngine
from .logger import get_logger

logger = get_logger("main_server")

app = FastAPI(title="Nomad Base API")

# CORS 설정 (프런트엔드 연동용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

data_manager = DataManager()

@app.get("/")
async def root():
    return {"message": "노마드 베이스 서버가 작동 중입니다."}

@app.get("/companions")
async def get_companions():
    """모든 동료 목록을 가져옴"""
    return data_manager.get_companions()

@app.get("/items")
async def get_items():
    """모든 아이템 도감을 가져옴"""
    return data_manager.get_items()

@app.post("/farming/calculate")
async def calculate_farming(elapsed_seconds: int, companion_ids: list[str]):
    """
    특정 시간 동안 투입된 동료들에 따른 자원 및 아이템 획득량 계산.
    """
    try:
        all_companions = data_manager.get_companions()
        active_companions = [c for c in all_companions if c['id'] in companion_ids]
        
        loot, dropped_items = FarmingEngine.calculate_loot(elapsed_seconds, active_companions)
        
        return {
            "loot_amount": loot,
            "dropped_items": dropped_items,
            "bonus_multiplier": sum([c.get('farming_bonus', 1.0) for c in active_companions]) if active_companions else 1.0
        }
    except Exception as e:
        logger.error(f"파밍 계산 중 오류: {e}")
        raise HTTPException(status_code=500, detail="서버 내부 오류 발생")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

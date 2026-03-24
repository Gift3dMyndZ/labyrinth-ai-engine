from fastapi import APIRouter
from app.db.database import get_aggregate_stats, get_top_survivals

router = APIRouter(prefix="/api/game", tags=["game"])


@router.get("/stats")
def game_stats():
    stats = get_aggregate_stats()
    return {"status": "ok", "data": stats}


@router.get("/leaderboard")
def leaderboard(limit: int = 10):
    entries = get_top_survivals(limit)
    return {"status": "ok", "data": entries}
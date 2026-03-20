from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional

from app.db.database import (
    insert_telemetry,
    insert_leaderboard_entry,
    get_top_survivals
)

router = APIRouter()


# ==================================================
# SCHEMA
# ==================================================

class TelemetryRequest(BaseModel):
    fear_level: float
    aggression: float
    curiosity: float
    survival_time: Optional[float] = None
    difficulty_modifier: Optional[float] = 1.0
    outcome: str
    session_id: Optional[str] = None
    floor_reached: Optional[int] = None
    maze_size: Optional[int] = None


# ==================================================
# TELEMETRY LOGGING
# ==================================================

@router.post("/")
def log_telemetry(data: TelemetryRequest, request: Request):

    # 1️⃣ Save telemetry
    insert_telemetry(data.dict())

    # 2️⃣ Leaderboard update
    leaderboard_updated = False

    if data.survival_time is not None:
        insert_leaderboard_entry(
            survival_time=data.survival_time,
            difficulty_modifier=data.difficulty_modifier or 1.0
        )
        leaderboard_updated = True

    # 3️⃣ Replay buffer
    cluster_service = getattr(request.app.state, "cluster_service", None)

    if cluster_service:
        try:
            cluster_service.add_experience(data.dict())
        except Exception as e:
            print(f"Replay buffer add failed: {e}")

    return {
        "status": "telemetry logged",
        "leaderboard_updated": leaderboard_updated
    }


# ==================================================
# LEADERBOARD
# ==================================================

@router.get("/leaderboard")
def leaderboard(limit: int = 10):
    return get_top_survivals(limit)


# ==================================================
# STATUS
# ==================================================

@router.get("/status")
def telemetry_status():
    return {
        "status": "Telemetry system operational"
    }
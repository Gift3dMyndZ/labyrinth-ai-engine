from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.db.database import (
    insert_telemetry,
    get_recent_telemetry,
    insert_leaderboard_entry,
    insert_replay,
)

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


class TelemetryPayload(BaseModel):
    session_id: Optional[str] = None
    fear_level: float = 0
    aggression: float = 0
    curiosity: float = 0
    survival_time: Optional[float] = None
    difficulty_modifier: float = 1.0
    outcome: str = "ongoing"
    floor_reached: int = 1
    maze_size: int = 41


@router.post("/log")
def log_telemetry(payload: TelemetryPayload):
    data = payload.model_dump()
    insert_telemetry(data)

    if payload.outcome in ("escaped", "killed"):
        insert_leaderboard_entry(
            survival_time=payload.survival_time or 0,
            difficulty_modifier=payload.difficulty_modifier,
        )
        insert_replay(data)

    return {"status": "logged"}


@router.get("/history/{session_id}")
def telemetry_history(session_id: str, limit: int = 20):
    rows = get_recent_telemetry(session_id, limit)
    return {"status": "ok", "data": rows}
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.db.database import (
    get_recent_telemetry,
    insert_leaderboard_entry,
    insert_replay,
    insert_telemetry,
)

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


class TelemetryPayload(BaseModel):
    session_id: Optional[str] = Field(default=None, max_length=128)
    display_name: str = Field(
        default="Unknown Wanderer",
        min_length=1,
        max_length=32,
    )
    device_type: str = Field(default="unknown", max_length=16)

    fear_level: float = Field(default=0, ge=0, le=1)
    aggression: float = Field(default=0, ge=0, le=1)
    curiosity: float = Field(default=0, ge=0, le=1)

    survival_time: Optional[float] = Field(default=None, ge=0)
    difficulty_modifier: float = Field(default=1.0, ge=0.1, le=5.0)
    outcome: str = Field(default="ongoing", max_length=16)
    floor_reached: int = Field(default=1, ge=1, le=9)
    maze_size: int = Field(default=41, ge=5, le=201)
    oracle_mutations: int = Field(default=0, ge=0)


@router.post("/log")
def log_telemetry(payload: TelemetryPayload):
    data = payload.model_dump()
    insert_telemetry(data)

    result = None

    if payload.outcome in ("escaped", "killed"):
        result = insert_leaderboard_entry(
            survival_time=payload.survival_time or 0,
            difficulty_modifier=payload.difficulty_modifier,
            session_id=payload.session_id,
            display_name=payload.display_name,
            outcome=payload.outcome,
            floor_reached=payload.floor_reached,
            device_type=payload.device_type,
            oracle_mutations=payload.oracle_mutations,
            validated=False,
        )
        insert_replay(data)

    response = {"status": "logged"}

    if result is not None:
        response["run_result"] = result

    return response


@router.get("/history/{session_id}")
def telemetry_history(session_id: str, limit: int = 20):
    safe_limit = min(100, max(1, limit))
    rows = get_recent_telemetry(session_id, safe_limit)
    return {"status": "ok", "data": rows}

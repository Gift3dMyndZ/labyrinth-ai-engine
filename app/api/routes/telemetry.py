from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime

from app.services.telemetry_logger import log_telemetry
from app.db.database import (
    insert_telemetry,
    insert_leaderboard_entry
)

router = APIRouter()


# ==================================================
# REQUEST SCHEMA
# ==================================================

class TelemetryPayload(BaseModel):
    fear_level: float = Field(..., ge=0, le=10)
    aggression: float = Field(..., ge=0, le=10)
    curiosity: float = Field(..., ge=0, le=10)
    survival_time: float = Field(..., ge=0)
    difficulty_modifier: float = Field(..., gt=0)
    outcome: Literal["win", "loss"]

    class Config:
        json_schema_extra = {
            "example": {
                "fear_level": 6,
                "aggression": 3,
                "curiosity": 8,
                "survival_time": 120,
                "difficulty_modifier": 1.2,
                "outcome": "win"
            }
        }


# ==================================================
# TELEMETRY ENDPOINT
# ==================================================

@router.post("/", summary="Submit player telemetry")
def receive_telemetry(payload: TelemetryPayload):
    """
    Accepts player behavioral telemetry data.
    
    - Logs raw telemetry to CSV (for ML training)
    - Persists telemetry to SQLite database
    - Updates leaderboard if applicable
    """

    try:
        telemetry_data = payload.model_dump()

        # ==================================================
        # CSV Logging (ML dataset)
        # ==================================================
        log_telemetry(telemetry_data)

        # ==================================================
        # Database Persistence
        # ==================================================
        insert_telemetry(telemetry_data)

        # ==================================================
        # Leaderboard Logic
        # ==================================================
        if telemetry_data["outcome"] == "win":
            insert_leaderboard_entry(
                survival_time=telemetry_data["survival_time"],
                difficulty_modifier=telemetry_data["difficulty_modifier"]
            )

        return {
            "status": "success",
            "message": "Telemetry logged and persisted",
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Telemetry processing failed: {str(e)}"
        )


# ==================================================
# TELEMETRY STATUS
# ==================================================

@router.get("/status", summary="Telemetry system status")
def telemetry_status():
    return {
        "telemetry_logging": "active",
        "database_persistence": "enabled",
        "leaderboard_tracking": "enabled",
        "timestamp": datetime.utcnow().isoformat()
    }
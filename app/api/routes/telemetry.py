from fastapi import APIRouter
from app.db.database import (
    insert_telemetry,
    insert_leaderboard_entry,
    get_top_survivals
)

router = APIRouter()


# ==================================================
# TELEMETRY LOGGING
# ==================================================

@router.post("/")
def log_telemetry(data: dict):
    """
    Logs player telemetry data.
    Automatically updates leaderboard if survival_time exists.
    """
    insert_telemetry(data)

    # Update leaderboard if survival time provided
    if data.get("survival_time") is not None:
        insert_leaderboard_entry(
            survival_time=data.get("survival_time"),
            difficulty_modifier=data.get("difficulty_modifier", 1.0)
        )

    return {
        "status": "telemetry logged",
        "leaderboard_updated": data.get("survival_time") is not None
    }


# ==================================================
# LEADERBOARD ENDPOINT
# ==================================================

@router.get("/leaderboard")
def leaderboard(limit: int = 10):
    """
    Returns top survival records.
    """
    return get_top_survivals(limit)


# ==================================================
# TELEMETRY STATUS
# ==================================================

@router.get("/status")
def telemetry_status():
    """
    Basic telemetry health check.
    """
    return {
        "status": "Telemetry system operational"
    }
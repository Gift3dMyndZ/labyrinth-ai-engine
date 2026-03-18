from fastapi import APIRouter, Request
from app.db.database import (
    insert_telemetry,
    insert_leaderboard_entry,
    get_top_survivals
)

router = APIRouter()


# ==================================================
# TELEMETRY LOGGING (PRIMARY ENDPOINT)
# ==================================================

@router.post("/")
def log_telemetry(data: dict, request: Request):
    """
    Logs player telemetry data.
    Updates leaderboard.
    Adds experience to ML replay buffer.
    """

    # ------------------------------------------------
    # 1️⃣ Save telemetry to database
    # ------------------------------------------------
    insert_telemetry(data)

    # ------------------------------------------------
    # 2️⃣ Update leaderboard if survival time exists
    # ------------------------------------------------
    leaderboard_updated = False

    if data.get("survival_time") is not None:
        insert_leaderboard_entry(
            survival_time=data.get("survival_time"),
            difficulty_modifier=data.get("difficulty_modifier", 1.0)
        )
        leaderboard_updated = True

    # ------------------------------------------------
    # 3️⃣ ✅ Add to ML replay buffer (NO direct training)
    # ------------------------------------------------
    cluster_service = request.app.state.cluster_service

    if cluster_service:
        try:
            cluster_service.add_experience(data)
        except Exception as e:
            print(f"Replay buffer add failed: {e}")

    return {
        "status": "telemetry logged",
        "leaderboard_updated": leaderboard_updated
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
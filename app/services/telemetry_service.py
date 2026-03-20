from app.db.database import SessionLocal
from app.db.models import Telemetry
from fastapi import Depends
from app.db.database import get_db

@router.post("/telemetry")
def log_run(data: dict, db=Depends(get_db)):
    return save_telemetry(db, data)

# ==================================================
# SIMPLE SAVE (Auto-Session)
# ==================================================

def save_telemetry_to_db(data: dict):
    db = SessionLocal()
    try:
        entry = Telemetry(
            fear_level=data.get("fear_level"),
            aggression=data.get("aggression"),
            curiosity=data.get("curiosity"),
            survival_time=data.get("survival_time"),
            difficulty_modifier=data.get("difficulty_modifier"),
            outcome=data.get("outcome"),
            session_id=data.get("session_id"),
            floor_reached=data.get("floor_reached"),
            maze_size=data.get("maze_size")
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
    finally:
        db.close()


# ==================================================
# ADVANCED SAVE (External Session Injection)
# ==================================================

def save_telemetry(db, data, cluster_id=None, player_type=None):

    telemetry = Telemetry(
        fear_level=data.get("fear_level"),
        aggression=data.get("aggression"),
        curiosity=data.get("curiosity"),
        survival_time=data.get("survival_time"),
        difficulty_modifier=data.get("difficulty_modifier"),
        outcome=data.get("outcome"),

        # Extended adaptive AI fields
        cluster_id=cluster_id,
        player_type=player_type,
        session_id=data.get("session_id"),
        floor_reached=data.get("floor_reached"),
        maze_size=data.get("maze_size")
    )

    db.add(telemetry)
    db.commit()
    db.refresh(telemetry)

    return telemetry
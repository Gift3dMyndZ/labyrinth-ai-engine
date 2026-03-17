from app.db.database import SessionLocal
from app.db.models import Telemetry


def save_telemetry_to_db(data: dict):
    db = SessionLocal()
    try:
        entry = Telemetry(
            fear_level=data["fear_level"],
            aggression=data["aggression"],
            curiosity=data["curiosity"],
            survival_time=data["survival_time"],
            difficulty_modifier=data["difficulty_modifier"],
            outcome=data["outcome"]
        )
        db.add(entry)
        db.commit()
    finally:
        db.close()
from fastapi import APIRouter, Body
from app.db.database import get_connection

router = APIRouter()


@router.post("/telemetry")
def log_telemetry(data: dict = Body(...)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO telemetry (fear_level, aggression, curiosity) VALUES (?, ?, ?)",
        (
            data.get("fear_level"),
            data.get("aggression"),
            data.get("curiosity"),
        ),
    )

    conn.commit()
    conn.close()

    return {"status": "logged"}
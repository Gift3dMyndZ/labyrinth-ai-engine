import sqlite3
import os
from contextlib import contextmanager
from datetime import datetime

# ==================================================
# PATH CONFIGURATION
# ==================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "labyrinth.db")

os.makedirs(DATA_DIR, exist_ok=True)


# ==================================================
# DATABASE CONNECTION
# ==================================================

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Enables dict-style row access
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


# ==================================================
# DATABASE INITIALIZATION
# ==================================================

def initialize_db():
    with get_db() as conn:
        cursor = conn.cursor()

        # Telemetry table (full ML-ready schema)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                fear_level REAL,
                aggression REAL,
                curiosity REAL,
                survival_time REAL,
                difficulty_modifier REAL,
                outcome TEXT
            )
        """)

        # Prediction logging table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                prediction INTEGER,
                confidence REAL
            )
        """)

        # Leaderboard table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leaderboard (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                survival_time REAL,
                difficulty_modifier REAL
            )
        """)


# ==================================================
# TELEMETRY INSERTION
# ==================================================

def insert_telemetry(data: dict):
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO telemetry (
                fear_level,
                aggression,
                curiosity,
                survival_time,
                difficulty_modifier,
                outcome
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data.get("fear_level"),
            data.get("aggression"),
            data.get("curiosity"),
            data.get("survival_time"),
            data.get("difficulty_modifier"),
            data.get("outcome"),
        ))


# ==================================================
# PREDICTION INSERTION
# ==================================================

def insert_prediction(prediction: int, confidence: float):
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO predictions (prediction, confidence)
            VALUES (?, ?)
        """, (prediction, confidence))


# ==================================================
# LEADERBOARD INSERTION
# ==================================================

def insert_leaderboard_entry(survival_time: float, difficulty_modifier: float):
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO leaderboard (survival_time, difficulty_modifier)
            VALUES (?, ?)
        """, (survival_time, difficulty_modifier))


# ==================================================
# TELEMETRY ANALYTICS
# ==================================================

def get_telemetry_averages():
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                AVG(fear_level) AS avg_fear,
                AVG(aggression) AS avg_aggression,
                AVG(curiosity) AS avg_curiosity
            FROM telemetry
        """)

        result = cursor.fetchone()

        if not result or all(result[key] is None for key in result.keys()):
            return {
                "fear": 5,
                "aggression": 5,
                "curiosity": 5,
            }

        return {
            "fear": result["avg_fear"] or 0,
            "aggression": result["avg_aggression"] or 0,
            "curiosity": result["avg_curiosity"] or 0,
        }


# ==================================================
# LEADERBOARD QUERY
# ==================================================

def get_top_survivals(limit: int = 10):
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT survival_time, difficulty_modifier, timestamp
            FROM leaderboard
            ORDER BY survival_time DESC
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()

        return [
            {
                "survival_time": row["survival_time"],
                "difficulty_modifier": row["difficulty_modifier"],
                "timestamp": row["timestamp"],
            }
            for row in rows
        ]
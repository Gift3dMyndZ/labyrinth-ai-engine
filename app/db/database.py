import sqlite3
import os


# ==================================================
# PATH CONFIGURATION
# ==================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "labyrinth.db")


# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)


# ==================================================
# DATABASE CONNECTION
# ==================================================

def get_connection():
    return sqlite3.connect(DB_PATH)


# ==================================================
# DATABASE INITIALIZATION
# ==================================================

def initialize_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fear_level INTEGER,
            aggression INTEGER,
            curiosity INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


# ==================================================
# INSERT TELEMETRY
# ==================================================

def insert_telemetry(fear: int, aggression: int, curiosity: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO telemetry (fear_level, aggression, curiosity)
        VALUES (?, ?, ?)
    """, (fear, aggression, curiosity))

    conn.commit()
    conn.close()


# ==================================================
# TELEMETRY ANALYTICS
# ==================================================

def get_telemetry_averages():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            AVG(fear_level),
            AVG(aggression),
            AVG(curiosity)
        FROM telemetry
    """)

    result = cursor.fetchone()
    conn.close()

    # If no telemetry exists yet
    if not result or all(value is None for value in result):
        return {
            "fear": 5,
            "aggression": 5,
            "curiosity": 5,
        }

    return {
        "fear": result[0] or 0,
        "aggression": result[1] or 0,
        "curiosity": result[2] or 0,
    }
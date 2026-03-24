"""
Tartarus Database Layer
SQLite with raw queries — no ORM overhead
"""

import sqlite3
import os
import threading
from datetime import datetime, timezone

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./tartarus.db").replace("sqlite:///", "")

_local = threading.local()


def get_connection():
    """Thread-local SQLite connection."""
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(DB_PATH)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA foreign_keys=ON")
    return _local.conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS telemetry (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp       TEXT    NOT NULL,
            session_id      TEXT,
            fear_level      REAL    NOT NULL DEFAULT 0,
            aggression      REAL    NOT NULL DEFAULT 0,
            curiosity       REAL    NOT NULL DEFAULT 0,
            survival_time   REAL,
            difficulty_mod  REAL    DEFAULT 1.0,
            outcome         TEXT    NOT NULL DEFAULT 'ongoing',
            floor_reached   INTEGER DEFAULT 1,
            maze_size       INTEGER DEFAULT 41
        );

        CREATE TABLE IF NOT EXISTS leaderboard (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp       TEXT    NOT NULL,
            survival_time   REAL    NOT NULL,
            difficulty_mod  REAL    DEFAULT 1.0,
            score           REAL    NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS replay_buffer (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp       TEXT    NOT NULL,
            fear_level      REAL    NOT NULL,
            aggression      REAL    NOT NULL,
            curiosity       REAL    NOT NULL,
            outcome         TEXT,
            cluster_id      INTEGER DEFAULT -1
        );

        CREATE INDEX IF NOT EXISTS idx_telemetry_session
            ON telemetry(session_id);
        CREATE INDEX IF NOT EXISTS idx_leaderboard_score
            ON leaderboard(score DESC);
        CREATE INDEX IF NOT EXISTS idx_replay_cluster
            ON replay_buffer(cluster_id);
    """)
    conn.commit()
    print("[DB] Tables initialized")


def insert_telemetry(data: dict):
    conn = get_connection()
    conn.execute("""
        INSERT INTO telemetry
            (timestamp, session_id, fear_level, aggression, curiosity,
             survival_time, difficulty_mod, outcome, floor_reached, maze_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datetime.now(timezone.utc).isoformat(),
        data.get("session_id"),
        data.get("fear_level", 0),
        data.get("aggression", 0),
        data.get("curiosity", 0),
        data.get("survival_time"),
        data.get("difficulty_modifier", 1.0),
        data.get("outcome", "ongoing"),
        data.get("floor_reached", 1),
        data.get("maze_size", 41),
    ))
    conn.commit()


def get_recent_telemetry(session_id: str, limit: int = 20):
    conn = get_connection()
    rows = conn.execute("""
        SELECT * FROM telemetry
        WHERE session_id = ?
        ORDER BY id DESC LIMIT ?
    """, (session_id, limit)).fetchall()
    return [dict(r) for r in rows]


def get_aggregate_stats():
    conn = get_connection()
    row = conn.execute("""
        SELECT
            COUNT(*)                            AS total_sessions,
            AVG(survival_time)                  AS avg_survival,
            MAX(survival_time)                  AS max_survival,
            AVG(fear_level)                     AS avg_fear,
            AVG(aggression)                     AS avg_aggression,
            AVG(curiosity)                      AS avg_curiosity,
            SUM(CASE WHEN outcome='escaped' THEN 1 ELSE 0 END) AS escapes,
            SUM(CASE WHEN outcome='killed'  THEN 1 ELSE 0 END) AS deaths
        FROM telemetry
        WHERE outcome IN ('escaped', 'killed')
    """).fetchone()
    return dict(row) if row else {}


def insert_leaderboard_entry(survival_time: float, difficulty_modifier: float = 1.0):
    score = survival_time * 10 * difficulty_modifier
    conn = get_connection()
    conn.execute("""
        INSERT INTO leaderboard (timestamp, survival_time, difficulty_mod, score)
        VALUES (?, ?, ?, ?)
    """, (
        datetime.now(timezone.utc).isoformat(),
        survival_time,
        difficulty_modifier,
        score,
    ))
    conn.commit()


def get_top_survivals(limit: int = 10):
    conn = get_connection()
    rows = conn.execute("""
        SELECT survival_time, difficulty_mod, score, timestamp
        FROM leaderboard ORDER BY score DESC LIMIT ?
    """, (limit,)).fetchall()
    return [dict(r) for r in rows]


def insert_replay(data: dict, cluster_id: int = -1):
    conn = get_connection()
    conn.execute("""
        INSERT INTO replay_buffer
            (timestamp, fear_level, aggression, curiosity, outcome, cluster_id)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        datetime.now(timezone.utc).isoformat(),
        data.get("fear_level", 0),
        data.get("aggression", 0),
        data.get("curiosity", 0),
        data.get("outcome"),
        cluster_id,
    ))
    conn.commit()


def get_all_replay_entries():
    conn = get_connection()
    rows = conn.execute("""
        SELECT fear_level, aggression, curiosity, outcome, cluster_id
        FROM replay_buffer ORDER BY id DESC LIMIT 5000
    """).fetchall()
    return [dict(r) for r in rows]


def update_replay_clusters(ids_and_clusters: list):
    conn = get_connection()
    conn.executemany("""
        UPDATE replay_buffer SET cluster_id = ? WHERE id = ?
    """, [(c, i) for i, c in ids_and_clusters])
    conn.commit()
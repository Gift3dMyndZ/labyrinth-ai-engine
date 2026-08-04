"""
Tartarus Database Layer
SQLite with raw queries — no ORM overhead
"""
import sqlite3
import os
import threading
from datetime import datetime, timezone


# Use /tmp on Render (writable), or local data/ for dev
DB_PATH = os.environ.get("DATABASE_URL", "data/tartarus.db").replace("sqlite:///", "")

# If path is relative like "data/tartarus.db", default to /tmp on Render
if not os.path.isabs(DB_PATH) and os.environ.get("RENDER"):
    DB_PATH = "/tmp/tartarus.db"

_local = threading.local()


def get_table_columns(conn, table_name: str) -> set:
    """Return the existing column names for a SQLite table."""
    rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    return {row["name"] for row in rows}


def ensure_column(
    conn,
    table_name: str,
    column_name: str,
    column_definition: str,
):
    """Add a column when an older database does not contain it."""
    existing_columns = get_table_columns(conn, table_name)

    if column_name not in existing_columns:
        conn.execute(
            f"ALTER TABLE {table_name} "
            f"ADD COLUMN {column_name} {column_definition}"
        )
        print(f"[DB] Added {table_name}.{column_name}")


def get_connection():
    if not hasattr(_local, "conn") or _local.conn is None:
        # Ensure directory exists
        os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
        _local.conn = sqlite3.connect(DB_PATH)
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA foreign_keys=ON")
        _local.conn.row_factory = sqlite3.Row
    return _local.conn


def init_db():
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
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp        TEXT    NOT NULL,
            session_id       TEXT,
            display_name     TEXT    NOT NULL DEFAULT 'Unknown Wanderer',
            survival_time    REAL    NOT NULL,
            difficulty_mod   REAL    NOT NULL DEFAULT 1.0,
            score            REAL    NOT NULL DEFAULT 0,
            outcome          TEXT    NOT NULL DEFAULT 'unknown',
            floor_reached    INTEGER NOT NULL DEFAULT 1,
            device_type      TEXT    NOT NULL DEFAULT 'unknown',
            oracle_mutations INTEGER NOT NULL DEFAULT 0,
            validated        INTEGER NOT NULL DEFAULT 0
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
    ensure_column(conn, "leaderboard", "session_id", "TEXT")
    ensure_column(
        conn,
        "leaderboard",
        "display_name",
        "TEXT NOT NULL DEFAULT 'Unknown Wanderer'",
    )
    ensure_column(
        conn,
        "leaderboard",
        "outcome",
        "TEXT NOT NULL DEFAULT 'unknown'",
    )
    ensure_column(
        conn,
        "leaderboard",
        "floor_reached",
        "INTEGER NOT NULL DEFAULT 1",
    )
    ensure_column(
        conn,
        "leaderboard",
        "device_type",
        "TEXT NOT NULL DEFAULT 'unknown'",
    )
    ensure_column(
        conn,
        "leaderboard",
        "oracle_mutations",
        "INTEGER NOT NULL DEFAULT 0",
    )
    ensure_column(
        conn,
        "leaderboard",
        "validated",
        "INTEGER NOT NULL DEFAULT 0",
    )

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_leaderboard_timestamp
        ON leaderboard(timestamp DESC)
    """)

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_leaderboard_session
        ON leaderboard(session_id)
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


def insert_leaderboard_entry(
    survival_time: float,
    difficulty_modifier: float = 1.0,
    session_id: str = None,
    display_name: str = "Unknown Wanderer",
    outcome: str = "unknown",
    floor_reached: int = 1,
    device_type: str = "unknown",
    oracle_mutations: int = 0,
    validated: bool = False,
):
    """
    Insert one final result per session.

    The score is calculated by the server from the submitted run metrics.
    The validated field remains false until full server-authoritative
    gameplay verification is implemented.
    """
    conn = get_connection()

    safe_name = (display_name or "Unknown Wanderer").strip()[:32]
    safe_name = safe_name or "Unknown Wanderer"

    safe_outcome = outcome if outcome in {"escaped", "killed"} else "unknown"
    safe_device = (
        device_type
        if device_type in {"desktop", "mobile", "tablet", "unknown"}
        else "unknown"
    )

    safe_survival = max(0.0, float(survival_time or 0))
    safe_difficulty = min(5.0, max(0.1, float(difficulty_modifier or 1.0)))
    safe_floor = min(9, max(1, int(floor_reached or 1)))
    safe_mutations = max(0, int(oracle_mutations or 0))

    score = round(safe_survival * 10 * safe_difficulty, 2)

    if session_id:
        existing = conn.execute(
            "SELECT id FROM leaderboard WHERE session_id = ? LIMIT 1",
            (session_id,),
        ).fetchone()

        if existing:
            return {
                "inserted": False,
                "duplicate": True,
                "score": score,
            }

    cursor = conn.execute("""
        INSERT INTO leaderboard (
            timestamp,
            session_id,
            display_name,
            survival_time,
            difficulty_mod,
            score,
            outcome,
            floor_reached,
            device_type,
            oracle_mutations,
            validated
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datetime.now(timezone.utc).isoformat(),
        session_id,
        safe_name,
        safe_survival,
        safe_difficulty,
        score,
        safe_outcome,
        safe_floor,
        safe_device,
        safe_mutations,
        1 if validated else 0,
    ))

    conn.commit()

    return {
        "inserted": True,
        "duplicate": False,
        "run_id": cursor.lastrowid,
        "score": score,
    }


def get_top_survivals(limit: int = 10):
    safe_limit = min(100, max(1, int(limit)))

    conn = get_connection()
    rows = conn.execute("""
        SELECT
            id,
            timestamp,
            session_id,
            display_name,
            survival_time,
            difficulty_mod,
            score,
            outcome,
            floor_reached,
            device_type,
            oracle_mutations,
            validated
        FROM leaderboard
        ORDER BY score DESC, timestamp ASC
        LIMIT ?
    """, (safe_limit,)).fetchall()

    return [dict(row) for row in rows]


def get_recent_runs(limit: int = 20):
    safe_limit = min(100, max(1, int(limit)))

    conn = get_connection()
    rows = conn.execute("""
        SELECT
            id,
            timestamp,
            session_id,
            display_name,
            survival_time,
            difficulty_mod,
            score,
            outcome,
            floor_reached,
            device_type,
            oracle_mutations,
            validated
        FROM leaderboard
        ORDER BY timestamp DESC
        LIMIT ?
    """, (safe_limit,)).fetchall()

    return [dict(row) for row in rows]


def get_dashboard_summary():
    conn = get_connection()

    row = conn.execute("""
        SELECT
            COUNT(*) AS total_runs,
            SUM(
                CASE WHEN outcome = 'escaped'
                THEN 1 ELSE 0 END
            ) AS completed_runs,
            SUM(
                CASE WHEN outcome = 'killed'
                THEN 1 ELSE 0 END
            ) AS deaths,
            COALESCE(MAX(score), 0) AS highest_score,
            COALESCE(AVG(score), 0) AS average_score,
            COALESCE(AVG(floor_reached), 0) AS average_floor,
            COALESCE(MAX(floor_reached), 0) AS deepest_floor,
            COALESCE(AVG(survival_time), 0) AS average_survival,
            COALESCE(SUM(oracle_mutations), 0) AS oracle_mutations
        FROM leaderboard
    """).fetchone()

    result = dict(row) if row else {}

    total_runs = result.get("total_runs") or 0
    completed_runs = result.get("completed_runs") or 0

    result["completion_rate"] = (
        round(completed_runs / total_runs, 4)
        if total_runs
        else 0
    )

    return result


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
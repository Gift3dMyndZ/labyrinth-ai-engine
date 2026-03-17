import csv
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Dict, Any

# ==================================================
# PATH CONFIGURATION
# ==================================================

RAW_DATA_PATH = Path("data/raw")
LOG_FILE = RAW_DATA_PATH / "telemetry_log.csv"

# Thread lock for safe concurrent writes
_write_lock = Lock()

# ==================================================
# TELEMETRY SCHEMA
# ==================================================

FIELDNAMES = [
    "timestamp",
    "fear_level",
    "aggression",
    "curiosity",
    "survival_time",
    "difficulty_modifier",
    "outcome"
]


# ==================================================
# DIRECTORY INITIALIZATION
# ==================================================

def ensure_data_directory() -> None:
    """
    Ensures raw telemetry directory exists.
    """
    RAW_DATA_PATH.mkdir(parents=True, exist_ok=True)


# ==================================================
# TELEMETRY LOGGING
# ==================================================

def log_telemetry(data: Dict[str, Any]) -> None:
    """
    Append validated telemetry data to CSV log.

    Args:
        data (dict): Telemetry payload dictionary
    """

    ensure_data_directory()

    # Prepare structured row
    row = {
        "timestamp": datetime.utcnow().isoformat(),
        "fear_level": data.get("fear_level"),
        "aggression": data.get("aggression"),
        "curiosity": data.get("curiosity"),
        "survival_time": data.get("survival_time"),
        "difficulty_modifier": data.get("difficulty_modifier"),
        "outcome": data.get("outcome")
    }

    file_exists = LOG_FILE.exists()

    # Thread-safe file write
    with _write_lock:
        with open(LOG_FILE, mode="a", newline="", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=FIELDNAMES)

            # Write header only if file is new
            if not file_exists:
                writer.writeheader()

            writer.writerow(row)
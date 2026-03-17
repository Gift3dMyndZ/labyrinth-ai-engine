import os
import json
from typing import Optional, Dict, List

from app.db.database import get_telemetry_averages


# ==================================================
# PATH RESOLUTION
# ==================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

CHARACTERS_PATH = os.path.join(DATA_DIR, "characters.json")
STORY_ARCS_PATH = os.path.join(DATA_DIR, "story_arcs.json")


# ==================================================
# LOAD JSON SAFELY
# ==================================================

def load_json(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Missing required data file: {path}")
    with open(path, "r") as f:
        return json.load(f)


characters = load_json(CHARACTERS_PATH)
story_arcs = load_json(STORY_ARCS_PATH)


# ==================================================
# ADAPTIVE STORY ENGINE
# ==================================================

def get_character_story(book_name: str) -> Optional[Dict]:
    """
    Generate progressive story arc for a given book.
    Now includes adaptive difficulty scaling based on telemetry.
    """

    character = next((c for c in characters if c["book"] == book_name), None)
    arc = next((a for a in story_arcs if a["book"] == book_name), None)

    if not character or not arc:
        return None

    # --------------------------------------------
    # ✅ Get Telemetry Averages
    # --------------------------------------------
    telemetry = get_telemetry_averages()

    fear = telemetry["fear"]
    aggression = telemetry["aggression"]
    curiosity = telemetry["curiosity"]

    # --------------------------------------------
    # ✅ Adaptive Multiplier Logic
    # --------------------------------------------
    difficulty_multiplier = 1.0

    if aggression > 7:
        difficulty_multiplier += 0.3

    if curiosity > 7:
        difficulty_multiplier += 0.2

    if fear > 7:
        difficulty_multiplier -= 0.2

    # Clamp multiplier for safety
    difficulty_multiplier = max(0.7, min(difficulty_multiplier, 1.8))

    # --------------------------------------------
    # ✅ Apply Scaling to Story Progression
    # --------------------------------------------
    progression: List[Dict] = []
    danger = character.get("danger_level", 0)

    for chapter in arc.get("chapters", []):
        base_increase = chapter.get("danger_increase", 0)
        adjusted_increase = int(base_increase * difficulty_multiplier)

        danger += adjusted_increase

        progression.append({
            "location": chapter.get("location"),
            "event": chapter.get("event"),
            "danger_level": danger
        })

    return {
        "character": character,
        "progression": progression
    }
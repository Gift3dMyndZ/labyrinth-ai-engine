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
# LOAD JSON
# ==================================================

def load_json(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Missing required data file: {path}")
    with open(path, "r") as f:
        return json.load(f)


characters = load_json(CHARACTERS_PATH)
story_arcs = load_json(STORY_ARCS_PATH)


# ==================================================
# DIFFICULTY CALCULATION
# ==================================================

def calculate_difficulty_multiplier(telemetry: Dict, character: Dict) -> float:
    """
    Combine telemetry + character traits into a final difficulty multiplier.
    """

    fear = telemetry["fear"]
    aggression = telemetry["aggression"]
    curiosity = telemetry["curiosity"]

    traits = character.get("traits", {})
    courage = traits.get("courage", 5)
    intellect = traits.get("intellect", 5)
    stamina = traits.get("stamina", 5)

    multiplier = 1.0

    # Telemetry influence
    if aggression > 7:
        multiplier += 0.3

    if curiosity > 7:
        multiplier += 0.2

    if fear > 7:
        multiplier -= 0.2

    # Character trait modifiers
    multiplier -= (courage - 5) * 0.03   # High courage slightly lowers danger
    multiplier -= (intellect - 5) * 0.02 # Smart characters adapt better
    multiplier += (5 - stamina) * 0.03   # Low stamina increases danger

    # Clamp multiplier
    return max(0.6, min(multiplier, 2.0))


# ==================================================
# STORY ENGINE
# ==================================================

def get_character_story(book_name: str) -> Optional[Dict]:
    """
    Generate progressive story arc with adaptive difficulty scaling.
    """

    character = next((c for c in characters if c["book"] == book_name), None)
    arc = next((a for a in story_arcs if a["book"] == book_name), None)

    if not character or not arc:
        return None

    # Get telemetry
    telemetry = get_telemetry_averages()

    # Calculate multiplier
    multiplier = calculate_difficulty_multiplier(telemetry, character)

    # Starting danger (support old + new format)
    danger = character.get("base_danger", character.get("danger_level", 0))

    progression: List[Dict] = []

    for chapter in arc.get("chapters", []):
        base_increase = chapter.get("danger_increase", 0)
        adjusted_increase = int(base_increase * multiplier)

        danger += adjusted_increase

        progression.append({
            "location": chapter.get("location"),
            "event": chapter.get("event"),
            "danger_level": danger
        })

    return {
        "character": character,
        "difficulty_multiplier": round(multiplier, 2),
        "progression": progression
    }
import os
import json
from typing import Optional, Dict, List


# ✅ Resolve project root safely
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

CHARACTERS_PATH = os.path.join(DATA_DIR, "characters.json")
STORY_ARCS_PATH = os.path.join(DATA_DIR, "story_arcs.json")


# ✅ Load JSON safely
def load_json(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Missing required data file: {path}")
    with open(path, "r") as f:
        return json.load(f)


characters = load_json(CHARACTERS_PATH)
story_arcs = load_json(STORY_ARCS_PATH)


def get_character_story(book_name: str) -> Optional[Dict]:
    """
    Generate progressive story arc for a given book.
    """

    character = next((c for c in characters if c["book"] == book_name), None)
    arc = next((a for a in story_arcs if a["book"] == book_name), None)

    if not character or not arc:
        return None

    progression: List[Dict] = []
    danger = character.get("danger_level", 0)

    for chapter in arc.get("chapters", []):
        danger += chapter.get("danger_increase", 0)

        progression.append({
            "location": chapter.get("location"),
            "event": chapter.get("event"),
            "danger_level": danger
        })

    return {
        "character": character,
        "progression": progression
    }
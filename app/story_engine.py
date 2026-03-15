import json
import os

# Get absolute path to this directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load characters
with open(os.path.join(BASE_DIR, "data", "characters.json")) as f:
    characters = json.load(f)

# Load story arcs
with open(os.path.join(BASE_DIR, "data", "story_arcs.json")) as f:
    story_arcs = json.load(f)


def get_character_story(book_name: str):
    character = next((c for c in characters if c["book"] == book_name), None)
    arc = next((a for a in story_arcs if a["book"] == book_name), None)

    if not character or not arc:
        return None

    progression = []
    danger = character["danger_level"]

    for chapter in arc["chapters"]:
        danger += chapter["danger_increase"]
        progression.append({
            "location": chapter["location"],
            "event": chapter["event"],
            "danger_level": danger
        })

    return {
        "character": character,
        "progression": progression
    }
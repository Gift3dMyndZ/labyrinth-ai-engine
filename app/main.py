from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import os

from .ml_engine import recommend_books_by_preferences
from .story_engine import get_character_story

app = FastAPI()

# Optional CORS (safe to keep)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get base directory (Docker-safe paths)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ==============================
# ROOT ROUTE
# ==============================
@app.get("/")
def root():
    return {"message": "Stephen King Survival MLOps API is running"}


# ==============================
# DASHBOARD ROUTE
# ==============================
@app.get("/dashboard", response_class=HTMLResponse)
def get_dashboard():
    dashboard_path = os.path.join(BASE_DIR, "templates", "dashboard.html")

    if not os.path.exists(dashboard_path):
        return "<h1>Dashboard not found</h1>"

    with open(dashboard_path, "r") as f:
        return f.read()


# ==============================
# RECOMMENDATION ROUTE
# ==============================
@app.get("/recommend")
def recommend(theme: str):
    results = recommend_books_by_preferences(theme)
    return {"recommendations": results}


# ==============================
# STORY MODE ROUTE
# ==============================
@app.get("/story/{book}", response_class=HTMLResponse)
def story_page(book: str):
    story = get_character_story(book)

    if not story:
        return "<h1 style='color:white;background:black;padding:40px;'>Story not found</h1>"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{book} - Dungeon Map</title>
        <style>
            body {{
                margin: 0;
                background: black;
                color: white;
                font-family: Arial;
                padding: 30px;
            }}

            h1 {{
                text-shadow: 0 0 15px red;
            }}

            .stats {{
                margin-bottom: 20px;
            }}

            .bar {{
                height: 20px;
                background: #222;
                border-radius: 10px;
                margin-bottom: 10px;
                overflow: hidden;
            }}

            .fill {{
                height: 100%;
                transition: width 0.4s ease;
            }}

            .health {{
                background: linear-gradient(90deg, darkgreen, lime);
            }}

            .madness {{
                background: linear-gradient(90deg, purple, red);
            }}

            .map {{
                display: grid;
                grid-template-columns: repeat(5, 60px);
                grid-gap: 10px;
                margin-top: 30px;
            }}

            .tile {{
                width: 60px;
                height: 60px;
                background: #111;
                border: 1px solid #333;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: 0.2s;
            }}

            .tile:hover {{
                background: #222;
            }}

            .player {{
                background: darkred !important;
            }}

            .exit {{
                background: darkgreen !important;
            }}

            .boss {{
                background: purple !important;
            }}

            .event-log {{
                margin-top: 30px;
                background: #111;
                padding: 20px;
                border-radius: 10px;
                min-height: 120px;
            }}
        </style>
    </head>
    <body>

        <h1>{story['character']['character']} - Dungeon</h1>

        <div class="stats">
            <strong>Health</strong>
            <div class="bar">
                <div id="healthBar" class="fill health" style="width:100%"></div>
            </div>

            <strong>Madness</strong>
            <div class="bar">
                <div id="madnessBar" class="fill madness" style="width:0%"></div>
            </div>
        </div>

        <div class="map" id="map"></div>

        <div class="event-log" id="eventLog">
            Click adjacent tiles to move through the dungeon.
        </div>

        <script>
            const size = 5;
            let playerPos = 0;
            let health = 100;
            let madness = 0;

            const bossTile = 18;
            const exitTile = 24;

            function updateBars() {{
                document.getElementById("healthBar").style.width = health + "%";
                document.getElementById("madnessBar").style.width = madness + "%";
            }}

            function log(text) {{
                const logBox = document.getElementById("eventLog");
                logBox.innerHTML = text + "<br><br>" + logBox.innerHTML;
            }}

            function createMap() {{
                const map = document.getElementById("map");
                map.innerHTML = "";

                for (let i = 0; i < size * size; i++) {{
                    const tile = document.createElement("div");
                    tile.classList.add("tile");

                    if (i === playerPos) tile.classList.add("player");
                    if (i === bossTile) tile.classList.add("boss");
                    if (i === exitTile) tile.classList.add("exit");

                    tile.onclick = () => movePlayer(i);
                    map.appendChild(tile);
                }}
            }}

            function movePlayer(target) {{
                const validMoves = [
                    playerPos - 1,
                    playerPos + 1,
                    playerPos - size,
                    playerPos + size
                ];

                if (!validMoves.includes(target)) return;

                playerPos = target;
                createMap();
                encounterCheck();
            }}

            function encounterCheck() {{
                if (playerPos === bossTile) {{
                    bossFight();
                    return;
                }}

                if (playerPos === exitTile) {{
                    alert("You escaped the dungeon!");
                    location.reload();
                    return;
                }}

                const chance = Math.random();

                if (chance > 0.6) {{
                    health -= 15;
                    madness += 10;
                    log("A creature attacks you in the dark!");
                }} else if (chance > 0.3) {{
                    madness += 15;
                    log("You hear whispers echoing through the halls...");
                }} else {{
                    log("The corridor is eerily quiet.");
                }}

                checkGameState();
                updateBars();
            }}

            function bossFight() {{
                const roll = Math.floor(Math.random() * 20) + 1;
                log("Boss encounter! You rolled " + roll);

                if (roll > 14) {{
                    log("You defeated the horror!");
                }} else {{
                    health -= 30;
                    madness += 25;
                    log("The boss mauls you brutally!");
                }}

                checkGameState();
                updateBars();
            }}

            function checkGameState() {{
                if (health <= 0) {{
                    alert("You died in the dungeon.");
                    location.reload();
                }}

                if (madness >= 100) {{
                    alert("Madness consumes you.");
                    location.reload();
                }}
            }}

            updateBars();
            createMap();
        </script>

    </body>
    </html>
    """

    return html
    story = get_character_story(book)

    if not story:
        return "<h1 style='color:white;background:black;padding:40px;'>Story not found</h1>"

    html = f"""
    <html>
    <head>
        <title>{book} - Campaign</title>
    </head>
    <body style="background:black;color:white;font-family:Arial;padding:40px;">
        <h1>{story['character']['character']}</h1>
        <h3>Role: {story['character']['role']}</h3>
        <p><strong>Starting Location:</strong> {story['character']['starting_location']}</p>
        <hr>
    """

    for chapter in story["progression"]:
        html += f"""
        <div style="margin-bottom:30px;padding:20px;border:1px solid #444;border-radius:8px;">
            <h2>📍 {chapter['location']}</h2>
            <p>{chapter['event']}</p>
            <p style="color:red;">🔥 Danger Level: {chapter['danger_level']}</p>
        </div>
        """

    html += """
        <hr>
        <a href="/dashboard" style="color:red;">⬅ Back to Dashboard</a>
    </body>
    </html>
    """

    return html
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
        <title>{book} - Advanced Dungeon</title>
        <style>
            body {{
                margin: 0;
                background: black;
                color: white;
                font-family: Arial;
                padding: 30px;
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

            .health {{ background: linear-gradient(90deg, darkgreen, lime); }}
            .madness {{ background: linear-gradient(90deg, purple, red); }}

            .map {{
                display: grid;
                grid-template-columns: repeat(5, 60px);
                gap: 8px;
                margin-top: 20px;
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
                font-size: 12px;
            }}

            .hidden {{ background: #000; border: 1px solid #000; }}
            .player {{ background: darkred !important; }}
            .exit {{ background: darkgreen !important; }}
            .boss {{ background: purple !important; }}

            .inventory {{
                margin-top: 20px;
                padding: 10px;
                background: #111;
                border-radius: 8px;
            }}

            button {{
                margin: 5px 5px 5px 0;
                padding: 6px 12px;
                background: darkred;
                border: none;
                color: white;
                cursor: pointer;
            }}

            .log {{
                margin-top: 20px;
                background: #111;
                padding: 15px;
                border-radius: 8px;
                min-height: 100px;
            }}
        </style>
    </head>
    <body>

        <h1>{story['character']['character']} - Dungeon</h1>

        <strong>Health</strong>
        <div class="bar"><div id="healthBar" class="fill health" style="width:100%"></div></div>

        <strong>Madness</strong>
        <div class="bar"><div id="madnessBar" class="fill madness" style="width:0%"></div></div>

        <div class="inventory">
            <strong>Inventory:</strong>
            <div id="inventoryDisplay"></div>
        </div>

        <div class="map" id="map"></div>

        <div id="choices"></div>

        <div class="log" id="log">You enter the darkness...</div>

        <script>
            const size = 5;
            let playerPos = 0;
            let health = 100;
            let madness = 0;

            let discovered = new Set([0]);

            const bossTile = 18;
            const exitTile = 24;

            let inventory = {{
                medkit: 1,
                potion: 1,
                key: 0
            }};

            function updateBars() {{
                health = Math.min(100, health);
                madness = Math.max(0, madness);
                document.getElementById("healthBar").style.width = health + "%";
                document.getElementById("madnessBar").style.width = madness + "%";
                updateInventory();
            }}

            function updateInventory() {{
                document.getElementById("inventoryDisplay").innerHTML =
                    "Medkits: " + inventory.medkit +
                    " | Sanity Potions: " + inventory.potion +
                    " | Keys: " + inventory.key;
            }}

            function log(text) {{
                document.getElementById("log").innerHTML =
                    text + "<br><br>" + document.getElementById("log").innerHTML;
            }}

            function createMap() {{
                const map = document.getElementById("map");
                map.innerHTML = "";

                for (let i = 0; i < size * size; i++) {{
                    const tile = document.createElement("div");
                    tile.classList.add("tile");

                    if (!discovered.has(i)) {{
                        tile.classList.add("hidden");
                    }}

                    if (i === playerPos) tile.classList.add("player");
                    if (i === bossTile) tile.classList.add("boss");
                    if (i === exitTile) tile.classList.add("exit");

                    tile.onclick = () => movePlayer(i);
                    map.appendChild(tile);
                }}
            }}

            function movePlayer(target) {{
                const row = Math.floor(playerPos / size);
                const col = playerPos % size;

                const targetRow = Math.floor(target / size);
                const targetCol = target % size;

                const isAdjacent =
                    (Math.abs(row - targetRow) === 1 && col === targetCol) ||
                    (Math.abs(col - targetCol) === 1 && row === targetRow);

                if (!isAdjacent) return;

                playerPos = target;
                discovered.add(target);
                createMap();
                encounter();
            }}

            function encounter() {{
                if (playerPos === bossTile) {{
                    log("The Boss emerges!");
                    showChoices("boss");
                    return;
                }}

                if (playerPos === exitTile) {{
                    if (inventory.key > 0) {{
                        alert("You escaped the dungeon!");
                        location.reload();
                    }} else {{
                        log("The exit is locked. You need a key.");
                    }}
                    return;
                }}

                const chance = Math.random();

                if (chance > 0.6) {{
                    log("A creature appears!");
                    showChoices("enemy");
                }} else if (chance > 0.3) {{
                    inventory.key += 1;
                    log("You found a key!");
                }} else {{
                    log("The hallway is silent...");
                }}

                updateBars();
            }}

            function showChoices(type) {{
                const div = document.getElementById("choices");
                div.innerHTML = `
                    <button onclick="resolveChoice('fight', '${type}')">⚔️ Fight</button>
                    <button onclick="resolveChoice('hide', '${type}')">🫥 Hide</button>
                    <button onclick="resolveChoice('flee', '${type}')">🏃 Flee</button>
                `;
            }}

            function resolveChoice(choice, type) {{
                const roll = Math.floor(Math.random() * 20) + 1;
                log("You rolled " + roll);

                if (choice === "fight") {{
                    if (roll > 12) {{
                        log("You defeated it!");
                    }} else {{
                        health -= 20;
                        madness += 15;
                        log("You were injured!");
                    }}
                }}

                if (choice === "hide") {{
                    if (roll > 10) {{
                        log("You remain unseen.");
                    }} else {{
                        madness += 20;
                        log("It senses you...");
                    }}
                }}

                if (choice === "flee") {{
                    if (roll > 8) {{
                        log("You escape safely.");
                    }} else {{
                        health -= 15;
                        log("You stumble while escaping.");
                    }}
                }}

                document.getElementById("choices").innerHTML = "";
                checkState();
                updateBars();
            }}

            function checkState() {{
                if (health <= 0) {{
                    alert("You died.");
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
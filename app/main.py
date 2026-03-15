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
@app.get("/play/{book}", response_class=HTMLResponse)
def play_page(book: str):
    story = get_character_story(book)

    if not story:
        return "<h1>Story not found</h1>"

    html = f"""
<!DOCTYPE html>
<html>
<head>
<title>{book} - Retro Maze</title>
<style>
body {{
    margin: 0;
    background: #222;
    color: white;
    font-family: monospace;
    overflow: hidden;
}}

#ui {{
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 10;
}}

canvas {{
    display: block;
}}
</style>
</head>
<body>

<div id="ui">
    <div>Health: <span id="health">100</span></div>
    <div>Madness: <span id="madness">0</span></div>
    <div>Use Arrow Keys or WASD</div>
</div>

<canvas id="game"></canvas>

<script>
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let health = 100;
let madness = 0;

const map = [
  [1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1],
  [1,0,1,0,1,0,0,1],
  [1,0,1,0,1,0,0,1],
  [1,0,0,0,0,0,2,1],
  [1,1,1,1,1,1,1,1]
];

let player = {{
    x: 2,
    y: 2,
    dir: 0
}};

const FOV = Math.PI / 3;
const DEPTH = 20;

function castRays() {{
    ctx.fillStyle = "#555";
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    ctx.fillStyle = "#777";
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    for (let i = 0; i < canvas.width; i++) {{
        let rayAngle = (player.dir - FOV/2) + (i / canvas.width) * FOV;

        for (let depth = 0; depth < DEPTH; depth += 0.1) {{
            let targetX = player.x + Math.cos(rayAngle) * depth;
            let targetY = player.y + Math.sin(rayAngle) * depth;

            if (map[Math.floor(targetY)][Math.floor(targetX)] === 1) {{
                let wallHeight = canvas.height / (depth * 0.5);

                ctx.fillStyle = "rgb(" + (200 - depth*15) + ",0,0)";
                ctx.fillRect(i, (canvas.height - wallHeight)/2, 1, wallHeight);
                break;
            }}

            if (map[Math.floor(targetY)][Math.floor(targetX)] === 2) {{
                alert("You escaped the maze!");
                location.reload();
            }}
        }}
    }}
}}

function move(dx, dy) {{
    let newX = player.x + dx;
    let newY = player.y + dy;

    if (map[Math.floor(newY)][Math.floor(newX)] === 0) {{
        player.x = newX;
        player.y = newY;

        if (Math.random() > 0.8) {{
            health -= 5;
            madness += 5;
        }}

        document.getElementById("health").innerText = health;
        document.getElementById("madness").innerText = madness;

        if (health <= 0 || madness >= 100) {{
            alert("You succumbed...");
            location.reload();
        }}
    }}
}}

document.addEventListener("keydown", e => {{
    if (e.key === "ArrowUp" || e.key === "w") {{
        move(Math.cos(player.dir)*0.2, Math.sin(player.dir)*0.2);
    }}
    if (e.key === "ArrowDown" || e.key === "s") {{
        move(-Math.cos(player.dir)*0.2, -Math.sin(player.dir)*0.2);
    }}
    if (e.key === "ArrowLeft" || e.key === "a") {{
        player.dir -= 0.1;
    }}
    if (e.key === "ArrowRight" || e.key === "d") {{
        player.dir += 0.1;
    }}
}});

function gameLoop() {{
    castRays();
    requestAnimationFrame(gameLoop);
}}

gameLoop();
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
from fastapi import FastAPI, Body
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi import Request
import os

from app.services.ml_engine import recommend_books_by_preferences
from app.services.story_engine import get_character_story
from app.db.database import initialize_db, get_connection

# ==================================================
# APP INITIALIZATION
# ==================================================

app = FastAPI()

# Enable CORS (safe default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
TEMPLATES_DIR = os.path.join(BASE_DIR, "app", "templates")

templates = Jinja2Templates(directory=TEMPLATES_DIR)


# ==================================================
# STARTUP EVENT (Initialize DB)
# ==================================================

@app.on_event("startup")
def startup_event():
    initialize_db()


# ==================================================
# ROOT
# ==================================================

@app.get("/")
def root():
    return {"message": "Labyrinth AI Engine API is running"}


# ==================================================
# DASHBOARD
# ==================================================

@app.get("/dashboard", response_class=HTMLResponse)
def get_dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})


# ==================================================
# RECOMMENDATION
# ==================================================

from pydantic import BaseModel
from typing import List

class PreferenceRequest(BaseModel):
    preferences: List[str]


@app.post("/recommend")
def recommend_post(request: PreferenceRequest):
    results = recommend_books_by_preferences(request.preferences)
    return results


@app.get("/recommend")
def recommend_get(theme: str):
    results = recommend_books_by_preferences([theme])
    return {"recommendations": results}

# ==================================================
# TELEMETRY LOGGING
# ==================================================

@app.post("/telemetry")
def log_telemetry(data: dict = Body(...)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO telemetry (fear_level, aggression, curiosity) VALUES (?, ?, ?)",
        (
            data.get("fear_level"),
            data.get("aggression"),
            data.get("curiosity"),
        ),
    )

    conn.commit()
    conn.close()

    return {"status": "logged"}


# ==================================================
# STORY MODE
# ==================================================

@app.get("/play/{book}", response_class=HTMLResponse)
def play_page(book: str):

    story = get_character_story(book)

    if not story:
        return "<h1 style='color:white;background:black;padding:40px;'>Story not found</h1>"

    html = f"""
<!DOCTYPE html>
<html>
<head>
<title>{book} - Campaign</title>
<style>
body {{
    background: black;
    color: white;
    font-family: Arial;
    padding: 40px;
}}
.chapter {{
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid #444;
    border-radius: 8px;
}}
</style>
</head>
<body>

<h1>{story['character']['name']}</h1>
<h3>Role: {story['character']['role']}</h3>
<p><strong>Starting Danger:</strong> {story['character']['danger_level']}</p>
<hr>
"""

    for chapter in story["progression"]:
        html += f"""
<div class="chapter">
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
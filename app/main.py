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
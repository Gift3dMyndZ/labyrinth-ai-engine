from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List
import json
import os

from .ml_engine import recommend_books_by_preferences

app = FastAPI(title="Stephen King Survival API")

# ✅ Absolute template path (Docker safe)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Load book dataset
with open(os.path.join(BASE_DIR, "stephen_king_library.json")) as f:
    BOOKS = json.load(f)


# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"message": "Stephen King Survival API running 🚀"}


# ---------------- DASHBOARD ----------------
@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})


# ---------------- REQUEST MODEL ----------------
class PreferenceRequest(BaseModel):
    preferences: List[str]


# ---------------- RECOMMENDATION ENDPOINT ----------------
@app.post("/recommend")
def recommend(data: PreferenceRequest):
    results = recommend_books_by_preferences(data.preferences)
    return results
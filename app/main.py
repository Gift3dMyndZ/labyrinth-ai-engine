"""
Labyrinth of Tartarus — Main Application
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from app.db.database import init_db
from app.routes import game, telemetry

app = FastAPI(title="Labyrinth of Tartarus")

BASE_DIR = Path(__file__).resolve().parent.parent


@app.on_event("startup")
def startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "alive", "engine": "tartarus"}


# ✅ SERVE GAME HOMEPAGE
@app.get("/")
def serve_index():
    return FileResponse(BASE_DIR / "static" / "index.html")


# ✅ API routes only
app.include_router(game.router)
app.include_router(telemetry.router)

# ✅ Static assets served raw, never templated
app.mount("/static", StaticFiles(directory="static"), name="static")
"""
Labyrinth of Tartarus — Main Application
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.db.database import init_db
from app.routes import game, telemetry

app = FastAPI(title="Labyrinth of Tartarus")


@app.on_event("startup")
def startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "alive", "engine": "tartarus"}


# ✅ API routes only
app.include_router(game.router)
app.include_router(telemetry.router)

# ✅ Static assets served raw, never templated
app.mount("/static", StaticFiles(directory="static"), name="static")
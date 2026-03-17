from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import initialize_db
from app.api.routes import recommend, telemetry, play

# ==================================================
# APP INITIALIZATION
# ==================================================

app = FastAPI(title="Labyrinth AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================================================
# STARTUP
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
# REGISTER ROUTERS
# ==================================================

app.include_router(recommend.router)
app.include_router(telemetry.router)
app.include_router(play.router)
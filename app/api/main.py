from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import initialize_db
from app.api.routes import recommend, telemetry, play

# ==================================================
# APP INITIALIZATION
# ==================================================

app = FastAPI(
    title="Labyrinth AI Engine",
    description="Adaptive AI horror survival predictor with telemetry-driven difficulty modeling.",
    version="1.0.0"
)

# ==================================================
# MIDDLEWARE
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================================================
# STARTUP EVENTS
# ==================================================

@app.on_event("startup")
def startup_event():
    """
    Initialize application resources on startup.
    """
    initialize_db()
    print("✅ Database initialized")
    print("🚀 Labyrinth AI Engine is running")

# ==================================================
# HEALTH CHECK
# ==================================================

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "running",
        "service": "Labyrinth AI Engine",
        "version": "1.0.0"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

# ==================================================
# ROUTER REGISTRATION
# ==================================================

app.include_router(recommend.router, prefix="/recommend", tags=["Recommendation"])
app.include_router(telemetry.router, prefix="/telemetry", tags=["Telemetry"])
app.include_router(play.router, prefix="/play", tags=["Gameplay"])

# ==================================================
# OPTIONAL: MODEL INFO (Phase 2 Ready)
# ==================================================

@app.get("/model-info", tags=["Model"])
def model_info():
    """
    Placeholder for returning model metadata.
    Will be fully implemented in Phase 2.
    """
    return {
        "model_status": "not_loaded",
        "note": "Model metadata endpoint will be implemented in Phase 2"
    }
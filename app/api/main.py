from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time

from app.db.database import initialize_db
from app.api.routes import recommend, telemetry, play

# Optional: preload recommender if available
try:
    from app.services.recommender import create_recommender
except ImportError:
    create_recommender = None


# ==================================================
# LOGGING CONFIGURATION
# ==================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("labyrinth-ai-engine")


# ==================================================
# APP INITIALIZATION
# ==================================================

app = FastAPI(
    title="Labyrinth AI Engine",
    description="Adaptive AI horror survival predictor with telemetry-driven difficulty modeling.",
    version="1.0.0"
)

app.state.start_time = time.time()
app.state.recommender = None


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
# GLOBAL ERROR HANDLER (NEW – SAFE ADDITION)
# ==================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc)
        }
    )


# ==================================================
# STARTUP EVENTS
# ==================================================

@app.on_event("startup")
def startup_event():
    initialize_db()
    logger.info("✅ Database initialized")

    # Optional recommender preload
    if create_recommender:
        try:
            app.state.recommender = create_recommender()
            logger.info("✅ Recommender engine loaded")
        except Exception as e:
            logger.warning(f"Recommender failed to load: {e}")

    logger.info("🚀 Labyrinth AI Engine is running")


# ==================================================
# HEALTH CHECK
# ==================================================

@app.get("/", tags=["Health"])
def root():
    uptime = round(time.time() - app.state.start_time, 2)
    return {
        "status": "running",
        "service": "Labyrinth AI Engine",
        "version": "1.0.0",
        "uptime_seconds": uptime
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "database": "initialized",
        "recommender_loaded": app.state.recommender is not None
    }


# ==================================================
# ROUTER REGISTRATION
# ==================================================

app.include_router(
    recommend.router,
    prefix="/recommend",
    tags=["Recommendation"]
)

app.include_router(
    telemetry.router,
    prefix="/telemetry",
    tags=["Telemetry"]
)

app.include_router(
    play.router,
    prefix="/play",
    tags=["Gameplay"]
)


# ==================================================
# MODEL INFO (Phase 2 Ready)
# ==================================================

@app.get("/model-info", tags=["Model"])
def model_info():
    return {
        "model_status": "not_loaded",
        "note": "Model metadata endpoint will be implemented in Phase 2",
        "recommender_initialized": app.state.recommender is not None
    }


# ==================================================
# SYSTEM INFO (NEW – NON-DESTRUCTIVE)
# ==================================================

@app.get("/system-info", tags=["Diagnostics"])
def system_info():
    return {
        "service": "Labyrinth AI Engine",
        "version": "1.0.0",
        "routers": ["recommend", "telemetry", "play"],
        "uptime_seconds": round(time.time() - app.state.start_time, 2)
    }
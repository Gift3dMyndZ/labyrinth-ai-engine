from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.services.player_clustering import PlayerClusteringService
from app.db.database import get_all_telemetry, initialize_db
from app.api.routes import recommend, telemetry, play

import logging
import time


# ==================================================
# CREATE APP
# ==================================================

app = FastAPI(
    title="Labyrinth AI Engine",
    description="Adaptive AI horror survival predictor with telemetry-driven difficulty modeling.",
    version="1.0.0"
)

app.state.start_time = time.time()
app.state.recommender = None
app.state.cluster_service = None


# ==================================================
# STATIC FILES + TEMPLATES
# ==================================================

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

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
# LOGGING
# ==================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("labyrinth-ai-engine")


# ==================================================
# STARTUP
# ==================================================

@app.on_event("startup")
def startup_event():
    initialize_db()
    logger.info("✅ Database initialized")

    app.state.cluster_service = PlayerClusteringService(n_clusters=3)

    try:
        telemetry_data = get_all_telemetry()
        if telemetry_data:
            trained = app.state.cluster_service.train(telemetry_data)
            logger.info(f"✅ Clustering trained: {trained}")
        else:
            logger.info("ℹ️ No telemetry data available.")
    except Exception as e:
        logger.warning(f"Clustering failed: {e}")

    logger.info("🚀 Labyrinth AI Engine running")


# ==================================================
# FRONTEND ROUTES
# ==================================================

@app.get("/", response_class=HTMLResponse)
def dashboard(request: Request):
    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "service": "Labyrinth AI Engine",
            "version": "1.0.0"
        }
    )


@app.get("/play", response_class=HTMLResponse)
def play_game(request: Request):
    return templates.TemplateResponse(
        "story.html",
        {"request": request}
    )


@app.get("/recommendations", response_class=HTMLResponse)
def recommendations_page(request: Request):
    return templates.TemplateResponse(
        "recommendations.html",
        {"request": request}
    )


# ==================================================
# API ROUTES
# ==================================================

@app.get("/api")
def api_status():
    return {
        "status": "running",
        "uptime_seconds": round(time.time() - app.state.start_time, 2)
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "clustering_initialized": app.state.cluster_service is not None
    }


# ==================================================
# CLUSTER ENDPOINT
# ==================================================

@app.post("/cluster-player")
def cluster_player(data: dict):

    if not app.state.cluster_service:
        return {"error": "Clustering not initialized"}

    cluster_id = app.state.cluster_service.predict(data)

    if cluster_id is None:
        return {"error": "Insufficient data"}

    return {
        "cluster_id": cluster_id,
        "player_type": map_cluster(cluster_id)
    }


def map_cluster(cluster_id):
    return {
        0: "Explorer",
        1: "Aggressor",
        2: "Survivor"
    }.get(cluster_id, "Unknown")


# ==================================================
# INCLUDE EXISTING API ROUTERS
# ==================================================

app.include_router(recommend.router, prefix="/recommend")
app.include_router(telemetry.router, prefix="/telemetry")
app.include_router(play.router, prefix="/game")


# ==================================================
# GLOBAL ERROR HANDLER
# ==================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )
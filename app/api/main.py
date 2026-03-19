import os
import time
import logging
import threading
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.services.player_clustering import PlayerClusteringService
from app.db.database import get_all_telemetry, initialize_db
from app.api.routes import recommend, telemetry


# ==================================================
# LOGGING
# ==================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("labyrinth-ai-engine")


# ==================================================
# BACKGROUND TRAINER
# ==================================================

def background_trainer(app: FastAPI):
    while True:
        time.sleep(5)

        cluster_service = app.state.cluster_service

        if cluster_service:
            try:
                cluster_service.train_from_buffer()
                cluster_service.save_model()
                logger.info("🔁 Background training cycle complete")
            except Exception as e:
                logger.warning(f"Background training error: {e}")


# ==================================================
# LIFESPAN (Modern FastAPI Startup/Shutdown)
# ==================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    # Startup logic
    logger.info("🚀 Starting Labyrinth AI Engine...")

    initialize_db()
    logger.info("✅ Database initialized")

    cluster_service = PlayerClusteringService(n_clusters=3)
    cluster_service.load_model()

    app.state.cluster_service = cluster_service
    app.state.start_time = time.time()

    try:
        telemetry_data = get_all_telemetry()

        if telemetry_data:
            logger.info("📊 Performing initial training from database...")
            cluster_service.train_from_buffer()
        else:
            logger.info("ℹ️ No historical telemetry found.")
    except Exception as e:
        logger.warning(f"Initial training skipped: {e}")

    trainer_thread = threading.Thread(
        target=background_trainer,
        args=(app,),
        daemon=True
    )
    trainer_thread.start()

    logger.info("✅ Background trainer started")
    logger.info("✅ Application startup complete")

    yield

    # Shutdown logic (optional)
    logger.info("🛑 Shutting down Labyrinth AI Engine...")


# ==================================================
# CREATE APP
# ==================================================

app = FastAPI(
    title="Labyrinth AI Engine",
    description="Adaptive ML-powered maze survival engine.",
    version="3.0.0",
    lifespan=lifespan
)


# ==================================================
# PATH CONFIG
# ==================================================

BASE_DIR = Path(__file__).resolve().parent

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")


# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# ROUTES
# ==================================================

@app.get("/", response_class=HTMLResponse)
def serve_game(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request}
    )


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


@app.post("/cluster-player")
def cluster_player(data: dict):

    cluster_service = app.state.cluster_service

    if not cluster_service:
        return {"error": "Clustering not initialized"}

    cluster_id = cluster_service.predict(data)

    if cluster_id is None:
        return {"error": "Model not trained yet"}

    return {
        "cluster_id": cluster_id,
        "player_type": {
            0: "Explorer",
            1: "Aggressor",
            2: "Survivor"
        }.get(cluster_id, "Unknown"),
        "model_confidence": getattr(cluster_service, "model_confidence", 0.0)
    }


# Include API routers
app.include_router(recommend.router)
app.include_router(telemetry.router)


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


# ==================================================
# RENDER ENTRYPOINT
# ==================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 10000))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
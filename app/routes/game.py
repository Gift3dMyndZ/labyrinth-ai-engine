from fastapi import APIRouter, Query

from app.db.database import (
    get_aggregate_stats,
    get_dashboard_summary,
    get_recent_runs,
    get_top_survivals,
)

router = APIRouter(prefix="/api/game", tags=["game"])


@router.get("/stats")
def game_stats():
    stats = get_aggregate_stats()
    return {"status": "ok", "data": stats}


@router.get("/leaderboard")
def leaderboard(
    limit: int = Query(default=10, ge=1, le=100),
):
    entries = get_top_survivals(limit)
    return {"status": "ok", "data": entries}


@router.get("/dashboard/summary")
def dashboard_summary():
    summary = get_dashboard_summary()
    return {"status": "ok", "data": summary}


@router.get("/dashboard/recent-runs")
def dashboard_recent_runs(
    limit: int = Query(default=20, ge=1, le=100),
):
    runs = get_recent_runs(limit)
    return {"status": "ok", "data": runs}

from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from pathlib import Path

# ==================================================
# TEMPLATE SETUP
# ==================================================

BASE_DIR = Path(__file__).resolve().parents[2]
TEMPLATES_DIR = BASE_DIR / "app" / "templates"

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

router = APIRouter()


# ==================================================
# PLAY MAZE GAME
# ==================================================

@router.get("/play", response_class=HTMLResponse)
def play_page(request: Request):
    """
    Renders the maze survival game.
    """

    return templates.TemplateResponse(
        "game.html",   # <-- your maze template
        {"request": request}
    )
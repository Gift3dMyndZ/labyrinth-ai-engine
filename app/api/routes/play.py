from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import os

from app.services.story_engine import get_character_story


# ==================================================
# TEMPLATE SETUP
# ==================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
TEMPLATES_DIR = os.path.join(BASE_DIR, "app", "templates")

templates = Jinja2Templates(directory=TEMPLATES_DIR)

router = APIRouter()


# ==================================================
# PLAY STORY MODE (Slug-Based)
# ==================================================

@router.get("/play/{book_slug}", response_class=HTMLResponse)
def play_page(request: Request, book_slug: str):
    """
    Expects URL-safe slug like:
    /play/haunted-maze
    """

    # Convert slug back to proper title
    book_name = book_slug.replace("-", " ").title()

    story = get_character_story(book_name)

    if not story:
        return HTMLResponse(
            "<h1 style='color:white;background:black;padding:40px;'>Story not found</h1>",
            status_code=404,
        )

    return templates.TemplateResponse(
        "story.html",
        {
            "request": request,
            "story": story
        },
    )
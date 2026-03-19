from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.services.recommender import create_recommender

router = APIRouter()

# Create once (better performance)
recommender = create_recommender()


class PreferenceRequest(BaseModel):
    preferences: List[str]


@router.post("/recommend")
def recommend_api(request: PreferenceRequest):
    return recommender.recommend(request.preferences)
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.services.recommender import create_recommender

router = APIRouter()


class PreferenceRequest(BaseModel):
    preferences: List[str]


@router.post("/recommend")
def recommend_api(request: PreferenceRequest):
    recommender = create_recommender()
    return recommender.recommend(request.preferences)
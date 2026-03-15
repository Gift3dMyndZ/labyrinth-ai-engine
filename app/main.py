from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Stephen King Survival Predictor API")


# -------- Root Endpoint --------
@app.get("/")
def root():
    return {"message": "Stephen King Survival API is running 🚀"}


# -------- Health Check --------
@app.get("/health")
def health_check():
    return {"status": "healthy"}


# -------- Request Model --------
class Character(BaseModel):
    bravery: float
    intelligence: float
    luck: float


# -------- Prediction Endpoint --------
@app.post("/predict")
def predict_survival(character: Character):
    score = (
        character.bravery * 0.4
        + character.intelligence * 0.4
        + character.luck * 0.2
    )

    survival_probability = min(score / 10, 1.0)

    return {
        "survival_probability": round(survival_probability, 2),
        "verdict": "Likely to survive"
        if survival_probability > 0.6
        else "Probably doomed"
    }
import numpy as np
from typing import Dict, List


def build_feature_vector(response: Dict) -> List[float]:
    """
    Converts raw questionnaire responses into a numerical feature vector.
    This function must be used in both training and inference.
    """

    # Example scoring logic — adjust to your actual schema

    emotional_intensity = np.mean([
        response.get("E1", 0),
        response.get("E2", 0),
        6 - response.get("E3", 0),
        response.get("E4", 0)
    ])

    cognitive_complexity = np.mean([
        response.get("C1", 0),
        response.get("C2", 0),
        6 - response.get("C3", 0),
        response.get("C4", 0)
    ])

    fantasy_score = np.mean([
        response.get("R2", 0),
        response.get("R4", 0)
    ])

    realism_score = np.mean([
        response.get("R1", 0),
        response.get("R3", 0)
    ])

    return [
        emotional_intensity,
        cognitive_complexity,
        fantasy_score,
        realism_score
    ]
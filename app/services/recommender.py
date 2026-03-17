import os
import json
import logging
from typing import List, Dict, Optional

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


logger = logging.getLogger(__name__)


# ==================================================
# REPOSITORY
# ==================================================

class LibraryRepository:
    """
    Responsible for loading and providing book data.
    """

    def __init__(self, data_dir: str):
        self.path = os.path.join(data_dir, "library.json")
        self.books = self._load()

    def _load(self) -> List[Dict]:
        if not os.path.exists(self.path):
            logger.warning(f"library.json not found at {self.path}")
            return []

        try:
            with open(self.path, "r") as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in library.json: {e}")
            return []

    def get_all(self) -> List[Dict]:
        return self.books


# ==================================================
# RECOMMENDER ENGINE
# ==================================================

class RecommenderEngine:
    """
    TF-IDF based recommender system.
    """

    def __init__(self, books: List[Dict]):
        if not books:
            raise ValueError("RecommenderEngine requires non-empty book dataset.")

        self.df = pd.DataFrame(books)

        if "themes" not in self.df.columns:
            raise ValueError("Expected 'themes' column in library.json")

        # Ensure themes are lists
        self.df["themes"] = self.df["themes"].apply(
            lambda x: x if isinstance(x, list) else []
        )

        self.df["combined_features"] = self.df["themes"].apply(
            lambda x: " ".join(x)
        )

        self.vectorizer = TfidfVectorizer(stop_words="english")

        try:
            self.tfidf_matrix = self.vectorizer.fit_transform(
                self.df["combined_features"]
            )
        except ValueError as e:
            raise ValueError(f"TF-IDF fitting failed: {e}")

    def recommend(
        self,
        preferences: List[str],
        top_k: int = 5
    ) -> List[Dict]:

        if not preferences:
            logger.warning("Empty preferences received. Returning empty list.")
            return []

        pref_text = " ".join(preferences)
        pref_vector = self.vectorizer.transform([pref_text])

        similarity = cosine_similarity(pref_vector, self.tfidf_matrix)
        scores = similarity.flatten()

        if len(scores) == 0:
            return []

        top_indices = scores.argsort()[-top_k:][::-1]

        return self.df.iloc[top_indices].to_dict(orient="records")


# ==================================================
# DIFFICULTY MODIFIER LOGIC (NEW)
# ==================================================

def compute_difficulty_modifier(features: Dict[str, float]) -> float:
    """
    Computes adaptive difficulty modifier.
    Range: 0.5 - 2.0
    """

    fear = float(features.get("fear_level", 5))
    aggression = float(features.get("aggression", 5))
    curiosity = float(features.get("curiosity", 5))

    # Basic behavioral scaling formula
    modifier = 1.0 + ((aggression + curiosity) - fear) * 0.05

    # Clamp range
    modifier = max(0.5, min(2.0, modifier))

    return round(modifier, 2)


# ==================================================
# FACTORY FUNCTION
# ==================================================

def create_recommender() -> Optional[RecommenderEngine]:
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    data_dir = os.path.join(base_dir, "data")

    try:
        repository = LibraryRepository(data_dir)
        books = repository.get_all()

        if not books:
            logger.warning("No books loaded. Recommender disabled.")
            return None

        return RecommenderEngine(books)

    except Exception as e:
        logger.error(f"Failed to create recommender: {e}")
        return None
import os
import json
import pandas as pd
from typing import List, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


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
            raise FileNotFoundError(f"Missing library.json at {self.path}")
        with open(self.path, "r") as f:
            return json.load(f)

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
        self.df = pd.DataFrame(books)

        if "themes" not in self.df.columns:
            raise ValueError("Expected 'themes' column in library.json")

        self.df["combined_features"] = self.df["themes"].apply(
            lambda x: " ".join(x)
        )

        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.tfidf_matrix = self.vectorizer.fit_transform(
            self.df["combined_features"]
        )

    def recommend(self, preferences: List[str], top_k: int = 5) -> List[Dict]:
        pref_text = " ".join(preferences)
        pref_vector = self.vectorizer.transform([pref_text])

        similarity = cosine_similarity(pref_vector, self.tfidf_matrix)
        top_indices = similarity.flatten().argsort()[-top_k:][::-1]

        return self.df.iloc[top_indices].to_dict(orient="records")


# ==================================================
# FACTORY FUNCTION
# ==================================================

def create_recommender() -> RecommenderEngine:
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    data_dir = os.path.join(base_dir, "data")

    repository = LibraryRepository(data_dir)
    return RecommenderEngine(repository.get_all())
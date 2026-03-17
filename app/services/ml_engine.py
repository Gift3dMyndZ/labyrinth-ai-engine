import json
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load books
with open("app/library.json") as f:
    books = json.load(f)

df = pd.DataFrame(books)

df["combined_features"] = df["themes"].apply(lambda x: " ".join(x))

vectorizer = TfidfVectorizer(stop_words="english")
tfidf_matrix = vectorizer.fit_transform(df["combined_features"])


def recommend_books_by_preferences(preferences):
    pref_text = " ".join(preferences)
    pref_vector = vectorizer.transform([pref_text])

    similarity = cosine_similarity(pref_vector, tfidf_matrix)
    top_indices = similarity.flatten().argsort()[-5:][::-1]

    return df.iloc[top_indices].to_dict(orient="records")
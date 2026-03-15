import requests
import json
import time

BASE_URL = "https://openlibrary.org/search.json"

def fetch_stephen_king_books():
    params = {
        "author": "Stephen King",
        "limit": 200
    }

    response = requests.get(BASE_URL, params=params)
    data = response.json()

    books = []

    for doc in data["docs"]:
        if "first_publish_year" not in doc:
            continue

        book = {
            "title": doc.get("title"),
            "first_publish_year": doc.get("first_publish_year"),
            "subjects": doc.get("subject", [])[:15],
            "edition_count": doc.get("edition_count"),
            "cover_id": doc.get("cover_i"),
            "openlibrary_key": doc.get("key")
        }

        books.append(book)

    return books


def classify_book(book):
    subjects = [s.lower() for s in book["subjects"]]

    return {
        "title": book["title"],
        "year": book["first_publish_year"],
        "themes": subjects[:5],
        "is_supernatural": any("supernatural" in s for s in subjects),
        "is_psychological": any("psychological" in s for s in subjects),
        "is_apocalyptic": any("apocalypse" in s for s in subjects),
        "is_small_town": any("small town" in s for s in subjects),
        "cover_id": book["cover_id"]
    }


if __name__ == "__main__":
    books = fetch_stephen_king_books()
    processed_books = [classify_book(b) for b in books]

    with open("app/stephen_king_library.json", "w") as f:
        json.dump(processed_books, f, indent=2)

    print(f"Saved {len(processed_books)} books.")
import json
import os
from pathlib import Path
from datetime import datetime

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    accuracy_score
)
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from app.services.features import generate_features


# ==================================================
# PATH CONFIGURATION
# ==================================================

RAW_DATA_PATH = Path("data/raw/telemetry_log.csv")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)

MODEL_PATH = MODEL_DIR / "model_v1.pkl"
METADATA_PATH = MODEL_DIR / "metadata_v1.json"


# ==================================================
# LOAD DATA
# ==================================================

def load_dataset():
    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(
            "No telemetry data found. Run the app and generate telemetry first."
        )

    df = pd.read_csv(RAW_DATA_PATH)

    if df.empty:
        raise ValueError("Telemetry dataset is empty.")

    df = generate_features(df)
    df = df.dropna()

    return df


# ==================================================
# TRAINING PIPELINE
# ==================================================

def train():
    print("📊 Loading dataset...")
    df = load_dataset()

    # Drop non-feature columns
    feature_columns = [
        col for col in df.columns
        if col not in ["timestamp", "outcome", "outcome_binary"]
    ]

    X = df[feature_columns]
    y = df["outcome_binary"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y if len(y.unique()) > 1 else None
    )

    # ==================================================
    # DEFINE MODELS
    # ==================================================

    models = {
        "logistic_regression": LogisticRegression(max_iter=1000),
        "random_forest": RandomForestClassifier(
            n_estimators=200,
            random_state=42
        )
    }

    results = {}

    print("🚀 Training models...")

    for name, model in models.items():
        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        probs = model.predict_proba(X_test)[:, 1]

        accuracy = accuracy_score(y_test, preds)
        roc_auc = roc_auc_score(y_test, probs)

        results[name] = {
            "accuracy": accuracy,
            "roc_auc": roc_auc
        }

        print(f"\n🔎 {name} Evaluation:")
        print(classification_report(y_test, preds))

    # ==================================================
    # SELECT BEST MODEL
    # ==================================================

    best_model_name = max(results, key=lambda x: results[x]["roc_auc"])
    best_model = models[best_model_name]

    print(f"\n🏆 Best Model: {best_model_name}")

    # ==================================================
    # SAVE MODEL
    # ==================================================

    joblib.dump(best_model, MODEL_PATH)

    metadata = {
        "model_type": best_model_name,
        "training_date": datetime.utcnow().isoformat(),
        "features_used": feature_columns,
        "metrics": results[best_model_name],
        "dataset_size": len(df)
    }

    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=4)

    print(f"\n✅ Model saved to {MODEL_PATH}")
    print(f"✅ Metadata saved to {METADATA_PATH}")


# ==================================================
# ENTRY POINT
# ==================================================

if __name__ == "__main__":
    train()
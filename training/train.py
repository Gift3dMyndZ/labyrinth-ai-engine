import os
import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

from app.features import build_feature_vector


# ---------------------------------------------------
# 1. Create synthetic raw questionnaire-style dataset
# ---------------------------------------------------

raw_data = [
    {"E1": 4, "E2": 5, "E3": 2, "E4": 4, "C1": 3, "C2": 4, "C3": 2, "C4": 5, "R1": 3, "R2": 4, "R3": 2, "R4": 5, "label": 1},
    {"E1": 2, "E2": 3, "E3": 4, "E4": 2, "C1": 5, "C2": 4, "C3": 3, "C4": 4, "R1": 5, "R2": 2, "R3": 4, "R4": 1, "label": 0},
    {"E1": 5, "E2": 5, "E3": 1, "E4": 4, "C1": 2, "C2": 3, "C3": 4, "C4": 3, "R1": 2, "R2": 5, "R3": 1, "R4": 4, "label": 1},
    {"E1": 1, "E2": 2, "E3": 5, "E4": 1, "C1": 4, "C2": 5, "C3": 2, "C4": 4, "R1": 4, "R2": 1, "R3": 5, "R4": 2, "label": 0}
]

# ---------------------------------------------------
# 2. Convert raw responses into feature vectors
# ---------------------------------------------------

X = []
y = []

for row in raw_data:
    features = build_feature_vector(row)
    X.append(features)
    y.append(row["label"])

# ---------------------------------------------------
# 3. Train model
# ---------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

model = LogisticRegression()
model.fit(X_train, y_train)

# ---------------------------------------------------
# 4. Evaluate
# ---------------------------------------------------

predictions = model.predict(X_test)
print("\nModel Evaluation:")
print(classification_report(y_test, predictions))

# ---------------------------------------------------
# 5. Save model
# ---------------------------------------------------

os.makedirs("models", exist_ok=True)
joblib.dump(model, "models/model_v1.pkl")

print("\n✅ Model saved to models/model_v1.pkl")
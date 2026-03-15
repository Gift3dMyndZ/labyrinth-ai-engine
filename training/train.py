import os
import pandas as pd
from sklearn.linear_model import LogisticRegression
import joblib

# Create synthetic dataset
data = pd.DataFrame({
    "bravery": [1, 3, 5, 7, 9, 2, 6, 8, 4, 10],
    "intelligence": [2, 4, 6, 8, 10, 3, 7, 9, 5, 1],
    "luck": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "survived": [0, 0, 0, 1, 1, 0, 1, 1, 0, 1]
})

X = data[["bravery", "intelligence", "luck"]]
y = data["survived"]

# Train model
model = LogisticRegression()
model.fit(X, y)

# Create models folder if it doesn't exist
os.makedirs("models", exist_ok=True)

# Save model
joblib.dump(model, "models/model.pkl")

print("✅ Model trained and saved to models/model.pkl")
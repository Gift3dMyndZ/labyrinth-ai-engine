import numpy as np
import joblib
import threading
import time
from sklearn.cluster import MiniBatchKMeans
from sklearn.preprocessing import StandardScaler


class PlayerClusteringService:

    def __init__(self, n_clusters=3, buffer_size=100):

        self.n_clusters = n_clusters
        self.model = MiniBatchKMeans(
            n_clusters=n_clusters,
            batch_size=32,
            random_state=42
        )

        self.scaler = StandardScaler()

        self.is_trained = False
        self.replay_buffer = []
        self.buffer_size = buffer_size

        self.last_centroids = None
        self.model_confidence = 0.0
        self.lock = threading.Lock()

    # ==================================================
    # FEATURE EXTRACTION
    # ==================================================

    def _extract_features(self, telemetry_list):

        features = []

        for t in telemetry_list:
            features.append([
                t.get("fear_level", 0),
                t.get("aggression", 0),
                t.get("curiosity", 0),
                t.get("survival_time", 0)
            ])

        return np.array(features)

    # ==================================================
    # ADD TO REPLAY BUFFER
    # ==================================================

    def add_experience(self, telemetry):

        self.replay_buffer.append(telemetry)

        if len(self.replay_buffer) > self.buffer_size:
            self.replay_buffer.pop(0)

    # ==================================================
    # BACKGROUND TRAINING STEP
    # ==================================================

    def train_from_buffer(self):

        if len(self.replay_buffer) < 10:
            return

        with self.lock:

            X = self._extract_features(self.replay_buffer)

            if not self.is_trained:
                self.scaler.fit(X)
                X_scaled = self.scaler.transform(X)
                self.model.partial_fit(X_scaled)
                self.is_trained = True
            else:
                X_scaled = self.scaler.transform(X)
                self.model.partial_fit(X_scaled)

            self._update_drift(X_scaled)
            self._update_confidence(X_scaled)

    # ==================================================
    # DRIFT DETECTION
    # ==================================================

    def _update_drift(self, X_scaled):

        current_centroids = self.model.cluster_centers_

        if self.last_centroids is not None:
            drift = np.linalg.norm(current_centroids - self.last_centroids)

            if drift > 1.5:
                print(f"⚠️ Drift detected: {drift:.3f}")

        self.last_centroids = current_centroids.copy()

    # ==================================================
    # CONFIDENCE SCORING
    # ==================================================

    def _update_confidence(self, X_scaled):

        distances = self.model.transform(X_scaled)
        avg_distance = np.mean(np.min(distances, axis=1))

        self.model_confidence = max(0.0, 1.0 - avg_distance)

    # ==================================================
    # PREDICT
    # ==================================================

    def predict(self, telemetry):

        if not self.is_trained:
            return None

        X = self._extract_features([telemetry])
        X_scaled = self.scaler.transform(X)

        return int(self.model.predict(X_scaled)[0])

    # ==================================================
    # SAVE MODEL
    # ==================================================

    def save_model(self):
        joblib.dump({
            "model": self.model,
            "scaler": self.scaler
        }, "model.pkl")

    def load_model(self):
        try:
            data = joblib.load("model.pkl")
            self.model = data["model"]
            self.scaler = data["scaler"]
            self.is_trained = True
        except:
            pass
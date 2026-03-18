import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score


class PlayerClusteringService:

    def __init__(self, n_clusters=3):
        self.n_clusters = n_clusters
        self.model = KMeans(n_clusters=n_clusters, random_state=42)
        self.scaler = StandardScaler()
        self.trained = False

    def train(self, telemetry_records):

        if len(telemetry_records) < self.n_clusters:
            return False

        X = np.array([
            [
                t["fear_level"],
                t["aggression"],
                t["curiosity"],
                t["survival_time"]
            ]
            for t in telemetry_records
        ])

        X = self.scaler.fit_transform(X)

        self.model.fit(X)
        self.trained = True

        score = silhouette_score(X, self.model.labels_)
        print("✅ Silhouette Score:", score)

        return True

    def predict(self, telemetry_dict):

        if not self.trained:
            return None

        X = np.array([[
            telemetry_dict["fear_level"],
            telemetry_dict["aggression"],
            telemetry_dict["curiosity"],
            telemetry_dict["survival_time"]
        ]])

        X = self.scaler.transform(X)

        return int(self.model.predict(X)[0])
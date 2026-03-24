"""
Cluster Service — AI Learning Engine

Uses K-Means clustering on player behavior telemetry
to classify player archetypes and adapt monster behavior.

This is the "LLM-informed" layer: the behavioral clusters
represent learned player strategies that the monster uses
to predict and counter the player.
"""

import numpy as np
from collections import deque
from sklearn.cluster import KMeans


# ==================================================
# PLAYER ARCHETYPES (discovered by clustering)
# ==================================================
# The monster learns these from accumulated telemetry:
#
#   ARCHETYPE 0 — "The Coward"    → high fear, low aggression
#   ARCHETYPE 1 — "The Hunter"    → low fear, high aggression
#   ARCHETYPE 2 — "The Explorer"  → high curiosity, moderate fear
#   ARCHETYPE 3 — "The Survivor"  → balanced stats, long survival
#
# The system doesn't hardcode these — K-Means discovers
# whatever natural clusters exist in real player data.
# ==================================================


class ClusterService:
    """
    Maintains an in-memory replay buffer of player behavior
    and periodically clusters it to find dominant strategies.
    """

    def __init__(self, buffer_size=2000, n_clusters=4, recluster_every=50):
        self.buffer = deque(maxlen=buffer_size)
        self.n_clusters = n_clusters
        self.recluster_every = recluster_every
        self.insert_count = 0

        # Current cluster centroids (None until first clustering)
        self.centroids = None
        self.model = None

        # Adaptive difficulty recommendations per cluster
        self.cluster_difficulty = {}

    def add_experience(self, data: dict):
        """Add a telemetry snapshot to the replay buffer."""
        entry = {
            "fear":       data.get("fear_level", 0),
            "aggression": data.get("aggression", 0),
            "curiosity":  data.get("curiosity", 0),
            "survival":   data.get("survival_time", 0),
            "outcome":    data.get("outcome", "ongoing"),
            "difficulty":  data.get("difficulty_modifier", 1.0),
        }
        self.buffer.append(entry)
        self.insert_count += 1

        # Auto recluster
        if self.insert_count % self.recluster_every == 0 and len(self.buffer) >= 30:
            self._recluster()

    def _recluster(self):
        """Run K-Means on the replay buffer."""
        try:
            X = np.array([
                [e["fear"], e["aggression"], e["curiosity"]]
                for e in self.buffer
            ])

            k = min(self.n_clusters, len(X))
            if k < 2:
                return

            self.model = KMeans(n_clusters=k, n_init=10, random_state=42)
            labels = self.model.fit_predict(X)
            self.centroids = self.model.cluster_centers_

            # Compute per-cluster difficulty recommendations
            for ci in range(k):
                mask = labels == ci
                if not np.any(mask):
                    continue

                cluster_entries = [e for e, l in zip(self.buffer, labels) if l == ci]

                avg_survival = np.mean([e["survival"] for e in cluster_entries])
                escape_rate = sum(1 for e in cluster_entries if e["outcome"] == "escaped") / max(1, len(cluster_entries))

                # Higher difficulty if players in this cluster survive long or escape often
                rec = 1.0 + (avg_survival / 120) + (escape_rate * 0.5)
                self.cluster_difficulty[ci] = round(min(3.0, rec), 2)

            print(f"[CLUSTER] Reclustered {len(X)} entries → {k} clusters")
            print(f"[CLUSTER] Centroids: {self.centroids}")
            print(f"[CLUSTER] Difficulty recs: {self.cluster_difficulty}")

        except Exception as e:
            print(f"[CLUSTER] Error: {e}")

    def classify_player(self, fear: float, aggression: float, curiosity: float) -> dict:
        """
        Classify a player's current behavior into a cluster
        and return recommended difficulty modifier.
        """
        if self.model is None or self.centroids is None:
            return {
                "cluster": -1,
                "difficulty_modifier": 1.0,
                "archetype": "unknown",
            }

        X = np.array([[fear, aggression, curiosity]])
        cluster_id = int(self.model.predict(X)[0])
        centroid = self.centroids[cluster_id]

        # Name the archetype based on dominant trait
        traits = {"fear": centroid[0], "aggression": centroid[1], "curiosity": centroid[2]}
        dominant = max(traits, key=traits.get)
        archetype_names = {
            "fear": "coward",
            "aggression": "hunter",
            "curiosity": "explorer",
        }
        archetype = archetype_names.get(dominant, "survivor")

        return {
            "cluster": cluster_id,
            "difficulty_modifier": self.cluster_difficulty.get(cluster_id, 1.0),
            "archetype": archetype,
            "centroid": centroid.tolist(),
        }

    def get_stats(self) -> dict:
        """Return current clustering stats."""
        return {
            "buffer_size": len(self.buffer),
            "total_processed": self.insert_count,
            "n_clusters": self.n_clusters if self.centroids is not None else 0,
            "centroids": self.centroids.tolist() if self.centroids is not None else [],
            "difficulty_map": self.cluster_difficulty,
        }
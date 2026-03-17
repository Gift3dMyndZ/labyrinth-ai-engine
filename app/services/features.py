import pandas as pd


def generate_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Core engineered features
    df["aggression_ratio"] = df["aggression"] / (df["fear_level"] + 1)
    df["efficiency_score"] = df["survival_time"] / (df["fear_level"] + 1)

    df["engagement_score"] = (
        df["curiosity"] * 0.5 + df["aggression"] * 0.3
    )

    # Convert outcome to binary target
    df["outcome_binary"] = df["outcome"].map({
        "win": 1,
        "loss": 0
    })

    return df
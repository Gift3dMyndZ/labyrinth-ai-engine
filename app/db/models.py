from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    fear_level = Column(Float)
    aggression = Column(Float)
    curiosity = Column(Float)
    survival_time = Column(Float)
    difficulty_modifier = Column(Float)
    outcome = Column(String)
# Labyrinth AI Engine

Adaptive, browser-based retro simulation engine with real-time telemetry and dynamic difficulty modeling.

---

## Overview

Labyrinth AI Engine is a modular first-person simulation environment that dynamically adjusts difficulty based on live player telemetry.

The system demonstrates:

- Real-time telemetry ingestion
- Adaptive difficulty modeling
- AI-driven parameter tuning
- Full-stack architecture (FastAPI + JavaScript engine)
- Dockerized cloud deployment

This project bridges interactive systems design and machine learning experimentation.

## Architecture

Frontend:
- JavaScript raycasting renderer
- Hedge-style maze visuals
- Monster movement logic
- Telemetry collector

Backend:
- FastAPI REST APIs
- Telemetry ingestion endpoint
- Adaptive difficulty computation
- ML integration hooks

Infrastructure:
- Dockerized deployment
- GitHub integration
- Cloud-ready configuration
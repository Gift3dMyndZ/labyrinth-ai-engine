# Labyrinth AI Engine

![Python](https://pfst.cf2.poecdn.net/base/image/6bed85cf801e45ecdf79bc667de74136c14bdcce673eec1ae57dedad575a3a6d?pmaid=586653153)
![FastAPI](https://pfst.cf2.poecdn.net/base/image/3e6659a8a421f5cb805567db450f3617c21b02fc62e3c268e7a86d6e8e33a4cc?pmaid=586653151)
![Docker](https://pfst.cf2.poecdn.net/base/image/4e93e772f179f77bf00d0a37fb67ffd7969fb109775bd0f56c963ee6ecdb55c0?pmaid=586653152)
![License](https://pfst.cf2.poecdn.net/base/image/2c89badab92b5ee0afea1a6328677fab597eaa5d90b21f6a29384f9eaac3cbc0?pmaid=586653154)

Adaptive, browser-based retro simulation engine built with FastAPI.
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
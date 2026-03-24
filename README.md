# 🔥 LABYRINTH OF TARTARUS 🔥

### ΤΑΡΤΑΡΟΣ — Adaptive Raycasting AI Simulation Engine

![Python 3.9+](https://img.shields.io/badge/Python-3.9+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-API-green?logo=fastapi)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightblue)
![License MIT](https://img.shields.io/badge/License-MIT-green)
![AI Powered](https://img.shields.io/badge/AI-Powered-red)

---

> *Descend into the labyrinth. The walls remember. The Minotaur adapts.*

A browser-based 3D raycasting survival horror engine with a full-stack
machine learning backend that dynamically adapts difficulty based on
real-time behavioral telemetry.

Built entirely from scratch — no game engine, no 3D library, no shortcuts.

**A first-person procedural maze crawler with adaptive AI, built in pure JavaScript + Python.**

The labyrinth watches. It learns. It adapts.

<img width="1757" height="1261" alt="Labyrinth" src="https://github.com/user-attachments/assets/4c295120-33cb-4198-a0b2-570a9c89efbd" />


## 🎮 Live Demo

### 🔥 [Play Labyrinth of Tartarus](https://labyrinth-ai-engine-1.onrender.com) 🔥🔥

> Free tier — first load may take ~30s to wake up.

---

## 🏛️ What Is This?

You are trapped in the **Labyrinth of Tartarus** — a procedurally generated
3D maze inspired by Greek mythology. A creature stalks the corridors.
It learns from your behavior. Every run is different.

**This is not a game built with Unity or Unreal.**

Every pixel is calculated from raw math:
- Raycasting angles computed per screen column
- Wall distances projected into perspective
- Floor textures rendered with device-pixel optimization
- Monster AI driven by steering behaviors

The backend tracks your fear, aggression, and curiosity in real time,
clustering player behavior to adapt the difficulty curve.

---

## ⚡ Core Features

### 🎯 Raycasting Engine (Pure JavaScript)
- Wolfenstein-style 3D renderer — zero external libraries
- Real-time distance shading with brightness/gamma controls
- CRT scanline post-processing aesthetic
- DPR-aware canvas scaling for retina displays
- Textured floor rendering via ImageData pixel manipulation

### 🧠 AI Monster System
- Steering-based pursuit with wall avoidance
- State machine: `PATROLLING` → `CHASING` → `HUNTING`
- Behavioral adaptation based on player telemetry
- Difficulty multiplier scales per ring descent

### 🗺️ Procedural Generation
- Recursive backtracking maze algorithm
- Guaranteed solvable paths to exit
- Progressive ring system — deeper = harder
- Dynamic maze size scaling

### 📊 ML Backend (FastAPI + SQLite)
- Real-time telemetry ingestion
- Player behavior clustering (K-Means)
- Difficulty recommendation engine
- Session replay buffer for training
- Leaderboard with score calculations

### 🎨 Visual Design
- Hellfire orange color palette
- CRT monitor aesthetic with scanlines
- Glowing text and UI elements
- Minimap with real-time tracking
- Boot screen with Greek typography

--


##  🎮 Controls

### 🕹️ W / S – Move forward / backward

### 🕹️ A / D – Turn left / right

### 👾 ENTER – Start game

##  🖱️ Click – Restart after defeat



### 🧠 System Overview

```
LABYRINTH is structured as a full-stack ML simulation platform.
labyrinth-ai-engine/
├── app/
│ ├── init.py
│ ├── main.py # FastAPI application entry
│ ├── config.py # Environment configuration
│ ├── db/
│ │ ├── init.py
│ │ └── database.py # Raw SQLite — no ORM overhead
│ ├── routes/
│ │ ├── init.py
│ │ ├── game.py # Stats & leaderboard endpoints
│ │ └── telemetry.py # Telemetry ingestion API
│ └── services/
│ ├── init.py
│ ├── features.py # Feature extraction pipeline
│ ├── player_clustering.py # K-Means behavioral clustering
│ ├── recommender.py # Difficulty adaptation engine
│ ├── story_engine.py # Narrative event system
│ ├── telemetry_logger.py
│ └── telemetry_service.py
├── static/
│ ├── index.html # Game shell
│ ├── style.css # CRT aesthetic
│ └── game.js # Entire 3D engine (~2000 lines)
├── tests/
│ └── init.py
├── requirements.txt
├── Dockerfile
├── .gitignore
├── LICENSE
└── README.md
```
Browser → Telemetry → FastAPI → ML Engine → Adaptive Output → Story Engine

## 🏗 System Architecture
```
┌─────────────────────────────────┐
│ Browser Client │
│ 3D Raycasting + Telemetry TX │
└───────────────┬─────────────────┘
│
▼
┌─────────────────────────────────┐
│ FastAPI Backend │
│ /health /telemetry /game │
└───────────────┬─────────────────┘
│
┌────────────┼────────────┐
▼ ▼ ▼
┌──────────┐ ┌───────────┐ ┌─────────────┐
│ ML Engine│ │ Story │ │ Leaderboard │
│ K-Means │ │ Engine │ │ Analytics │
│ Clusters │ │ Narrative │ │ Rankings │
└─────┬────┘ └─────┬─────┘ └──────┬──────┘
│ │ │
▼ ▼ ▼
┌─────────────────────────────────────────┐
│ SQLite (WAL Mode) │
│ telemetry │ replay_buffer │ leaderboard│
└───────────────────┬─────────────────────┘
│
▼
┌─────────────────────────────────────────┐
│ Adaptive Difficulty Engine │
│ │
│ Player Telemetry → Feature Extraction │
│ → Behavioral Clustering → Archetype │
│ → Difficulty Modifier → Game Engine │
│ │
│ 🏃 Runners → Faster monster │
│ ⚔️ Fighters → Larger mazes │
│ 🔍 Explorers → Complex layouts │
└─────────────────────────────────────────┘
```
### 📡 API Endpoints
```
Method	Endpoint	Description
GET	/health	Service health check
GET	/api/game/stats	Aggregate gameplay statistics
GET	/api/game/leaderboard	Top survival scores
POST	/api/telemetry/log	Ingest telemetry data
GET	/api/telemetry/history/{session_id}	Session telemetry history
```
### 🧠 How the ML Pipeline Works
```
Player Actions
     ↓
Telemetry Logger → SQLite (fear, aggression, curiosity)
     ↓
Feature Extraction → Behavioral vectors
     ↓
K-Means Clustering → Player archetype identification
     ↓
Recommender Engine → Difficulty modifier (0.5x – 3.0x)
     ↓
Game Engine ← Adapted monster speed, maze size, spawn rates
```
## Player Archetypes:

🏃 Runners — High fear, low aggression → Faster monster
⚔️ Fighters — High aggression, low fear → Larger mazes
🔍 Explorers — High curiosity → More complex layouts

## 📊 Database Schema
```
sql
telemetry    — Per-tick behavioral snapshots
leaderboard  — Top scores with difficulty weighting
replay_buffer — Training data for clustering pipeline
```
### All queries are raw SQL. No ORM. Zero abstraction overhead.

## 🔥 Technical Highlights
Custom raycasting — Every 3D frame calculated from trigonometry
No game engine — Pure <canvas> 2D context, no WebGL
Sub-16ms frame budget — Smooth 60fps rendering
Thread-local SQLite — Safe concurrent access with WAL
Steering AI — Monster uses velocity-based pursuit, not pathfinding
CRT shader — Pure CSS scanline + vignette post-processing

## 🛣️ Roadmap
 Multi-floor descent with progressive difficulty
 Sound engine — procedural audio cues
 WebSocket real-time telemetry streaming
 LLM-driven narrative events
 Multiplayer spectator mode
 Mobile touch controls

## 📜 License
MIT License — see LICENSE


# 👤 Author

## Developed by - Joshua Wolfe

Built from scratch as a full-stack AI engineering portfolio project.

No Unity. No Unreal. No Three.js. Just math and madness. 🔥

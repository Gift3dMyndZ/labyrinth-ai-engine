<div align="center">

# 🔥 LABYRINTH OF TARTARUS 🔥

### ΤΑΡΤΑΡΟΣ — Adaptive Raycasting AI Simulation Engine

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-red?style=for-the-badge)](LICENSE)
[![AI Powered](https://img.shields.io/badge/🧠_AI-Powered-FF4500?style=for-the-badge)](#-the-oracle--adaptive-ai-engine)

---

*"τὸ λαβύρινθον τοῦ Ταρτάρου — Where Mortals Are Tested by Machine"*

A first-person raycasting dungeon crawler powered by an adaptive AI engine that learns how you play, dynamically reshaping the labyrinth, enemy behavior, and difficulty in real time.

</div>

---


**A first-person procedural maze crawler with adaptive AI, built in pure JavaScript + Python.**

The labyrinth watches. It learns. It adapts.

<img width="1757" height="1261" alt="Labyrinth" src="https://github.com/user-attachments/assets/4c295120-33cb-4198-a0b2-570a9c89efbd" />


## 🎮 Live Demo

### 🔥 [Play Labyrinth of Tartarus](https://labyrinth-ai-engine-1.onrender.com) 🔥🔥

> Free tier — first load may take ~30s to wake up.

---


## 🏛 Overview

**Labyrinth of Tartarus** is a browser-based, first-person dungeon crawler that uses raycasting rendering inspired by classic titles like Wolfenstein 3D, combined with a modern adaptive AI backend. The game places players in a procedurally generated labyrinth modeled after the mythological Tartarus — the deepest abyss of the Greek underworld.

What sets this project apart is **The Oracle**, an AI simulation engine that observes player behavior in real time and continuously adapts the game world. Walls shift, enemies evolve, traps relocate, and the difficulty curve reshapes itself based on how you move, fight, and explore.

---

## ✨ Features

### 🎮 Core Gameplay
- **First-person raycasting engine** rendered entirely in the browser using HTML5 Canvas
- **Procedurally generated labyrinths** with configurable size, complexity, and theme
- **Real-time combat system** with melee and ranged mechanics
- **Inventory and resource management** — torches, health potions, keys, and ancient relics
- **Multiple dungeon floors** with increasing depth and danger

### 🧠 Adaptive AI
- **Behavioral profiling** — the engine tracks movement patterns, combat tendencies, exploration habits, and decision-making speed
- **Dynamic difficulty adjustment (DDA)** that goes beyond simple scaling — the world itself changes
- **Enemy evolution** — creatures adapt tactics based on how you've defeated them before
- **Procedural trap placement** guided by player path prediction
- **Loot balancing** — resource scarcity and reward placement respond to player performance

### 🏗 Technical
- **Modular Python backend** powered by FastAPI with WebSocket support for real-time communication
- **SQLite persistence layer** for player profiles, session history, and AI model state
- **RESTful API** for game state management, leaderboards, and configuration
- **Lightweight frontend** with zero external framework dependencies — pure vanilla JavaScript
- **Sub-50ms server response times** for seamless real-time gameplay

---

## 🧿 The Oracle — Adaptive AI Engine

The Oracle is the heart of the Labyrinth of Tartarus. It is a multi-layered AI system that sits between the game world and the player, continuously observing and reacting.

### How It Works

**Layer 1 — Observation**
Every player action is captured as a timestamped event: movement direction, time between inputs, combat choices, items used, rooms explored vs. ignored, and even hesitation patterns. These events are streamed to the backend over WebSocket.

**Layer 2 — Profiling**
The engine maintains a rolling behavioral profile for each player session. Profiles are categorized along several axes: aggression (rusher vs. cautious), exploration (completionist vs. speedrunner), resource usage (hoarder vs. spender), and adaptability (pattern-follower vs. improviser).

**Layer 3 — World Mutation**
Based on the active profile, The Oracle issues world mutation commands. These can include: sealing previously open corridors, spawning enemies with counter-tactics, adjusting lighting and visibility, relocating key items, and introducing environmental hazards along predicted paths.

**Layer 4 — Feedback Loop**
After each mutation, the engine measures the player's response. Did they panic? Adapt? Backtrack? This feedback refines the profile and informs the next cycle of mutations. The result is a living dungeon that feels personally adversarial.

### Difficulty Philosophy

The Oracle does not aim to make the game harder or easier. It aims to keep the player in a **flow state** — the psychological zone between boredom and frustration where engagement is highest. If you're breezing through, the labyrinth will tighten. If you're struggling, it may offer a hidden passage or a well-timed health drop — but never obviously enough to feel artificial.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER CLIENT                    │
│                                                     │
│  ┌─────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Raycaster   │  │  Input   │  │  UI Overlay   │  │
│  │  Renderer    │  │  Handler │  │  (HUD/Menu)   │  │
│  └──────┬──────┘  └────┬─────┘  └───────┬───────┘  │
│         │              │                │           │
│         └──────────────┼────────────────┘           │
│                        │                            │
│                   WebSocket                         │
└────────────────────────┼────────────────────────────┘
                         │
                         ▼
┌────────────────────────┼────────────────────────────┐
│                  FASTAPI SERVER                      │
│                        │                            │
│  ┌─────────────────────▼─────────────────────────┐  │
│  │              Game State Manager                │  │
│  └──┬──────────────┬────────────────┬────────────┘  │
│     │              │                │               │
│     ▼              ▼                ▼               │
│  ┌──────┐   ┌───────────┐   ┌────────────────┐     │
│  │ Map  │   │  Combat   │   │   The Oracle   │     │
│  │ Gen  │   │  Engine   │   │   (AI Engine)  │     │
│  └──┬───┘   └─────┬─────┘   └───────┬────────┘     │
│     │             │                  │              │
│     └─────────────┼──────────────────┘              │
│                   │                                 │
│                   ▼                                 │
│           ┌──────────────┐                          │
│           │    SQLite    │                          │
│           │   Database   │                          │
│           └──────────────┘                          │
└─────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | HTML5 Canvas, Vanilla JavaScript    |
| Backend     | Python 3.9+, FastAPI, Uvicorn       |
| AI Engine   | Custom Python (NumPy, SciPy)        |
| Database    | SQLite with aiosqlite               |
| Transport   | WebSocket (real-time), REST (config) |
| Map Gen     | Custom procedural generation module  |
| Testing     | pytest, Jest                        |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.9** or higher
- **Node.js 16+** (optional, for frontend dev tooling)
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/labyrinth-of-tartarus.git
cd labyrinth-of-tartarus

# Create a virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate          # Windows

# Install Python dependencies
pip install -r requirements.txt

# Initialize the database
python scripts/init_db.py
```

### Running the Application

```bash
# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Open your browser and navigate to:
# http://localhost:8000
```

The game client is served directly by FastAPI as static files. No separate frontend build step is required.

---

## 📁 Project Structure

```
labyrinth-of-tartarus/
│
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Application configuration
│   ├── models/
│   │   ├── player.py           # Player data models
│   │   ├── game_state.py       # Game state schema
│   │   └── events.py           # WebSocket event definitions
│   ├── routers/
│   │   ├── game.py             # Game session endpoints
│   │   ├── leaderboard.py      # Leaderboard endpoints
│   │   └── ws.py               # WebSocket handler
│   ├── engine/
│   │   ├── map_generator.py    # Procedural labyrinth generation
│   │   ├── combat.py           # Combat resolution logic
│   │   ├── entities.py         # Enemy and NPC definitions
│   │   └── items.py            # Item and loot tables
│   ├── oracle/
│   │   ├── observer.py         # Player behavior tracking
│   │   ├── profiler.py         # Behavioral profile builder
│   │   ├── mutator.py          # World mutation controller
│   │   └── difficulty.py       # Flow-state difficulty manager
│   └── database/
│       ├── connection.py       # SQLite connection manager
│       └── queries.py          # Database query definitions
│
├── static/
│   ├── index.html              # Game client entry point
│   ├── css/
│   │   └── styles.css          # UI styles
│   ├── js/
│   │   ├── raycaster.js        # Raycasting rendering engine
│   │   ├── input.js            # Keyboard and mouse input
│   │   ├── hud.js              # Heads-up display overlay
│   │   ├── websocket.js        # Server communication layer
│   │   └── audio.js            # Sound effects manager
│   └── assets/
│       ├── textures/           # Wall and floor textures
│       ├── sprites/            # Enemy and item sprites
│       └── sounds/             # Audio files
│
├── scripts/
│   ├── init_db.py              # Database initialization
│   └── seed_data.py            # Sample data seeder
│
├── tests/
│   ├── test_map_generator.py
│   ├── test_combat.py
│   ├── test_oracle.py
│   └── test_api.py
│
├── requirements.txt
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## ⚙ Configuration

Configuration is managed through environment variables. Copy `.env.example` to `.env` and adjust values as needed.

| Variable                    | Default     | Description                                    |
|-----------------------------|-------------|------------------------------------------------|
| `TARTARUS_HOST`             | `0.0.0.0`  | Server bind address                            |
| `TARTARUS_PORT`             | `8000`      | Server port                                    |
| `TARTARUS_DB_PATH`          | `./data.db` | Path to SQLite database                       |
| `TARTARUS_MAP_WIDTH`        | `32`        | Default labyrinth width                        |
| `TARTARUS_MAP_HEIGHT`       | `32`        | Default labyrinth height                       |
| `TARTARUS_ORACLE_ENABLED`   | `true`      | Enable/disable adaptive AI                     |
| `TARTARUS_ORACLE_INTERVAL`  | `5000`      | AI evaluation interval in milliseconds         |
| `TARTARUS_MAX_FLOOR_DEPTH`  | `9`         | Maximum dungeon floors                         |
| `TARTARUS_LOG_LEVEL`        | `INFO`      | Logging verbosity                              |

---

## 📡 API Reference

### REST Endpoints

| Method | Endpoint                  | Description                        |
|--------|---------------------------|------------------------------------|
| POST   | `/api/game/new`           | Create a new game session          |
| GET    | `/api/game/{session_id}`  | Retrieve current game state        |
| DELETE | `/api/game/{session_id}`  | End and archive a game session     |
| GET    | `/api/leaderboard`        | Retrieve global leaderboard        |
| GET    | `/api/leaderboard/{floor}`| Retrieve leaderboard by floor      |
| GET    | `/api/health`             | Server health check                |

### WebSocket

Connect to `ws://localhost:8000/ws/{session_id}` to establish a real-time game session.

**Client → Server Events:**

| Event             | Payload                              | Description                     |
|-------------------|--------------------------------------|---------------------------------|
| `player_move`     | `{ "direction": "N/S/E/W" }`       | Player movement                 |
| `player_attack`   | `{ "type": "melee/ranged" }`        | Initiate attack                 |
| `player_use_item` | `{ "item_id": "..." }`              | Use inventory item              |
| `player_interact` | `{ "target_id": "..." }`            | Interact with environment       |

**Server → Client Events:**

| Event             | Payload                              | Description                     |
|-------------------|--------------------------------------|---------------------------------|
| `state_update`    | `{ "map": ..., "entities": ... }`   | Full game state refresh         |
| `world_mutation`  | `{ "changes": [...] }`              | Oracle-driven world changes     |
| `combat_result`   | `{ "damage": ..., "status": ... }`  | Combat resolution result        |
| `floor_transition`| `{ "floor": ..., "map": ... }`      | Player descended to new floor   |

---

## ⚔ Game Mechanics

### The Labyrinth

Each floor of the labyrinth is procedurally generated using a modified recursive backtracking algorithm enhanced with room carving and loop injection. The Oracle may mutate the map during gameplay by sealing passages, opening hidden doors, or flooding corridors with darkness.

### Combat

Combat is resolved in real time. Melee attacks deal high damage at close range but leave the player vulnerable. Ranged attacks consume limited ammunition and require line-of-sight. Enemies have unique behaviors: some charge directly, some flank, some retreat and set traps. The Oracle adjusts enemy composition and tactics based on observed player combat patterns.

### Enemies

| Enemy          | Behavior       | Threat Level | Adapts Via                     |
|----------------|----------------|--------------|--------------------------------|
| Shade          | Patrol / Chase | ★☆☆☆☆       | Increases speed over time      |
| Fury           | Flank / Ambush | ★★★☆☆       | Learns player dodge patterns   |
| Minotaur       | Guard / Charge | ★★★★☆       | Blocks previously used routes  |
| Titan Fragment  | Siege / Area   | ★★★★★       | Counters player's best weapon  |

### Items

| Item            | Effect                              | Rarity      |
|-----------------|-------------------------------------|-------------|
| Torch           | Increases visibility radius         | Common      |
| Ichor Flask     | Restores health                     | Common      |
| Bronze Key      | Opens locked gates                  | Uncommon    |
| Thread of Ariadne | Reveals path to nearest exit     | Rare        |
| Aegis Shard     | Temporary invulnerability           | Legendary   |

---

## 📸 Screenshots

> *Screenshots will be added after the first visual release milestone.*

```
┌─────────────────────────────────────────┐
│                                         │
│     [First-Person Labyrinth View]       │
│                                         │
│     Raycasted corridors with dynamic    │
│     lighting and textured walls         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│     [HUD Overlay]                       │
│                                         │
│     Health bar, minimap, inventory      │
│     slots, floor indicator, and         │
│     Oracle activity warning icon        │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│     [Combat Encounter]                  │
│                                         │
│     Engaging a Fury in a narrow         │
│     corridor while low on resources     │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🗺 Roadmap

- [x] Core raycasting renderer
- [x] Procedural map generation
- [x] FastAPI backend with WebSocket support
- [x] Basic combat system
- [x] The Oracle — observation and profiling layers
- [ ] The Oracle — world mutation layer
- [ ] The Oracle — feedback loop and flow-state tuning
- [ ] Audio system with spatial sound
- [ ] Multiple texture themes per floor
- [ ] Persistent player accounts and progression
- [ ] Multiplayer cooperative mode
- [ ] Community-created labyrinth templates
- [ ] Mobile touch controls
- [ ] Speedrun leaderboards with replay system

---

## 🤝 Contributing

Contributions are welcome and encouraged. Whether you're fixing a bug, adding a feature, or improving documentation, every contribution helps.

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/your-feature`)
3. **Commit** your changes (`git commit -m "Add your feature"`)
4. **Push** to the branch (`git push origin feature/your-feature`)
5. **Open** a Pull Request

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Wolfenstein 3D** and **DOOM** for pioneering the raycasting technique that inspired the rendering engine
- **Mihaly Csikszentmihalyi** for the concept of flow state that guides The Oracle's design philosophy
- **Greek mythology** for providing an endlessly rich thematic foundation
- The open-source community for the incredible tools that make projects like this possible

---

<div align="center">

*"Abandon all hope, ye who enter here — unless The Oracle decides otherwise."*

**⬇ Descend into Tartarus ⬇**

### 🔥 [Play Labyrinth of Tartarus](https://labyrinth-ai-engine-1.onrender.com) 🔥🔥


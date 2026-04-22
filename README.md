
<div align="center">

# 🔥 LABYRINTH OF TARTARUS 🔥
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Async-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![SQLite](https://img.shields.io/badge/SQLite-Embedded-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)

<!-- ───── Systems Layer ───── -->
[![Simulation](https://img.shields.io/badge/Simulation-Real--Time-8A2BE2?style=for-the-badge)](#)
[![Procedural Generation](https://img.shields.io/badge/Procedural-Generation-013220?style=for-the-badge)](#)
[![Difficulty](https://img.shields.io/badge/Difficulty-Flow--State-8A2BE2?style=for-the-badge)](#)

<!-- ───── Runtime / Networking ───── -->
[![Uvicorn](https://img.shields.io/badge/Uvicorn-ASGI-4051B5?style=for-the-badge)](https://www.uvicorn.org/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-4A90E2?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

<!-- ───── Engine Layer ───── -->
[![Rendering](https://img.shields.io/badge/Rendering-Raycasting-critical?style=for-the-badge)](#)
[![Game Engine](https://img.shields.io/badge/Game-Engine--Like-8A2BE2?style=for-the-badge)](#)

<!-- ───── Narrow Apex: Quality & Intelligence ───── -->
[![Testing](https://img.shields.io/badge/Testing-pytest-blue?style=for-the-badge&logo=pytest&logoColor=white)](https://pytest.org)

[![AI Powered](https://img.shields.io/badge/🧠_AI-The_Oracle-FF4500?style=for-the-badge)](#-the-oracle--adaptive-ai-engine)

<img
  src="https://raw.githubusercontent.com/yourusername/labyrinth-of-tartarus/main/assets/badges/oracle-pulse.gif"
  alt="The Oracle — Adaptive AI Engine"
  height="28"
/><!-- ───── Tip of the Pyramid ───── -->
[![License](https://img.shields.io/badge/License-MIT-red?style=for-the-badge)](LICENSE)

---
### *“τὸ λαβύρινθον τοῦ Ταρτάρου· Ἀπολίπετε πᾶσαν ἐλπίδα, οἱ εἰσιόντες ἐνθάδε.”*  
### *“The Labyrinth of Tartarus: Abandon all hope, you who enter here.”*

### 🔥 ▶ [Play Now](https://labyrinth-ai-engine-1.onrender.com)

<img
  width="1757"
  height="1261"
  alt="Labyrinth of Tartarus Gameplay"
  src="https://github.com/user-attachments/assets/4c295120-33cb-4198-a0b2-570a9c89efbd"
/>

</div>


### ΤΑΡΤΑΡΟΣ — Adaptive Raycasting AI Simulation Engine

Inspired by *Wolfenstein 3D*, powered by FastAPI + WebSockets, and driven by a custom behavioral AI engine (**The Oracle**),  

*Labyrinth of Tartarus* is a living dungeon that observes, profiles, and mutates in real time to keep players in a constant **flow state**

---

## Why This Project Exists

Most games adjust difficulty by scaling numbers.

**Tartarus changes the world instead.**

Rather than inflating enemy health or damage, the dungeon itself adapts:
- Corridors seal or open
- Enemies evolve counter‑tactics
- Resources relocate
- Safe paths disappear

The goal is not to punish or assist the player—but to maintain **flow**: the psychological state between boredom and frustration where engagement is highest.

---

## ✨ Key Features

### 🎮 Gameplay
- First‑person raycasting engine (HTML5 Canvas)
- Procedurally generated, multi‑floor labyrinths
- Real‑time melee and ranged combat
- Inventory, keys, relics, and exploration layers

### 🧠 Adaptive AI — *The Oracle*
- Behavioral profiling via real‑time WebSocket events
- World mutation instead of numeric difficulty scaling
- Enemies adapt based on prior encounters
- Trap and loot placement guided by path prediction

### 🏗 Technical
- FastAPI backend with WebSocket transport
- SQLite persistence for player profiles and AI state
- Sub‑50ms server response times
- Zero frontend frameworks (pure vanilla JavaScript)

---

## 🧿 The Oracle — Adaptive AI Engine

The Oracle is a real‑time simulation engine that sits between the player and the world, continuously observing behavior and reshaping the dungeon in response.

### How It Works

**1. Observe**  
Movement, combat choices, hesitation patterns, input timing, exploration vs. avoidance.

**2. Profile**  
Players are modeled along multiple axes:
- Aggression (rusher ↔ cautious)
- Exploration (completionist ↔ speedrunner)
- Resource usage (hoarder ↔ spender)
- Adaptability (pattern‑follower ↔ improviser)

**3. Mutate**  
The Oracle issues world‑level changes:
- Altering map topology
- Spawning enemies with counter‑tactics
- Adjusting lighting and visibility
- Relocating critical resources

**4. Measure**  
Player response feeds back into the profile, refining the next mutation cycle.

The result is a dungeon that feels personal, adversarial, and alive.

### Difficulty Philosophy

The Oracle does not try to make the game harder or easier—it tries to keep you **engaged**.  
If you dominate, the labyrinth tightens. If you struggle, it may offer subtle relief—but never in a way that breaks immersion.

---

## 🗺 Roadmap

### ✅ Completed
- Core raycasting renderer
- Procedural map generation
- FastAPI backend with WebSockets
- Real‑time combat system
- The Oracle (observation → profiling → mutation → feedback)
- Spatial audio system
- Multiple texture themes per floor
- Persistent player progression

### 🚧 Planned / In Progress
- Mobile touch controls
- Speedrun leaderboards (with ghost replays)
- Community‑created labyrinth templates
- Cooperative multiplayer (long‑term)

---

## 🏗 Architecture Overview

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


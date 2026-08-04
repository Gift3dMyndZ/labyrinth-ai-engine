<img src="https://readme-typing-svg.herokuapp.com?font=Cinzel&size=42&pause=1000&color=FF4500&center=true&vCenter=true&width=900&lines=LABYRINTH+OF+TARTARUS;THE+LABYRINTH+WATCHES;THE+ORACLE+LEARNS;ABANDON+ALL+HOPE" alt="Labyrinth of Tartarus animated title" />

<br>

<img src="https://capsule-render.vercel.app/api?type=waving&height=160&color=0:000000,35:2B0000,65:8B0000,100:1A1A1A&text=Adaptive%20Raycasting%20AI%20Simulation%20Engine&fontColor=ffffff&fontSize=28&fontAlignY=35&desc=FastAPI%20%E2%80%A2%20WebSockets%20%E2%80%A2%20SQLite%20%E2%80%A2%20Procedural%20Mutation&descAlignY=58&animation=fadeIn" alt="Adaptive Raycasting AI Simulation Engine" />

<br>

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Async-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![SQLite](https://img.shields.io/badge/SQLite-Embedded-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Rendering](https://img.shields.io/badge/Rendering-Raycasting-critical?style=for-the-badge)](#rendering-and-gameplay)
[![AI](https://img.shields.io/badge/AI-The_Oracle-FF4500?style=for-the-badge)](#the-oracle)
[![Mobile](https://img.shields.io/badge/Mobile-Touch_Controls-8A2BE2?style=for-the-badge)](#mobile-controls)
[![License](https://img.shields.io/badge/License-MIT-red?style=for-the-badge)](LICENSE)

<br>

<a href="https://labyrinth-ai-engine-1.onrender.com">
  <img src="https://img.shields.io/badge/ENTER_THE_LABYRINTH-8B0000?style=for-the-badge&logoColor=white" height="52" alt="Enter the Labyrinth" />
</a>

### The Oracle awaits

*A living adversarial simulation engine disguised as an infernal maze crawler.*


---

# Labyrinth of Tartarus

**Labyrinth of Tartarus** is a browser-based first-person raycasting experience backed by FastAPI and SQLite. A procedural labyrinth, an adaptive monster, behavioral telemetry, persistent run history, an executive dashboard, and a mobile-ready control layer combine into a simulation designed around sustained player pressure.

The project is built with vanilla JavaScript and HTML5 Canvas on the client, with Python and FastAPI on the server. No frontend framework or separate build step is required.

> The labyrinth does not merely become harder. The labyrinth observes how the player moves, adapts its pressure, and remembers completed runs.

## Live application

- Game: <https://labyrinth-ai-engine-1.onrender.com>
- Local game: <http://127.0.0.1:8000/>
- Local dashboard: <http://127.0.0.1:8000/dashboard>

---

## Current feature set

### Rendering and gameplay

- First-person HTML5 Canvas raycasting renderer
- Procedurally generated labyrinth layouts
- Multi-floor progression and increasing difficulty
- Collision-aware forward, reverse, rotation, and strafing movement
- Adaptive monster states including patrol, chase, flank, ambush, and investigate
- Atmospheric boot sequence, ambient audio, infernal lighting, and shadow figures
- Desktop pointer-lock mouse look
- Touch-safe boot flow and persistent player identity

### The Oracle

The Oracle observes gameplay signals and adapts local difficulty pressure. Current behavioral telemetry includes:

- Fear signal
- Aggression signal
- Curiosity signal
- Survival time
- Difficulty modifier
- Floor reached
- Maze size
- Oracle mutation count
- Device type
- Run outcome

Periodic telemetry is throttled to approximately one request every five seconds. Death and escape events are submitted immediately.

> Gameplay telemetry is currently client-reported. It should not be treated as authoritative competitive scoring without additional server-side validation.

### Persistence and executive dashboard

The SQLite-backed service supports:

- Player identity
- Leaderboard records
- Recent completed runs
- Session and device telemetry
- Backward-compatible database migrations
- Dashboard summary metrics
- Responsive dashboard views

Open the local dashboard at:

```text
http://127.0.0.1:8000/dashboard
```

---

## ORACLE NAV

ORACLE NAV replaces the original flat minimap with a local isometric mini-maze.

### Navigation legend

- **Gold `YOU` marker:** player position and facing direction
- **Cyan raised blocks:** nearby maze walls
- **Dark blue diamonds:** walkable floor cells
- **Orange diamonds:** the next route steps toward the exit
- **Green `EXIT` beacon:** the exit when it enters the local navigation radius
- **Orange compass:** exit direction relative to player facing
- **Pink `ENEMY` marker:** monster inside the local threat radius
- **Pink directional marker:** nearby monster outside the visible local map

The exit route uses cached breadth-first search. The route is recalculated when the player enters a new grid cell or when the destination changes. Only a short route segment is exposed so navigation remains useful without revealing the entire labyrinth.

---

## Controls

### Desktop controls

- `W` or `Arrow Up`: move forward
- `S` or `Arrow Down`: move backward
- `A` or `Arrow Left`: rotate left
- `D` or `Arrow Right`: rotate right
- Mouse movement while pointer-locked: look left or right
- `M`: show or hide ORACLE NAV
- `Enter`: start or restart a run
- `Escape`: release pointer lock

### Mobile controls

- **Left virtual joystick**
  - Drag upward to move forward
  - Drag downward to move backward
  - Drag left or right to strafe
- **Right touch zone**
  - Swipe horizontally to rotate the view
- **MAP ON / MAP OFF**
  - Show or hide ORACLE NAV

The joystick and look zone support simultaneous multi-touch input. Mobile input resets after pointer cancellation, window blur, page visibility changes, and orientation changes to prevent stuck movement.

### Mobile layout guidance

- Landscape is the recommended gameplay orientation.
- Controls use device safe-area insets.
- Touch targets are designed to remain finger-sized.
- The release target is a sustained 30 FPS or better on supported mobile devices.

---

## Architecture

```text
Browser Client
├── Canvas raycaster
├── Procedural local game state
├── Keyboard, mouse, and touch input
├── ORACLE NAV isometric renderer
├── Player identity persistence
└── Telemetry client
        │
        ├── REST telemetry and run persistence
        └── WebSocket adaptation channel
        │
FastAPI Service
├── Static game and dashboard hosting
├── Game routes
├── Telemetry routes
├── Dashboard APIs
└── SQLite persistence
```

### Technology stack

**Frontend**

- HTML5 Canvas
- Vanilla JavaScript
- CSS
- Pointer Events API
- Web Audio and browser media playback

**Backend**

- Python 3.9+
- FastAPI
- Uvicorn
- WebSockets

**Persistence**

- SQLite
- Backward-compatible schema migrations

**Validation and tooling**

- Python bytecode compilation
- Node.js syntax validation
- SQLite integrity checks
- Git whitespace validation

---

## Getting started

### Prerequisites

- Python 3.9 or newer
- Git
- Node.js for JavaScript syntax validation
- SQLite CLI for database inspection

### Clone and install

```bash
git clone https://github.com/Gift3dMyndZ/labyrinth-ai-engine.git
cd labyrinth-ai-engine

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

### Run locally

```bash
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open:

```text
http://127.0.0.1:8000/
```

Dashboard:

```text
http://127.0.0.1:8000/dashboard
```

### Test on a phone

Connect the phone and development machine to the same local network.

Find the active interface:

```bash
route get default | grep interface
```

Retrieve the local address using the interface reported by the previous command:

```bash
ipconfig getifaddr en1
```

Replace `en1` when another interface is reported, then open:

```text
http://IMAC_IP:8000/
```

Close older game tabs before testing so multiple telemetry loops do not remain active.

---

## API overview

The exact OpenAPI contract is available from the running FastAPI application:

```text
http://127.0.0.1:8000/docs
```

Important application-facing routes include:

- Game page: `/`
- Dashboard page: `/dashboard`
- Gameplay telemetry: `POST /api/telemetry/log`
- Dashboard APIs under the configured game and telemetry routers
- Health endpoint exposed by the FastAPI application

Use `/docs` as the source of truth for request and response schemas.

---

## Validation

### Source validation

```bash
python -m py_compile \
  app/main.py \
  app/db/database.py \
  app/routes/game.py \
  app/routes/telemetry.py

node --check static/game.js
node --check static/dashboard.js

git diff --check
```

### Database integrity

```bash
sqlite3 data/tartarus.db 'PRAGMA integrity_check;'
```

Expected result:

```text
ok
```

### Desktop acceptance checklist

- Boot input accepts mouse focus
- DESCEND and Enter start a run
- Keyboard movement and mouse look work
- Wall collision and wall sliding work
- ORACLE NAV displays and toggles with `M`
- Route, exit, compass, and monster indicators render
- Death and restart work
- Telemetry returns HTTP 200
- No fatal browser-console exceptions occur

### Mobile acceptance checklist

- Player-name field accepts touch focus
- DESCEND starts exactly one run
- Joystick supports forward, reverse, and strafing
- Touch-look rotates the view
- Joystick and look operate simultaneously
- MAP ON / MAP OFF toggles navigation
- App switching and orientation changes reset active input
- Controls hide on death or escape and return on restart
- Portrait remains functional
- Landscape remains the recommended orientation
- Sustained gameplay meets the 30 FPS release target

---

## Repository layout

```text
labyrinth-ai-engine/
├── app/
│   ├── db/
│   │   └── database.py
│   ├── routes/
│   │   ├── game.py
│   │   └── telemetry.py
│   └── main.py
├── static/
│   ├── assets/
│   │   └── audio/
│   ├── dashboard.css
│   ├── dashboard.html
│   ├── dashboard.js
│   ├── game.js
│   ├── index.html
│   └── style.css
├── data/
│   └── tartarus.db
├── tests/
├── requirements.txt
├── LICENSE
└── README.md
```

Runtime databases should remain outside version control in production workflows unless a deliberate seed database is supplied.

---

## Roadmap

### Completed

- Core raycasting renderer
- Procedural labyrinth generation
- FastAPI backend and WebSocket adaptation
- SQLite persistence and migrations
- Player identity and run persistence
- Executive dashboard
- Isometric ORACLE NAV
- Cached route guidance
- Exit compass and beacon
- Monster proximity navigation
- Desktop and mobile map toggles
- Mobile joystick and touch-look controls
- Mobile input interruption recovery
- Multicolor boot-screen shadow effects
- Touch-safe boot flow
- Telemetry throttling

### Future work

- Server-authoritative competitive validation
- Expanded automated browser testing
- Additional mobile-device performance profiles
- Optional combat and interaction systems
- Ghost replay support
- Community labyrinth templates
- Cooperative multiplayer research

---

## Current limitations

- Gameplay telemetry is client-reported.
- Competitive leaderboard integrity requires server-authoritative validation.
- Attack and interaction controls are not exposed until corresponding mechanics are implemented.
- Mobile behavior should be revalidated on each target browser and device class.
- Landscape is the recommended mobile gameplay orientation.
- External decorative README services may be unavailable or rate-limited.

---

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes with tests or validation notes.
4. Run the source and database validation commands.
5. Commit and push the branch.
6. Open a pull request against the active development branch.

Please review the repository license and contribution standards before submitting changes.

---

## Acknowledgments

- *Wolfenstein 3D* and *DOOM* for pioneering first-person raycasting techniques
- Mihaly Csikszentmihalyi for the flow-state framework that informs The Oracle's design philosophy
- Greek mythology for the Tartarus and labyrinth themes
- The open-source communities behind Python, FastAPI, SQLite, JavaScript, and browser graphics tooling

---

<img src="https://capsule-render.vercel.app/api?type=waving&height=180&text=THE%20LABYRINTH%20REMEMBERS&fontSize=40&fontColor=ffffff&color=0:000000,100:8B0000" alt="The Labyrinth Remembers" />

### The Oracle never sleeps
### Every choice is remembered
### Every path has consequences

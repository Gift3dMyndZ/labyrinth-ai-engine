# LABYRINTH – Raycasting AI Maze Engine

LABYRINTH is a browser-based 3D raycasting engine built from scratch using vanilla JavaScript and HTML5 Canvas. The project demonstrates real-time rendering, procedural maze generation, AI steering behavior, and optimized floor texturing techniques.

## 🚀 Live Demo
(https://labyrinth-ai-engine.onrender.com)

## 🎮 Features

- 3D raycasting engine (Wolfenstein-style rendering)
- Procedural maze generation using recursive backtracking
- Textured floor rendering with device-pixel optimization
- Real-time distance shading
- AI-driven pursuing monster with steering behavior
- Minimap overlay with player/goal/monster tracking
- Boot screen state management
- Restart system
- DPR-aware canvas scaling
- CRT retro visual aesthetic

## 🧠 Technical Highlights

- Custom raycasting implementation (no external libraries)
- Axis-separated collision with radius prevention
- Device-pixel optimized ImageData floor rendering
- Steering-based AI pursuit system
- Infrastructure-ready production structure

## 🛠 Tech Stack

- JavaScript (ES6+)
- HTML5 Canvas
- CSS3 (CRT visual effects)
- Procedural texture generation
- Git version control

## 📦 Installation

```bash
git clone https://github.com/Gift3dMyndZ/labyrinth-ai-engine.git
cd labyrinth-ai-engine
```

Then open index.html in your browser.

📌 Controls
W / S – Move forward / backward
A / D – Turn left / right
ENTER – Start game
Click – Restart after defeat

🎯 Purpose

This project demonstrates real-time graphics programming, procedural systems, and game loop architecture in a lightweight browser environment.



![Python](https://pfst.cf2.poecdn.net/base/image/eb0a896e8374c4fd9444d205422f34ab733dea13b665cfdbfcd909ebb940b5bd?pmaid=587912115)
![FastAPI](https://pfst.cf2.poecdn.net/base/image/3e6659a8a421f5cb805567db450f3617c21b02fc62e3c268e7a86d6e8e33a4cc?pmaid=587912116)
![SQLite](https://pfst.cf2.poecdn.net/base/image/c31e1e16b33ad45d4492179818eb80d827556269628f8a0fbb82922af611cee0?pmaid=587912117)
![Docker](https://pfst.cf2.poecdn.net/base/image/3111f6a8fee083ed1ec8b43f904cc99eb163e57f72afe6a054602142dcc51642?pmaid=587912114)
![License](https://pfst.cf2.poecdn.net/base/image/2c89badab92b5ee0afea1a6328677fab597eaa5d90b21f6a29384f9eaac3cbc0?pmaid=587912113)
![LLM](https://img.shields.io/badge/LLM-Integrated-purple)
![ML](https://img.shields.io/badge/Machine%20Learning-Enabled-orange)
![AI Story Engine](https://img.shields.io/badge/AI-Story%20Engine-ff00ff)
![CI](https://img.shields.io/github/actions/workflow/status/Gift3dMyndZ/labyrinth-ai-engine/main.yml?branch=main)
![Deployment](https://img.shields.io/badge/Deployment-Render-46E3B7)
![Tests](https://img.shields.io/badge/Tests-Pytest-blue)
![Coverage](https://img.shields.io/badge/Coverage-85%25-brightgreen)
![Model](https://img.shields.io/badge/Model-Scikit--Learn-orange)
![Docs](https://img.shields.io/badge/API-OpenAPI-success)
![Version](https://img.shields.io/github/v/tag/Gift3dMyndZ/labyrinth-ai-engine)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![Code Style](https://img.shields.io/badge/code%20style-black-000000.svg)
![Architecture](https://img.shields.io/badge/Architecture-Service--Oriented-blueviolet)
![ML Pipeline](https://img.shields.io/badge/ML-Pipeline%20Separated-orange)
![Telemetry](https://img.shields.io/badge/Telemetry-Real--Time-red)
![Inference](https://img.shields.io/badge/Inference-Online-success)

---

This project demonstrates production-style ML architecture inside an interactive simulation system.

---

## 🏗 System Architecture
```
┌──────────────────────────┐
│        Browser UI        │
│  Raycasting + Telemetry  │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│        FastAPI API       │
│  /telemetry  /train      │
└─────────────┬────────────┘
              │
   ┌──────────┼──────────┐
   ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌────────────┐
│ ML Engine│ │ Story    │ │ Leaderboard│
│Inference │ │ Engine   │ │ Analytics  │
└──────────┘ └──────────┘ └────────────┘
        │
        ▼
┌────────────────────────┐
│ Adaptive Difficulty +  │
│ Narrative Modulation   │
└────────────────────────┘
```

🧠 System Overview
LABYRINTH is structured as a full-stack ML simulation platform.

```
Browser → Telemetry → FastAPI → ML Engine → Adaptive Output → Story Engine
```


### 🖥 Frontend
- Vanilla JavaScript raycasting renderer
- Player movement + collision system
- Monster AI pursuit logic
- Behavioral telemetry tracking:
- Fear level
- Aggression
- Curiosity
- Survival time
- Dynamic difficulty adjustments


### ⚙ Backend (FastAPI)
- REST API architecture
- Telemetry ingestion endpoint
- ML inference service
- Optional training trigger endpoint
- Analytics hooks
- Service-layer abstraction

### ☁ Infrastructure

- Dockerized FastAPI application
- Cloud deployment via Render
- GitHub-managed version control
- Modular production-style project structure
- Serialized ML model artifact management

---

### POST /train

Trigger model retraining (if enabled in configuration).

Example Response:
```josn
{
  "status": "training_started"
}
```
---

## 📂 Project Structure
```
labyrinth-ai-engine/
│
├── app/
│   ├── __init__.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── main.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── story_engine.py
│   │   ├── ml_engine.py
│   │   └── features.py
│   │
│   ├── templates/
│   │   └── dashboard.html
│   │
│   └── static/
│
├── data/
│   └── library.json
│
├── models/
│   └── model.pkl
│
├── training/
│   ├── __init__.py
│   ├── preprocessing.py
│   └── train.py
│
├── tests/
├── Dockerfile
├── requirements.txt
└── README.md
```

---

## 🧠 Machine Learning Architecture
located in: 
```
traning/
```

Pipeline:
```
- Feature engineering
- Data preprocessing
- Model serialization
- Artifact saved to /models/model.pkl
- Model training (Scikit-learn)
```
Retrain locally:

```
python training/train.py
```

### Offline Training

Located in:
```
training/
```
Responsibilities:
```
- Feature engineering  
- Data preprocessing  
- Model training  
- Model serialization  
- Artifact saving to /models/model.pkl  
```

Retrain model:
```
python training/train.py
```
---

### Online Inference

Located in:
```
app/services/ml_engine.py
```
Responsibilities:
```
- Load trained model  
- Transform input features  
- Perform inference  
- Return adaptive recommendations  
```
This separation ensures:
```
- Clean production boundaries  
- Reproducible training  
- Scalable deployment  
- Docker safety  
```
---

## ⚙️ Local Installation

Clone repository:
```
git clone https://github.com/Gift3dMyndZ/labyrinth-ai-engine.git  
cd labyrinth-ai-engine  
```
Create virtual environment:
```
python3 -m venv venv  
source venv/bin/activate  
```
Install dependencies:
```
pip install -r requirements.txt  
```
Run application:
```
uvicorn app.api.main:app --reload  
```
Visit:
```
http://127.0.0.1:8000
```
---

## 🐳 Docker Deployment

Build container:
```
docker build -t labyrinth-ai-engine .
```
Run container:
```
docker run -p 8000:8000 labyrinth-ai-engine
```
---



## 🔬 Design Principles
```
- Separation of concerns  
- Modular architecture  
- Reproducible ML workflows  
- Service-layer abstraction  
- Production-ready folder structure  
- Clean import safety via __init__.py  
- Clear ML training vs inference boundary  
```
---

## 🛣 Roadmap
```
- Behavioral clustering  
- Hybrid psychological + telemetry modeling  
- Persistent database integration  
- Real-time difficulty recalibration  
- CI/CD automation
- Model versioning and artifact tracking
- Cloud scaling configuration
```
---

---

## 👤 Author

Developed by - Joshua Wolfe

If you found this interesting, consider starring the repository ⭐
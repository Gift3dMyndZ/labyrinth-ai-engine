# 🧠 Labyrinth AI Engine

> Adaptive AI horror survival predictor built with FastAPI, behavioral telemetry modeling, LLM storytelling, leaderboard tracking, and analytics.

---

## 🚀 Overview

Labyrinth AI Engine is a modular, browser-based simulation platform that dynamically adjusts survival difficulty using live player telemetry and machine learning predictions.

The system blends:


![Python](https://pfst.cf2.poecdn.net/base/image/eb0a896e8374c4fd9444d205422f34ab733dea13b665cfdbfcd909ebb940b5bd?pmaid=587912115)
![FastAPI](https://pfst.cf2.poecdn.net/base/image/3e6659a8a421f5cb805567db450f3617c21b02fc62e3c268e7a86d6e8e33a4cc?pmaid=587912116)
![SQLite](https://pfst.cf2.poecdn.net/base/image/c31e1e16b33ad45d4492179818eb80d827556269628f8a0fbb82922af611cee0?pmaid=587912117)
![Docker](https://pfst.cf2.poecdn.net/base/image/3111f6a8fee083ed1ec8b43f904cc99eb163e57f72afe6a054602142dcc51642?pmaid=587912114)
![License](https://pfst.cf2.poecdn.net/base/image/2c89badab92b5ee0afea1a6328677fab597eaa5d90b21f6a29384f9eaac3cbc0?pmaid=587912113)
![LLM](https://img.shields.io/badge/LLM-Integrated-purple)
![ML](https://img.shields.io/badge/Machine%20Learning-Enabled-orange)
![AI Story Engine](https://img.shields.io/badge/AI-Story%20Engine-ff00ff)

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
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│   ML Engine    │  │  Story Engine  │  │  Leaderboard   │
│ (Inference)    │  │  (LLM Driven)  │  │  & Analytics   │
└────────────────┘  └────────────────┘  └────────────────┘
          │
          ▼
┌────────────────────┐
│  Adaptive Output   │
│ Difficulty + Story │
└────────────────────┘
```

### High-Level Flow
```
Browser → Telemetry → FastAPI → ML Engine → Adaptive Output → Narrative Engine
```
### 🎮 Frontend

- JavaScript raycasting renderer
- Retro hedge-style maze visuals
- Monster movement logic
- Telemetry collection (fear, aggression, curiosity, etc.)
- Dynamic difficulty updates

### ⚙️ Backend (FastAPI)

- REST API endpoints
- Telemetry ingestion
- Adaptive difficulty computation
- ML integration hooks
- Leaderboard logic
- Analytics tracking

### ☁ Infrastructure

- Dockerized deployment
- GitHub-based CI-ready structure
- Cloud-ready configuration

---

## 🔌 API Endpoints

### `GET /`

Returns main simulation dashboard.

---

### `POST /telemetry`

Accepts live player behavioral data.

Example:

```json
{
  "fear_level": 6,
  "aggression": 3,
  "curiosity": 8,
  "survival_time": 124
}
```
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

Architecture emphasizes:

- Clear separation of concerns  
- Service-layer abstraction  
- ML training vs inference isolation  
- Production-ready organization  

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
```
Retrain:
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

## 🎭 LLM Story Engine

Located in:
```
app/services/story_engine.py
```
Features:
```
- Dynamic narrative generation  
- Character-based survival arcs  
- Context-aware event creation  
- Modular story service abstraction  
```
Narrative logic is isolated from predictive modeling for extensibility.

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

## 📊 Technologies Used
```
- Python  
- FastAPI  
- Scikit-Learn  
- Pandas  
- NumPy  
- Sentence Transformers  
- Jinja2  
- SQLite  
- Docker  
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

## 📜 License

MIT License  

---

## 👤 Author

Developed by Gift3dMyndz - Joshua Wolfe

If you found this interesting, consider starring the repository ⭐
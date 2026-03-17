# 🧠 Labyrinth AI Engine

> AI horror survival predictor built with FastAPI, behavioral modeling, adaptive difficulty systems, and LLM-powered narrative generation.

![Python](https://pfst.cf2.poecdn.net/base/image/eb0a896e8374c4fd9444d205422f34ab733dea13b665cfdbfcd909ebb940b5bd?pmaid=587912115)
![FastAPI](https://pfst.cf2.poecdn.net/base/image/3e6659a8a421f5cb805567db450f3617c21b02fc62e3c268e7a86d6e8e33a4cc?pmaid=587912116)
![SQLite](https://pfst.cf2.poecdn.net/base/image/c31e1e16b33ad45d4492179818eb80d827556269628f8a0fbb82922af611cee0?pmaid=587912117)
![Docker](https://pfst.cf2.poecdn.net/base/image/3111f6a8fee083ed1ec8b43f904cc99eb163e57f72afe6a054602142dcc51642?pmaid=587912114)
![License](https://pfst.cf2.poecdn.net/base/image/2c89badab92b5ee0afea1a6328677fab597eaa5d90b21f6a29384f9eaac3cbc0?pmaid=587912113)

---

## 🚀 Overview

Labyrinth AI Engine is a modular AI simulation platform that dynamically adjusts survival difficulty using behavioral telemetry and machine learning predictions.

It demonstrates production-style ML system design, including:

- ✅ Real-time telemetry ingestion  
- ✅ Adaptive difficulty modeling  
- ✅ Survival probability prediction  
- ✅ LLM-powered story generation  
- ✅ Service-layer ML architecture  
- ✅ Offline training pipeline  
- ✅ Model artifact management  
- ✅ Dockerized deployment  
- ✅ Clean FastAPI modular structure  

This project bridges interactive systems engineering and applied machine learning architecture.

---

## 🏗 System Architecture

### High-Level Flow

Browser → API → Services → Model → Adaptive Output

- Browser collects behavioral input  
- FastAPI handles API requests  
- Service layer processes logic  
- ML model performs inference  
- Adaptive output modifies difficulty and narrative  

---

## 🔌 API Endpoints

### GET /

Returns the main dashboard interface.

---

### POST /recommend

Generate adaptive recommendations based on user behavioral input.

Example Request:

{
  "fear_level": 7,
  "aggression": 4,
  "curiosity": 9
}

Example Response:

{
  "recommended_path": "stealth",
  "difficulty_modifier": 1.25
}

---

### POST /train

Trigger model retraining (if enabled in configuration).

Example Response:

{
  "status": "training_started"
}

---

## 📂 Project Structure

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

Architecture emphasizes:

- Clear separation of concerns  
- Service-layer abstraction  
- ML training vs inference isolation  
- Production-ready organization  

---

## 🧠 Machine Learning Pipeline

### Offline Training

Located in:

training/

Responsibilities:

- Feature engineering  
- Data preprocessing  
- Model training  
- Model serialization  
- Artifact saving to /models/model.pkl  

Retrain model:

python training/train.py

---

### Online Inference

Located in:

app/services/ml_engine.py

Responsibilities:

- Load trained model  
- Transform input features  
- Perform inference  
- Return adaptive recommendations  

This separation ensures:

- Clean production boundaries  
- Reproducible training  
- Scalable deployment  
- Docker safety  

---

## 🎭 LLM Story Engine

Located in:

app/services/story_engine.py

Features:

- Dynamic narrative generation  
- Character-based survival arcs  
- Context-aware event creation  
- Modular story service abstraction  

Narrative logic is isolated from predictive modeling for extensibility.

---

## ⚙️ Installation

Clone repository:

git clone https://github.com/Gift3dMyndZ/labyrinth-ai-engine.git  
cd labyrinth-ai-engine  

Create virtual environment:

python3 -m venv venv  
source venv/bin/activate  

Install dependencies:

pip install -r requirements.txt  

Run application:

uvicorn app.api.main:app --reload  

Visit:

http://127.0.0.1:8000

---

## 🐳 Docker Deployment

Build container:

docker build -t labyrinth-ai-engine .

Run container:

docker run -p 8000:8000 labyrinth-ai-engine

---

## 📊 Technologies Used

- Python  
- FastAPI  
- Scikit-Learn  
- Pandas  
- NumPy  
- Sentence Transformers  
- Jinja2  
- SQLite  
- Docker  

---

## 🔬 Design Principles

- Separation of concerns  
- Modular architecture  
- Reproducible ML workflows  
- Service-layer abstraction  
- Production-ready folder structure  
- Clean import safety via __init__.py  
- Clear ML training vs inference boundary  

---

## 🛣 Roadmap

- Behavioral clustering  
- Hybrid psychological + telemetry modeling  
- Persistent database integration  
- Real-time difficulty recalibration  
- CI/CD automation  

---

## 📜 License

MIT License  

---

## 👤 Author

Developed by Gift3dMyndz

If you found this interesting, consider starring the repository ⭐
🧠 Labyrinth AI Engine
AI horror survival predictor built with FastAPI, behavioral modeling, adaptive difficulty systems, and LLM-powered narrative generation.



> Adaptive behavioral simulation engine built with FastAPI and machine learning.

![Python](https://img.shields.io/badge/Python-3.9+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-API-green)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey)
![Docker](https://img.shields.io/badge/Container-Docker-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)



Labyrinth AI Engine is a modular simulation system that dynamically adjusts difficulty using behavioral modeling and machine learning.

It demonstrates production-style ML system design, including:

- ✅ Real-time telemetry ingestion  
- ✅ Adaptive difficulty modeling  
- ✅ Service-layer ML architecture  
- ✅ Offline training pipeline  
- ✅ Model artifact management  
- ✅ Dockerized deployment  
- ✅ Clean FastAPI modular structure  

This project bridges interactive systems engineering and applied machine learning.

---

## 🏗 System Architecture

### High-Level Flow

```
Browser → API → Services → Model → Adaptive Output
```

---

## 🔌 API Endpoints

### `GET /`

Returns the main dashboard interface.

---

### `POST /recommend`

Generate adaptive recommendations based on user behavioral input.

#### Example Request

```json
{
  "fear_level": 7,
  "aggression": 4,
  "curiosity": 9
}

#### Example Response

```json
{
  "recommended_path": "stealth",
  "difficulty_modifier": 1.25
}

---

### `POST /train`

Trigger model retraining (if enabled in configuration).

#### Example Response

```json
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

## 🧠 Machine Learning Pipeline

### Offline Training

Located in:

training/

Responsibilities:

- Feature engineering  
- Data preprocessing  
- Model training  
- Model serialization  
- Artifact saving to `/models`  

To retrain:

```bash
python training/train.py

Online Inference
Located in:

app/services/ml_engine.py

Responsibilities:

Load trained model
Transform input features
Perform inference
Return adaptive recommendations
This separation ensures:

- ✅ Clean production boundaries  
- ✅ Reproducible training  
- ✅ Scalable deployment  
- ✅ Docker safety  

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/labyrinth-ai-engine.git
cd labyrinth-ai-engine
```

### Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Application

```bash
uvicorn app.api.main:app --reload
```

Visit:

http://127.0.0.1:8000

🐳 Docker Deployment
Build container:

```bash
docker build -t labyrinth-ai-engine .

Run container:

```bash
docker run -p 8000:8000 labyrinth-ai-engine
```

---

## 📊 Technologies Used

- Python  
- FastAPI  
- Scikit-Learn  
- Pandas  
- NumPy  
- Sentence Transformers  
- Jinja2  
- Docker  

---

## 🔬 Design Principles

- Separation of concerns  
- Modular architecture  
- Reproducible ML workflows  
- Service-layer abstraction  
- Production-ready folder structure  
- Clean import safety via `__init__.py`  

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

Developed by **Gift3dMyndz**

If you found this interesting, consider starring the repository ⭐


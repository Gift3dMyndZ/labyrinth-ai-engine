# 🧠 Labyrinth AI Engine

> Adaptive behavioral simulation engine built with FastAPI and machine learning.

![Python](https://pfst.cf2.poecdn.net/base/image/eb0a896e8374c4fd9444d205422f34ab733dea13b665cfdbfcd909ebb940b5bd?pmaid=587828208)
![FastAPI](https://pfst.cf2.poecdn.net/base/image/3e6659a8a421f5cb805567db450f3617c21b02fc62e3c268e7a86d6e8e33a4cc?pmaid=587828205)
![Docker](https://pfst.cf2.poecdn.net/base/image/4e93e772f179f77bf00d0a37fb67ffd7969fb109775bd0f56c963ee6ecdb55c0?pmaid=587828206)
![License](https://pfst.cf2.poecdn.net/base/image/2c89badab92b5ee0afea1a6328677fab597eaa5d90b21f6a29384f9eaac3cbc0?pmaid=587828207)

---

## 🚀 Overview

Labyrinth AI Engine is a modular simulation system that dynamically adjusts difficulty using behavioral modeling and machine learning.

It demonstrates production‑style ML system design, including:

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
├── Dockerfile
├── requirements.txt
└── README.md
```

---

## 🧠 Machine Learning Pipeline

### Offline Training

Located in:

```
training/
```

Responsibilities:

- Feature engineering  
- Data preprocessing  
- Model training  
- Model serialization  
- Artifact saving to `/models`  

To retrain:

```bash
python training/train.py
```

---

### Online Inference

Located in:

```
app/services/ml_engine.py
```

Responsibilities:

- Load trained model  
- Transform input features  
- Perform inference  
- Return adaptive recommendations  

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

```
http://127.0.0.1:8000
```

---

## 🐳 Docker Deployment

Build container:

```bash
docker build -t labyrinth-ai-engine .
```

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
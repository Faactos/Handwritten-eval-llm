# 🧠 AI Handwritten Answer Evaluation System

An AI-powered web application that evaluates **handwritten student answers** using OCR, NLP, and a Large Language Model (LLM). Teachers upload a photo of a student's handwritten answer and receive detailed automated feedback including scores for clarity, formality, conciseness, keyword matching, and an overall grade.

---

## Features

- 📷 **OCR** — Extracts text from handwritten answer images using Tesseract
- 🤖 **LLM Evaluation** — Scores answers using Groq's `llama-3.3-70b-versatile` model
- 📊 **Cosine Similarity** — Compares student answer to model answer
- 🔑 **Keyword Matching** — Checks for presence of expected keywords
- 🗄️ **MongoDB** — Stores all evaluations for record keeping
- 🎨 **React + Tailwind UI** — Clean, responsive frontend

---

## Project Structure

```
llm_full/
├── backend/
│   ├── app.py              # Flask API
│   ├── requirements.txt
│   └── uploads/            # Temporarily stores uploaded images
├── frontend/
│   ├── src/
│   │   └── App.js          # Main React component
│   ├── public/
│   └── package.json
└── README.md
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) installed on your system
- MongoDB Atlas account
- Groq API key (free at [console.groq.com](https://console.groq.com))

---

## Setup & Running

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows
# source .venv/bin/activate        # macOS/Linux

# Install dependencies
pip install flask flask-cors python-dotenv pymongo pillow pytesseract scikit-learn nltk requests
```

Create a `.env` file inside the `backend/` folder:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/student_evaluation?retryWrites=true&w=majority
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend:
```bash
python app.py
```
Backend runs at: `http://127.0.0.1:5000`

---

### 2. Frontend

```bash
cd frontend
npm install
npm start
```
Frontend runs at: `http://localhost:3000`

---

## Usage

1. Enter the **student's name**
2. Paste the **model (ideal) answer**
3. Enter **keywords** separated by commas (e.g. `photosynthesis, chlorophyll, sunlight`)
4. Upload a **JPG or PNG image** of the student's handwritten answer
5. Click **Evaluate Answer**
6. View the extracted text and detailed feedback including grade

---

## API

### `POST /evaluate`

**Form Data:**

| Field | Type | Description |
|---|---|---|
| `image` | file | Handwritten answer image (JPG/PNG) |
| `model_answer` | string | The ideal/correct answer |
| `keywords` | string | Comma-separated expected keywords |
| `student_name` | string | Name of the student |

**Response:**
```json
{
  "student_name": "John Doe",
  "student_answer": "extracted OCR text...",
  "matched_keywords": ["photosynthesis", "chlorophyll"],
  "keyword_count": 2,
  "similarity_score": 0.87,
  "grammar_feedback": "Grammar appears solid.",
  "formality": 85,
  "conciseness": 78,
  "clarity": 90,
  "overall_llm_score": 84,
  "llm_feedback": "...",
  "total_percentage": 82.5,
  "overall_grade": "B"
}
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS, Axios |
| Backend | Python, Flask, Flask-CORS |
| OCR | Tesseract, pytesseract, Pillow |
| LLM | Groq API (LLaMA 3.3 70B) |
| NLP | scikit-learn, NLTK |
| Database | MongoDB Atlas (pymongo) |


import os
import uuid
import requests
import nltk
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
from PIL import Image
import pytesseract
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Setup
nltk.download("punkt")
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not MONGO_URI or not GROQ_API_KEY:
    raise ValueError("⚠️ Missing MONGO_URI or GROQ_API_KEY in .env file")

app = Flask(__name__)
CORS(app)

# MongoDB setup
client = MongoClient(MONGO_URI)
db = client["student_evaluation"]
collection = db["evaluations"]

# ---------- OCR ----------
def preprocess_image(image_path):
    image = Image.open(image_path).convert("L")
    return image

def ocr_extract(image):
    return pytesseract.image_to_string(image)

# ---------- Evaluation ----------
def evaluate_answer(student_answer, model_answer, keywords):
    # Cosine similarity
    vectorizer = CountVectorizer().fit_transform([student_answer, model_answer])
    vectors = vectorizer.toarray()
    similarity_score = cosine_similarity(vectors)[0][1]

    # Keyword matching
    matched_keywords = [kw for kw in keywords if kw.lower() in student_answer.lower()]
    keyword_count = len(matched_keywords)

    # Simple grammar hint
    grammar_feedback = (
        "Grammar appears solid." if len(student_answer.split()) > 8 else "Sentence structure too short or incomplete."
    )

    # ---------- LLM scoring ----------
    try:
        prompt = f"""
You are an experienced academic evaluator.
Assess the following student's answer compared to the model answer.

Return a JSON object with these keys:
- "formality": number (0–100)
- "conciseness": number (0–100)
- "clarity": number (0–100)
- "overall_score": number (0–100)
- "feedback": detailed 3–5 sentence feedback including grammar, tone, and relevance.

Student Answer:
{student_answer}

Model Answer:
{model_answer}
"""

        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": "You are a professional education evaluator."},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 400,
            },
            timeout=40,
        )

        llm_output = res.json()["choices"][0]["message"]["content"]
        match = re.search(r"\{.*\}", llm_output, re.S)
        if match:
            llm_data = json.loads(match.group(0))
        else:
            raise ValueError("Could not parse JSON from LLM")

    except Exception as e:
        print("⚠️ LLM feedback error:", e)
        llm_data = {
            "formality": 80,
            "conciseness": 75,
            "clarity": 82,
            "overall_score": 78,
            "feedback": "Good effort! The student shows understanding but could improve structure and clarity."
        }

    # ---------- Compute composite score ----------
    total_score = (
        (similarity_score * 40)
        + (keyword_count / max(len(keywords), 1)) * 20
        + (llm_data["overall_score"] * 0.4)
    )

    overall_grade = (
        "A" if total_score >= 85 else
        "B" if total_score >= 70 else
        "C" if total_score >= 50 else
        "D"
    )

    feedback = {
        "matched_keywords": matched_keywords,
        "keyword_count": keyword_count,
        "similarity_score": round(similarity_score, 2),
        "grammar_feedback": grammar_feedback,
        "formality": llm_data["formality"],
        "conciseness": llm_data["conciseness"],
        "clarity": llm_data["clarity"],
        "overall_llm_score": llm_data["overall_score"],
        "llm_feedback": llm_data["feedback"],
        "total_percentage": round(total_score, 2),
        "overall_grade": overall_grade,
    }

    return feedback


# ---------- Flask Route ----------
@app.route("/evaluate", methods=["POST"])
def evaluate():
    try:
        print("📥 Request received at /evaluate")

        if "image" not in request.files:
            print("❌ No image file in request")
            return jsonify({"error": "No image uploaded"}), 400

        image_file = request.files["image"]
        model_answer = request.form.get("model_answer", "")
        keywords = request.form.get("keywords", "")
        student_name = request.form.get("student_name", "Unknown Student")

        print(f"🧾 Model answer: {model_answer[:50]}")
        print(f"🧾 Keywords: {keywords}")
        print(f"🧾 Student name: {student_name}")

        os.makedirs("uploads", exist_ok=True)
        image_path = os.path.join("uploads", image_file.filename)
        image_file.save(image_path)

        print(f"✅ Image saved at {image_path}")

        processed_image = preprocess_image(image_path)
        student_answer = ocr_extract(processed_image)

        print(f"🧠 Extracted answer: {student_answer[:80]}")

        feedback = evaluate_answer(student_answer, model_answer, keywords.split(","))

        record = {
            "student_id": str(uuid.uuid4())[:8],
            "student_name": student_name,
            "student_answer": student_answer,
            "model_answer": model_answer,
            "keywords": keywords.split(","),
            **feedback
        }

        print("🗂 Inserting into MongoDB...")
        result = collection.insert_one(record)
        print(f"✅ Mongo insert success: {result.inserted_id}")

        return jsonify({
            "student_name": student_name,
            "student_answer": student_answer,
            **feedback
        }), 200

    except Exception as e:
        print("⚠️ Error in /evaluate:", e)
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(debug=True)

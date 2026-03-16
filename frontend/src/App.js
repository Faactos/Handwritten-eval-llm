import React, { useState } from "react";
import axios from "axios";

function App() {
  const [studentName, setStudentName] = useState("");
  const [modelAnswer, setModelAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [image, setImage] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!studentName || !modelAnswer || !keywords || !image) {
      alert("Please provide all inputs.");
      return;
    }

    const formData = new FormData();
    formData.append("student_name", studentName);
    formData.append("model_answer", modelAnswer);
    formData.append("keywords", keywords);
    formData.append("image", image);

    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/evaluate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFeedback(res.data);
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Error connecting to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-10 px-4">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
          🧠 AI Handwritten Answer Evaluation
        </h1>

        {/* Student Name */}
        <div className="mb-6">
          <label className="block font-semibold text-gray-700 mb-2">
            Student Name:
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter student's full name"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Form Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Model Answer */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Model Answer:
            </label>
            <textarea
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
              rows="5"
              value={modelAnswer}
              onChange={(e) => setModelAnswer(e.target.value)}
              placeholder="Enter the ideal model answer here..."
            ></textarea>
          </div>

          {/* Keywords */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Keywords (comma separated):
            </label>
            <textarea
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
              rows="5"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. photosynthesis, chlorophyll, sunlight"
            ></textarea>
          </div>
        </div>

        {/* File Upload */}
        <div className="mt-6">
          <label className="block font-semibold text-gray-700 mb-2">
            Upload Student Answer (JPG/PNG):
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-gray-700 border rounded-lg cursor-pointer bg-gray-50 p-2"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-3 rounded-lg text-white font-semibold ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 transition"
            }`}
          >
            {loading ? "Evaluating..." : "Evaluate Answer"}
          </button>
        </div>

        {/* Feedback Section */}
        {feedback && (
          <div className="mt-10 bg-gray-50 border rounded-xl p-6">
            {/* Extracted Answer (Full Width) */}
            {/* Extracted Answer (Full Width with better styling) */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Extracted Answer
              </h2>
              <div className="w-full bg-white border border-blue-200 rounded-xl shadow-sm p-5">
                <pre className="text-gray-800 whitespace-pre-wrap font-serif leading-relaxed">
                  {feedback.student_answer}
                </pre>
              </div>
            </div>


            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Evaluation Feedback
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <div>
                <p>
                  <strong>Matched Keywords:</strong>{" "}
                  {feedback.matched_keywords.join(", ")}
                </p>
                <p>
                  <strong>Keyword Count:</strong> {feedback.keyword_count}
                </p>
                <p>
                  <strong>Similarity Score:</strong> {feedback.similarity_score}
                </p>
                <p>
                  <strong>Grammar Feedback:</strong>{" "}
                  {feedback.grammar_feedback}
                </p>
              </div>

              <div>
                <p>
                  <strong>Formality:</strong> {feedback.formality}
                </p>
                <p>
                  <strong>Conciseness:</strong> {feedback.conciseness}
                </p>
                <p>
                  <strong>Clarity:</strong> {feedback.clarity}
                </p>
                <p>
                  <strong>Total Score:</strong> {feedback.total_percentage}%
                </p>
                <p>
                  <strong>Overall Grade:</strong>{" "}
                  <span
                    className={`font-bold ${
                      feedback.overall_grade === "A"
                        ? "text-green-600"
                        : feedback.overall_grade === "B"
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {feedback.overall_grade}
                  </span>
                </p>
              </div>
            </div>

            {/* Divider */}
            <hr className="my-4 border-gray-300" />

            <p className="text-gray-800">
              <strong>LLM Feedback:</strong>{" "}
              <span className="italic">{feedback.llm_feedback}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

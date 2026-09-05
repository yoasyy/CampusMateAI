from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from ai_service import ask_ai, explain_topic, generate_quiz, summarize_text
from data_store import (
    average_quiz_score,
    load_history,
    load_stats,
    record_question,
    record_quiz
)


BASE_DIR = Path(__file__).resolve().parent
PLAIN_FRONTEND_DIR = BASE_DIR / "frontend" / "plain"
REACT_FRONTEND_DIR = BASE_DIR / "frontend" / "react"

app = Flask(__name__)


def _json_error(message, status_code=400):
    return jsonify({"ok": False, "error": message}), status_code


def _stats_payload():
    stats = load_stats()
    return {
        "ok": True,
        "stats": stats,
        "average_quiz_score": round(average_quiz_score(stats), 1)
    }


@app.get("/")
def plain_index():
    return send_from_directory(PLAIN_FRONTEND_DIR, "index.html")


@app.get("/react")
def react_index():
    return send_from_directory(REACT_FRONTEND_DIR, "index.html")


@app.get("/plain/<path:filename>")
def plain_static(filename):
    return send_from_directory(PLAIN_FRONTEND_DIR, filename)


@app.get("/react/<path:filename>")
def react_static(filename):
    return send_from_directory(REACT_FRONTEND_DIR, filename)


@app.get("/api/bootstrap")
def bootstrap():
    return jsonify({
        "ok": True,
        "history": load_history(),
        "stats": load_stats()
    })


@app.get("/api/history")
def history():
    return jsonify({"ok": True, "history": load_history()})


@app.get("/api/stats")
def stats():
    return jsonify(_stats_payload())


@app.post("/api/ask")
def ask():
    data = request.get_json(silent=True) or {}
    question = data.get("question", "").strip()
    student_name = data.get("student_name", "").strip() or None

    if not question:
        return _json_error("Question cannot be empty.")

    try:
        answer = ask_ai(question)
        stats = record_question(question, answer, student_name)
    except Exception as error:
        return _json_error(str(error), 500)

    return jsonify({
        "ok": True,
        "question": question,
        "answer": answer,
        "stats": stats,
        "average_quiz_score": round(average_quiz_score(stats), 1)
    })


@app.post("/api/explain")
def explain():
    data = request.get_json(silent=True) or {}
    topic = data.get("topic", "").strip()
    level = data.get("level", "").strip().lower()

    if not topic:
        return _json_error("Topic cannot be empty.")

    if level not in {"beginner", "intermediate", "advanced"}:
        return _json_error("Select a valid difficulty level.")

    try:
        answer = explain_topic(topic, level)
    except Exception as error:
        return _json_error(str(error), 500)

    return jsonify({
        "ok": True,
        "topic": topic,
        "level": level,
        "answer": answer
    })


@app.post("/api/summarize")
def summarize():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    style = data.get("style", "").strip().lower()

    if not text:
        return _json_error("Text cannot be empty.")

    if style not in {
        "short",
        "detailed",
        "bullet points",
        "beginner-friendly"
    }:
        return _json_error("Select a valid summary style.")

    try:
        answer = summarize_text(text, style)
    except Exception as error:
        return _json_error(str(error), 500)

    return jsonify({
        "ok": True,
        "style": style,
        "answer": answer
    })


@app.post("/api/quiz/generate")
def quiz_generate():
    data = request.get_json(silent=True) or {}
    topic = data.get("topic", "").strip()
    level = data.get("level", "").strip().lower()
    number = data.get("number_of_questions", 0)

    if not topic:
        return _json_error("Topic cannot be empty.")

    if level not in {"beginner", "intermediate", "advanced"}:
        return _json_error("Select a valid difficulty level.")

    try:
        number_of_questions = int(number)
    except (TypeError, ValueError):
        return _json_error("Please enter a valid number of questions.")

    if number_of_questions <= 0:
        return _json_error("Number of questions must be greater than 0.")

    try:
        quiz = generate_quiz(topic, level, number_of_questions)
    except Exception as error:
        return _json_error(str(error), 500)

    return jsonify({
        "ok": True,
        "topic": topic,
        "level": level,
        "quiz": quiz
    })


@app.post("/api/quiz/result")
def quiz_result():
    data = request.get_json(silent=True) or {}

    try:
        score = int(data.get("score", 0))
        total = int(data.get("total", 0))
    except (TypeError, ValueError):
        return _json_error("Score and total must be numbers.")

    if total < 0 or score < 0 or score > total:
        return _json_error("Score and total are not valid.")

    stats = record_quiz(score, total)

    return jsonify({
        "ok": True,
        "score": score,
        "total": total,
        "stats": stats,
        "average_quiz_score": round(average_quiz_score(stats), 1)
    })


if __name__ == "__main__":
    app.run(debug=True)

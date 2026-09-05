import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
HISTORY_PATH = BASE_DIR / "history.json"
STATS_PATH = BASE_DIR / "stats.json"

DEFAULT_STATS = {
    "questions_asked": 0,
    "quizzes_completed": 0,
    "correct_answers": 0,
    "incorrect_answers": 0,
    "quiz_scores": []
}


def _load_json(path, default):
    try:
        with path.open("r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        return deepcopy(default)
    except json.JSONDecodeError:
        return deepcopy(default)


def _save_json(path, data):
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)


def load_history():
    history = _load_json(HISTORY_PATH, [])
    return history if isinstance(history, list) else []


def save_history(history):
    _save_json(HISTORY_PATH, history)


def load_stats():
    stats = _load_json(STATS_PATH, DEFAULT_STATS)

    if not isinstance(stats, dict):
        return deepcopy(DEFAULT_STATS)

    merged = deepcopy(DEFAULT_STATS)
    merged.update(stats)

    if not isinstance(merged.get("quiz_scores"), list):
        merged["quiz_scores"] = []

    return merged


def save_stats(stats):
    _save_json(STATS_PATH, stats)


def record_question(question, answer, student_name=None):
    history = load_history()

    entry = {
        "question": question,
        "answer": answer,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    if student_name:
        entry["student_name"] = student_name

    history.append(entry)
    save_history(history)

    stats = load_stats()
    stats["questions_asked"] += 1
    save_stats(stats)

    return stats


def record_quiz(score, total):
    stats = load_stats()

    percentage = 0
    if total > 0:
        percentage = (score / total) * 100

    stats["quizzes_completed"] += 1
    stats["correct_answers"] += score
    stats["incorrect_answers"] += max(total - score, 0)
    stats["quiz_scores"].append(percentage)
    save_stats(stats)

    return stats


def average_quiz_score(stats):
    scores = stats.get("quiz_scores", [])

    if not scores:
        return 0.0

    return sum(scores) / len(scores)

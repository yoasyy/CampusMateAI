const API_ROOT = "";

const state = {
  history: [],
  stats: {
    questions_asked: 0,
    quizzes_completed: 0,
    correct_answers: 0,
    incorrect_answers: 0,
    quiz_scores: []
  },
  quiz: null,
  selectedAnswers: {}
};

const els = {
  studentName: document.getElementById("studentName"),
  saveName: document.getElementById("saveName"),
  greeting: document.getElementById("greeting"),
  questionsAsked: document.getElementById("questionsAsked"),
  quizzesCompleted: document.getElementById("quizzesCompleted"),
  averageScore: document.getElementById("averageScore"),
  statusText: document.getElementById("statusText"),
  responseOutput: document.getElementById("responseOutput"),
  historyList: document.getElementById("historyList"),
  statsDetails: document.getElementById("statsDetails"),
  quizArea: document.getElementById("quizArea")
};

function setStatus(message, tone = "") {
  els.statusText.textContent = message;
  els.statusText.className = tone ? `notice ${tone}` : "";
}

function setOutput(text) {
  els.responseOutput.textContent = text;
}

function getSavedName() {
  return localStorage.getItem("campusmate_name") || "";
}

function saveName(name) {
  localStorage.setItem("campusmate_name", name);
  renderGreeting();
}

function renderGreeting() {
  const name = getSavedName();
  els.greeting.textContent = name
    ? `You are browsing as ${name}.`
    : "You are browsing as a guest.";
}

function averageQuizScore() {
  const scores = state.stats.quiz_scores || [];
  if (!scores.length) return 0;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function renderMetrics() {
  els.questionsAsked.textContent = state.stats.questions_asked ?? 0;
  els.quizzesCompleted.textContent = state.stats.quizzes_completed ?? 0;
  els.averageScore.textContent = `${averageQuizScore().toFixed(1)}%`;
}

function renderHistory() {
  if (!state.history.length) {
    els.historyList.innerHTML = `<div class="history-item"><h3>No history yet</h3><p>Ask a question to create your first saved answer.</p></div>`;
    return;
  }

  els.historyList.innerHTML = state.history
    .slice()
    .reverse()
    .map((item) => `
      <div class="history-item">
        <h3>${escapeHtml(item.student_name ? `${item.student_name}` : "Student")}</h3>
        <p><strong>Q:</strong> ${escapeHtml(item.question)}</p>
        <p><strong>A:</strong> ${escapeHtml(item.answer)}</p>
      </div>
    `)
    .join("");
}

function renderStats() {
  const average = averageQuizScore().toFixed(1);
  els.statsDetails.innerHTML = `
    <div class="stat-item"><h3>Questions asked</h3><p>${state.stats.questions_asked ?? 0}</p></div>
    <div class="stat-item"><h3>Quizzes completed</h3><p>${state.stats.quizzes_completed ?? 0}</p></div>
    <div class="stat-item"><h3>Correct answers</h3><p>${state.stats.correct_answers ?? 0}</p></div>
    <div class="stat-item"><h3>Incorrect answers</h3><p>${state.stats.incorrect_answers ?? 0}</p></div>
    <div class="stat-item"><h3>Average quiz score</h3><p>${average}%</p></div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function switchPanel(targetId) {
  document.querySelectorAll(".card").forEach((card) => {
    card.classList.toggle("active", card.id === targetId);
  });

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.target === targetId);
  });
}

async function requestJson(path, payload) {
  const response = await fetch(`${API_ROOT}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return data;
}

async function refreshBootstrap() {
  const response = await fetch("/api/bootstrap");
  const data = await response.json();
  if (!data.ok) throw new Error("Could not load dashboard data.");

  state.history = data.history || [];
  state.stats = data.stats || state.stats;
  renderMetrics();
  renderHistory();
  renderStats();
}

function renderQuiz(quiz) {
  state.quiz = quiz;
  state.selectedAnswers = {};

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    els.quizArea.innerHTML = `<div class="quiz-block">No quiz questions were generated.</div>`;
    return;
  }

  els.quizArea.innerHTML = quiz.questions
    .map((question, index) => `
      <div class="quiz-block" data-index="${index}">
        <h3>${index + 1}. ${escapeHtml(question.question)}</h3>
        <div class="quiz-options">
          ${question.options.map((option, optionIndex) => `
            <label class="quiz-option">
              <input type="radio" name="q-${index}" value="${optionIndex}" />
              <span>${escapeHtml(option)}</span>
            </label>
          `).join("")}
        </div>
      </div>
    `)
    .join("");

  const submitButton = document.createElement("button");
  submitButton.className = "btn";
  submitButton.textContent = "Submit quiz";
  submitButton.addEventListener("click", gradeQuiz);

  els.quizArea.appendChild(submitButton);
}

async function gradeQuiz() {
  if (!state.quiz || !state.quiz.questions) {
    setStatus("Generate a quiz first.", "notice");
    return;
  }

  let score = 0;
  const total = state.quiz.questions.length;

  state.quiz.questions.forEach((question, index) => {
    const checked = document.querySelector(`input[name="q-${index}"]:checked`);
    if (checked && Number(checked.value) === Number(question.correct_index)) {
      score += 1;
    }
  });

  const result = await requestJson("/api/quiz/result", { score, total });
  state.stats = result.stats;
  renderMetrics();
  renderStats();

  setStatus(`Quiz completed. Score ${score}/${total}.`);
  setOutput(`Quiz completed.\nScore: ${score}/${total}\nAverage quiz score: ${result.average_quiz_score.toFixed(1)}%`);
}

async function handleAsk() {
  const question = document.getElementById("questionInput").value.trim();
  if (!question) {
    setStatus("Question cannot be empty.", "notice");
    return;
  }

  setStatus("Thinking...");
  const data = await requestJson("/api/ask", {
    question,
    student_name: getSavedName()
  });

  state.stats = data.stats;
  state.history = [...state.history, { question: data.question, answer: data.answer, student_name: getSavedName() || undefined }];
  renderMetrics();
  renderHistory();
  renderStats();
  setOutput(`Question:\n${data.question}\n\nAnswer:\n${data.answer}`);
  setStatus("Answer ready.");
}

async function handleExplain() {
  const topic = document.getElementById("topicInput").value.trim();
  const level = document.getElementById("difficultyLevel").value;
  if (!topic) {
    setStatus("Topic cannot be empty.", "notice");
    return;
  }

  setStatus("Preparing explanation...");
  const data = await requestJson("/api/explain", { topic, level });
  setOutput(`Topic: ${data.topic}\nDifficulty: ${data.level}\n\n${data.answer}`);
  setStatus("Explanation ready.");
}

async function handleSummarize() {
  const text = document.getElementById("summaryInput").value.trim();
  const style = document.getElementById("summaryStyle").value;
  if (!text) {
    setStatus("Text cannot be empty.", "notice");
    return;
  }

  setStatus("Summarizing...");
  const data = await requestJson("/api/summarize", { text, style });
  setOutput(`Style: ${data.style}\n\n${data.answer}`);
  setStatus("Summary ready.");
}

async function handleGenerateQuiz() {
  const topic = document.getElementById("quizTopic").value.trim();
  const level = document.getElementById("quizLevel").value;
  const number_of_questions = Number(document.getElementById("quizCount").value);

  if (!topic) {
    setStatus("Quiz topic cannot be empty.", "notice");
    return;
  }

  setStatus("Generating quiz...");
  const data = await requestJson("/api/quiz/generate", {
    topic,
    level,
    number_of_questions
  });

  renderQuiz(data.quiz);
  setOutput(`Quiz generated for ${data.topic} (${data.level}).`);
  setStatus("Quiz ready.");
}

async function init() {
  els.studentName.value = getSavedName();
  renderGreeting();

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchPanel(btn.dataset.target));
  });

  els.saveName.addEventListener("click", () => {
    saveName(els.studentName.value.trim());
  });

  document.getElementById("askBtn").addEventListener("click", () => {
    handleAsk().catch((error) => {
      setStatus(error.message, "notice");
      setOutput(error.message);
    });
  });

  document.getElementById("explainBtn").addEventListener("click", () => {
    handleExplain().catch((error) => {
      setStatus(error.message, "notice");
      setOutput(error.message);
    });
  });

  document.getElementById("summarizeBtn").addEventListener("click", () => {
    handleSummarize().catch((error) => {
      setStatus(error.message, "notice");
      setOutput(error.message);
    });
  });

  document.getElementById("generateQuizBtn").addEventListener("click", () => {
    handleGenerateQuiz().catch((error) => {
      setStatus(error.message, "notice");
      setOutput(error.message);
    });
  });

  await refreshBootstrap();
}

init().catch((error) => {
  setStatus(error.message, "notice");
  setOutput(error.message);
});

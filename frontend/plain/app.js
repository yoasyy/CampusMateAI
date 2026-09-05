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
  explainOutput: document.getElementById("explainOutput"),
  summarizeOutput: document.getElementById("summarizeOutput"),
  quizOutput: document.getElementById("quizOutput"),
  historyList: document.getElementById("historyList"),
  statsDetails: document.getElementById("statsDetails"),
  quizArea: document.getElementById("quizArea")
  ,chatThread: document.getElementById("chatThread")
};

const chatMessages = [];

function setStatus(message, tone = "") {
  document.querySelectorAll(".status-text").forEach((statusText) => {
    statusText.textContent = message;
    statusText.className = tone ? `status-text notice ${tone}` : "status-text";
  });
}

function setOutput(text, outputId = "askOutput") {
  const output = els[outputId];
  if (!output) {
    chatMessages.push({ role: "assistant", text });
    renderChat();
    return;
  }
  output.querySelector("span").textContent = text;
  output.classList.add("has-output");
}

function renderChat() {
  if (!chatMessages.length) return;
  els.chatThread.innerHTML = chatMessages.map((message) => `
    <div class="chat-message ${message.role}">
      <span class="chat-avatar">${message.role === "user" ? "You" : "AI"}</span>
      <div class="chat-bubble">${escapeHtml(message.text)}</div>
    </div>
  `).join("");
  els.chatThread.scrollTop = els.chatThread.scrollHeight;
}

function restoreChatFromHistory() {
  if (chatMessages.length) return;
  state.history.slice(-8).forEach((item) => {
    if (item.question) chatMessages.push({ role: "user", text: item.question });
    if (item.answer) chatMessages.push({ role: "assistant", text: item.answer });
  });
  renderChat();
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
  const scores = (state.stats.quiz_scores || []).map(Number).filter(Number.isFinite);
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
  const questions = Math.max(0, Number(state.stats.questions_asked) || 0);
  const quizzes = Math.max(0, Number(state.stats.quizzes_completed) || 0);
  const correct = Math.max(0, Number(state.stats.correct_answers) || 0);
  const incorrect = Math.max(0, Number(state.stats.incorrect_answers) || 0);
  const answered = correct + incorrect;
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const scores = (state.stats.quiz_scores || []).map(Number).filter(Number.isFinite).slice(-8);
  const average = averageQuizScore().toFixed(1);
  const scoreBars = scores.length
    ? scores.map((score, index) => `<div class="score-bar-wrap"><span>${index + 1}</span><div class="score-bar"><i style="height: ${Math.min(100, Math.max(0, score))}%"></i></div><small>${Math.round(score)}%</small></div>`).join("")
    : `<p class="chart-empty">Complete a quiz to see your score history.</p>`;

  els.statsDetails.innerHTML = `
    <div class="stats-cards">
      <div class="stat-item"><span>Questions asked</span><strong>${questions}</strong></div>
      <div class="stat-item"><span>Quizzes completed</span><strong>${quizzes}</strong></div>
      <div class="stat-item"><span>Correct answers</span><strong>${correct}</strong></div>
      <div class="stat-item"><span>Average quiz score</span><strong>${average}%</strong></div>
    </div>
    <div class="stats-charts">
      <div class="chart-card">
        <div class="chart-title"><h3>Answer accuracy</h3><strong>${accuracy}%</strong></div>
        <div class="progress-track"><i style="width: ${accuracy}%"></i></div>
        <div class="chart-legend"><span class="legend-correct">Correct ${correct}</span><span>Incorrect ${incorrect}</span></div>
      </div>
      <div class="chart-card">
        <div class="chart-title"><h3>Recent quiz scores</h3><span>${scores.length ? `${scores.length} quizzes` : "No data"}</span></div>
        <div class="score-chart">${scoreBars}</div>
      </div>
    </div>
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

function panelFromPath() {
  const view = window.location.pathname.split("/").filter(Boolean).pop();
  return {
    ask: "askPanel",
    explain: "explainPanel",
    summarize: "summarizePanel",
    quiz: "quizPanel",
    history: "historyPanel",
    stats: "statsPanel"
  }[view] || "askPanel";
}

function applySingleView() {
  const view = window.location.pathname.split("/").filter(Boolean).pop();
  const labels = {
    ask: "Ask AI",
    explain: "Explain",
    summarize: "Summarize",
    quiz: "Quiz",
    history: "History",
    stats: "Stats"
  };

  if (!labels[view]) return;
  document.body.classList.add("single-view");
  document.title = `${labels[view]} | CampusMate AI`;
  const backLink = document.createElement("a");
  backLink.className = "back-link";
  backLink.href = "/";
  backLink.textContent = "<- Back to CampusMate AI";
  document.querySelector(".shell").prepend(backLink);
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
  restoreChatFromHistory();
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
  setOutput(`Score: ${score}/${total}\nAverage quiz score: ${result.average_quiz_score.toFixed(1)}%`, "quizOutput");
}

async function handleAsk() {
  const question = document.getElementById("questionInput").value.trim();
  if (!question) {
    setStatus("Question cannot be empty.", "notice");
    return;
  }

  document.getElementById("questionInput").value = "";
  chatMessages.push({ role: "user", text: question });
  renderChat();
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
  chatMessages.push({ role: "assistant", text: data.answer });
  renderChat();
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
  setOutput(data.answer, "explainOutput");
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
  setOutput(data.answer, "summarizeOutput");
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
  setOutput(`Quiz generated for ${data.topic} (${data.level}).`, "quizOutput");
  setStatus("Quiz ready.");
}

async function init() {
  applySingleView();
  els.studentName.value = getSavedName();
  renderGreeting();

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.target.replace("Panel", "");
      window.location.href = `/app/${view}`;
    });
  });

  els.saveName.addEventListener("click", () => {
    saveName(els.studentName.value.trim());
  });

  document.getElementById("clearChatBtn").addEventListener("click", () => {
    chatMessages.length = 0;
    els.chatThread.innerHTML = `<div class="chat-empty">Ask a question to start your study conversation.</div>`;
    setStatus("Conversation cleared.");
  });

  document.getElementById("questionInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAsk().catch((error) => {
        setStatus(error.message, "notice");
        setOutput(error.message);
      });
    }
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
      setOutput(error.message, "explainOutput");
    });
  });

  document.getElementById("summarizeBtn").addEventListener("click", () => {
    handleSummarize().catch((error) => {
      setStatus(error.message, "notice");
      setOutput(error.message, "summarizeOutput");
    });
  });

  document.getElementById("generateQuizBtn").addEventListener("click", () => {
    handleGenerateQuiz().catch((error) => {
      setStatus(error.message, "notice");
      setOutput(error.message, "quizOutput");
    });
  });

  switchPanel(panelFromPath());

  await refreshBootstrap();
}

init().catch((error) => {
  setStatus(error.message, "notice");
  setOutput(error.message);
});

const { useEffect, useMemo, useState } = React;

const initialStats = {
  questions_asked: 0,
  quizzes_completed: 0,
  correct_answers: 0,
  incorrect_answers: 0,
  quiz_scores: []
};

const validViews = ["ask", "explain", "summarize", "quiz", "history", "stats"];
const pathView = window.location.pathname.split("/").filter(Boolean).pop();
const initialView = validViews.includes(pathView) ? pathView : "ask";
const isSingleView = validViews.includes(pathView);

function App() {
  const [studentName, setStudentName] = useState(localStorage.getItem("campusmate_name") || "");
  const [activeTab, setActiveTab] = useState(initialView);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [status, setStatus] = useState("Ready when you are.");
  const [output, setOutput] = useState("Pick a tool and start learning.");
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [questionDraft, setQuestionDraft] = useState("");

  const averageScore = useMemo(() => {
    const scores = (stats.quiz_scores || []).map(Number).filter(Number.isFinite);
    if (!scores.length) return 0;
    return scores.reduce((sum, value) => sum + value, 0) / scores.length;
  }, [stats]);

  useEffect(() => {
    fetch("/api/bootstrap")
      .then((response) => response.json())
      .then((data) => {
        if (!data.ok) throw new Error("Could not load dashboard data.");
        setHistory(data.history || []);
        setStats(data.stats || initialStats);
        setChatMessages((data.history || []).slice(-8).flatMap((item) => [
          item.question ? { role: "user", text: item.question } : null,
          item.answer ? { role: "assistant", text: item.answer } : null
        ].filter(Boolean)));
      })
      .catch((error) => {
        setStatus(error.message);
        setOutput(error.message);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("campusmate_name", studentName);
  }, [studentName]);

  useEffect(() => {
    document.title = `${activeTab === "ask" ? "Ask AI" : activeTab[0].toUpperCase() + activeTab.slice(1)} | CampusMate AI`;
  }, [activeTab]);

  const requestJson = async (path, payload) => {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Something went wrong.");
    }
    return data;
  };

  const tabs = [
    ["ask", "Ask AI"],
    ["explain", "Explain"],
    ["summarize", "Summarize"],
    ["quiz", "Quiz"],
    ["history", "History"],
    ["stats", "Stats"]
  ];

  const toolOutput = () => (
    <div className="tool-output">
      <p className={status.includes("cannot") || status.includes("invalid") ? "notice" : ""}>{status}</p>
      <pre>{output}</pre>
    </div>
  );

  const chatView = chatMessages.length ? chatMessages.map((message, index) => (
    <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
      <span className="chat-avatar">{message.role === "user" ? "You" : "AI"}</span>
      <div className="chat-bubble">{message.text}</div>
    </div>
  )) : <div className="chat-empty">Ask a question to start your study conversation.</div>;

  const refreshAfterQuestion = (question, answer) => {
    setHistory((current) => [...current, { question, answer, student_name: studentName || undefined }]);
  };

  const handleAsk = async () => {
    const question = questionDraft.trim();
    if (!question) return setStatus("Question cannot be empty.");
    setQuestionDraft("");
    setChatMessages((current) => [...current, { role: "user", text: question }]);
    setLoading(true);
    setStatus("Thinking...");
    try {
      const data = await requestJson("/api/ask", {
        question,
        student_name: studentName
      });
      setStats(data.stats);
      refreshAfterQuestion(data.question, data.answer);
      setChatMessages((current) => [...current, { role: "assistant", text: data.answer }]);
      setStatus("Answer ready.");
    } catch (error) {
      setStatus(error.message);
      setChatMessages((current) => [...current, { role: "assistant", text: error.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    const topic = document.getElementById("topicInput").value.trim();
    const level = document.getElementById("difficultyLevel").value;
    if (!topic) return setStatus("Topic cannot be empty.");
    setLoading(true);
    setStatus("Preparing explanation...");
    try {
      const data = await requestJson("/api/explain", { topic, level });
      setOutput(`Topic: ${data.topic}\nDifficulty: ${data.level}\n\n${data.answer}`);
      setStatus("Explanation ready.");
    } catch (error) {
      setStatus(error.message);
      setOutput(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    const text = document.getElementById("summaryInput").value.trim();
    const style = document.getElementById("summaryStyle").value;
    if (!text) return setStatus("Text cannot be empty.");
    setLoading(true);
    setStatus("Summarizing...");
    try {
      const data = await requestJson("/api/summarize", { text, style });
      setOutput(`Style: ${data.style}\n\n${data.answer}`);
      setStatus("Summary ready.");
    } catch (error) {
      setStatus(error.message);
      setOutput(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderQuiz = () => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return <div className="quiz-item">No quiz questions were generated.</div>;
    }

    return (
      <>
        {quiz.questions.map((question, index) => (
          <div className="quiz-item" key={index}>
            <h3>{index + 1}. {question.question}</h3>
            <div className="quiz-options">
              {question.options.map((option, optionIndex) => (
                <label className="quiz-choice" key={optionIndex}>
                  <input type="radio" name={`q-${index}`} value={optionIndex} />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <button className="primary" onClick={gradeQuiz}>Submit quiz</button>
      </>
    );
  };

  const gradeQuiz = async () => {
    if (!quiz || !quiz.questions) {
      setStatus("Generate a quiz first.");
      return;
    }

    let score = 0;
    const total = quiz.questions.length;

    quiz.questions.forEach((question, index) => {
      const checked = document.querySelector(`input[name="q-${index}"]:checked`);
      if (checked && Number(checked.value) === Number(question.correct_index)) {
        score += 1;
      }
    });

    setLoading(true);
    try {
      const data = await requestJson("/api/quiz/result", { score, total });
      setStats(data.stats);
      setStatus(`Quiz completed. Score ${score}/${total}.`);
      setOutput(`Quiz completed.\nScore: ${score}/${total}\nAverage quiz score: ${data.average_quiz_score.toFixed(1)}%`);
    } catch (error) {
      setStatus(error.message);
      setOutput(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    const topic = document.getElementById("quizTopic").value.trim();
    const level = document.getElementById("quizLevel").value;
    const number_of_questions = Number(document.getElementById("quizCount").value);
    if (!topic) return setStatus("Quiz topic cannot be empty.");
    setLoading(true);
    setStatus("Generating quiz...");
    try {
      const data = await requestJson("/api/quiz/generate", {
        topic,
        level,
        number_of_questions
      });
      setQuiz(data.quiz);
      setOutput(`Quiz generated for ${data.topic} (${data.level}).`);
      setStatus("Quiz ready.");
    } catch (error) {
      setStatus(error.message);
      setOutput(error.message);
    } finally {
      setLoading(false);
    }
  };

  const historyView = history.length ? (
    history.slice().reverse().map((item, index) => (
      <div className="list-item" key={index}>
        <h3>{item.student_name || "Student"}</h3>
        <p><strong>Q:</strong> {item.question}</p>
        <p><strong>A:</strong> {item.answer}</p>
      </div>
    ))
  ) : (
    <div className="list-item">
      <h3>No history yet</h3>
      <p>Ask a question to create your first saved answer.</p>
    </div>
  );

  const correctAnswers = Math.max(0, Number(stats.correct_answers) || 0);
  const incorrectAnswers = Math.max(0, Number(stats.incorrect_answers) || 0);
  const answeredQuestions = correctAnswers + incorrectAnswers;
  const accuracy = answeredQuestions ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;
  const scoreHistory = (stats.quiz_scores || []).map(Number).filter(Number.isFinite).slice(-8);
  const statsView = (
    <>
      <div className="stats-cards">
        <div className="stat-item"><span>Questions asked</span><strong>{Math.max(0, Number(stats.questions_asked) || 0)}</strong></div>
        <div className="stat-item"><span>Quizzes completed</span><strong>{Math.max(0, Number(stats.quizzes_completed) || 0)}</strong></div>
        <div className="stat-item"><span>Correct answers</span><strong>{correctAnswers}</strong></div>
        <div className="stat-item"><span>Average quiz score</span><strong>{averageScore.toFixed(1)}%</strong></div>
      </div>
      <div className="stats-charts">
        <div className="chart-card">
          <div className="chart-title"><h3>Answer accuracy</h3><strong>{accuracy}%</strong></div>
          <div className="progress-track"><i style={{ width: `${accuracy}%` }} /></div>
          <div className="chart-legend"><span className="legend-correct">Correct {correctAnswers}</span><span>Incorrect {incorrectAnswers}</span></div>
        </div>
        <div className="chart-card">
          <div className="chart-title"><h3>Recent quiz scores</h3><span>{scoreHistory.length ? `${scoreHistory.length} quizzes` : "No data"}</span></div>
          <div className="score-chart">
            {scoreHistory.length ? scoreHistory.map((score, index) => (
              <div className="score-bar-wrap" key={`${score}-${index}`}><span>{index + 1}</span><div className="score-bar"><i style={{ height: `${Math.min(100, Math.max(0, score))}%` }} /></div><small>{Math.round(score)}%</small></div>
            )) : <p className="chart-empty">Complete a quiz to see your score history.</p>}
          </div>
        </div>
      </div>
    </>
  );

  const activeCard = {
    ask: (
      <div className="card active">
        <h2>Ask CampusMate</h2>
        <p>Have a natural conversation with your study co-pilot.</p>
        <button className="primary chat-clear" type="button" onClick={() => { setChatMessages([]); setStatus("Conversation cleared."); }}>Clear conversation</button>
        <div className="chat-thread" aria-live="polite">{chatView}</div>
        <div className="chat-composer">
          <textarea
            id="questionInput"
            rows="1"
            placeholder="Message CampusMate..."
            value={questionDraft}
            onChange={(event) => setQuestionDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleAsk();
              }
            }}
          />
          <button className="primary" onClick={handleAsk} disabled={loading}>Send</button>
        </div>
      </div>
    ),
    explain: (
      <div className="card active">
        <h2>Explain a topic</h2>
        <p>Choose a difficulty level so the explanation matches your pace.</p>
        <input id="topicInput" type="text" placeholder="Enter a topic" />
        <select id="difficultyLevel" defaultValue="beginner">
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button className="primary" onClick={handleExplain} disabled={loading}>Explain topic</button>
        {toolOutput()}
      </div>
    ),
    summarize: (
      <div className="card active">
        <h2>Summarize text</h2>
        <p>Trim long content into a focused summary or bullet points.</p>
        <textarea id="summaryInput" placeholder="Paste text to summarize..." />
        <select id="summaryStyle" defaultValue="short">
          <option value="short">Short</option>
          <option value="detailed">Detailed</option>
          <option value="bullet points">Bullet Points</option>
          <option value="beginner-friendly">Beginner-Friendly</option>
        </select>
        <button className="primary" onClick={handleSummarize} disabled={loading}>Summarize</button>
        {toolOutput()}
      </div>
    ),
    quiz: (
      <div className="card active">
        <h2>Generate quiz</h2>
        <p>Create a multiple-choice quiz and grade it in the browser.</p>
        <div className="split-grid">
          <input id="quizTopic" type="text" placeholder="Quiz topic" />
          <select id="quizLevel" defaultValue="beginner">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <input id="quizCount" type="number" min="1" defaultValue="4" />
        <button className="primary" onClick={handleGenerateQuiz} disabled={loading}>Generate quiz</button>
        <div className="quiz-list">{renderQuiz()}</div>
        {toolOutput()}
      </div>
    ),
    history: (
      <div className="card active">
        <h2>Previous questions</h2>
        <p>Your recent questions and answers stay saved locally.</p>
        <div className="stack">{historyView}</div>
      </div>
    ),
    stats: (
      <div className="card active">
        <h2>Learning stats</h2>
        <p>Track how your study sessions are building up over time.</p>
        <div className="stack">{statsView}</div>
      </div>
    )
  }[activeTab];

  return (
    <main className={`app-shell ${isSingleView ? "single-view" : ""}`}>
      {isSingleView && <a className="back-link" href="/">&lt;- Back to CampusMate AI</a>}
      <section className="hero">
        <div>
          <p className="eyebrow">CampusMate AI</p>
          <h1>Your study co-pilot for questions, summaries, and quizzes.</h1>
          <p className="lede">Use the same learning tools from the CLI in a polished browser interface. Ask questions, explain topics, summarize text, and generate quizzes from one dashboard.</p>
          <div className="hero-tags" aria-label="CampusMate features">
            <span><i /> AI tutor</span>
            <span><i /> Progress tracked</span>
            <span><i /> Built for students</span>
          </div>
        </div>
        <div className="profile">
          <label htmlFor="studentName">Student name</label>
          <div className="profile-row">
            <input
              id="studentName"
              type="text"
              placeholder="Enter your name"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
            />
            <button className="primary" onClick={() => localStorage.setItem("campusmate_name", studentName.trim())}>Save</button>
          </div>
          <p className="muted">{studentName ? `You are browsing as ${studentName}.` : "You are browsing as a guest."}</p>
        </div>
      </section>

      <section className="metrics">
        <article className="metric"><span>Questions asked</span><strong>{stats.questions_asked ?? 0}</strong></article>
        <article className="metric"><span>Quizzes completed</span><strong>{stats.quizzes_completed ?? 0}</strong></article>
        <article className="metric"><span>Average quiz score</span><strong>{averageScore.toFixed(1)}%</strong></article>
        <article className="metric"><span>Knowledge sparks</span><strong>4</strong></article>
      </section>

      <section className="workspace">
        <aside className="sidebar">
          <a className="sidebar-home" href="/">CampusMate AI <span>Home</span></a>
          <div className="sidebar-label">Study tools</div>
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={activeTab === key ? "active" : ""}
              onClick={() => {
                window.location.href = `/react/${key}`;
              }}
            >
              {label}
            </button>
          ))}
        </aside>

        <section className="content">
          {activeCard}
        </section>
      </section>

    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

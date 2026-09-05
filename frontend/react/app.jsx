const { useEffect, useMemo, useState } = React;

const initialStats = {
  questions_asked: 0,
  quizzes_completed: 0,
  correct_answers: 0,
  incorrect_answers: 0,
  quiz_scores: []
};

function App() {
  const [studentName, setStudentName] = useState(localStorage.getItem("campusmate_name") || "");
  const [activeTab, setActiveTab] = useState("ask");
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [status, setStatus] = useState("Ready when you are.");
  const [output, setOutput] = useState("Pick a tool and start learning.");
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);

  const averageScore = useMemo(() => {
    const scores = stats.quiz_scores || [];
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
      })
      .catch((error) => {
        setStatus(error.message);
        setOutput(error.message);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("campusmate_name", studentName);
  }, [studentName]);

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

  const refreshAfterQuestion = (question, answer) => {
    setHistory((current) => [...current, { question, answer, student_name: studentName || undefined }]);
  };

  const handleAsk = async () => {
    const question = document.getElementById("questionInput").value.trim();
    if (!question) return setStatus("Question cannot be empty.");
    setLoading(true);
    setStatus("Thinking...");
    try {
      const data = await requestJson("/api/ask", {
        question,
        student_name: studentName
      });
      setStats(data.stats);
      refreshAfterQuestion(data.question, data.answer);
      setOutput(`Question:\n${data.question}\n\nAnswer:\n${data.answer}`);
      setStatus("Answer ready.");
    } catch (error) {
      setStatus(error.message);
      setOutput(error.message);
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

  const statsView = (
    <>
      <div className="list-item"><h3>Questions asked</h3><p>{stats.questions_asked ?? 0}</p></div>
      <div className="list-item"><h3>Quizzes completed</h3><p>{stats.quizzes_completed ?? 0}</p></div>
      <div className="list-item"><h3>Correct answers</h3><p>{stats.correct_answers ?? 0}</p></div>
      <div className="list-item"><h3>Incorrect answers</h3><p>{stats.incorrect_answers ?? 0}</p></div>
      <div className="list-item"><h3>Average quiz score</h3><p>{averageScore.toFixed(1)}%</p></div>
    </>
  );

  const activeCard = {
    ask: (
      <div className="card active">
        <h2>Ask a question</h2>
        <p>Get direct help with study questions, homework, and concepts.</p>
        <textarea id="questionInput" placeholder="Ask anything study-related..." />
        <button className="primary" onClick={handleAsk} disabled={loading}>Get answer</button>
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
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">CampusMate AI</p>
          <h1>Your study co-pilot for questions, summaries, and quizzes.</h1>
          <p className="lede">Use the same learning tools from the CLI in a polished browser interface. Ask questions, explain topics, summarize text, and generate quizzes from one dashboard.</p>
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
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={activeTab === key ? "active" : ""}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </aside>

        <section className="content">
          {activeCard}
        </section>
      </section>

      <section className="output">
        <h2>Workspace output</h2>
        <p className={status.includes("cannot") || status.includes("invalid") ? "notice" : ""}>{status}</p>
        <pre>{output}</pre>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

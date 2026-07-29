import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getQuestions } from "../services/questions";
import { submitAnswer } from "../services/submissions";
import type { Question } from "../types/question";
import type { Submission } from "../types/submission";

const PALETTE = {
  cream: "#F7EFE0",
  panel: "#EFE3CD",
  deepCream: "#E6D5B8",
  ink: "#2A1810",
  accent: "#E5733B",
  accentDeep: "#C4541F",
  soft: "#FBF6EC",
  green: "#4E8D7C",
  greenDeep: "#386F60",
};

export default function ChildSolvePage() {
  const { materialId } = useParams<{ materialId: string }>();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Flow states
  const [step, setStep] = useState<"welcome" | "solve" | "feedback" | "completed">("welcome");
  const [childName, setChildName] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Solving states
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);

  // Summary state
  const [gradedSubmissions, setGradedSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (materialId) {
      loadQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId]);

  async function loadQuestions() {
    if (!materialId) return;
    try {
      setLoading(true);
      setError("");
      // Fetch public questions (only returns is_selected=true)
      const data = await getQuestions(materialId);
      setQuestions(data);
    } catch (err) {
      setError("We had trouble loading the questions. Please verify the link with your parents!");
    } finally {
      setLoading(false);
    }
  }

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!childName.trim()) return;
    setStep("solve");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || submitting) return;

    const currentQuestion = questions[currentIndex];

    try {
      setSubmitting(true);
      const submission = await submitAnswer(currentQuestion.id, childName.trim(), answer.trim());
      setLastSubmission(submission);
      setGradedSubmissions((prev) => [...prev, submission]);
      setStep("feedback");
    } catch (err) {
      console.error("Submission failed", err);
      alert("Uh oh! We had a small problem submitting your answer. Let's try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    setAnswer("");
    setLastSubmission(null);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setStep("solve");
    } else {
      setStep("completed");
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: PALETTE.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign: "center", color: PALETTE.ink, opacity: 0.6 }}>Loading your study nest...</div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: PALETTE.cream, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ width: "100%", maxWidth: 440, background: PALETTE.panel, borderRadius: 24, padding: 36, textAlign: "center", boxShadow: `0 8px 0 ${PALETTE.deepCream}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🦉</div>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: PALETTE.ink, marginBottom: 12 }}>No Questions Ready Yet</h3>
          <p style={{ fontSize: 14, opacity: 0.65, lineHeight: 1.5, marginBottom: 24 }}>
            {error || "Ask your parent to assign some questions to this study challenge from their dashboard!"}
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.cream, color: PALETTE.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>

      {/* 1. Welcome Screen */}
      {step === "welcome" && (
        <div style={{ width: "100%", maxWidth: 480, background: PALETTE.panel, borderRadius: 28, padding: "48px 36px", boxShadow: `0 8px 0 ${PALETTE.deepCream}`, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🦉</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, margin: "0 0 12px" }}>
            Ready for a <span style={{ color: PALETTE.accent, fontStyle: "italic" }}>Challenge</span>?
          </h1>
          <p style={{ fontSize: 15, opacity: 0.65, marginBottom: 32, lineHeight: 1.5 }}>
            You have <strong>{questions.length}</strong> questions waiting for you. Enter your name below to start!
          </p>

          <form onSubmit={handleStart} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="text"
              placeholder="What is your name?"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              style={{ width: "100%", background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 12, padding: "14px 20px", fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box", textAlign: "center", fontWeight: 600 }}
            />
            <button
              type="submit"
              disabled={!childName.trim()}
              style={{ width: "100%", background: PALETTE.accent, color: "#fff", border: "none", borderRadius: 14, padding: "14px 20px", fontSize: 16, fontWeight: 700, cursor: childName.trim() ? "pointer" : "not-allowed", boxShadow: `0 5px 0 ${PALETTE.accentDeep}`, opacity: childName.trim() ? 1 : 0.7 }}
            >
              {"Let's Go!"}
            </button>
          </form>
        </div>
      )}

      {/* 2. Solve Screen */}
      {step === "solve" && (
        <div style={{ width: "100%", maxWidth: 580, background: PALETTE.panel, borderRadius: 28, padding: "40px 36px", boxShadow: `0 8px 0 ${PALETTE.deepCream}` }}>

          {/* Progress Indicator */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, fontSize: 13, fontWeight: 700, opacity: 0.6 }}>
            <span>STUDENT: {childName.toUpperCase()}</span>
            <span style={{ color: PALETTE.accent }}>QUESTION {currentIndex + 1} OF {questions.length}</span>
          </div>

          {/* Progress bar */}
          <div style={{ width: "100%", height: 8, background: PALETTE.soft, borderRadius: 4, overflow: "hidden", marginBottom: 32 }}>
            <div style={{ width: `${((currentIndex) / questions.length) * 100}%`, height: "100%", background: PALETTE.green, borderRadius: 4, transition: "width 0.3s ease" }} />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, lineHeight: 1.4 }}>
            {currentQuestion.question}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {currentQuestion.type === "mcq" && currentQuestion.options ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentQuestion.options.map((opt) => {
                  const isSelected = answer === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(opt)}
                      disabled={submitting}
                      style={{ width: "100%", background: isSelected ? PALETTE.soft : "#FFF1DC", border: isSelected ? `2px solid ${PALETTE.accent}` : `1.5px solid ${PALETTE.deepCream}`, borderRadius: 12, padding: "16px 20px", fontSize: 15, fontWeight: 600, textAlign: "left", cursor: "pointer", transition: "transform 0.1s" }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={submitting}
                rows={5}
                style={{ width: "100%", background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 12, padding: "16px", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "none", lineHeight: 1.5 }}
              />
            )}

            <button
              type="submit"
              disabled={!answer.trim() || submitting}
              style={{ width: "100%", background: PALETTE.green, color: "#fff", border: "none", borderRadius: 14, padding: "14px 20px", fontSize: 16, fontWeight: 700, cursor: answer.trim() && !submitting ? "pointer" : "not-allowed", boxShadow: `0 5px 0 ${PALETTE.greenDeep}`, opacity: answer.trim() && !submitting ? 1 : 0.7, marginTop: 8, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ display: "inline-block", width: 14, height: 14, border: "2.5px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Owl Mascot is reading your answer...
                </>
              ) : (
                "Submit Answer"
              )}
            </button>

          </form>
        </div>
      )}

      {/* 3. Feedback / Grade Screen */}
      {step === "feedback" && lastSubmission && (
        <div style={{ width: "100%", maxWidth: 580, background: PALETTE.panel, borderRadius: 28, padding: "40px 36px", boxShadow: `0 8px 0 ${PALETTE.deepCream}`, textAlign: "center" }}>

          <div style={{ fontSize: 56, marginBottom: 12 }}>🦉</div>

          <div style={{ display: "inline-flex", background: lastSubmission.score && lastSubmission.score >= 80 ? "#E8F4F1" : "#FFFBF4", color: lastSubmission.score && lastSubmission.score >= 80 ? PALETTE.greenDeep : "#9E7A3B", borderRadius: 12, padding: "8px 16px", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
            {lastSubmission.score && lastSubmission.score >= 80 ? "⭐ Fantastic! " : "👍 Nice effort! "}
            {lastSubmission.score}/100
          </div>

          <div style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 16, padding: 24, textAlign: "left", marginBottom: 24 }}>
            <h4 style={{ color: PALETTE.greenDeep, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>AI Feedback</h4>
            <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0, color: PALETTE.ink }}>{lastSubmission.feedback}</p>

            {lastSubmission.suggestions && (
              <>
                <h4 style={{ color: PALETTE.accentDeep, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 20, marginBottom: 8 }}>Tip for next time</h4>
                <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0, opacity: 0.9 }}>{lastSubmission.suggestions}</p>
              </>
            )}
          </div>

          <button
            onClick={handleNext}
            style={{ width: "100%", background: PALETTE.accent, color: "#fff", border: "none", borderRadius: 14, padding: "14px 20px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: `0 5px 0 ${PALETTE.accentDeep}` }}
          >
            {currentIndex + 1 < questions.length ? "Next Question" : "Complete Challenge"}
          </button>
        </div>
      )}

      {/* 4. Completed Screen */}
      {step === "completed" && (
        <div style={{ width: "100%", maxWidth: 480, background: PALETTE.panel, borderRadius: 28, padding: "48px 36px", boxShadow: `0 8px 0 ${PALETTE.deepCream}`, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, margin: "0 0 12px" }}>
            Challenge Complete!
          </h1>
          <p style={{ fontSize: 15, opacity: 0.65, marginBottom: 32, lineHeight: 1.5 }}>
            Super job, <strong>{childName}</strong>! You answered all <strong>{questions.length}</strong> questions in this activity.
          </p>

          <div style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 16, padding: "20px 24px", marginBottom: 32, textAlign: "left" }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: PALETTE.greenDeep, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Your Scores</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {gradedSubmissions.map((sub, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, borderBottom: i < gradedSubmissions.length - 1 ? `1px dashed ${PALETTE.deepCream}` : "none", paddingBottom: i < gradedSubmissions.length - 1 ? 8 : 0 }}>
                  <span style={{ fontWeight: 600 }}>Question {i + 1}</span>
                  <span style={{ fontWeight: 700, color: sub.score && sub.score >= 80 ? PALETTE.greenDeep : PALETTE.accentDeep }}>
                    {sub.score}/100
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 13, opacity: 0.5, lineHeight: 1.4, margin: 0 }}>
            Show this screen to your parents to show them how well you did! You can now close this tab.
          </p>
        </div>
      )}

      {/* Embedded CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

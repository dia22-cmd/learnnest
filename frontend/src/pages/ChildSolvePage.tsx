import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getQuestions } from "../services/questions";
import { submitAnswer } from "../services/submissions";
import type { Question, MatchFollowingOptions, MatchItem } from "../types/question";
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
  const [searchParams] = useSearchParams();
  const childIdParam = searchParams.get("child_id") || null;
  const childNameParam = searchParams.get("child_name") || "";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Flow states
  const [step, setStep] = useState<"welcome" | "solve" | "feedback" | "completed">(
    childNameParam ? "solve" : "welcome"
  );
  const [childName, setChildName] = useState(childNameParam);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Solving states
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);

  // New interactive states
  const [blankAnswers, setBlankAnswers] = useState<Record<string, string>>({});
  const [matchAnswers, setMatchAnswers] = useState<Record<string, string>>({});
  const [activeLeftId, setActiveLeftId] = useState<string | null>(null);
  const [gradedSubmissions, setGradedSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (materialId) {
      loadQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId]);

  useEffect(() => {
    setBlankAnswers({});
    setMatchAnswers({});
    setActiveLeftId(null);
    setAnswer("");
  }, [currentIndex]);

  function isSubmitDisabled() {
    if (submitting) return true;
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return true;

    if (currentQuestion.type === "fill_blank") {
      const matchCount = (currentQuestion.question.match(/\[blank_\d+\]/g) || []).length;
      if (matchCount === 0) return true;
      const filledCount = Object.keys(blankAnswers).filter(k => blankAnswers[k]?.trim()).length;
      return filledCount < matchCount;
    }
    if (currentQuestion.type === "match_following") {
      const matchOpts = currentQuestion.options as MatchFollowingOptions;
      const leftCount = (matchOpts?.left || []).length;
      if (leftCount === 0) return true;
      const filledCount = Object.keys(matchAnswers).length;
      return filledCount < leftCount;
    }
    return !answer.trim();
  }

  function renderFillInTheBlank(text: string) {
    const parts = text.split(/(\[blank_\d+\])/g);
    return (
      <div style={{ fontSize: 18, lineHeight: 1.8, color: PALETTE.ink, margin: "24px 0", fontWeight: 500 }}>
        {parts.map((part, i) => {
          const match = part.match(/\[blank_(\d+)\]/);
          if (match) {
            const blankId = `blank_${match[1]}`;
            return (
              <input
                key={i}
                type="text"
                value={blankAnswers[blankId] || ""}
                onChange={(e) => {
                  setBlankAnswers((prev) => ({
                    ...prev,
                    [blankId]: e.target.value,
                  }));
                }}
                placeholder="..."
                disabled={submitting}
                style={{
                  display: "inline-block",
                  margin: "0 8px",
                  padding: "4px 10px",
                  border: "none",
                  borderBottom: `2.5px solid ${PALETTE.accent}`,
                  background: PALETTE.soft,
                  borderRadius: "6px 6px 0 0",
                  width: "140px",
                  textAlign: "center",
                  fontSize: "17px",
                  fontWeight: 700,
                  color: PALETTE.ink,
                  outline: "none",
                }}
              />
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  }

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
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion || submitting) return;

    let answerText = answer.trim();
    if (currentQuestion.type === "fill_blank") {
      answerText = JSON.stringify(blankAnswers);
    } else if (currentQuestion.type === "match_following") {
      answerText = JSON.stringify(matchAnswers);
    }

    if (!answerText) return;

    try {
      setSubmitting(true);
      const submission = await submitAnswer(currentQuestion.id, childName.trim(), answerText, childIdParam);
      setLastSubmission(submission);
      setGradedSubmissions((prev) => [...prev, submission]);
      setStep("feedback");
    } catch (err: unknown) {
      console.error("Submission failed", err);
      const errorWithResponse = err as { response?: { data?: { detail?: string } } };
      const serverMsg = errorWithResponse.response?.data?.detail || "Uh oh! We had a small problem submitting your answer. Let's try again.";
      alert(serverMsg);
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

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {currentQuestion.type === "mcq" && Array.isArray(currentQuestion.options) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentQuestion.options.map((opt: string) => {
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
            )}

            {currentQuestion.type === "true_false" && (
              <div style={{ display: "flex", gap: 16 }}>
                <button
                  type="button"
                  onClick={() => setAnswer("True")}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    background: answer === "True" ? "#E8F4F1" : "#FFF1DC",
                    border: answer === "True" ? `2.5px solid ${PALETTE.green}` : `1.5px solid ${PALETTE.deepCream}`,
                    borderRadius: 16,
                    padding: "24px 16px",
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    color: PALETTE.ink,
                  }}
                >
                  <span style={{ fontSize: 28, color: PALETTE.green }}>✓</span>
                  True
                </button>
                <button
                  type="button"
                  onClick={() => setAnswer("False")}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    background: answer === "False" ? "#FCEEE7" : "#FFF1DC",
                    border: answer === "False" ? `2.5px solid ${PALETTE.accent}` : `1.5px solid ${PALETTE.deepCream}`,
                    borderRadius: 16,
                    padding: "24px 16px",
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    color: PALETTE.ink,
                  }}
                >
                  <span style={{ fontSize: 28, color: PALETTE.accent }}>✗</span>
                  False
                </button>
              </div>
            )}

            {currentQuestion.type === "fill_blank" && (
              renderFillInTheBlank(currentQuestion.question)
            )}

            {currentQuestion.type === "match_following" && (() => {
              const matchOpts = currentQuestion.options as MatchFollowingOptions;
              const leftItems = matchOpts?.left || [];
              const rightItems = matchOpts?.right || [];

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 20 }}>
                    {/* Left Column */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 13, opacity: 0.6, fontWeight: 700, textTransform: "uppercase" }}>Concepts</h4>
                      {leftItems.map((item: MatchItem) => {
                        const isSelected = activeLeftId === item.id;
                        const pairedRightId = matchAnswers[item.id];
                        const pairedRightItem = rightItems.find((r: MatchItem) => r.id === pairedRightId);

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (!submitting) {
                                setActiveLeftId(item.id);
                              }
                            }}
                            style={{
                              background: isSelected ? "#E8F4F1" : "#FFF1DC",
                              border: isSelected ? `2.5px solid ${PALETTE.green}` : `1.5px solid ${PALETTE.deepCream}`,
                              borderRadius: 12,
                              padding: "16px",
                              cursor: "pointer",
                              fontSize: 15,
                              fontWeight: 700,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              color: PALETTE.ink,
                            }}
                          >
                            <span>{item.text}</span>
                            {pairedRightItem && (
                              <span style={{ fontSize: 11, background: PALETTE.green, color: "#fff", padding: "4px 8px", borderRadius: 8, fontWeight: 700 }}>
                                Linked
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 13, opacity: 0.6, fontWeight: 700, textTransform: "uppercase" }}>Matches</h4>
                      {rightItems.map((item: MatchItem) => {
                        const pairedLeftKey = Object.keys(matchAnswers).find(key => matchAnswers[key] === item.id);
                        const pairedLeftItem = leftItems.find((l: MatchItem) => l.id === pairedLeftKey);
                        const isSelectable = activeLeftId !== null;

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (!submitting && activeLeftId) {
                                setMatchAnswers((prev) => {
                                  const updated = { ...prev };
                                  Object.keys(updated).forEach(key => {
                                    if (updated[key] === item.id) {
                                      delete updated[key];
                                    }
                                  });
                                  updated[activeLeftId] = item.id;
                                  return updated;
                                });
                                setActiveLeftId(null);
                              }
                            }}
                            style={{
                              background: pairedLeftItem ? "#E8F4F1" : "#FFF1DC",
                              border: pairedLeftItem ? `2.5px solid ${PALETTE.green}` : isSelectable ? `1.5px dashed ${PALETTE.green}` : `1.5px solid ${PALETTE.deepCream}`,
                              borderRadius: 12,
                              padding: "16px",
                              cursor: isSelectable ? "pointer" : "default",
                              fontSize: 15,
                              fontWeight: 600,
                              opacity: isSelectable || pairedLeftItem ? 1 : 0.65,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              color: PALETTE.ink,
                            }}
                          >
                            <span>{item.text}</span>
                            {pairedLeftItem && (
                              <span style={{ fontSize: 11, background: PALETTE.accent, color: "#fff", padding: "4px 8px", borderRadius: 8, fontWeight: 700 }}>
                                {pairedLeftItem.text}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Connections List */}
                  {Object.keys(matchAnswers).length > 0 && (
                    <div style={{ background: PALETTE.soft, borderRadius: 12, padding: "16px 20px", marginTop: 8 }}>
                      <h5 style={{ margin: "0 0 10px 0", fontSize: 13, opacity: 0.6, fontWeight: 700 }}>CURRENT CONNECTIONS:</h5>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {Object.entries(matchAnswers).map(([lId, rId]) => {
                          const lItem = leftItems.find((l: MatchItem) => l.id === lId);
                          const rItem = rightItems.find((r: MatchItem) => r.id === rId);
                          if (!lItem || !rItem) return null;
                          return (
                            <div key={lId} style={{ background: "#fff", border: `1px solid ${PALETTE.deepCream}`, padding: "6px 12px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                              <span>{lItem.text} 🔗 {rItem.text}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setMatchAnswers((prev) => {
                                    const updated = { ...prev };
                                    delete updated[lId];
                                    return updated;
                                  });
                                }}
                                style={{ background: "transparent", border: "none", color: PALETTE.accent, cursor: "pointer", fontWeight: 700, padding: 0 }}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {currentQuestion.type === "short_answer" && (
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
              disabled={isSubmitDisabled()}
              style={{ width: "100%", background: PALETTE.green, color: "#fff", border: "none", borderRadius: 14, padding: "14px 20px", fontSize: 16, fontWeight: 700, cursor: !isSubmitDisabled() ? "pointer" : "not-allowed", boxShadow: `0 5px 0 ${PALETTE.greenDeep}`, opacity: !isSubmitDisabled() ? 1 : 0.7, marginTop: 8, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
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

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMaterialDetail } from "../services/materials";
import { generateQuestions, getQuestions, selectQuestion } from "../services/questions";
import { getSubmissions } from "../services/submissions";
import type { MaterialDetail } from "../types/material";
import type { Question } from "../types/question";
import type { SubmissionDetail } from "../types/submission";

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

export default function MaterialDetailPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();

  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDetail[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "submissions">("questions");

  // Question gen inputs
  const [genCount, setGenCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  // Share link states
  const [copied, setCopied] = useState(false);

  // Expand text state
  const [textExpanded, setTextExpanded] = useState(false);

  useEffect(() => {
    if (materialId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId]);

  async function loadData() {
    if (!materialId) return;
    try {
      setLoading(true);
      const mat = await getMaterialDetail(materialId);
      setMaterial(mat);

      const qList = await getQuestions(materialId);
      setQuestions(qList);

      const subList = await getSubmissions(materialId);
      setSubmissions(subList);
    } catch (err) {
      console.error("Failed to load material details", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!materialId) return;

    try {
      setGenerating(true);
      setGenError("");
      const newQs = await generateQuestions(materialId, genCount);
      setQuestions((prev) => [...prev, ...newQs]);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      const errMsg = axiosError.response?.data?.detail || "Question generation failed. Verify Gemini API Key.";
      setGenError(errMsg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleSelect(questionId: string, currentSelected: boolean) {
    try {
      const res = await selectQuestion(questionId, !currentSelected);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, is_selected: res.is_selected } : q))
      );
    } catch (err) {
      console.error("Failed to toggle selection", err);
    }
  }

  function getShareUrl() {
    return `${window.location.origin}/solve/${materialId}`;
  }

  function copyShareUrl() {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: PALETTE.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>
        <div style={{ textAlign: "center", color: PALETTE.ink, opacity: 0.6 }}>Loading study nest...</div>
      </div>
    );
  }

  if (!material) {
    return (
      <div style={{ minHeight: "100vh", background: PALETTE.cream, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div>
          <h3>Material not found</h3>
          <button onClick={() => navigate("/welcome")} style={{ marginTop: 12, background: PALETTE.accent, color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer" }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedCount = questions.filter((q) => q.is_selected).length;

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.cream, color: PALETTE.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>

        {/* Back navigation */}
        <button
          onClick={() => navigate("/welcome")}
          style={{ background: "transparent", border: "none", color: PALETTE.ink, opacity: 0.7, fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", marginBottom: 24, padding: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Dashboard
        </button>

        {/* Material Summary Header Card */}
        <div style={{ background: PALETTE.panel, borderRadius: 24, padding: "32px 32px 24px", boxShadow: `0 8px 0 ${PALETTE.deepCream}`, marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: PALETTE.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>Study Material</span>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, margin: "4px 0 8px", color: PALETTE.ink }}>{material.title}</h1>
              <div style={{ fontSize: 13, opacity: 0.5 }}>
                Uploaded on {new Date(material.created_at).toLocaleDateString(undefined, { dateStyle: "long" })}
              </div>
            </div>
            {material.file_url && (
              <a
                href={material.file_url}
                target="_blank"
                rel="noreferrer"
                style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: PALETTE.ink, textDecoration: "none", cursor: "pointer" }}
              >
                View original PDF ↗
              </a>
            )}
          </div>

          <div style={{ borderTop: `1.5px solid ${PALETTE.deepCream}`, marginTop: 24, paddingTop: 16 }}>
            <button
              onClick={() => setTextExpanded(!textExpanded)}
              style={{ background: "transparent", border: "none", color: PALETTE.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}
            >
              {textExpanded ? "Hide extracted text" : "Show extracted text"}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: textExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {textExpanded && (
              <div style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.deepCream}`, borderRadius: 12, padding: 18, marginTop: 12, fontSize: 13, lineHeight: 1.6, maxHeight: 240, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                {material.raw_text}
              </div>
            )}
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: "flex", gap: 12, borderBottom: `2.5px solid ${PALETTE.panel}`, marginBottom: 28, paddingBottom: 2 }}>
          <button
            onClick={() => setActiveTab("questions")}
            style={{ background: "transparent", border: "none", fontSize: 16, fontWeight: 700, color: activeTab === "questions" ? PALETTE.accent : PALETTE.ink, opacity: activeTab === "questions" ? 1 : 0.5, cursor: "pointer", padding: "8px 16px", position: "relative" }}
          >
            Questions ({questions.length})
            {activeTab === "questions" && (
              <span style={{ position: "absolute", left: 0, right: 0, bottom: -4, height: 3, borderRadius: 2, background: PALETTE.accent }} />
            )}
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            style={{ background: "transparent", border: "none", fontSize: 16, fontWeight: 700, color: activeTab === "submissions" ? PALETTE.accent : PALETTE.ink, opacity: activeTab === "submissions" ? 1 : 0.5, cursor: "pointer", padding: "8px 16px", position: "relative" }}
          >
            Submissions ({submissions.length})
            {activeTab === "submissions" && (
              <span style={{ position: "absolute", left: 0, right: 0, bottom: -4, height: 3, borderRadius: 2, background: PALETTE.accent }} />
            )}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "questions" ? (
          <div>

            {/* Share link block */}
            {selectedCount > 0 && (
              <div style={{ background: PALETTE.soft, border: `2.5px dashed ${PALETTE.accent}`, borderRadius: 16, padding: "20px 24px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>🎉 Ready to assign!</h4>
                  <p style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                    You have selected <strong>{selectedCount}</strong> questions. Copy the link below to share with your child.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexGrow: 1, maxWidth: 440 }}>
                  <input
                    type="text"
                    readOnly
                    value={getShareUrl()}
                    style={{ flexGrow: 1, background: "#FFF1DC", border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 10, padding: "8px 12px", fontSize: 12, color: PALETTE.ink, outline: "none" }}
                  />
                  <button
                    onClick={copyShareUrl}
                    style={{ background: copied ? PALETTE.green : PALETTE.accent, color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {copied ? "Copied! ✓" : "Copy Link"}
                  </button>
                </div>
              </div>
            )}

            {/* Questions generation controller */}
            <div style={{ background: PALETTE.panel, borderRadius: 18, padding: 24, marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Generate AI Questions</h4>
                <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                  Gemini will scan the lesson text and draft custom questions.
                </p>
              </div>
              <form onSubmit={handleGenerate} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  disabled={generating}
                  style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", outline: "none" }}
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={8}>8 Questions</option>
                </select>
                <button
                  type="submit"
                  disabled={generating}
                  style={{ background: PALETTE.accent, color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", boxShadow: `0 3px 0 ${PALETTE.accentDeep}`, display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  {generating ? (
                    <>
                      <span className="spinner" style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      Drafting...
                    </>
                  ) : (
                    "Generate"
                  )}
                </button>
              </form>
            </div>

            {genError && (
              <div style={{ color: PALETTE.accentDeep, background: "#FDF2F2", border: "1px solid #FDE8E8", borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 20 }}>
                ⚠️ {genError}
              </div>
            )}

            {/* Questions list */}
            {questions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: PALETTE.ink, opacity: 0.5 }}>
                {"No questions generated yet. Choose a count and click \"Generate\" above!"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    onClick={() => handleToggleSelect(q.id, q.is_selected)}
                    style={{ background: q.is_selected ? PALETTE.soft : "#FFF1DC", border: q.is_selected ? `1.8px solid ${PALETTE.accent}` : `1.5px solid ${PALETTE.deepCream}`, borderRadius: 16, padding: "20px 24px", display: "flex", gap: 16, cursor: "pointer", transition: "border 0.2s" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", paddingTop: 4 }}>
                      <input
                        type="checkbox"
                        checked={q.is_selected}
                        onChange={() => {}} // Controlled via card click handler
                        style={{ width: 18, height: 18, accentColor: PALETTE.accent, cursor: "pointer" }}
                      />
                    </div>

                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: q.type === "mcq" ? PALETTE.green : PALETTE.accent, background: q.type === "mcq" ? "#E8F4F1" : "#FCEEE7", padding: "4px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {q.type === "mcq" ? "MCQ" : "Short Answer"}
                        </span>
                        <span style={{ fontSize: 11, opacity: 0.4 }}>Q{index + 1}</span>
                      </div>

                      <p style={{ fontSize: 15, fontWeight: 600, margin: "12px 0 10px" }}>{q.question}</p>

                      {q.type === "mcq" && q.options && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "8px 0" }}>
                          {q.options.map((opt) => (
                            <div key={opt} style={{ background: "#FFFBF4", border: `1px solid ${PALETTE.deepCream}`, borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: 12, borderTop: `1px dashed ${PALETTE.deepCream}`, marginTop: 12, paddingTop: 8, display: "flex", gap: 6 }}>
                        <strong style={{ color: PALETTE.greenDeep }}>Correct Answer:</strong>
                        <span style={{ opacity: 0.8 }}>{q.answer}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        ) : (
          /* Submissions tab content */
          <div>
            {submissions.length === 0 ? (
              <div style={{ background: PALETTE.soft, border: `2px dashed ${PALETTE.deepCream}`, borderRadius: 18, padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>✍️</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No answers submitted yet</h3>
                <p style={{ fontSize: 14, opacity: 0.6, maxWidth: 360, margin: "0 auto", lineHeight: 1.5 }}>
                  Once your child opens the solver link and submits answers, their scores and feedback reports will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {submissions.map((sub) => {
                  const score = sub.score ?? 0;
                  const isHigh = score >= 80;
                  const isLow = score < 50;
                  const scoreColor = isHigh ? PALETTE.greenDeep : isLow ? PALETTE.accentDeep : "#9E7A3B";
                  const scoreBg = isHigh ? "#E8F4F1" : isLow ? "#FDF2F2" : "#FFFBF4";

                  return (
                    <div key={sub.id} style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 18, padding: 24 }}>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div>
                          <strong style={{ fontSize: 16 }}>{sub.child_name}</strong>
                          <span style={{ fontSize: 12, opacity: 0.5, marginLeft: 12 }}>
                            {new Date(sub.submitted_at).toLocaleDateString(undefined, { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                        <div style={{ background: scoreBg, border: `1px solid ${scoreColor}50`, color: scoreColor, borderRadius: 10, padding: "6px 12px", fontWeight: 700, fontSize: 15 }}>
                          Score: {score}/100
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
                        <div style={{ background: "#FFFBF4", padding: 12, borderRadius: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, marginBottom: 4 }}>QUESTION</div>
                          <div style={{ fontWeight: 600 }}>{sub.question}</div>
                        </div>

                        <div style={{ background: "#FFFBF4", padding: 12, borderRadius: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, marginBottom: 4 }}>{"CHILD'S ANSWER"}</div>
                          <div style={{ fontStyle: "italic" }}>&quot;{sub.answer_given}&quot;</div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12, marginTop: 4 }}>
                          <div style={{ background: "#E8F4F1", padding: 12, borderRadius: 10, borderLeft: `4px solid ${PALETTE.green}` }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: PALETTE.greenDeep, marginBottom: 4 }}>AI FEEDBACK</div>
                            <div style={{ fontSize: 13, lineHeight: 1.4 }}>{sub.feedback}</div>
                          </div>
                          <div style={{ background: "#FCEEE7", padding: 12, borderRadius: 10, borderLeft: `4px solid ${PALETTE.accent}` }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: PALETTE.accentDeep, marginBottom: 4 }}>SUGGESTION FOR IMPROVEMENT</div>
                            <div style={{ fontSize: 13, lineHeight: 1.4 }}>{sub.suggestions}</div>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Embedded CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

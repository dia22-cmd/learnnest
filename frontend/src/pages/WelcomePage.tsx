import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMaterials, uploadMaterial } from "../services/materials";
import type { Material } from "../types/material";

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

export default function WelcomePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      loadMaterials();
    }
  }, [authLoading, user]);

  async function loadMaterials() {
    try {
      setLoading(true);
      const data = await getMaterials();
      setMaterials(data);
    } catch (err: any) {
      console.error("Failed to load materials", err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      await uploadMaterial(title.trim(), file);
      setTitle("");
      setFile(null);
      setModalOpen(false);
      await loadMaterials();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Upload failed. Make sure the PDF is text-based and under 10MB.";
      setError(errMsg);
    } finally {
      setUploading(false);
    }
  }

  const name = user?.full_name || user?.email.split("@")[0] || "";

  if (authLoading) return null;

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.cream, color: PALETTE.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 32 }}>🦉</span>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700 }}>
              Learn<span style={{ color: PALETTE.accent, fontStyle: "italic" }}>nest</span> Dashboard
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 14, color: PALETTE.ink, opacity: 0.8, fontWeight: 500 }}>
              Hi, <strong>{name}</strong>!
            </span>
            <button
              onClick={handleLogout}
              style={{ background: "transparent", color: PALETTE.ink, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Log out
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div style={{ background: PALETTE.panel, borderRadius: 24, padding: "36px 32px", boxShadow: `0 8px 0 ${PALETTE.deepCream}` }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: PALETTE.ink, margin: 0 }}>Study Materials</h2>
              <p style={{ fontSize: 14, color: PALETTE.ink, opacity: 0.65, marginTop: 4 }}>
                Upload PDF lessons to generate and assign questions.
              </p>
            </div>
            <button
              onClick={() => { setModalOpen(true); setError(""); }}
              style={{ background: PALETTE.accent, color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 0 ${PALETTE.accentDeep}`, display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Upload Material
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: PALETTE.ink, opacity: 0.5 }}>
              Loading materials...
            </div>
          ) : materials.length === 0 ? (
            <div style={{ background: PALETTE.soft, border: `2px dashed ${PALETTE.deepCream}`, borderRadius: 18, padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📚</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No materials yet</h3>
              <p style={{ fontSize: 14, opacity: 0.6, maxWidth: 360, margin: "0 auto 20px", lineHeight: 1.5 }}>
                Get started by uploading a textbook chapter, reading comprehension, or science worksheet in PDF format.
              </p>
              <button
                onClick={() => { setModalOpen(true); setError(""); }}
                style={{ background: "transparent", color: PALETTE.accent, border: `1.5px solid ${PALETTE.accent}`, borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Upload your first PDF
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {materials.map((m) => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/material/${m.id}`)}
                  style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 4px 12px rgba(42, 24, 16, 0.08)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "#FFF1DC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      📄
                    </div>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{m.title}</h4>
                      <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>
                        Uploaded on {new Date(m.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {m.file_url && (
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: 13, fontWeight: 600, color: PALETTE.ink, opacity: 0.6, textDecoration: "none", padding: "6px 12px", borderRadius: 8, background: PALETTE.deepCream }}
                      >
                        PDF
                      </a>
                    )}
                    <span style={{ fontSize: 14, fontWeight: 700, color: PALETTE.accent, display: "flex", alignItems: "center", gap: 4 }}>
                      Open
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Upload Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(42, 24, 16, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: PALETTE.cream, width: "100%", maxWidth: 480, borderRadius: 24, padding: 36, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, margin: 0 }}>Upload New Material</h3>
              <button
                onClick={() => setModalOpen(false)}
                disabled={uploading}
                style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", opacity: 0.5, padding: 0 }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.8, display: "block", marginBottom: 8 }}>
                  Material Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Photosynthesis Chapter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={uploading}
                  style={{ width: "100%", background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.8, display: "block", marginBottom: 8 }}>
                  Select PDF File
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  disabled={uploading}
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) setFile(selected);
                  }}
                  style={{ display: "none" }}
                  id="pdf-upload-input"
                />
                <label
                  htmlFor="pdf-upload-input"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px dashed ${PALETTE.deepCream}`, background: PALETTE.soft, borderRadius: 12, padding: "24px 16px", cursor: "pointer", textAlign: "center" }}
                >
                  <span style={{ fontSize: 28, marginBottom: 8 }}>📂</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: file ? PALETTE.ink : PALETTE.accent }}>
                    {file ? file.name : "Choose PDF file"}
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Text-based PDF, max 10MB"}
                  </span>
                </label>
              </div>

              {error && (
                <div style={{ color: PALETTE.accentDeep, background: "#FDF2F2", border: "1px solid #FDE8E8", borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 1.4 }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                style={{ background: PALETTE.accent, color: "#fff", border: "none", borderRadius: 12, padding: "14px 20px", fontSize: 14, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", boxShadow: `0 4px 0 ${PALETTE.accentDeep}`, marginTop: 8, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}
              >
                {uploading ? (
                  <>
                    <span className="spinner" style={{ display: "inline-block", width: 14, height: 14, border: "2.5px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Uploading & Parsing PDF...
                  </>
                ) : (
                  "Create Material"
                )}
              </button>

            </form>

          </div>
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

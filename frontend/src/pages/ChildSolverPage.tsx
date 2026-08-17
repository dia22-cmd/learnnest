import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSolverAssignments, type SolverData } from "../services/children";

const PALETTE = {
  cream: "#F7EFE0",
  panel: "#EFE3CD",
  deepCream: "#E6D5B8",
  ink: "#2A1810",
  accent: "#E5733B",
  accentDeep: "#C4541F",
  soft: "#FBF6EC",
  green: "#4E8D7C",
};

export default function ChildSolverPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<SolverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!childId) return;
    async function loadData() {
      try {
        setLoading(true);
        const res = await getSolverAssignments(childId!);
        setData(res);
      } catch (err) {
        console.error(err);
        setError("We couldn't load your assignments. Please ask your parent for a new link!");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [childId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: PALETTE.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 48, display: "inline-block", animation: "bounce 1s infinite alternate" }}>🦉</span>
          <h3 style={{ marginTop: 16, color: PALETTE.ink, fontWeight: 700 }}>Loading your worksheets...</h3>
        </div>
        <style>{`
          @keyframes bounce {
            from { transform: translateY(0); }
            to { transform: translateY(-10px); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", background: PALETTE.cream, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ background: "#fff", padding: 32, borderRadius: 24, maxWidth: 400, textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: 44 }}>⚠️</span>
          <h3 style={{ margin: "16px 0 10px", color: PALETTE.ink, fontWeight: 700 }}>Oops!</h3>
          <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6 }}>{error || "Something went wrong."}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.cream, color: PALETTE.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "48px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>

        {/* Mascot Greeting */}
        <div style={{ fontSize: 64, marginBottom: 12 }}>🦉</div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, margin: 0, fontWeight: 700 }}>
          Welcome back, <span style={{ color: PALETTE.accent }}>{data.child_name}</span>!
        </h1>
        <p style={{ fontSize: 16, opacity: 0.7, marginTop: 8, marginBottom: 36 }}>
          Here are your active study assignments. Select a lesson to start!
        </p>

        {/* Assignments List */}
        {data.materials.length === 0 ? (
          <div style={{ background: PALETTE.panel, borderRadius: 24, padding: "48px 24px", boxShadow: `0 8px 0 ${PALETTE.deepCream}` }}>
            <span style={{ fontSize: 36 }}>✨</span>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "12px 0 6px" }}>All caught up!</h3>
            <p style={{ fontSize: 14, opacity: 0.6, maxWidth: 320, margin: "0 auto" }}>
              You don&apos;t have any worksheets assigned right now. Go play!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
            {data.materials.map((m) => (
              <div
                key={m.id}
                onClick={() => navigate(`/solve/${m.id}?child_id=${childId}&child_name=${encodeURIComponent(data.child_name)}`)}
                style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 20, padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 4px 12px rgba(42, 24, 16, 0.08)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{m.title}</h3>
                    <span style={{ fontSize: 11, background: PALETTE.deepCream, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                      {m.subject}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, opacity: 0.5, marginTop: 6, display: "inline-block" }}>
                    Assigned lesson
                  </span>
                </div>

                <button
                  style={{ background: PALETTE.accent, color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: `0 3.5px 0 ${PALETTE.accentDeep}` }}
                >
                  Start Quiz ✏️
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

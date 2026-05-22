import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PALETTE = {
  cream: "#F7EFE0",
  panel: "#EFE3CD",
  deepCream: "#E6D5B8",
  ink: "#2A1810",
  accent: "#E5733B",
  accentDeep: "#C4541F",
  soft: "#FBF6EC",
};

export default function WelcomePage() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  if (loading) return null;

  function handleLogout() {
    logout();
    navigate("/");
  }

  const name = user?.full_name || user?.email.split("@")[0] || "";

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 520, background: PALETTE.panel, borderRadius: 28, padding: "56px 48px", boxShadow: `0 8px 0 ${PALETTE.deepCream}`, textAlign: "center" }}>

        <div style={{ fontSize: 56, marginBottom: 24 }}>🦉</div>

        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 40, fontWeight: 600, color: PALETTE.ink, marginBottom: 12 }}>
          Welcome, <span style={{ color: PALETTE.accent, fontStyle: "italic" }}>{name}</span>!
        </h1>

        <p style={{ fontSize: 16, color: PALETTE.ink, opacity: 0.65, marginBottom: 40, lineHeight: 1.6 }}>
          You're now inside LearnNest. Your AI study partner is ready.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <div style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.deepCream}`, borderRadius: 16, padding: "16px 24px", width: "100%", textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: PALETTE.accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Logged in as</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: PALETTE.ink }}>{user?.email}</div>
          </div>

          <button
            onClick={handleLogout}
            style={{ marginTop: 8, background: "transparent", color: PALETTE.ink, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 14, padding: "14px 32px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

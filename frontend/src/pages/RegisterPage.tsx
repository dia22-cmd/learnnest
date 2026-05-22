import { useState, FormEvent } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { z } from "zod";
import { register } from "../services/auth";
import { registerSchema } from "../schemas/auth";
import { useAuth } from "../context/AuthContext";
import type { FieldErrors } from "../types/auth";

const PALETTE = {
  cream: "#F7EFE0",
  panel: "#EFE3CD",
  deepCream: "#E6D5B8",
  ink: "#2A1810",
  accent: "#E5733B",
  accentDeep: "#C4541F",
  soft: "#FBF6EC",
  error: "#C4541F",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authLoading && isAuthenticated) return <Navigate to="/welcome" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");

    const result = registerSchema.safeParse({ full_name: fullName, email, password });
    if (!result.success) {
      const flat = z.flattenError(result.error).fieldErrors;
      setFieldErrors({
        full_name: flat.full_name?.[0],
        email: flat.email?.[0],
        password: flat.password?.[0],
      });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await register({ email, password, full_name: fullName || undefined });
      try {
        await login(email, password);
        navigate("/welcome");
      } catch {
        navigate("/login");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("already registered")) {
        setServerError("That email is already registered. Try logging in.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (hasError: boolean) => ({
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    border: `1.5px solid ${hasError ? PALETTE.error : PALETTE.deepCream}`,
    background: PALETTE.soft,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 15,
    color: PALETTE.ink,
    outline: "none",
  });

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440, background: PALETTE.panel, borderRadius: 28, padding: "48px 40px", boxShadow: `0 8px 0 ${PALETTE.deepCream}` }}>

        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 36 }}>
          <svg width="36" height="36" viewBox="0 0 44 44">
            <ellipse cx="22" cy="32" rx="18" ry="6" fill={PALETTE.accentDeep} />
            <ellipse cx="22" cy="30" rx="18" ry="6" fill={PALETTE.accent} />
            <ellipse cx="22" cy="22" rx="9" ry="11" fill="#FFF1DC" />
            <ellipse cx="19" cy="19" rx="3" ry="4" fill="#fff" opacity="0.7" />
            <path d="M 36 8 l 1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5 z" fill={PALETTE.accent} />
          </svg>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: PALETTE.ink }}>
            Learn<span style={{ color: PALETTE.accent, fontStyle: "italic" }}>nest</span>
          </span>
        </Link>

        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 600, color: PALETTE.ink, marginBottom: 8 }}>
          Create your account
        </h1>
        <p style={{ fontSize: 14, color: PALETTE.ink, opacity: 0.6, marginBottom: 32 }}>
          Already have one?{" "}
          <Link to="/login" style={{ color: PALETTE.accent, fontWeight: 600, textDecoration: "none" }}>Log in</Link>
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: PALETTE.ink, marginBottom: 6 }}>
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              style={inputStyle(!!fieldErrors.full_name)}
            />
            {fieldErrors.full_name && <p style={{ fontSize: 12, color: PALETTE.error, marginTop: 4, fontWeight: 600 }}>{fieldErrors.full_name}</p>}
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: PALETTE.ink, marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle(!!fieldErrors.email)}
            />
            {fieldErrors.email && <p style={{ fontSize: 12, color: PALETTE.error, marginTop: 4, fontWeight: 600 }}>{fieldErrors.email}</p>}
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: PALETTE.ink, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={inputStyle(!!fieldErrors.password)}
            />
            {fieldErrors.password && <p style={{ fontSize: 12, color: PALETTE.error, marginTop: 4, fontWeight: 600 }}>{fieldErrors.password}</p>}
          </div>

          {serverError && (
            <p style={{ fontSize: 13, color: PALETTE.error, fontWeight: 600, margin: 0 }}>{serverError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 8, background: loading ? PALETTE.deepCream : PALETTE.accent, color: loading ? PALETTE.ink : "#fff", border: "none", borderRadius: 14, padding: "16px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : `0 5px 0 ${PALETTE.accentDeep}`, letterSpacing: 0.2, transition: "background 0.15s" }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

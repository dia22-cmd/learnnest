import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OwlMascot from "../components/OwlMascot";

const PALETTE = {
  cream: "#F7EFE0",
  panel: "#EFE3CD",
  deepCream: "#E6D5B8",
  ink: "#2A1810",
  accent: "#E5733B",
  accentDeep: "#C4541F",
  book: "#C8341F",
  speckle: "#FFFFFF",
  soft: "#FBF6EC",
};

// ── Speckles ─────────────────────────────────────────────────

interface Blob { x: number; y: number; rx: number; ry: number; rot: number; op: number }

function Speckles({ count = 14, seed = 1 }: { count?: number; seed?: number }) {
  const blobs: Blob[] = useMemo(() => {
    const out: Blob[] = [];
    let s = seed * 9301 + 49297;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < count; i++) {
      out.push({ x: rnd() * 100, y: rnd() * 100, rx: 14 + rnd() * 28, ry: 8 + rnd() * 16, rot: rnd() * 60 - 30, op: 0.45 + rnd() * 0.35 });
    }
    return out;
  }, [count, seed]);

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {blobs.map((b, i) => (
        <ellipse key={i} cx={b.x} cy={b.y} rx={b.rx / 10} ry={b.ry / 10} transform={`rotate(${b.rot} ${b.x} ${b.y})`} fill={PALETTE.speckle} opacity={b.op} />
      ))}
    </svg>
  );
}

// ── Hills backdrop ────────────────────────────────────────────

function HillsBackdrop() {
  return (
    <svg viewBox="0 0 1200 200" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, top: -10, height: 130, width: "100%", pointerEvents: "none" }}>
      <path d="M 80 130 Q 130 30 200 130 Z" fill={PALETTE.deepCream} opacity="0.7" />
      <path d="M 160 130 Q 220 60 280 130 Z" fill={PALETTE.deepCream} />
      <path d="M 240 130 Q 290 80 340 130 Z" fill={PALETTE.deepCream} opacity="0.6" />
    </svg>
  );
}

// ── Logo ──────────────────────────────────────────────────────

function LogoMark() {
  return (
    <a href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <ellipse cx="22" cy="32" rx="18" ry="6" fill={PALETTE.accentDeep} />
        <ellipse cx="22" cy="30" rx="18" ry="6" fill={PALETTE.accent} />
        <ellipse cx="22" cy="22" rx="9" ry="11" fill="#FFF1DC" />
        <ellipse cx="19" cy="19" rx="3" ry="4" fill="#fff" opacity="0.7" />
        <path d="M 36 8 l 1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5 z" fill={PALETTE.accent} />
      </svg>
      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: PALETTE.ink }}>
        Learn<span style={{ color: PALETTE.accent, fontStyle: "italic" }}>nest</span>
      </span>
    </a>
  );
}

// ── Nav ───────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "HOME", active: true },
  { label: "Features", active: false },
  { label: "Stories", active: false },
  { label: "Help", active: false },
];

function NavBar() {
  return (
    <nav style={{ display: "flex", gap: 36 }}>
      {NAV_ITEMS.map((it) => (
        <a
          key={it.label}
          href="#"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: it.active ? 700 : 500, color: it.active ? PALETTE.accent : PALETTE.ink, textDecoration: "none", position: "relative", paddingBottom: 4 }}
        >
          {it.label}
          {it.active && (
            <span style={{ position: "absolute", left: 0, right: 0, bottom: -2, height: 3, borderRadius: 2, background: PALETTE.accent }} />
          )}
        </a>
      ))}
    </nav>
  );
}

// ── Header ────────────────────────────────────────────────────

function Header() {
  const navigate = useNavigate();
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 56px", background: PALETTE.cream }}>
      <LogoMark />
      <NavBar />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/login")} style={{ background: "transparent", color: PALETTE.ink, border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 15, padding: "10px 18px", cursor: "pointer", borderRadius: 12 }}>
          Log in
        </button>
        <button onClick={() => navigate("/register")} style={{ background: PALETTE.accent, color: "#fff", border: "none", borderRadius: 14, padding: "12px 22px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: `0 4px 0 ${PALETTE.accentDeep}`, letterSpacing: 0.2 }}>
          Sign in
        </button>
      </div>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────

function HeroPanel() {
  return (
    <div style={{ position: "relative", padding: "0 56px", marginTop: -8 }}>
      <div style={{ position: "relative" }}>
        <HillsBackdrop />
        <div style={{ position: "relative", background: PALETTE.panel, borderRadius: 36, minHeight: 440, padding: "72px 80px", overflow: "visible", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 40, alignItems: "center" }}>

          {/* speckles */}
          <div style={{ position: "absolute", inset: 0, borderRadius: 36, overflow: "hidden" }}>
            <Speckles count={22} seed={3} />
          </div>

          {/* left */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: PALETTE.soft, color: PALETTE.ink, padding: "8px 14px", borderRadius: 999, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, marginBottom: 28, border: `1px solid ${PALETTE.deepCream}` }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: PALETTE.accent }} />
              ages 3–10
            </div>

            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 68, lineHeight: 1.02, letterSpacing: -1.5, color: PALETTE.ink, margin: 0, fontWeight: 600 }}>
              <span>LearnNest</span>
              <span style={{ color: PALETTE.accent, fontStyle: "italic", fontWeight: 400 }}> </span>
              <span style={{ fontWeight: 500 }}>Your AI Study Partner.</span>
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 36 }}>
              <button style={{ background: PALETTE.accent, color: "#fff", border: "none", borderRadius: 16, padding: "18px 32px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: `0 6px 0 ${PALETTE.accentDeep}`, display: "inline-flex", alignItems: "center", gap: 10, letterSpacing: 0.2 }}>
                Browse the nest
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              <a href="#" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 600, color: PALETTE.ink, textDecoration: "underline", textDecorationThickness: 2, textUnderlineOffset: 5, textDecorationColor: PALETTE.accent }}>
                See how it works
              </a>
            </div>
          </div>

          {/* right — mascot */}
          <div style={{ position: "relative", zIndex: 3, marginRight: -120, marginBottom: -90, marginTop: -40, alignSelf: "end", justifySelf: "end" }}>
            <OwlMascot size={460} accent={PALETTE.accent} deep={PALETTE.accentDeep} book={PALETTE.book} />
          </div>

          {/* floating sticker */}
          <div style={{ position: "absolute", top: 36, right: 56, zIndex: 4, background: PALETTE.soft, border: `2px dashed ${PALETTE.accent}`, borderRadius: 999, padding: "10px 18px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: PALETTE.accentDeep, transform: "rotate(6deg)", letterSpacing: 0.5, textTransform: "uppercase", boxShadow: `0 4px 0 ${PALETTE.deepCream}` }}>
            ✦ HAND-PICKED BY PARENTS
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feature Row ───────────────────────────────────────────────

const FEATURES = [
  {
    title: "AI Question Generator",
    sub: "Claude turns any material into tailored questions instantly.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={PALETTE.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3 L27 8 v9 c0 7 -5 11 -11 12 -6 -1 -11 -5 -11 -12 V8 z" />
        <path d="M11 16 l4 4 7 -8" />
      </svg>
    ),
  },
  {
    title: "Smart Evaluation",
    sub: "AI reviews answers and gives friendly, helpful feedback.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={PALETTE.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="9" width="16" height="13" rx="1" />
        <path d="M18 13 h7 l3 4 v5 h-10 z" />
        <circle cx="9" cy="25" r="2.5" /><circle cx="22" cy="25" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Upload Materials",
    sub: "Drop in a PDF or paste text — we handle the rest.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={PALETTE.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="26" height="18" rx="1" />
        <path d="M3 17 H29" /><path d="M16 11 V29" />
        <path d="M16 11 c -3 -5 -8 -5 -8 -2 s 5 2 8 2 z" />
        <path d="M16 11 c 3 -5 8 -5 8 -2 s -5 2 -8 2 z" />
      </svg>
    ),
  },
];

function FeatureRow() {
  return (
    <div style={{ padding: "32px 80px 48px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 36 }}>
      {FEATURES.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: PALETTE.soft, border: `1px solid ${PALETTE.deepCream}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {f.icon}
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: PALETTE.ink, marginBottom: 2 }}>{f.title}</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: PALETTE.ink, opacity: 0.65 }}>{f.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function LandingPage() {
  useEffect(() => {
    document.body.style.background = PALETTE.cream;
    return () => { document.body.style.background = ""; };
  }, []);

  return (
    <div style={{ background: PALETTE.cream, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: PALETTE.ink }}>
      <Header />
      <HeroPanel />
      <FeatureRow />
    </div>
  );
}

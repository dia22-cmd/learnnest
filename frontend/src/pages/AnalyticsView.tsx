import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAnalyticsOverview, ChildStats } from "../services/analytics";

const PALETTE = {
  cream: "#F7EFE0",
  panel: "#EFE3CD",
  deepCream: "#E6D5B8",
  ink: "#2A1810",
  accent: "#E5733B",
  accentDeep: "#C4541F",
  soft: "#FBF6EC",
  green: "#2D7A7B",
  greenDeep: "#234E52",
};

export default function AnalyticsView() {
  const [analytics, setAnalytics] = useState<Record<string, ChildStats>>({});
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalyticsOverview()
      .then((data) => {
        setAnalytics(data);
        const children = Object.keys(data);
        if (children.length > 0) {
          setSelectedChild(children[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load analytics:", err);
        setError("Unable to load performance reports. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <div style={{ color: PALETTE.ink, opacity: 0.6, fontSize: 15 }}>Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "#FDF2F2", border: "1px solid #FDE8E8", borderRadius: 16, padding: 20, textAlign: "center", color: PALETTE.accentDeep }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
      </div>
    );
  }

  const childrenNames = Object.keys(analytics);

  if (childrenNames.length === 0) {
    return (
      <div style={{ background: PALETTE.soft, border: `2px dashed ${PALETTE.deepCream}`, borderRadius: 24, padding: "64px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 54, marginBottom: 16 }}>📊</div>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: PALETTE.ink, marginBottom: 8 }}>
          No analytics data yet
        </h3>
        <p style={{ fontSize: 15, opacity: 0.65, maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.6 }}>
          Once your child completes worksheets and submits their answers for evaluation, progress tracking charts and analytics reports will appear here automatically!
        </p>
        <Link
          to="/"
          style={{ display: "inline-block", background: PALETTE.accent, color: "#fff", textDecoration: "none", fontWeight: 700, borderRadius: 12, padding: "14px 28px", boxShadow: `0 4px 0 ${PALETTE.accentDeep}` }}
        >
          Share a study link
        </Link>
      </div>
    );
  }

  const currentStats = analytics[selectedChild];
  const history = currentStats?.history || [];

  // SVG Line Chart Constants
  const width = 600;
  const height = 240;
  const paddingX = 60;
  const paddingY = 40;

  // Chart coordinates mapping (Backend pre-calculates the sorting order)
  const chartPoints = history.map((item, idx) => {
    const x = paddingX + (idx * (width - 2 * paddingX)) / (history.length - 1 || 1);
    const y = height - paddingY - (item.average_score / 100) * (height - 2 * paddingY);
    const dateStr = new Date(item.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return { x, y, score: item.average_score, title: item.title, date: dateStr };
  });

  const pathD = chartPoints.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
  }, "");

  // Gradient fill area
  const fillD = chartPoints.length > 0
    ? `${pathD} L ${chartPoints[chartPoints.length - 1].x} ${height - paddingY} L ${chartPoints[0].x} ${height - paddingY} Z`
    : "";

  const gridLines = [0, 25, 50, 75, 100].map((val) => {
    const y = height - paddingY - (val / 100) * (height - 2 * paddingY);
    return { y, label: `${val}%` };
  });

  // Calculate success metrics
  const masteredWorksheets = history.filter(h => h.average_score >= 80).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Header Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: PALETTE.ink, margin: 0 }}>
            Progress & Performance
          </h2>
          <p style={{ fontSize: 14, opacity: 0.6, margin: "4px 0 0" }}>
            Track learning improvement across assigned lessons
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.7 }}>Student Profile:</label>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 10, padding: "8px 16px", fontSize: 14, fontWeight: 600, color: PALETTE.ink, outline: "none", cursor: "pointer" }}
          >
            {childrenNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>

        {/* Card 1: Average Score */}
        <div style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 20, padding: "20px 24px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}>Average Score</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "8px 0 0" }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: PALETTE.ink }}>{currentStats.average_score}</span>
            <span style={{ fontSize: 16, opacity: 0.5, fontWeight: 600 }}>/100</span>
          </div>
          <p style={{ fontSize: 12, opacity: 0.6, margin: "6px 0 0" }}>
            Overall evaluation rating
          </p>
        </div>

        {/* Card 2: Worksheets Solved */}
        <div style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 20, padding: "20px 24px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}>Lessons Completed</span>
          <div style={{ fontSize: 36, fontWeight: 800, color: PALETTE.ink, margin: "8px 0 0" }}>
            {currentStats.total_worksheets}
          </div>
          <p style={{ fontSize: 12, opacity: 0.6, margin: "6px 0 0" }}>
            Total worksheets attempted
          </p>
        </div>

        {/* Card 3: Questions Answered */}
        <div style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 20, padding: "20px 24px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}>Questions Attempted</span>
          <div style={{ fontSize: 36, fontWeight: 800, color: PALETTE.ink, margin: "8px 0 0" }}>
            {currentStats.total_questions}
          </div>
          <p style={{ fontSize: 12, opacity: 0.6, margin: "6px 0 0" }}>
            Individual queries answered
          </p>
        </div>

        {/* Card 4: Mastered Lessons (>= 80%) */}
        <div style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 20, padding: "20px 24px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}>Mastered Topics</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "8px 0 0" }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: PALETTE.green }}>{masteredWorksheets}</span>
            <span style={{ fontSize: 14, opacity: 0.5, fontWeight: 600 }}>/ {currentStats.total_worksheets}</span>
          </div>
          <p style={{ fontSize: 12, opacity: 0.6, margin: "6px 0 0" }}>
            Scores at or above 80%
          </p>
        </div>

      </div>

      {/* Line Chart */}
      <div style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 24, padding: "28px 24px 20px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: PALETTE.ink, margin: "0 0 20px" }}>Score Progression over Time</h3>

        {history.length < 2 ? (
          <div style={{ height: 180, display: "flex", justifyContent: "center", alignItems: "center", color: PALETTE.ink, opacity: 0.5, fontSize: 14 }}>
            💡 Need at least 2 completed worksheets to generate a progress graph. Complete more lessons to see progression trends!
          </div>
        ) : (
          <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PALETTE.accent} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={PALETTE.accent} stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              {gridLines.map((line, idx) => (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={line.y}
                    x2={width - paddingX}
                    y2={line.y}
                    stroke={PALETTE.deepCream}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <text
                    x={paddingX - 10}
                    y={line.y + 4}
                    textAnchor="end"
                    style={{ fontSize: 11, fontWeight: 600, fill: PALETTE.ink, opacity: 0.5 }}
                  >
                    {line.label}
                  </text>
                </g>
              ))}

              {/* Chart Gradient Area */}
              <path d={fillD} fill="url(#chartGradient)" />

              {/* Chart Path Line */}
              <path
                d={pathD}
                fill="none"
                stroke={PALETTE.accent}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Chart Points & Labels */}
              {chartPoints.map((pt, idx) => (
                <g key={idx}>
                  {/* Point Circle */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={5}
                    fill="#fff"
                    stroke={PALETTE.accentDeep}
                    strokeWidth={2.5}
                  />
                  {/* Score Label directly above point */}
                  <text
                    x={pt.x}
                    y={pt.y - 12}
                    textAnchor="middle"
                    style={{ fontSize: 11, fontWeight: 700, fill: PALETTE.accentDeep }}
                  >
                    {pt.score}%
                  </text>
                  {/* Worksheet short title & date below */}
                  <text
                    x={pt.x}
                    y={height - paddingY + 20}
                    textAnchor="middle"
                    style={{ fontSize: 10, fontWeight: 600, fill: PALETTE.ink, opacity: 0.6 }}
                  >
                    {pt.date}
                  </text>
                </g>
              ))}

              {/* Chart Base Line */}
              <line
                x1={paddingX}
                y1={height - paddingY}
                x2={width - paddingX}
                y2={height - paddingY}
                stroke={PALETTE.ink}
                strokeWidth={1.5}
                opacity={0.2}
              />
            </svg>
          </div>
        )}
      </div>

      {/* History Table */}
      <div style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 24, padding: "28px 24px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: PALETTE.ink, margin: "0 0 16px" }}>Detailed Learning History</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[...history].reverse().map((item, idx) => (
            <div
              key={idx}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: `1px solid ${PALETTE.deepCream}`, borderRadius: 16, padding: "16px 20px" }}
            >
              <div>
                <strong style={{ fontSize: 15, color: PALETTE.ink, display: "block" }}>{item.title}</strong>
                <span style={{ fontSize: 12, opacity: 0.5, display: "inline-block", marginTop: 4 }}>
                  Completed on {new Date(item.submitted_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ background: item.average_score >= 80 ? "#E8F4F1" : item.average_score >= 50 ? "#FFFBF4" : "#FDF2F2", color: item.average_score >= 80 ? PALETTE.greenDeep : item.average_score >= 50 ? "#9E7A3B" : PALETTE.accentDeep, borderRadius: 10, padding: "6px 14px", fontWeight: 700, fontSize: 14 }}>
                  {item.average_score}%
                </div>
                <Link
                  to={`/material/${item.material_id}`}
                  style={{ fontSize: 13, fontWeight: 700, color: PALETTE.accent, textDecoration: "none" }}
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

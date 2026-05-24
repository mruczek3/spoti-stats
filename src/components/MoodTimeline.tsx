import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import type { UserProfile } from "../data/mockData";

interface MoodTimelineProps {
  profile: UserProfile;
}

// ── Animated Circular Mood Gauge ─────────────────────────────────────────────
const MoodGauge: React.FC<{ value: number }> = ({ value }) => {
  const [displayed, setDisplayed] = useState(0);
  const r = 52;
  const circ = 2 * Math.PI * r; // ≈ 326.7

  // Animate counter from 0 → value using cubic ease-out via rAF
  useEffect(() => {
    let rafId = 0;
    const dur = 1400;
    const t0 = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(eased * value));
      if (p < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  const offset = circ - (displayed / 100) * circ;

  return (
    <svg width="136" height="136" viewBox="0 0 136 136">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1db954" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* Track ring */}
      <circle
        cx="68"
        cy="68"
        r={r}
        fill="none"
        stroke="rgba(29,185,84,0.12)"
        strokeWidth="10"
      />
      {/* Animated progress arc */}
      <circle
        cx="68"
        cy="68"
        r={r}
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 68 68)"
      />

      {/* Score readout */}
      <text
        x="68"
        y="62"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize="26"
        fontWeight="700"
        fontFamily="DM Sans, sans-serif"
      >
        {displayed}
      </text>
      <text
        x="68"
        y="81"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#b3b3b3"
        fontSize="11"
        fontFamily="DM Sans, sans-serif"
      >
        / 100
      </text>
    </svg>
  );
};

// ── Recharts custom tooltip ───────────────────────────────────────────────────
interface ChartPayloadItem {
  value: number;
  payload: {
    month: string;
    valence: number;
    topTrack?: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ChartPayloadItem[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "rgba(10,10,10,0.96)",
        border: "1px solid rgba(29,185,84,0.42)",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        minWidth: "175px",
      }}
    >
      <p
        style={{
          color: "#1db954",
          fontWeight: 700,
          fontSize: "0.95rem",
          marginBottom: "0.45rem",
        }}
      >
        {d.month}
      </p>
      <p
        style={{
          color: "#b3b3b3",
          fontSize: "0.84rem",
          marginBottom: "0.25rem",
        }}
      >
        Mood Score:{" "}
        <span style={{ color: "#fff", fontWeight: 600 }}>
          {Math.round(d.valence)}/100
        </span>
      </p>
      <p style={{ color: "#b3b3b3", fontSize: "0.84rem", margin: 0 }}>
        Top Track:{" "}
        <span style={{ color: "#fff", fontWeight: 600 }}>
          {d.topTrack ?? "—"}
        </span>
      </p>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export const MoodTimeline: React.FC<MoodTimelineProps> = ({ profile }) => {
  const data = profile.moodTimeline;

  const avgValence = useMemo(
    () => data.reduce((s, d) => s + d.valence, 0) / data.length,
    [data],
  );

  // Sorted high→low to derive insight cards
  const sortedDesc = useMemo(
    () => [...data].sort((a, b) => b.valence - a.valence),
    [data],
  );

  const happiest = sortedDesc[0];
  const saddest = sortedDesc[sortedDesc.length - 1];
  const energetic = sortedDesc[2] ?? sortedDesc[1]; // 3rd highest for variety

  const moodEmoji =
    avgValence >= 70
      ? "😄 Very Happy"
      : avgValence >= 50
        ? "🙂 Content"
        : avgValence >= 35
          ? "😐 Neutral"
          : "😔 Melancholic";

  const insightCards = [
    {
      emoji: "🌞",
      title: "Happiest Month",
      month: happiest.month,
      score: happiest.valence,
      topTrack: happiest.topTrack,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.07)",
      borderColor: "rgba(245,158,11,0.28)",
    },
    {
      emoji: "🌙",
      title: "Most Melancholic",
      month: saddest.month,
      score: saddest.valence,
      topTrack: saddest.topTrack,
      color: "#06b6d4",
      bg: "rgba(6,182,212,0.07)",
      borderColor: "rgba(6,182,212,0.28)",
    },
    {
      emoji: "⚡",
      title: "Most Energetic",
      month: energetic.month,
      score: energetic.valence,
      topTrack: energetic.topTrack,
      color: "#1db954",
      bg: "rgba(29,185,84,0.07)",
      borderColor: "rgba(29,185,84,0.28)",
    },
  ];

  return (
    <section style={styles.section} className="section fade-on-scroll">
      <div style={styles.container}>
        <h2 style={{ marginBottom: "3rem" }}>Mood Timeline</h2>

        {/* ── Top row: Gauge (left) + Area chart (right) ───────────────────── */}
        <div style={styles.topRow}>
          {/* Gauge card */}
          <div
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.1rem",
              minWidth: "195px",
            }}
          >
            <h3
              style={{ fontSize: "1rem", textAlign: "center", marginBottom: 0 }}
            >
              Avg Mood Score
            </h3>
            <MoodGauge value={Math.round(avgValence)} />
            <p
              style={{
                color: "#1db954",
                fontWeight: 700,
                fontSize: "0.95rem",
                textAlign: "center",
                margin: 0,
              }}
            >
              {moodEmoji}
            </p>
          </div>

          {/* Mood journey chart */}
          <div className="card" style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ marginBottom: "1.5rem" }}>12-Month Mood Journey</h3>

            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={data}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <defs>
                  {/* Green-to-transparent gradient fill below the line */}
                  <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1db954" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#1db954" stopOpacity={0} />
                  </linearGradient>
                </defs>

                {/* ── Coloured zone bands ─────────────────────────────────── */}
                {/* Energetic zone: valence 75–100 */}
                <ReferenceArea
                  y1={75}
                  y2={100}
                  fill="rgba(245,158,11,0.08)"
                  label={{
                    value: "Energetic",
                    position: "insideTopRight",
                    fill: "#f59e0b",
                    fontSize: 10,
                  }}
                />
                {/* Melancholic zone: valence 0–35 */}
                <ReferenceArea
                  y1={0}
                  y2={35}
                  fill="rgba(6,182,212,0.08)"
                  label={{
                    value: "Melancholic",
                    position: "insideBottomRight",
                    fill: "#06b6d4",
                    fontSize: 10,
                  }}
                />

                <CartesianGrid
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="transparent"
                  tick={{ fill: "#b3b3b3", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="transparent"
                  domain={[0, 100]}
                  tick={{ fill: "#b3b3b3", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                {/* Custom hoverable tooltip showing month, score, top track */}
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "rgba(29,185,84,0.3)", strokeWidth: 1 }}
                />

                {/* Smooth monotone area with visible dots + enlarged active dot */}
                <Area
                  type="monotone"
                  dataKey="valence"
                  stroke="#1db954"
                  strokeWidth={2.5}
                  fill="url(#moodFill)"
                  dot={{
                    r: 4,
                    fill: "#1db954",
                    stroke: "#111",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 7,
                    fill: "#1db954",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Insight cards row ─────────────────────────────────────────────── */}
        <div style={styles.insightRow}>
          {insightCards.map((card, idx) => (
            <div
              key={card.title}
              className="card animate-in"
              style={{
                flex: 1,
                background: card.bg,
                borderColor: card.borderColor,
                // Stagger each card's entrance; use 'both' so the element starts
                // at opacity:0 during the delay (no flash)
                animationDelay: `${idx * 0.12}s`,
                animationFillMode: "both",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "1rem",
                }}
              >
                <span style={{ fontSize: "1.75rem" }}>{card.emoji}</span>
                <h4 style={{ color: card.color, margin: 0, fontSize: "1rem" }}>
                  {card.title}
                </h4>
              </div>

              {/* Month name — body font so it doesn't shout */}
              <p
                style={{
                  color: "#fff",
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  fontFamily: "DM Sans, sans-serif",
                  marginBottom: "0.25rem",
                }}
              >
                {card.month}
              </p>

              <p
                style={{
                  color: card.color,
                  fontSize: "0.88rem",
                  marginBottom: "0.5rem",
                }}
              >
                Mood: {Math.round(card.score)}/100
              </p>

              <p style={{ color: "#b3b3b3", fontSize: "0.78rem", margin: 0 }}>
                🎵 {card.topTrack ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const styles: Record<string, React.CSSProperties> = {
  section: {
    background:
      "linear-gradient(135deg, rgba(245,158,11,0.05) 0%, transparent 100%)",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 2rem",
  },
  topRow: {
    display: "flex",
    gap: "2rem",
    marginBottom: "2rem",
    alignItems: "stretch",
  },
  insightRow: {
    display: "flex",
    gap: "1.5rem",
  },
};

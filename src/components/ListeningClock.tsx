import React, { useState, useEffect, useMemo } from "react";
import type { UserProfile } from "../data/mockData";

interface ListeningClockProps {
  profile: UserProfile;
}

interface HoverTooltip {
  x: number;
  y: number;
  hour: number;
  count: number;
  topTrack?: string;
}

// SVG arc math constants
const CX = 160;
const CY = 160;
const INNER_R = 56;
const MAX_OUTER_R = 122;

// Heatmap layout constants
const CELL = 14;
const GAP = 2;
const WEEK_W = CELL + GAP; // 16px per week column
const MONTH_W = (52 / 12) * WEEK_W; // ≈ 69.3px per month label
const DAY_LABEL_W = 30;
const DAY_GAP = 4;

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const CARDINAL: Record<number, string> = {
  0: "12AM",
  6: "6AM",
  12: "12PM",
  18: "6PM",
};

export const ListeningClock: React.FC<ListeningClockProps> = ({ profile }) => {
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState<HoverTooltip | null>(null);

  // Trigger staggered entrance animation shortly after mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  const maxCount = useMemo(
    () => Math.max(...profile.listeningHistory.map((h) => h.count)),
    [profile.listeningHistory],
  );

  const peakHour = useMemo(
    () =>
      profile.listeningHistory.reduce((max, curr) =>
        curr.count > max.count ? curr : max,
      ),
    [profile.listeningHistory],
  );

  // Sum each day column across all 52 weeks → find the busiest day
  const peakDayName = useMemo(() => {
    const dayTotals: number[] = new Array<number>(7).fill(0);
    profile.weeklyHeatmap.forEach((week) => {
      week.forEach((val, dayIdx) => {
        dayTotals[dayIdx] += val;
      });
    });
    const maxIdx = dayTotals.indexOf(Math.max(...dayTotals));
    const names = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    return names[maxIdx] ?? "the weekend";
  }, [profile.weeklyHeatmap]);

  const maxHeatmapValue = useMemo(() => {
    let max = 0;
    profile.weeklyHeatmap.forEach((week) =>
      week.forEach((v) => {
        if (v > max) max = v;
      }),
    );
    return max || 1;
  }, [profile.weeklyHeatmap]);

  const getHeatmapColor = (value: number): string => {
    if (value === 0) return "rgba(255,255,255,0.04)";
    const intensity = value / maxHeatmapValue;
    // Smooth near-black → bright green gradient
    return `rgba(29,185,84,${(0.14 + intensity * 0.86).toFixed(2)})`;
  };

  return (
    <section style={styles.section} className="section fade-on-scroll">
      {/* ── Floating hover tooltip ─────────────────────────────────────────── */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 16,
            top: tooltip.y - 18,
            zIndex: 9999,
            background: "rgba(10,10,10,0.96)",
            padding: "0.7rem 1rem",
            borderRadius: "10px",
            border: "1px solid rgba(29,185,84,0.45)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            pointerEvents: "none",
            minWidth: "160px",
          }}
        >
          <p
            style={{
              color: "#1db954",
              fontWeight: 700,
              marginBottom: "0.3rem",
              fontSize: "0.9rem",
            }}
          >
            {tooltip.hour}:00 – {(tooltip.hour + 1) % 24}:00
          </p>
          <p
            style={{
              color: "#b3b3b3",
              fontSize: "0.8rem",
              marginBottom: tooltip.topTrack ? "0.25rem" : 0,
            }}
          >
            {tooltip.count} plays
          </p>
          {tooltip.topTrack && (
            <p style={{ color: "#fff", fontSize: "0.8rem", margin: 0 }}>
              🎵 {tooltip.topTrack}
            </p>
          )}
        </div>
      )}

      <div style={styles.container}>
        <h2 style={{ marginBottom: "3rem" }}>Listening Patterns</h2>

        <div style={styles.contentGrid}>
          {/* ── 24-Hour Radial Clock Card ──────────────────────────────────── */}
          <div
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <h3 style={{ marginBottom: "1.5rem", alignSelf: "flex-start" }}>
              24h Listening Clock
            </h3>

            <div style={{ width: "100%", maxWidth: "340px", margin: "0 auto" }}>
              <svg
                viewBox="0 0 320 320"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  overflow: "visible",
                }}
              >
                <defs>
                  {/* Glow filter applied to high-intensity segments */}
                  <filter
                    id="seg-glow"
                    x="-40%"
                    y="-40%"
                    width="180%"
                    height="180%"
                  >
                    <feGaussianBlur
                      in="SourceGraphic"
                      stdDeviation="2.5"
                      result="blur"
                    />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Decorative outer ring */}
                <circle
                  cx={CX}
                  cy={CY}
                  r="126"
                  fill="none"
                  stroke="rgba(29,185,84,0.08)"
                  strokeWidth="1"
                />
                {/* Inner hub ring */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={INNER_R}
                  fill="rgba(29,185,84,0.05)"
                  stroke="rgba(29,185,84,0.2)"
                  strokeWidth="1.5"
                />

                {/* Hour tick marks — longer at cardinal hours (0, 6, 12, 18) */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
                  const isCardinal = i % 6 === 0;
                  return (
                    <line
                      key={`tick-${i}`}
                      x1={CX + Math.cos(angle) * 128}
                      y1={CY + Math.sin(angle) * 128}
                      x2={CX + Math.cos(angle) * (isCardinal ? 136 : 133)}
                      y2={CY + Math.sin(angle) * (isCardinal ? 136 : 133)}
                      stroke={
                        isCardinal
                          ? "rgba(29,185,84,0.6)"
                          : "rgba(29,185,84,0.2)"
                      }
                      strokeWidth={isCardinal ? 2 : 1}
                    />
                  );
                })}

                {/* Listening intensity segments — one per hour, clockwise from midnight */}
                {profile.listeningHistory.map((hourData) => {
                  const startAngle =
                    (hourData.hour / 24) * Math.PI * 2 - Math.PI / 2;
                  const endAngle =
                    ((hourData.hour + 1) / 24) * Math.PI * 2 - Math.PI / 2;
                  const intensity = hourData.count / maxCount;
                  // Outer radius scales linearly with intensity; minimum stub even at 0
                  const outerR =
                    INNER_R + 5 + intensity * (MAX_OUTER_R - INNER_R - 5);

                  // Four arc corners: (inner-start, outer-start, outer-end, inner-end)
                  const x1 = CX + Math.cos(startAngle) * INNER_R;
                  const y1 = CY + Math.sin(startAngle) * INNER_R;
                  const x2 = CX + Math.cos(startAngle) * outerR;
                  const y2 = CY + Math.sin(startAngle) * outerR;
                  const x3 = CX + Math.cos(endAngle) * outerR;
                  const y3 = CY + Math.sin(endAngle) * outerR;
                  const x4 = CX + Math.cos(endAngle) * INNER_R;
                  const y4 = CY + Math.sin(endAngle) * INNER_R;

                  return (
                    <path
                      key={`seg-${hourData.hour}`}
                      d={[
                        `M ${x1.toFixed(1)} ${y1.toFixed(1)}`,
                        `L ${x2.toFixed(1)} ${y2.toFixed(1)}`,
                        `A ${outerR.toFixed(1)} ${outerR.toFixed(1)} 0 0 1 ${x3.toFixed(1)} ${y3.toFixed(1)}`,
                        `L ${x4.toFixed(1)} ${y4.toFixed(1)}`,
                        `A ${INNER_R} ${INNER_R} 0 0 0 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`,
                      ].join(" ")}
                      fill={`rgba(29,185,84,${(0.1 + intensity * 0.8).toFixed(2)})`}
                      stroke={`rgba(29,185,84,${(0.05 + intensity * 0.35).toFixed(2)})`}
                      strokeWidth="0.5"
                      // Glow filter only on the brightest segments to keep performance sane
                      filter={intensity > 0.65 ? "url(#seg-glow)" : undefined}
                      style={{
                        // Staggered fade-in: segments appear clockwise one by one
                        opacity: mounted ? 1 : 0,
                        transition: "opacity 0.5s ease",
                        transitionDelay: mounted
                          ? `${hourData.hour * 0.045}s`
                          : "0s",
                        cursor: "pointer",
                      }}
                      onMouseMove={(e) =>
                        setTooltip({
                          x: e.clientX,
                          y: e.clientY,
                          hour: hourData.hour,
                          count: hourData.count,
                          topTrack: hourData.topTrack,
                        })
                      }
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {/* Native SVG tooltip as fallback */}
                      <title>
                        {hourData.hour}:00 — {hourData.count} plays
                        {hourData.topTrack ? ` · ${hourData.topTrack}` : ""}
                      </title>
                    </path>
                  );
                })}

                {/* Cardinal hour labels: 12AM (top), 6AM (right), 12PM (bottom), 6PM (left) */}
                {Object.entries(CARDINAL).map(([h, label]) => {
                  const angle = (Number(h) / 24) * Math.PI * 2 - Math.PI / 2;
                  return (
                    <text
                      key={`lbl-${h}`}
                      x={CX + Math.cos(angle) * 145}
                      y={CY + Math.sin(angle) * 145}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#b3b3b3"
                      fontSize="10"
                      fontFamily="DM Sans, sans-serif"
                    >
                      {label}
                    </text>
                  );
                })}

                {/* Center pip */}
                <circle cx={CX} cy={CY} r="8" fill="#1db954" />
                <circle cx={CX} cy={CY} r="4" fill="#fff" />
              </svg>
            </div>

            {/* Peak hour summary */}
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1.1rem 1.5rem",
                background: "rgba(29,185,84,0.07)",
                borderRadius: "12px",
                border: "1px solid rgba(29,185,84,0.2)",
                width: "100%",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "#b3b3b3",
                  fontSize: "0.78rem",
                  marginBottom: "0.35rem",
                }}
              >
                Peak Listening Hour
              </p>
              <p
                style={{
                  color: "#1db954",
                  fontSize: "2.1rem",
                  fontWeight: 700,
                  fontFamily: "DM Sans, sans-serif",
                  marginBottom: "0.3rem",
                }}
              >
                {peakHour.hour}:00
              </p>
              <p style={{ color: "#b3b3b3", fontSize: "0.78rem" }}>
                {peakHour.count} plays this hour
              </p>
              {peakHour.topTrack && (
                <p
                  style={{
                    color: "#fff",
                    fontSize: "0.78rem",
                    marginTop: "0.3rem",
                  }}
                >
                  🎵 {peakHour.topTrack}
                </p>
              )}
            </div>
          </div>

          {/* ── Weekly Heatmap Card ────────────────────────────────────────── */}
          <div className="card">
            <h3 style={{ marginBottom: "1.5rem" }}>Year in Music</h3>

            {/* Scrollable heatmap wrapper */}
            <div style={{ overflowX: "auto", paddingBottom: "4px" }}>
              {/* Month labels row — offset by the day-label column width */}
              <div
                style={{
                  display: "flex",
                  marginLeft: `${DAY_LABEL_W + DAY_GAP}px`,
                  marginBottom: "4px",
                }}
              >
                {MONTH_LABELS.map((m) => (
                  <div
                    key={m}
                    style={{
                      minWidth: `${MONTH_W}px`,
                      fontSize: "10px",
                      color: "#b3b3b3",
                      flexShrink: 0,
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>

              {/* Day labels + week columns */}
              <div
                style={{
                  display: "flex",
                  gap: `${DAY_GAP}px`,
                  alignItems: "flex-start",
                }}
              >
                {/* Day label column (Mon–Sun, every other label shown like GitHub) */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: `${GAP}px`,
                    flexShrink: 0,
                  }}
                >
                  {DAY_LABELS.map((day, i) => (
                    <div
                      key={day}
                      style={{
                        height: `${CELL}px`,
                        width: `${DAY_LABEL_W}px`,
                        fontSize: "10px",
                        color: "#b3b3b3",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        paddingRight: "4px",
                      }}
                    >
                      {i % 2 === 0 ? day : ""}
                    </div>
                  ))}
                </div>

                {/* 52 week columns × 7 day cells */}
                <div style={{ display: "flex", gap: `${GAP}px` }}>
                  {profile.weeklyHeatmap.map((week, weekIdx) => (
                    <div
                      key={weekIdx}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: `${GAP}px`,
                      }}
                    >
                      {week.map((value, dayIdx) => (
                        <div
                          key={dayIdx}
                          title={`Week ${weekIdx + 1}, ${DAY_LABELS[dayIdx]}: ${value} plays`}
                          style={{
                            width: `${CELL}px`,
                            height: `${CELL}px`,
                            borderRadius: "3px",
                            background: getHeatmapColor(value),
                            cursor: "pointer",
                            flexShrink: 0,
                            transition: "transform 0.12s ease",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLDivElement
                            ).style.transform = "scale(1.45)";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLDivElement
                            ).style.transform = "scale(1)";
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Colour-scale legend */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                justifyContent: "flex-end",
                marginTop: "1rem",
              }}
            >
              <span style={{ color: "#b3b3b3", fontSize: "0.7rem" }}>Less</span>
              {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                <div
                  key={i}
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "3px",
                    background:
                      v === 0
                        ? "rgba(255,255,255,0.04)"
                        : `rgba(29,185,84,${(0.14 + v * 0.86).toFixed(2)})`,
                  }}
                />
              ))}
              <span style={{ color: "#b3b3b3", fontSize: "0.7rem" }}>More</span>
            </div>
          </div>
        </div>

        {/* ── Listening Patterns Insight Card ───────────────────────────────── */}
        <div
          className="card animate-in"
          style={{
            marginTop: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            background: "rgba(29,185,84,0.06)",
            borderColor: "rgba(29,185,84,0.28)",
          }}
        >
          <span style={{ fontSize: "2.6rem", flexShrink: 0 }}>📅</span>
          <div>
            <h4 style={{ color: "#1db954", marginBottom: "0.4rem" }}>
              Listening Insight
            </h4>
            <p
              style={{
                color: "#fff",
                fontSize: "1rem",
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              You listen most on{" "}
              <strong style={{ color: "#1db954" }}>{peakDayName}</strong>{" "}
              evenings. Your music taste comes alive as the week winds down —
              weekend energy runs deep in your playlists.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const styles: Record<string, React.CSSProperties> = {
  section: {
    background:
      "linear-gradient(135deg, rgba(6,182,212,0.05) 0%, transparent 100%)",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 2rem",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.6fr",
    gap: "2rem",
    alignItems: "start",
  },
};

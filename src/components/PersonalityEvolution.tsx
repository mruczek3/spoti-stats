import React from "react";
import type { UserProfile } from "../data/mockData";
import { getVisitSnapshots } from "../services/auth";
import type { VisitSnapshot } from "../services/auth";

interface PersonalityEvolutionProps {
  profile: UserProfile;
  spotifyUserId: string;
}

// ── Feature C: Weather forecast ───────────────────────────────────────────────
function getWeatherForecast(personality: UserProfile["personality"]): {
  icon: string;
  title: string;
  description: string;
  cssClass: string;
} {
  const { energy, valence, danceability, acousticness } = personality;

  if (energy > 75 && valence > 65)
    return {
      icon: "☀️",
      title: "Sunny & Danceable",
      description: "Expect pop showers and upbeat rhythms 🌦",
      cssClass: "weather-sunny",
    };
  if (energy > 60 && danceability > 65)
    return {
      icon: "⛅",
      title: "Partly Cloudy",
      description: "With a chance of indie rock and electronic beats",
      cssClass: "weather-cloudy",
    };
  if (acousticness > 60)
    return {
      icon: "🌿",
      title: "Calm & Acoustic",
      description: "Clear skies, gentle folk winds, warm indie sun",
      cssClass: "weather-calm",
    };
  if (valence < 40 && energy < 50)
    return {
      icon: "🌧️",
      title: "Melancholic Rain",
      description: "Heavy emotional clouds, expect introspective showers",
      cssClass: "weather-rain",
    };
  if (energy > 70 && valence < 50)
    return {
      icon: "⚡",
      title: "Stormy & Intense",
      description:
        "Dark energy fronts moving through, high pressure metal zones",
      cssClass: "weather-storm",
    };
  return {
    icon: "🌤",
    title: "Mixed Conditions",
    description: "Varied taste winds, anything could happen today",
    cssClass: "weather-mixed",
  };
}

// ── Feature D: Loyalty badges ─────────────────────────────────────────────────
function calcLoyaltyBadges(snapshots: VisitSnapshot[]): Map<string, number> {
  const counts = new Map<string, number>();
  snapshots.forEach((s) => {
    s.topArtists.forEach((name) => {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
  });
  return counts;
}

function getBadge(count: number): { emoji: string; label: string } | null {
  if (count >= 10) return { emoji: "🥇", label: "Gold" };
  if (count >= 6) return { emoji: "🥈", label: "Silver" };
  if (count >= 3) return { emoji: "🥉", label: "Bronze" };
  return null;
}

// ── Feature E: Artist race ────────────────────────────────────────────────────
function assignHourToArtist(
  hour: number,
  count: number,
  total: number,
  numArtists: number,
): number {
  const weight = count / Math.max(total, 1);
  return Math.floor((hour * 7 + Math.floor(weight * 100)) % numArtists);
}

// ── Date utility ──────────────────────────────────────────────────────────────
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ── CSS string for animations ─────────────────────────────────────────────────
const ANIMATION_CSS = `
  @keyframes evo-pulse-glow {
    0%, 100% { filter: drop-shadow(0 0 8px rgba(255,200,50,0.6)); }
    50%       { filter: drop-shadow(0 0 22px rgba(255,200,50,1)); }
  }
  @keyframes evo-wave {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-5px); }
  }
  @keyframes evo-flicker {
    0%, 100% { opacity: 1;    }
    25%       { opacity: 0.75; }
    75%       { opacity: 0.85; }
  }
  @keyframes evo-float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-7px); }
  }
  @keyframes evo-fadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  .weather-sunny  .evo-weather-icon { animation: evo-pulse-glow 2s ease-in-out infinite; }
  .weather-rain   .evo-weather-icon { animation: evo-wave       1.5s ease-in-out infinite; }
  .weather-storm  .evo-weather-icon { animation: evo-flicker    0.8s ease-in-out infinite; }
  .weather-cloudy .evo-weather-icon,
  .weather-calm   .evo-weather-icon,
  .weather-mixed  .evo-weather-icon { animation: evo-float      3s ease-in-out infinite; }
  .evo-cemetery-item { animation: evo-fadeInUp 0.5s ease-out forwards; opacity: 0; }
`;

// ── SVG arc path builder ──────────────────────────────────────────────────────
const CX = 150;
const CY = 150;
const INNER_R = 56;
const MAX_OUTER_R = 122;
const ARTIST_COLORS = ["#1db954", "#06b6d4", "#f59e0b"];

function arcPath(
  hour: number,
  count: number,
  maxCount: number,
): { d: string; outerR: number } {
  const startAngle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
  const endAngle = ((hour + 1) / 24) * Math.PI * 2 - Math.PI / 2;
  const intensity = count / Math.max(maxCount, 1);
  const outerR = INNER_R + 4 + intensity * (MAX_OUTER_R - INNER_R - 4);

  const x1 = CX + Math.cos(startAngle) * INNER_R;
  const y1 = CY + Math.sin(startAngle) * INNER_R;
  const x2 = CX + Math.cos(startAngle) * outerR;
  const y2 = CY + Math.sin(startAngle) * outerR;
  const x3 = CX + Math.cos(endAngle) * outerR;
  const y3 = CY + Math.sin(endAngle) * outerR;
  const x4 = CX + Math.cos(endAngle) * INNER_R;
  const y4 = CY + Math.sin(endAngle) * INNER_R;

  return {
    d: [
      `M ${x1.toFixed(1)} ${y1.toFixed(1)}`,
      `L ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      `A ${outerR.toFixed(1)} ${outerR.toFixed(1)} 0 0 1 ${x3.toFixed(1)} ${y3.toFixed(1)}`,
      `L ${x4.toFixed(1)} ${y4.toFixed(1)}`,
      `A ${INNER_R} ${INNER_R} 0 0 0 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`,
    ].join(" "),
    outerR,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
const ScoreBar: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div style={{ flex: 1 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "0.75rem",
        marginBottom: "0.25rem",
      }}
    >
      <span style={{ color: "#9ca3af" }}>{label}</span>
      <span style={{ color }}>{value}</span>
    </div>
    <div
      style={{
        height: "4px",
        background: "rgba(255,255,255,0.08)",
        borderRadius: "2px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: color,
          borderRadius: "2px",
          transition: "width 0.6s ease",
        }}
      />
    </div>
  </div>
);

const WeatherStat: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e5e7eb" }}>
      {value}
    </div>
    <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>{label}</div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export const PersonalityEvolution: React.FC<PersonalityEvolutionProps> = ({
  profile,
  spotifyUserId,
}) => {
  const snapshots = getVisitSnapshots(spotifyUserId);

  // ── Feature A data ────────────────────────────────────────────────────────
  const recentSnapshots = snapshots.slice(-6);
  const hasTimeline = snapshots.length >= 2;
  const lastSnapshot: VisitSnapshot | null =
    snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  const currentMoodScore = Math.round(profile.personality.valence);
  const currentTopArtistNames = profile.topArtists
    .slice(0, 5)
    .map((a) => a.name);
  const currentTopTrackNames = profile.topTracks.slice(0, 5).map((t) => t.name);

  const newArtists = lastSnapshot
    ? currentTopArtistNames.filter((n) => !lastSnapshot.topArtists.includes(n))
    : [];
  const tracksStayed = lastSnapshot
    ? currentTopTrackNames.filter((n) => lastSnapshot.topTracks.includes(n))
        .length
    : 0;
  const moodDelta = lastSnapshot
    ? currentMoodScore - lastSnapshot.moodScore
    : 0;

  // ── Feature B data ────────────────────────────────────────────────────────
  // Build a name→artist lookup from the current full topTracks list
  const trackArtistLookup = new Map<string, string>(
    profile.topTracks.map((t) => [t.name, t.artist]),
  );
  const allCurrentTrackNames = new Set(profile.topTracks.map((t) => t.name));
  const departedTrackNames = lastSnapshot
    ? lastSnapshot.topTracks.filter((n) => !allCurrentTrackNames.has(n))
    : [];

  // ── Feature C data ────────────────────────────────────────────────────────
  const weather = getWeatherForecast(profile.personality);

  // ── Feature D data ────────────────────────────────────────────────────────
  const loyaltyMap = calcLoyaltyBadges(snapshots);
  const badgeArtists = profile.topArtists.slice(0, 10);
  const hasAnyBadge = badgeArtists.some(
    (a) => (loyaltyMap.get(a.name) ?? 0) >= 3,
  );

  // ── Feature E data ────────────────────────────────────────────────────────
  const top3 = profile.topArtists.slice(0, 3);
  const history = profile.listeningHistory ?? [];
  const totalCount = history.reduce((s, h) => s + h.count, 0);
  const maxCount = Math.max(...history.map((h) => h.count), 1);
  const numArtists = Math.max(top3.length, 1);

  const hourArtistMap = history.map((h) => ({
    ...h,
    artistIdx: assignHourToArtist(h.hour, h.count, totalCount, numArtists),
  }));

  const hoursDominated = [0, 0, 0];
  hourArtistMap.forEach((h) => {
    if (h.artistIdx < 3) hoursDominated[h.artistIdx]++;
  });

  // Cardinal labels for the clock face
  const CARDINALS = [
    { label: "12AM", angle: -Math.PI / 2 },
    { label: "6AM", angle: 0 },
    { label: "12PM", angle: Math.PI / 2 },
    { label: "6PM", angle: Math.PI },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: "3rem" }}>
      {/* Scoped animations — injected once */}
      <style>{ANIMATION_CSS}</style>

      {/* ══════════════════════════════════════════════════════════════════════
          Feature A — Listening Personality Evolution
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={s.featureBlock}>
        <h3 style={s.featureTitle}>🌱 Listening Personality Evolution</h3>

        {!hasTimeline ? (
          <div style={s.emptyState}>
            Visit again to see how your taste evolves 🌱
          </div>
        ) : (
          <>
            {/* Since-last-visit diff card */}
            {lastSnapshot && (
              <div style={s.diffCard}>
                <p style={s.diffCardHeading}>Since Last Visit</p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.65rem",
                  }}
                >
                  <div style={s.diffRow}>
                    <span>🎤</span>
                    <span>
                      You discovered{" "}
                      <strong style={{ color: "#86efac" }}>
                        {newArtists.length}
                      </strong>{" "}
                      new artist{newArtists.length !== 1 ? "s" : ""} in your top
                      5
                      {newArtists.length > 0 && (
                        <span style={{ color: "#9ca3af", fontSize: "0.85em" }}>
                          {" "}
                          ({newArtists.slice(0, 3).join(", ")})
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={s.diffRow}>
                    <span>😊</span>
                    <span>
                      Mood score changed from{" "}
                      <strong>{lastSnapshot.moodScore}</strong> to{" "}
                      <strong
                        style={{
                          color: moodDelta >= 0 ? "#4ade80" : "#fb923c",
                        }}
                      >
                        {currentMoodScore}
                      </strong>{" "}
                      {moodDelta >= 0 ? "↑" : "↓"}
                    </span>
                  </div>
                  <div style={s.diffRow}>
                    <span>🎵</span>
                    <span>
                      <strong style={{ color: "#86efac" }}>
                        {tracksStayed}
                      </strong>{" "}
                      track{tracksStayed !== 1 ? "s" : ""} stayed in your top 5
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Vertical timeline */}
            <div>
              {recentSnapshots.map((snap, idx) => (
                <div key={`${snap.date}-${idx}`} style={s.timelineRow}>
                  {/* Left rail */}
                  <div style={s.rail}>
                    <div style={s.dot} />
                    {idx < recentSnapshots.length - 1 && (
                      <div style={s.connector} />
                    )}
                  </div>
                  {/* Card */}
                  <div style={s.timelineCard}>
                    <div style={s.timelineDate}>
                      {formatRelativeDate(snap.date)}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.35rem",
                      }}
                    >
                      {snap.topArtists.slice(0, 3).map((name, i) => (
                        <span key={i} style={s.chip}>
                          {name}
                        </span>
                      ))}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        marginTop: "0.75rem",
                      }}
                    >
                      <ScoreBar
                        label="Mood"
                        value={snap.moodScore}
                        color="#1db954"
                      />
                      <ScoreBar
                        label="Energy"
                        value={snap.energyScore}
                        color="#06b6d4"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Feature B — Track Cemetery
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={s.featureBlock}>
        <h3 style={s.featureTitle}>🪦 Track Cemetery</h3>

        {departedTrackNames.length === 0 ? (
          <div style={s.emptyState}>Your top tracks are holding strong 💪</div>
        ) : (
          <div style={s.cemeteryCard}>
            <p
              style={{
                color: "#c4b5fd",
                fontWeight: 600,
                marginBottom: "1.25rem",
              }}
            >
              Tracks That Left Your Top 50
            </p>
            {departedTrackNames.map((name, idx) => {
              const artist = trackArtistLookup.get(name);
              return (
                <div
                  key={name}
                  className="evo-cemetery-item"
                  style={{
                    ...s.cemeteryItem,
                    animationDelay: `${idx * 0.12}s`,
                    borderBottom:
                      idx < departedTrackNames.length - 1
                        ? "1px solid rgba(139,92,246,0.12)"
                        : "none",
                  }}
                >
                  <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>🪦</span>
                  <div>
                    <div
                      style={{
                        textDecoration: "line-through",
                        color: "#9ca3af",
                      }}
                    >
                      {name}
                    </div>
                    {artist && (
                      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                        {artist}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "#7c3aed",
                        marginTop: "0.15rem",
                      }}
                    >
                      RIP · Left your top 50
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Feature C — Taste Weather Forecast
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={s.featureBlock}>
        <h3 style={s.featureTitle}>🌤 Taste Weather Forecast</h3>

        <div className={weather.cssClass} style={s.weatherCard}>
          <span className="evo-weather-icon" style={s.weatherIcon}>
            {weather.icon}
          </span>
          <div style={s.weatherTitle}>{weather.title}</div>
          <div style={s.weatherDesc}>{weather.description}</div>
          <div style={s.weatherStats}>
            <WeatherStat
              label="Energy"
              value={Math.round(profile.personality.energy)}
            />
            <WeatherStat
              label="Vibes"
              value={Math.round(profile.personality.valence)}
            />
            <WeatherStat
              label="Dance"
              value={Math.round(profile.personality.danceability)}
            />
            <WeatherStat
              label="Acoustic"
              value={Math.round(profile.personality.acousticness)}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Feature D — Artist Loyalty Badges
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={s.featureBlock}>
        <h3 style={s.featureTitle}>🏆 Artist Loyalty Badges</h3>

        {!hasAnyBadge ? (
          <div style={s.emptyState}>
            Keep listening — badges are earned over time!
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
          >
            {badgeArtists.map((artist) => {
              const visits = loyaltyMap.get(artist.name) ?? 0;
              const badge = getBadge(visits);
              const isGold = badge?.label === "Gold";
              return (
                <div
                  key={artist.id}
                  style={{ ...s.loyaltyRow, ...(isGold ? s.goldRow : {}) }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <img
                      src={artist.image}
                      alt={artist.name}
                      width={36}
                      height={36}
                      style={s.artistThumb}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{artist.name}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    {badge && (
                      <span title={badge.label} style={{ fontSize: "1.4rem" }}>
                        {badge.emoji}
                      </span>
                    )}
                    {visits > 0 ? (
                      <span style={{ color: "#b3b3b3", fontSize: "0.83rem" }}>
                        {visits} visit{visits !== 1 ? "s" : ""}
                      </span>
                    ) : null}
                    {!badge && visits > 0 && (
                      <span style={{ color: "#6b7280", fontSize: "0.78rem" }}>
                        {3 - visits} to bronze
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Feature E — Listening Clock Race
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={s.featureBlock}>
        <h3 style={s.featureTitle}>🏁 Artist Race — Who Dominates Your Day?</h3>

        <div style={s.raceGrid}>
          {/* SVG clock face */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <svg width="300" height="300" viewBox="0 0 300 300">
              {/* Background rings */}
              <circle
                cx={CX}
                cy={CY}
                r={MAX_OUTER_R + 5}
                fill="rgba(0,0,0,0.25)"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
              <circle
                cx={CX}
                cy={CY}
                r={INNER_R}
                fill="rgba(0,0,0,0.45)"
                stroke="rgba(29,185,84,0.2)"
                strokeWidth="1.5"
              />

              {/* Colored hour segments */}
              {hourArtistMap.map(({ hour, count, artistIdx }) => {
                const color = ARTIST_COLORS[artistIdx] ?? ARTIST_COLORS[0];
                const { d } = arcPath(hour, count, maxCount);
                const intensity = count / maxCount;
                // encode alpha as 2-digit hex (~33–cc)
                const alpha = Math.round((0.2 + intensity * 0.65) * 255)
                  .toString(16)
                  .padStart(2, "0");
                return (
                  <path
                    key={`race-${hour}`}
                    d={d}
                    fill={`${color}${alpha}`}
                    stroke={`${color}40`}
                    strokeWidth="0.5"
                    style={{ transition: "opacity 0.3s", cursor: "default" }}
                    aria-label={`Hour ${hour}: ${top3[artistIdx]?.name ?? ""}`}
                  />
                );
              })}

              {/* Cardinal hour labels */}
              {CARDINALS.map(({ label, angle }) => (
                <text
                  key={label}
                  x={(CX + Math.cos(angle) * (MAX_OUTER_R + 17)).toFixed(1)}
                  y={(CY + Math.sin(angle) * (MAX_OUTER_R + 17)).toFixed(1)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#6b7280"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {label}
                </text>
              ))}

              {/* Center label */}
              <text
                x={CX}
                y={CY - 7}
                textAnchor="middle"
                fill="#d1d5db"
                fontSize="10"
                fontWeight="600"
              >
                ARTIST
              </text>
              <text
                x={CX}
                y={CY + 8}
                textAnchor="middle"
                fill="#d1d5db"
                fontSize="10"
                fontWeight="600"
              >
                RACE
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div style={s.raceLegend}>
            {top3.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No artist data available</p>
            ) : (
              top3.map((artist, idx) => (
                <div key={artist.id} style={s.legendItem}>
                  <div
                    style={{
                      ...s.legendDot,
                      background: ARTIST_COLORS[idx],
                      boxShadow: `0 0 8px ${ARTIST_COLORS[idx]}60`,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                      {artist.name}
                    </div>
                    <div style={{ color: "#b3b3b3", fontSize: "0.82rem" }}>
                      {hoursDominated[idx]} hour
                      {hoursDominated[idx] !== 1 ? "s" : ""} dominated
                    </div>
                    <div
                      style={{
                        marginTop: "0.3rem",
                        height: "4px",
                        width: `${Math.round((hoursDominated[idx] / 24) * 100)}%`,
                        background: ARTIST_COLORS[idx],
                        borderRadius: "2px",
                        minWidth: "4px",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  featureBlock: {
    marginBottom: "3rem",
  },
  featureTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#e5e7eb",
    marginBottom: "1.25rem",
  },
  emptyState: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "2rem",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "0.97rem",
  },

  // Feature A
  diffCard: {
    background: "rgba(29,185,84,0.06)",
    border: "1px solid rgba(29,185,84,0.22)",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  },
  diffCardHeading: {
    fontWeight: 700,
    color: "#1db954",
    marginBottom: "1rem",
    fontSize: "0.95rem",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  diffRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.6rem",
    color: "#d1d5db",
    fontSize: "0.93rem",
    lineHeight: "1.5",
  },
  timelineRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
  },
  rail: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "18px",
    flexShrink: 0,
    paddingTop: "5px",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#1db954",
    flexShrink: 0,
    boxShadow: "0 0 6px #1db954",
  },
  connector: {
    width: "2px",
    flex: 1,
    background: "rgba(29,185,84,0.25)",
    minHeight: "44px",
  },
  timelineCard: {
    flex: 1,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "1rem 1.25rem",
    marginBottom: "0.6rem",
  },
  timelineDate: {
    fontSize: "0.78rem",
    color: "#6b7280",
    fontFamily: "monospace",
    marginBottom: "0.5rem",
  },
  chip: {
    background: "rgba(29,185,84,0.12)",
    border: "1px solid rgba(29,185,84,0.25)",
    borderRadius: "20px",
    padding: "0.12rem 0.55rem",
    fontSize: "0.76rem",
    color: "#86efac",
  },

  // Feature B
  cemeteryCard: {
    background: "rgba(139,92,246,0.05)",
    border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: "12px",
    padding: "1.5rem",
  },
  cemeteryItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    padding: "0.65rem 0",
  },

  // Feature C
  weatherCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "2.5rem 2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.7rem",
    textAlign: "center",
  },
  weatherIcon: {
    fontSize: "4rem",
    display: "block",
    lineHeight: "1",
  },
  weatherTitle: {
    fontSize: "1.55rem",
    fontWeight: 700,
    color: "#e5e7eb",
  },
  weatherDesc: {
    color: "#9ca3af",
    fontSize: "0.95rem",
    maxWidth: "320px",
    lineHeight: "1.5",
  },
  weatherStats: {
    display: "flex",
    gap: "2rem",
    marginTop: "0.5rem",
    padding: "0.75rem 1.75rem",
    background: "rgba(0,0,0,0.2)",
    borderRadius: "10px",
  },

  // Feature D
  loyaltyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "0.7rem 1rem",
  },
  goldRow: {
    background: "rgba(245,158,11,0.08)",
    border: "1px solid rgba(245,158,11,0.35)",
    boxShadow: "0 0 14px rgba(245,158,11,0.15)",
  },
  artistThumb: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  // Feature E
  raceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem",
    alignItems: "center",
  },
  raceLegend: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  legendItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
  },
  legendDot: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: "3px",
  },
};

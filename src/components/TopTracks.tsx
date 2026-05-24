import React, { useState } from "react";
import type { Track } from "../data/mockData";
import * as spotifyApi from "../services/spotifyApi";
import { hasValidToken } from "../services/auth";
import { spotifyTracksToLocal } from "../utils/converters";

type TimeRange = "short_term" | "medium_term" | "long_term";

interface TopTracksProps {
  tracks: Track[];
}

export const TopTracks: React.FC<TopTracksProps> = ({
  tracks: initialTracks,
}) => {
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const handleRangeChange = async (range: TimeRange) => {
    if (loading) return;
    setLoading(true);

    if (hasValidToken()) {
      try {
        const data = (await spotifyApi.getTopTracks(range, 50)) as {
          items: any[];
        };
        const newTracks = spotifyTracksToLocal(data.items);
        console.log(
          "[TopTracks] order from API:",
          newTracks.slice(0, 5).map((t) => t.name),
        );
        setTracks(newTracks);
      } catch (err) {
        console.error("[TopTracks] fetch failed:", err);
      }
    }

    // Demo mode: timeRange still updates so button highlights correctly; tracks unchanged
    setTimeRange(range);
    setVisibleCount(10);
    setLoading(false);
  };

  const showMore = () => {
    setVisibleCount((prev) => Math.min(prev + 10, tracks.length));
  };

  const hasMore = visibleCount < tracks.length;
  const nextCount = Math.min(visibleCount + 10, tracks.length);

  return (
    <section style={styles.section} className="section fade-on-scroll">
      <div style={styles.container}>
        {/* Header with time range selector */}
        <div style={styles.header}>
          <h2>Top Tracks</h2>
          <div style={styles.timeRangeSelector}>
            {(["short_term", "medium_term", "long_term"] as const).map(
              (range) => (
                <button
                  key={range}
                  onClick={() => handleRangeChange(range)}
                  style={{
                    ...styles.timeRangeBtn,
                    ...(timeRange === range ? styles.timeRangeBtnActive : {}),
                  }}
                >
                  {range === "short_term"
                    ? "Last 4 Weeks"
                    : range === "medium_term"
                      ? "Last 6 Months"
                      : "All Time"}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div style={styles.tracksGrid}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-card card"
                style={{ minHeight: "320px", animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Track grid — only the first visibleCount tracks are rendered */}
            <div style={styles.tracksGrid}>
              {tracks.slice(0, visibleCount).map((track, idx) => (
                <TrackCard key={track.id} track={track} rank={idx + 1} />
              ))}
            </div>

            {/* Show more button */}
            {hasMore && (
              <div style={styles.showMoreContainer}>
                <button
                  style={styles.showMoreBtn}
                  onClick={showMore}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "#1ed760";
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "scale(1.05)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 8px 24px rgba(29,185,84,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "#1db954";
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "scale(1)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 4px 16px rgba(29,185,84,0.3)";
                  }}
                >
                  Show more ({nextCount}/{tracks.length})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// TrackCard — rank = API position (idx + 1), no drag, no rankDiff
// ---------------------------------------------------------------------------

interface TrackCardProps {
  track: Track;
  rank: number;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, rank }) => (
  <div style={styles.trackCard} className="card animate-in">
    <div style={styles.trackHeader}>
      <div style={styles.rankBadge}>{rank}</div>
      <img src={track.albumArt} alt={track.name} style={styles.trackImage} />
    </div>

    <h4 style={{ marginTop: "1rem" }}>{track.name}</h4>
    <p style={{ color: "#b3b3b3", marginBottom: "1rem" }}>{track.artist}</p>

    {/* Waveform */}
    <div style={styles.waveform}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            ...styles.waveformBar,
            height: `${30 + Math.sin(i * 0.5 + track.id.charCodeAt(0)) * 30}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>

    {/* Stats */}
    <div style={styles.statsContainer}>
      <StatRow label="Plays" value={track.playCount.toString()} />
      <StatRow label="Hours" value={track.hoursListened.toString()} />
      <StatRow label="Mood" value={`${Math.round(track.moodScore)}/100`} />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// StatRow
// ---------------------------------------------------------------------------

const StatRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div style={styles.statRow}>
    <span style={{ color: "#b3b3b3", fontSize: "0.9rem" }}>{label}</span>
    <span style={{ color: "#1db954", fontWeight: "700" }}>{value}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  section: {
    background:
      "linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, transparent 100%)",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 2rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "3rem",
  },
  timeRangeSelector: {
    display: "flex",
    gap: "1rem",
  },
  timeRangeBtn: {
    padding: "0.75rem 1.5rem",
    background: "rgba(29, 185, 84, 0.1)",
    border: "1px solid rgba(29, 185, 84, 0.2)",
    color: "#b3b3b3",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontFamily: "'DM Sans', sans-serif",
  },
  timeRangeBtnActive: {
    background: "#1db954",
    color: "#000",
    borderColor: "#1db954",
    fontWeight: 700,
  },
  tracksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "2rem",
  },
  trackCard: {
    display: "flex",
    flexDirection: "column",
  },
  trackHeader: {
    position: "relative",
    marginBottom: "1rem",
  },
  rankBadge: {
    position: "absolute",
    top: "10px",
    left: "10px",
    background: "#1db954",
    color: "#000",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    fontWeight: "700",
    zIndex: 2,
  },
  trackImage: {
    width: "100%",
    aspectRatio: "1",
    borderRadius: "12px",
    objectFit: "cover",
  },
  waveform: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: "3px",
    height: "40px",
    margin: "1rem 0",
  },
  waveformBar: {
    width: "4px",
    background: "linear-gradient(180deg, #1db954, #06b6d4)",
    borderRadius: "2px",
    animation: "wave 0.6s ease-in-out infinite",
  },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
    marginTop: "auto",
    paddingTop: "1rem",
    borderTop: "1px solid rgba(29, 185, 84, 0.2)",
  },
  statRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    alignItems: "center",
  },
  showMoreContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "3rem",
  },
  showMoreBtn: {
    padding: "1rem 2.5rem",
    background: "#1db954",
    color: "#000",
    border: "none",
    borderRadius: "50px",
    fontSize: "1.1rem",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.02em",
    boxShadow: "0 4px 16px rgba(29,185,84,0.3)",
    transition:
      "background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
  },
};

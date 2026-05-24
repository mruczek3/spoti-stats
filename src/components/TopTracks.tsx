import React, { useState } from "react";
import type { Track } from "../data/mockData";

interface TopTracksProps {
  tracks: Track[];
}

export const TopTracks: React.FC<TopTracksProps> = ({ tracks }) => {
  const [timeRange, setTimeRange] = useState<"4weeks" | "6months" | "alltime">(
    "4weeks",
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  // userRanking stores original track indices in user-preferred order (full list)
  const [userRanking, setUserRanking] = useState(() => tracks.map((_, i) => i));
  const [visibleCount, setVisibleCount] = useState(10);

  // -------------------------------------------------------------------------
  // Drag handlers — operate on visible-slice positions only
  // -------------------------------------------------------------------------

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const newRanking = [...userRanking];
    const draggedId = newRanking[draggedIndex];
    newRanking.splice(draggedIndex, 1);
    newRanking.splice(index, 0, draggedId);
    setUserRanking(newRanking);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

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
            {(["4weeks", "6months", "alltime"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  ...styles.timeRangeBtn,
                  ...(timeRange === range ? styles.timeRangeBtnActive : {}),
                }}
              >
                {range === "4weeks"
                  ? "Last 4 Weeks"
                  : range === "6months"
                    ? "Last 6 Months"
                    : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {/* Track grid — only the first visibleCount tracks are rendered */}
        <div style={styles.tracksGrid}>
          {tracks.slice(0, visibleCount).map((track, idx) => {
            const userIdx = userRanking.indexOf(idx);
            const rankDiff = idx - userIdx;
            return (
              <TrackCard
                key={track.id}
                track={track}
                rank={idx + 1}
                userRank={userIdx + 1}
                rankDiff={rankDiff}
                isDragging={draggedIndex === idx}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={() => handleDragOver(idx)}
                onDragEnd={handleDragEnd}
              />
            );
          })}
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
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// TrackCard
// ---------------------------------------------------------------------------

interface TrackCardProps {
  track: Track;
  rank: number;
  userRank: number;
  rankDiff: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
}

const TrackCard: React.FC<TrackCardProps> = ({
  track,
  rank,
  rankDiff,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
}) => (
  <div
    style={{
      ...styles.trackCard,
      opacity: isDragging ? 0.5 : 1,
      cursor: "grab",
    }}
    draggable
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDragEnd={onDragEnd}
    className="card animate-in"
  >
    <div style={styles.trackHeader}>
      <div style={styles.rankBadge}>{rank}</div>
      <img src={track.albumArt} alt={track.name} style={styles.trackImage} />
      <div style={styles.rankChange}>
        {rankDiff > 0 ? (
          <span style={{ color: "#06b6d4" }}>↑ {rankDiff}</span>
        ) : rankDiff < 0 ? (
          <span style={{ color: "#f59e0b" }}>↓ {Math.abs(rankDiff)}</span>
        ) : (
          <span style={{ color: "#b3b3b3" }}>= Stable</span>
        )}
      </div>
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
  rankChange: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    background: "rgba(10, 10, 10, 0.9)",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600",
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

import React, { useEffect, useState } from "react";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import type { UserProfile } from "../data/mockData";

// ─── Props ────────────────────────────────────────────────────────────────────

interface HeroDashboardProps {
  profile: UserProfile;
  /** Preferred display name set by the user. Falls back to profile.displayName. */
  nickname?: string;
  /** Called when the user saves a new nickname. */
  onNicknameChange?: (newNickname: string) => void;
}

// Validation: 3–20 chars, letters / numbers / underscores only
const NICKNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// ─── Component ────────────────────────────────────────────────────────────────

export const HeroDashboard: React.FC<HeroDashboardProps> = ({
  profile,
  nickname,
  onNicknameChange,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  // Nickname editor state
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  // Avatar fallback state
  const [avatarError, setAvatarError] = useState(false);

  // The name displayed everywhere
  const displayName = nickname || profile.displayName;
  const firstWord = displayName.split(" ")[0];

  // Keep the nickname input in sync when the prop changes
  useEffect(() => {
    setNicknameInput(nickname || profile.displayName);
  }, [nickname, profile.displayName]);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setProgress((prev) => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // ── Nickname editor handlers ────────────────────────────────────────────────

  const startEdit = () => {
    setNicknameInput(nickname || profile.displayName);
    setNicknameError(null);
    setIsEditingNickname(true);
  };

  const saveNickname = () => {
    const trimmed = nicknameInput.trim();
    if (!NICKNAME_REGEX.test(trimmed)) {
      setNicknameError(
        "Nickname must be 3–20 characters: letters, numbers and underscores only.",
      );
      return;
    }
    onNicknameChange?.(trimmed);
    setIsEditingNickname(false);
    setNicknameError(null);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const cancelEdit = () => {
    setIsEditingNickname(false);
    setNicknameError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") saveNickname();
    if (e.key === "Escape") cancelEdit();
  };

  // ── Avatar ─────────────────────────────────────────────────────────────────

  const showImg = Boolean(profile.avatar) && !avatarError;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section style={styles.section} className="section">
      <div style={styles.container}>
        {/* ── Hero Header ── */}
        <div
          style={{
            ...styles.heroHeader,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s ease",
          }}
        >
          <div style={styles.greeting}>
            {/* Avatar */}
            <div style={styles.avatarContainer}>
              {showImg ? (
                <img
                  src={profile.avatar}
                  alt={displayName}
                  style={styles.avatar}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div style={styles.initialsAvatar}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={styles.auraRing} />
            </div>

            {/* Text block */}
            <div>
              {/* Greeting */}
              <h1 style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>
                Hello, <span style={{ color: "#1db954" }}>{firstWord}</span>
              </h1>

              {/* Nickname editor row */}
              <div style={styles.nicknameRow}>
                {!isEditingNickname ? (
                  <>
                    <span style={styles.nicknameDisplay}>{displayName}</span>
                    <button
                      onClick={startEdit}
                      style={styles.iconBtn}
                      title="Edit nickname"
                      aria-label="Edit nickname"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    {savedMsg && (
                      <span style={styles.savedMsg}>Nickname saved!</span>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={(e) => {
                        setNicknameInput(e.target.value);
                        setNicknameError(null);
                      }}
                      onKeyDown={handleKeyDown}
                      style={styles.nicknameInput}
                      maxLength={20}
                      autoFocus
                    />
                    <button
                      onClick={saveNickname}
                      style={styles.iconBtn}
                      title="Save nickname"
                      aria-label="Save nickname"
                    >
                      <FiCheck size={14} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={styles.iconBtnDanger}
                      title="Cancel"
                      aria-label="Cancel edit"
                    >
                      <FiX size={14} />
                    </button>
                  </>
                )}
              </div>

              {nicknameError && (
                <p style={styles.nicknameError}>{nicknameError}</p>
              )}

              {/* Archetype */}
              <p
                style={{
                  fontSize: "1.1rem",
                  color: "#b3b3b3",
                  marginTop: "0.5rem",
                }}
              >
                {profile.listenerArchetype}
              </p>
              <p style={{ marginTop: "0.5rem", maxWidth: "500px" }}>
                {profile.archetypeDescription}
              </p>
            </div>
          </div>
        </div>

        {/* ── Currently Playing + Key Stats ── */}
        <div style={styles.gridContainer} className="mt-4">
          <div style={styles.currentlyPlayingCard} className="card animate-in">
            <h3 style={{ marginBottom: "1.5rem", fontSize: "1.2rem" }}>
              Now Playing
            </h3>
            {profile.currentlyPlaying ? (
              <>
                <img
                  src={profile.currentlyPlaying.albumArt}
                  alt="Album Art"
                  style={styles.albumArt}
                />
                <h4 style={{ marginTop: "1.5rem" }}>
                  {profile.currentlyPlaying.name}
                </h4>
                <p style={{ color: "#b3b3b3", marginBottom: "1rem" }}>
                  {profile.currentlyPlaying.artist}
                </p>

                {/* Progress bar */}
                <div style={styles.progressContainer}>
                  <div
                    style={{
                      ...styles.progressBar,
                      width: `${progress}%`,
                    }}
                  />
                </div>
                <div style={styles.timeInfo}>
                  <span>
                    {Math.floor(
                      (progress / 100) * profile.currentlyPlaying.duration,
                    )}
                    s
                  </span>
                  <span>{profile.currentlyPlaying.duration}s</span>
                </div>

                {/* Audio features */}
                <div style={styles.features}>
                  <div style={styles.featureItem}>
                    <span>BPM</span>
                    <span style={{ color: "#1db954", fontWeight: "700" }}>
                      {profile.currentlyPlaying.audioFeatures.bpm}
                    </span>
                  </div>
                  <div style={styles.featureItem}>
                    <span>Energy</span>
                    <span style={{ color: "#f59e0b", fontWeight: "700" }}>
                      {Math.round(
                        profile.currentlyPlaying.audioFeatures.energy,
                      )}
                      %
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p>No track currently playing</p>
            )}
          </div>

          {/* Key Stats */}
          <div style={styles.statsGrid}>
            <StatCard
              label="Total Minutes"
              value={profile.totalMinutesListened.toLocaleString()}
              color="#1db954"
            />
            <StatCard
              label="Artists Discovered"
              value={profile.artistsDiscovered.toString()}
              color="#f59e0b"
            />
            <StatCard
              label="Listening Streak"
              value={`${profile.listeningStreak} days`}
              color="#06b6d4"
            />
          </div>
        </div>

        {/* ── Listening Streak Tracker ── */}
        <div style={styles.streakSection} className="card animate-in mt-4">
          <h3 style={{ marginBottom: "1.5rem" }}>Listening Streak</h3>
          <div style={styles.streakVisual}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.streakDay,
                  background:
                    i < profile.listeningStreak % 30
                      ? "#1db954"
                      : "rgba(29, 185, 84, 0.1)",
                }}
                title={`Day ${i + 1}`}
              />
            ))}
          </div>
          <p style={{ marginTop: "1rem", color: "#b3b3b3" }}>
            You've been listening for{" "}
            <span style={{ color: "#1db954", fontWeight: "700" }}>
              {profile.listeningStreak} days
            </span>{" "}
            in a row!
          </p>
        </div>
      </div>
    </section>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => (
  <div style={{ ...styles.statCard, borderColor: color }} className="card">
    <p style={{ color: "#b3b3b3", marginBottom: "0.5rem" }}>{label}</p>
    <h3 style={{ color, fontSize: "2.5rem" }}>{value}</h3>
  </div>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  section: {
    paddingTop: "8rem",
    background:
      "linear-gradient(135deg, rgba(29, 185, 84, 0.05) 0%, transparent 100%)",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 2rem",
  },
  heroHeader: {
    marginBottom: "3rem",
  },
  greeting: {
    display: "flex",
    alignItems: "center",
    gap: "2rem",
  },

  // ── Avatar ──
  avatarContainer: {
    position: "relative",
    flexShrink: 0,
  },
  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    border: "3px solid #1db954",
    display: "block",
    objectFit: "cover",
  },
  initialsAvatar: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "#1db954",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "2.5rem",
    fontWeight: "700",
    border: "3px solid #1db954",
    flexShrink: 0,
  },
  auraRing: {
    position: "absolute",
    top: "-8px",
    left: "-8px",
    right: "-8px",
    bottom: "-8px",
    borderRadius: "50%",
    border: "2px solid #1db954",
    animation: "pulse 2s ease-in-out infinite",
  },

  // ── Nickname editor ──
  nicknameRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.25rem",
    flexWrap: "wrap",
  },
  nicknameDisplay: {
    fontSize: "1rem",
    color: "#b3b3b3",
    fontWeight: "500",
  },
  nicknameInput: {
    background: "rgba(20, 20, 25, 0.9)",
    border: "1px solid rgba(29, 185, 84, 0.5)",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    padding: "0.3rem 0.6rem",
    outline: "none",
    width: "180px",
  },
  iconBtn: {
    background: "rgba(29, 185, 84, 0.12)",
    border: "1px solid rgba(29, 185, 84, 0.3)",
    borderRadius: "6px",
    color: "#1db954",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.3rem 0.4rem",
    transition: "background 0.2s ease",
  },
  iconBtnDanger: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "6px",
    color: "#ef4444",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.3rem 0.4rem",
    transition: "background 0.2s ease",
  },
  nicknameError: {
    color: "#ef4444",
    fontSize: "0.78rem",
    marginTop: "0.25rem",
    marginBottom: "0",
  },
  savedMsg: {
    color: "#1db954",
    fontSize: "0.8rem",
    fontWeight: "600",
  },

  // ── Grid ──
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "2rem",
  },
  currentlyPlayingCard: {
    display: "flex",
    flexDirection: "column",
  },
  albumArt: {
    width: "100%",
    aspectRatio: "1",
    borderRadius: "12px",
    objectFit: "cover",
  },
  progressContainer: {
    width: "100%",
    height: "6px",
    background: "rgba(29, 185, 84, 0.1)",
    borderRadius: "3px",
    overflow: "hidden",
    marginTop: "1rem",
  },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, #1db954, #06b6d4)",
    transition: "width 0.1s linear",
  },
  timeInfo: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.85rem",
    color: "#b3b3b3",
    marginTop: "0.5rem",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1rem",
    marginTop: "1.5rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid rgba(29, 185, 84, 0.2)",
  },
  featureItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
  },
  statCard: {
    borderLeft: "3px solid",
    padding: "2rem",
  },
  streakSection: {
    maxWidth: "800px",
  },
  streakVisual: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(25px, 1fr))",
    gap: "8px",
  },
  streakDay: {
    aspectRatio: "1",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
};

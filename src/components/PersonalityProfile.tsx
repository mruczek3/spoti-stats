import React, { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { UserProfile } from "../data/mockData";
import { PersonalityEvolution } from "./PersonalityEvolution";

interface PersonalityProfileProps {
  profile: UserProfile;
  statsId?: string;
  spotifyUserId?: string;
}

export const PersonalityProfile: React.FC<PersonalityProfileProps> = ({
  profile,
  statsId,
  spotifyUserId,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyStatsId = () => {
    if (!statsId) return;
    navigator.clipboard.writeText(statsId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const data = [
    { name: "Energy", value: Math.round(profile.personality.energy) },
    {
      name: "Danceability",
      value: Math.round(profile.personality.danceability),
    },
    {
      name: "Acousticness",
      value: Math.round(profile.personality.acousticness),
    },
    { name: "Valence", value: Math.round(profile.personality.valence) },
    { name: "Liveness", value: Math.round(profile.personality.liveness) },
    { name: "Speechiness", value: Math.round(profile.personality.speechiness) },
  ];

  const dominantTraits = data.sort((a, b) => b.value - a.value).slice(0, 3);

  return (
    <section style={styles.section} className="section fade-on-scroll">
      <div style={styles.container}>
        <h2 style={{ marginBottom: "3rem" }}>Listening Personality</h2>

        <div style={styles.contentGrid}>
          {/* Radar Chart */}
          <div style={styles.chartContainer} className="card">
            <h3 style={{ marginBottom: "1.5rem" }}>Your Taste Dimensions</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={data}>
                <PolarGrid
                  stroke="rgba(29, 185, 84, 0.1)"
                  fill="rgba(29, 185, 84, 0.02)"
                />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fill: "#b3b3b3", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#b3b3b3", fontSize: 12 }}
                />
                <Radar
                  name="Your Profile"
                  dataKey="value"
                  stroke="#1db954"
                  fill="#1db954"
                  fillOpacity={0.3}
                  isAnimationActive={true}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Archetype Info */}
          <div style={styles.archetypeContainer}>
            <div style={styles.archetypeCard} className="card animate-in">
              <div style={styles.archetypeIcon}>🎵</div>
              <h3 style={{ marginTop: "1rem" }}>{profile.listenerArchetype}</h3>
              <p style={{ marginTop: "1rem" }}>
                {profile.archetypeDescription}
              </p>

              {/* Dominant Traits */}
              <div style={styles.traitsSection}>
                <h4 style={{ marginBottom: "1rem" }}>Your Dominant Traits</h4>
                {dominantTraits.map((trait, idx) => (
                  <TraitBar
                    key={trait.name}
                    name={trait.name}
                    value={trait.value}
                    index={idx}
                  />
                ))}
              </div>
            </div>

            {/* Personality Description */}
            <div style={styles.descriptionCard} className="card animate-in">
              <h4 style={{ marginBottom: "1rem" }}>What This Means</h4>
              <PersonalityExplanation personality={profile.personality} />
            </div>
          </div>
        </div>

        {/* ── Stats ID card ──────────────────────────────────────────── */}
        {statsId && (
          <div style={styles.statsIdCard} className="card">
            <h4 style={{ marginBottom: "0.75rem" }}>Your Stats ID</h4>
            <div style={styles.statsIdRow}>
              <code style={styles.statsIdCode}>{statsId}</code>
              <button
                onClick={handleCopyStatsId}
                style={{
                  ...styles.copyBtn,
                  background: copied
                    ? "rgba(29,185,84,0.25)"
                    : "rgba(29,185,84,0.1)",
                  borderColor: copied ? "#1db954" : "rgba(29,185,84,0.3)",
                  color: copied ? "#1db954" : "#b3b3b3",
                }}
              >
                {copied ? "\u2713 Copied!" : "Copy"}
              </button>
            </div>
            <p
              style={{
                color: "#b3b3b3",
                fontSize: "0.88rem",
                marginTop: "0.6rem",
              }}
            >
              Use this ID to receive comments and be found by others.
            </p>
          </div>
        )}

        {/* ── Personality Evolution (all 5 unique features) ───────── */}
        <PersonalityEvolution
          profile={profile}
          spotifyUserId={spotifyUserId || ""}
        />
      </div>
    </section>
  );
};

interface TraitBarProps {
  name: string;
  value: number;
  index: number;
}

const TraitBar: React.FC<TraitBarProps> = ({ name, value, index }) => (
  <div
    style={{
      marginBottom: "1.5rem",
      animation: "fadeInUp 0.6s ease-out forwards",
      animationDelay: `${index * 0.1}s`,
      opacity: 0,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "0.5rem",
      }}
    >
      <span style={{ color: "#b3b3b3" }}>{name}</span>
      <span style={{ color: "#1db954", fontWeight: "700" }}>{value}%</span>
    </div>
    <div
      style={{
        width: "100%",
        height: "8px",
        background: "rgba(29, 185, 84, 0.1)",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: "linear-gradient(90deg, #1db954, #06b6d4)",
          transition: "width 0.8s ease",
          animation: "loadingAnimation 0.8s ease forwards",
        }}
      />
    </div>
  </div>
);

interface PersonalityExplanationProps {
  personality: Record<string, number>;
}

const PersonalityExplanation: React.FC<PersonalityExplanationProps> = ({
  personality,
}) => {
  const energy = personality.energy;
  const valence = personality.valence;
  const acousticness = personality.acousticness;
  const danceability = personality.danceability;

  let explanation = "";

  if (energy > 70) {
    explanation +=
      "You're drawn to high-energy, intense music that keeps you moving. ";
  } else if (energy < 40) {
    explanation += "You prefer mellow, relaxing soundscapes. ";
  } else {
    explanation += "You enjoy a balanced mix of energetic and calm music. ";
  }

  if (valence > 70) {
    explanation += "Happy, uplifting tracks dominate your playlist. ";
  } else if (valence < 40) {
    explanation += "You're attracted to emotional, melancholic music. ";
  } else {
    explanation += "You appreciate a diverse emotional range. ";
  }

  if (acousticness > 70) {
    explanation += "Acoustic, raw, and authentic sounds resonate with you. ";
  }

  if (danceability > 75) {
    explanation +=
      "Every beat moves you—rhythm is essential to your music taste.";
  }

  return <p style={{ lineHeight: "1.8", color: "#b3b3b3" }}>{explanation}</p>;
};

const styles: Record<string, React.CSSProperties> = {
  section: {
    background:
      "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 100%)",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 2rem",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem",
    alignItems: "start",
  },
  chartContainer: {
    padding: "2rem",
  },
  archetypeContainer: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "2rem",
  },
  archetypeCard: {
    textAlign: "center",
  },
  archetypeIcon: {
    fontSize: "4rem",
  },
  traitsSection: {
    marginTop: "2rem",
    paddingTop: "2rem",
    borderTop: "1px solid rgba(29, 185, 84, 0.2)",
    textAlign: "left",
  },
  descriptionCard: {
    padding: "2rem",
  },
  statsIdCard: {
    marginTop: "2rem",
    padding: "1.5rem",
    background: "rgba(29,185,84,0.05)",
    border: "1px solid rgba(29,185,84,0.2)",
    borderRadius: "12px",
  },
  statsIdRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  statsIdCode: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#1db954",
    letterSpacing: "0.06em",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(29,185,84,0.25)",
    borderRadius: "6px",
    padding: "0.4rem 0.75rem",
  },
  copyBtn: {
    padding: "0.4rem 1rem",
    border: "1px solid",
    borderRadius: "6px",
    fontSize: "0.88rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
};

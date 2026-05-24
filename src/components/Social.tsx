import React, { useState, useEffect, useMemo } from "react";
import html2canvas from "html2canvas";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { UserProfile } from "../data/mockData";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SharedProfileData {
  statsId: string; // e.g. "STATS-X7K2PQ"
  nickname: string;
  avatar: string;
  topArtists: { name: string; genres: string[] }[];
  topTracks: { name: string; artist: string }[];
  listenerArchetype: string;
  moodScore: number; // 0-100
  energyScore: number; // 0-100
  avgReleaseYear: number; // e.g. 2018
  mainstreamScore: number; // average popularity 0-100
  genres: string[];
}

interface SocialProps {
  profile: UserProfile;
  nickname?: string;
  sharedProfile?: SharedProfileData | null;
  statsId?: string; // current user's STATS-XXXXXX ID
}

interface CompatibilityBreakdown {
  genreOverlap: number; // 0-40
  moodSimilarity: number; // 0-20
  energySimilarity: number; // 0-20
  eraSimilarity: number; // 0-10
  obscurityMatch: number; // 0-10
  total: number; // 0-100
}

interface Comment {
  id: string;
  authorNickname: string;
  authorStatsId: string;
  text: string;
  timestamp: number;
}

// ─── Helper functions ─────────────────────────────────────────────────────────

function buildShareData(
  profile: UserProfile,
  displayName: string,
  statsId: string,
): SharedProfileData {
  const avgValence =
    profile.moodTimeline.length > 0
      ? profile.moodTimeline.reduce((s, m) => s + m.valence, 0) /
        profile.moodTimeline.length
      : 50;

  const avgEnergy = profile.personality.energy;

  const avgReleaseYear =
    profile.topTracks.length > 0
      ? Math.round(
          profile.topTracks.reduce((sum, t) => {
            const y = new Date(t.releaseDate).getFullYear();
            return sum + (isNaN(y) ? 2018 : y);
          }, 0) / profile.topTracks.length,
        )
      : 2018;

  const mainstreamScore =
    profile.topArtists.length > 0
      ? Math.round(
          profile.topArtists.reduce((s, a) => s + a.popularity, 0) /
            profile.topArtists.length,
        )
      : 50;

  return {
    statsId,
    nickname: displayName,
    avatar: profile.avatar,
    topArtists: profile.topArtists
      .slice(0, 3)
      .map((a) => ({ name: a.name, genres: a.genre })),
    topTracks: profile.topTracks
      .slice(0, 3)
      .map((t) => ({ name: t.name, artist: t.artist })),
    listenerArchetype: profile.listenerArchetype,
    moodScore: Math.round(avgValence),
    energyScore: Math.round(avgEnergy),
    avgReleaseYear,
    mainstreamScore,
    genres: Array.from(profile.genres.keys()).slice(0, 5),
  };
}

function encodeProfile(data: SharedProfileData): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decodeProfile(encoded: string): SharedProfileData | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch {
    return null;
  }
}

/** Fill defaults for profiles encoded with an older schema version. */
function normalizeSharedProfile(p: SharedProfileData): SharedProfileData {
  return {
    statsId: p.statsId || "UNKNOWN",
    nickname: p.nickname || "Anonymous",
    avatar: p.avatar || "",
    topArtists: p.topArtists || [],
    topTracks: p.topTracks || [],
    listenerArchetype: p.listenerArchetype || "Unknown",
    moodScore: p.moodScore ?? 50,
    energyScore: p.energyScore ?? 50,
    avgReleaseYear: p.avgReleaseYear ?? 2018,
    mainstreamScore: p.mainstreamScore ?? 50,
    genres: p.genres || [],
  };
}

function calcCompatibility(
  a: SharedProfileData,
  b: SharedProfileData,
): CompatibilityBreakdown {
  const setA = new Set(a.genres);
  const setB = new Set(b.genres);
  const shared = [...setA].filter((g) => setB.has(g)).length;
  const union = new Set([...setA, ...setB]).size;
  const genreOverlap = union > 0 ? Math.round((shared / union) * 40) : 0;

  const moodSimilarity = Math.round(
    (1 - Math.abs(a.moodScore - b.moodScore) / 100) * 20,
  );
  const energySimilarity = Math.round(
    (1 - Math.abs(a.energyScore - b.energyScore) / 100) * 20,
  );

  const maxYearDiff = 30;
  const yearDiff = Math.abs(a.avgReleaseYear - b.avgReleaseYear);
  const eraSimilarity = Math.round(
    Math.max(0, 1 - yearDiff / maxYearDiff) * 10,
  );

  const obscurityMatch = Math.round(
    (1 - Math.abs(a.mainstreamScore - b.mainstreamScore) / 100) * 10,
  );

  const total =
    genreOverlap +
    moodSimilarity +
    energySimilarity +
    eraSimilarity +
    obscurityMatch;
  return {
    genreOverlap,
    moodSimilarity,
    energySimilarity,
    eraSimilarity,
    obscurityMatch,
    total,
  };
}

function getCompatibilityTier(score: number): {
  label: string;
  emoji: string;
  color: string;
} {
  if (score >= 81)
    return { label: "Musical Twins", emoji: "🎼", color: "#1db954" };
  if (score >= 61)
    return { label: "Sonic Soulmates", emoji: "🎸", color: "#06b6d4" };
  if (score >= 41)
    return { label: "Vibing Together", emoji: "🎶", color: "#a855f7" };
  if (score >= 21)
    return { label: "Curious Ears", emoji: "🎵", color: "#f59e0b" };
  return { label: "Musical Strangers", emoji: "👻", color: "#ef4444" };
}

function randomId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function loadComments(statsId: string): Comment[] {
  try {
    const raw = localStorage.getItem(`comments_${statsId}`);
    return raw ? (JSON.parse(raw) as Comment[]) : [];
  } catch {
    return [];
  }
}

function saveComments(statsId: string, comments: Comment[]): void {
  localStorage.setItem(`comments_${statsId}`, JSON.stringify(comments));
}

// ─── CSS keyframes (injected once into the document head) ─────────────────────

const COMPONENT_STYLES = `
  @keyframes socialDrawLine {
    from { stroke-dashoffset: 500; }
    to   { stroke-dashoffset: 0;   }
  }
  @keyframes socialScoreIn {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1);   }
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const Social: React.FC<SocialProps> = ({
  profile,
  nickname,
  sharedProfile,
  statsId: statsIdProp,
}) => {
  // ── State ──────────────────────────────────────────────────────────────────

  const [copied, setCopied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [pasteInput, setPasteInput] = useState("");
  const [comparedProfile, setComparedProfile] =
    useState<SharedProfileData | null>(null);
  const [parseError, setParseError] = useState("");
  const [revealStep, setRevealStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [displayedScore, setDisplayedScore] = useState(0);
  const [barsVisible, setBarsVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");

  /** Persistent Stats ID – uses prop, then localStorage, then generates one. */
  const [myStatsId] = useState<string>(() => {
    if (statsIdProp) return statsIdProp;
    const stored = localStorage.getItem("my_stats_id");
    if (stored) return stored;
    const generated =
      "STATS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem("my_stats_id", generated);
    return generated;
  });

  // ── Derived values ─────────────────────────────────────────────────────────

  const displayName = nickname || profile.displayName || "You";

  const myShareData = useMemo(
    () => buildShareData(profile, displayName, myStatsId),
    [profile, displayName, myStatsId],
  );

  const breakdown = useMemo(
    () =>
      comparedProfile ? calcCompatibility(myShareData, comparedProfile) : null,
    [myShareData, comparedProfile],
  );

  const tier = useMemo(
    () => (breakdown ? getCompatibilityTier(breakdown.total) : null),
    [breakdown],
  );

  // ── Effects ────────────────────────────────────────────────────────────────

  /** Auto-compare when a shared profile is passed as a prop. */
  useEffect(() => {
    if (sharedProfile) {
      setComparedProfile(normalizeSharedProfile(sharedProfile));
    }
  }, [sharedProfile]);

  /** Advance through the animated reveal sequence when a comparison starts. */
  useEffect(() => {
    if (!comparedProfile) {
      setRevealStep(0);
      setDisplayedScore(0);
      setBarsVisible(false);
      return;
    }

    setRevealStep(0);
    setDisplayedScore(0);
    setBarsVisible(false);

    const t1 = setTimeout(() => setRevealStep(1), 300);
    const t2 = setTimeout(() => setRevealStep(2), 800);
    const t3 = setTimeout(() => setRevealStep(3), 1400);
    const t4 = setTimeout(() => setRevealStep(4), 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [comparedProfile]);

  /** Animate the score counter when step 3 is reached. */
  useEffect(() => {
    if (revealStep < 3 || !breakdown) return;

    let v = 0;
    const target = breakdown.total;
    const id = setInterval(() => {
      v = Math.min(v + 2, target);
      setDisplayedScore(v);
      if (v >= target) clearInterval(id);
    }, 30);

    return () => clearInterval(id);
  }, [revealStep, breakdown]);

  /** Trigger bar fill transitions shortly after step 4 mounts. */
  useEffect(() => {
    if (revealStep >= 4) {
      const t = setTimeout(() => setBarsVisible(true), 60);
      return () => clearTimeout(t);
    } else {
      setBarsVisible(false);
    }
  }, [revealStep]);

  /** Load comments for the relevant profile. */
  useEffect(() => {
    if (sharedProfile?.statsId) {
      setComments(loadComments(sharedProfile.statsId));
    } else if (statsIdProp) {
      setComments(loadComments(statsIdProp));
    }
  }, [sharedProfile, statsIdProp]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function buildShareUrl() {
    const encoded = encodeProfile(myShareData);
    const base =
      window.location.origin + window.location.pathname.replace(/\/$/, "");
    return `${base}?profile=${encoded}`;
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(buildShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard not available */
    }
  }

  async function handleCopyStatsId() {
    try {
      await navigator.clipboard.writeText(myStatsId);
    } catch {
      /* silent */
    }
  }

  async function handleDownloadCard() {
    if (isCapturing) return;
    setIsCapturing(true);
    const el = document.getElementById("shareable-profile-card");
    if (!el) {
      setIsCapturing(false);
      return;
    }
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: "#0a0a0a",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `${displayName.replace(/\s+/g, "-")}-music-profile.png`;
      link.href = canvas.toDataURL();
      link.click();
    } finally {
      setIsCapturing(false);
    }
  }

  async function handleDownloadMatchCard() {
    const el = document.getElementById("match-card");
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: "#111827",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = "music-match.png";
      link.href = canvas.toDataURL();
      link.click();
    } catch {
      /* silent */
    }
  }

  function handleParseProfile() {
    setParseError("");
    const input = pasteInput.trim();

    if (!input) {
      setParseError("Please enter a profile link or Stats ID.");
      return;
    }

    if (input.startsWith("STATS-")) {
      setParseError(
        "Stats IDs can't be looked up directly — you need the full share link " +
          "(the URL containing ?profile=). Ask your friend to click 'Copy Link' " +
          "and share that URL with you.",
      );
      return;
    }

    let base64 = "";
    try {
      const url = new URL(input);
      base64 = url.searchParams.get("profile") ?? "";
    } catch {
      base64 = input.includes("?profile=")
        ? (input.split("?profile=")[1] ?? "")
        : input;
    }

    if (!base64) {
      setParseError(
        "No profile data found. Paste the full share link — it should contain ?profile=.",
      );
      return;
    }

    const decoded = decodeProfile(base64);
    if (!decoded) {
      setParseError(
        "Couldn't decode that link. Make sure you're using a valid share URL.",
      );
      return;
    }

    setComparedProfile(normalizeSharedProfile(decoded));
    setPasteInput("");
  }

  function handlePostComment() {
    if (!sharedProfile?.statsId) return;
    const text = commentText.trim();
    if (!text) return;

    const newComment: Comment = {
      id: randomId(),
      authorNickname: nickname || "Anonymous",
      authorStatsId: myStatsId,
      text,
      timestamp: Date.now(),
    };

    // Newest first; cap at 50 (removes oldest at the tail)
    const updated = [newComment, ...comments];
    if (updated.length > 50) updated.length = 50;
    setComments(updated);
    saveComments(sharedProfile.statsId, updated);
    setCommentText("");
  }

  function handleDeleteComment(id: string) {
    if (!sharedProfile?.statsId) return;
    const updated = comments.filter((c) => c.id !== id);
    setComments(updated);
    saveComments(sharedProfile.statsId, updated);
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  const isLoggedIn = !!localStorage.getItem("spotify_access_token");

  const sharedGenres = comparedProfile
    ? myShareData.genres.filter((g) => comparedProfile.genres.includes(g))
    : [];

  const sharedArtists = comparedProfile
    ? myShareData.topArtists
        .filter((a) =>
          comparedProfile.topArtists.some((b) => b.name === a.name),
        )
        .map((a) => a.name)
    : [];

  const differences: string[] = (() => {
    if (!comparedProfile) return [];
    const diffs: string[] = [];
    const eDiff = myShareData.energyScore - comparedProfile.energyScore;
    if (Math.abs(eDiff) > 10)
      diffs.push(`You're more ${eDiff > 0 ? "energetic" : "mellow"}`);
    const yDiff = myShareData.avgReleaseYear - comparedProfile.avgReleaseYear;
    if (Math.abs(yDiff) > 3)
      diffs.push(`You prefer ${yDiff < 0 ? "older" : "newer"} music`);
    const mDiff = myShareData.mainstreamScore - comparedProfile.mainstreamScore;
    if (Math.abs(mDiff) > 10)
      diffs.push(
        `You like ${mDiff > 0 ? "more mainstream" : "more niche"} artists`,
      );
    return diffs;
  })();

  const radarData = comparedProfile
    ? [
        {
          subject: "Mood",
          A: myShareData.moodScore,
          B: comparedProfile.moodScore,
        },
        {
          subject: "Energy",
          A: myShareData.energyScore,
          B: comparedProfile.energyScore,
        },
        {
          subject: "Pop",
          A: myShareData.mainstreamScore,
          B: comparedProfile.mainstreamScore,
        },
        {
          subject: "Vintage",
          A: Math.max(
            0,
            Math.min(100, (myShareData.avgReleaseYear - 1990) * 3),
          ),
          B: Math.max(
            0,
            Math.min(100, (comparedProfile.avgReleaseYear - 1990) * 3),
          ),
        },
        {
          subject: "Variety",
          A: Math.min(100, myShareData.genres.length * 20),
          B: Math.min(100, comparedProfile.genres.length * 20),
        },
      ]
    : [];

  const breakdownCategories = breakdown
    ? [
        { label: "Genre Overlap", value: breakdown.genreOverlap, max: 40 },
        { label: "Mood Match", value: breakdown.moodSimilarity, max: 20 },
        { label: "Energy Match", value: breakdown.energySimilarity, max: 20 },
        { label: "Era Match", value: breakdown.eraSimilarity, max: 10 },
        { label: "Obscurity Match", value: breakdown.obscurityMatch, max: 10 },
      ]
    : [];

  const avgMoodScore = myShareData.moodScore;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section style={s.section}>
      {/* Inject component-specific keyframes */}
      <style>{COMPONENT_STYLES}</style>

      <div style={s.container}>
        {/* ── View banner when reading a shared profile ── */}
        {sharedProfile && (
          <div style={s.viewBanner}>
            <span>
              👀 Viewing{" "}
              <strong style={{ color: "#1db954" }}>
                {sharedProfile.nickname}
              </strong>
              's profile
            </span>
            <span style={{ color: "#888", fontSize: "0.85rem" }}>
              Auto-comparing with yours ↓
            </span>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION A — YOUR PROFILE CARD
        ════════════════════════════════════════════════════════════════ */}
        <div style={s.featureBlock}>
          <h2 style={s.sectionTitle}>🎵 Your Music Profile</h2>

          <div style={s.cardWrapper}>
            <div id="shareable-profile-card" style={s.shareCard}>
              {/* Decorative star dots */}
              <div style={s.starsLayer} aria-hidden="true" />

              {/* Header: avatar + name + archetype */}
              <div style={s.cardHeader}>
                <div style={s.cardAvatarWrap}>
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={displayName}
                      style={s.cardAvatar}
                    />
                  ) : (
                    <div style={s.initialsSmall}>
                      {displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div style={s.cardAvatarRing} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.cardName}>{displayName}</div>
                  <div style={s.archetypePill}>{profile.listenerArchetype}</div>
                </div>
              </div>

              <div style={s.divider} />

              {/* Top artists */}
              <div style={s.cardBlock}>
                <div style={s.cardBlockLabel}>Top Artists</div>
                {myShareData.topArtists.map((artist, i) => (
                  <div key={i} style={s.cardRow}>
                    <span style={s.cardRank}>#{i + 1}</span>
                    <span style={s.cardRowName}>{artist.name}</span>
                    <span style={s.cardRowSub}>
                      {artist.genres.slice(0, 2).join(", ")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Top tracks */}
              <div style={s.cardBlock}>
                <div style={s.cardBlockLabel}>Top Tracks</div>
                {myShareData.topTracks.map((track, i) => (
                  <div key={i} style={s.cardRow}>
                    <span style={s.cardRank}>#{i + 1}</span>
                    <span style={s.cardRowName}>{track.name}</span>
                    <span style={s.cardRowSub}>{track.artist}</span>
                  </div>
                ))}
              </div>

              {/* Mood bar */}
              <div style={s.cardBlock}>
                <div style={s.cardBlockLabel}>
                  Mood Score — {avgMoodScore}/100
                </div>
                <div style={s.moodTrack}>
                  <div style={{ ...s.moodFill, width: `${avgMoodScore}%` }} />
                </div>
              </div>

              <div style={s.divider} />

              {/* Branding row */}
              <div style={s.brandingRow}>
                <span style={s.brandingText}>🎧 Spotify Stats</span>
                {statsIdProp && <span style={s.brandingId}>{myStatsId}</span>}
              </div>
            </div>
          </div>

          {/* Stats ID row (shown only when statsId prop is provided) */}
          {statsIdProp && (
            <div style={s.statsIdRow}>
              <span style={s.statsIdLabel}>Your Stats ID:</span>
              <code style={s.statsIdCode}>{myStatsId}</code>
              <button style={s.smallBtn} onClick={handleCopyStatsId}>
                Copy
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div style={s.actionRow}>
            <button
              style={copied ? { ...s.btn, ...s.btnSuccess } : s.btn}
              onClick={handleCopyLink}
            >
              {copied ? "✓ Copied!" : "🔗 Copy Link"}
            </button>
            <button
              style={s.btn}
              onClick={handleDownloadCard}
              disabled={isCapturing}
            >
              {isCapturing ? "⏳ Capturing…" : "📷 Download as Image"}
            </button>
          </div>

          {copied && (
            <div style={s.toast}>
              ✓ Profile link copied — share it with friends to compare music
              tastes!
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION B — FIND YOUR MUSIC MATCH
        ════════════════════════════════════════════════════════════════ */}
        <div style={s.compareSection}>
          <h2 style={s.sectionTitle}>🎸 Find Your Music Match</h2>
          <p style={s.sectionDesc}>
            Paste a friend's profile share link to see how your music tastes
            align. You can also type a Stats ID to learn why you need the full
            link.
          </p>

          {/* Input */}
          <div style={s.inputRow}>
            <input
              style={s.linkInput}
              placeholder="Paste a profile link or Stats ID (STATS-XXXXXX)…"
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleParseProfile()}
            />
            <button style={s.btn} onClick={handleParseProfile}>
              Compare →
            </button>
          </div>

          {parseError && <p style={s.errorText}>{parseError}</p>}

          {/* ── Animated Reveal ── */}
          {comparedProfile && revealStep >= 1 && (
            <div style={s.revealSection}>
              {/* Avatars + connecting line + score */}
              <div style={s.revealHeader}>
                {/* Left: your avatar */}
                <div
                  style={{
                    ...s.revealAvatarBlock,
                    animation: "slideInLeft 0.5s ease both",
                  }}
                >
                  {myShareData.avatar ? (
                    <img
                      src={myShareData.avatar}
                      alt={myShareData.nickname}
                      style={s.revealAvatarImg}
                    />
                  ) : (
                    <div style={s.revealAvatarInitials}>
                      {myShareData.nickname.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div style={s.revealAvatarName}>{myShareData.nickname}</div>
                  <div style={s.revealAvatarSub}>You</div>
                </div>

                {/* Center: SVG line → score → tier */}
                <div style={s.revealCenter}>
                  {revealStep >= 2 && (
                    <svg
                      width="100%"
                      height="6"
                      style={{ overflow: "visible", display: "block" }}
                    >
                      <line
                        x1="0"
                        y1="3"
                        x2="100%"
                        y2="3"
                        stroke={tier?.color ?? "#1db954"}
                        strokeWidth="3"
                        strokeDasharray="500"
                        strokeDashoffset="0"
                        style={{
                          animation: "socialDrawLine 0.7s ease both",
                        }}
                      />
                    </svg>
                  )}
                  {revealStep >= 3 && tier && (
                    <div
                      style={{
                        ...s.revealScore,
                        color: tier.color,
                        animation: "socialScoreIn 0.5s ease both",
                      }}
                    >
                      {displayedScore}
                      <span style={s.revealScorePct}>%</span>
                    </div>
                  )}
                  {revealStep >= 4 && tier && (
                    <div
                      style={{
                        ...s.revealTierLabel,
                        color: tier.color,
                      }}
                    >
                      {tier.emoji} {tier.label}
                    </div>
                  )}
                </div>

                {/* Right: their avatar */}
                <div
                  style={{
                    ...s.revealAvatarBlock,
                    animation: "slideInRight 0.5s ease both",
                  }}
                >
                  {comparedProfile.avatar ? (
                    <img
                      src={comparedProfile.avatar}
                      alt={comparedProfile.nickname}
                      style={s.revealAvatarImg}
                    />
                  ) : (
                    <div style={s.revealAvatarInitials}>
                      {(comparedProfile.nickname || "?")
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                  )}
                  <div style={s.revealAvatarName}>
                    {comparedProfile.nickname}
                  </div>
                  <div style={s.revealAvatarSub}>
                    {comparedProfile.statsId || "Them"}
                  </div>
                </div>
              </div>

              {/* ── Step 4: breakdown + radar + shared items + differences ── */}
              {revealStep >= 4 && breakdown && tier && (
                <div style={{ animation: "fadeInUp 0.5s ease both" }}>
                  {/* Compatibility breakdown bars */}
                  <div style={s.breakdownSection}>
                    <h3 style={s.subHeading}>Compatibility Breakdown</h3>
                    {breakdownCategories.map((cat, i) => (
                      <div key={cat.label} style={s.breakdownRow}>
                        <span style={s.breakdownLabel}>{cat.label}</span>
                        <div style={s.barTrack}>
                          <div
                            style={{
                              ...s.barFill,
                              width: barsVisible
                                ? `${(cat.value / cat.max) * 100}%`
                                : "0%",
                              background: tier.color,
                              transition: `width 0.85s cubic-bezier(0.4,0,0.2,1) ${
                                i * 0.13
                              }s`,
                            }}
                          />
                        </div>
                        <span style={s.breakdownScore}>
                          {cat.value}/{cat.max}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Radar chart – comparing both profiles across 5 dimensions */}
                  <div style={s.radarCard}>
                    <h3 style={s.subHeading}>Music Profile Radar</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "#b3b3b3", fontSize: 11 }}
                        />
                        <PolarRadiusAxis
                          domain={[0, 100]}
                          tick={false}
                          axisLine={false}
                        />
                        <Radar
                          name={myShareData.nickname}
                          dataKey="A"
                          stroke="#1db954"
                          fill="#1db954"
                          fillOpacity={0.25}
                        />
                        <Radar
                          name={comparedProfile.nickname}
                          dataKey="B"
                          stroke={tier.color}
                          fill={tier.color}
                          fillOpacity={0.2}
                        />
                        <Legend
                          wrapperStyle={{
                            color: "#b3b3b3",
                            fontSize: "0.8rem",
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Shared favorites */}
                  {(sharedGenres.length > 0 || sharedArtists.length > 0) && (
                    <div style={s.sharedSection}>
                      <h3 style={s.subHeading}>✨ You Both Love</h3>
                      {sharedGenres.length > 0 && (
                        <div style={s.sharedBlock}>
                          <div style={s.sharedBlockLabel}>Genres</div>
                          <div style={s.tagRow}>
                            {sharedGenres.map((g) => (
                              <span key={g} style={s.genreTag}>
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {sharedArtists.length > 0 && (
                        <div style={s.sharedBlock}>
                          <div style={s.sharedBlockLabel}>Artists</div>
                          <div style={s.tagRow}>
                            {sharedArtists.map((a) => (
                              <span key={a} style={s.artistTag}>
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Differences */}
                  {differences.length > 0 && (
                    <div style={s.diffsSection}>
                      <h3 style={s.subHeading}>🔀 Your Differences</h3>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {differences.map((d, i) => (
                          <li key={i} style={s.diffItem}>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Match card – html2canvas target */}
                  <div id="match-card" style={s.matchCard}>
                    <div style={s.matchCardInner}>
                      <div style={s.matchCardLabel}>🎵 Music Match</div>
                      <div style={s.matchCardNames}>
                        {myShareData.nickname} × {comparedProfile.nickname}
                      </div>
                      <div style={{ ...s.matchCardScore, color: tier.color }}>
                        {breakdown.total}%
                      </div>
                      <div style={{ ...s.matchCardTier, color: tier.color }}>
                        {tier.emoji} {tier.label}
                      </div>
                      {sharedGenres.length > 0 && (
                        <div style={s.matchCardGenres}>
                          {sharedGenres.slice(0, 3).join(" · ")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Match card actions */}
                  <div style={s.actionRow}>
                    <button style={s.btn} onClick={handleDownloadMatchCard}>
                      📸 Download Match Card
                    </button>
                    <button
                      style={copied ? { ...s.btn, ...s.btnSuccess } : s.btn}
                      onClick={handleCopyLink}
                    >
                      {copied ? "✓ Link Copied!" : "🔗 Share Your Profile"}
                    </button>
                  </div>
                </div>
              )}

              {/* Clear comparison */}
              <button
                style={{ ...s.smallBtn, marginTop: "1.5rem" }}
                onClick={() => {
                  setComparedProfile(null);
                  setPasteInput("");
                }}
              >
                ✕ Clear comparison
              </button>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION C — COMMENTS
        ════════════════════════════════════════════════════════════════ */}

        {/* Viewing someone else's profile: interactive comment thread */}
        {sharedProfile?.statsId && (
          <div style={s.commentsSection}>
            <h2 style={s.sectionTitle}>💬 Comments</h2>

            <div style={s.commentInputWrapper}>
              {isLoggedIn ? (
                <>
                  <textarea
                    style={s.commentTextarea}
                    placeholder="Leave a comment…"
                    value={commentText}
                    onChange={(e) =>
                      setCommentText(e.target.value.slice(0, 280))
                    }
                    rows={3}
                    maxLength={280}
                  />
                  <div style={s.commentInputMeta}>
                    <span style={s.charCount}>{commentText.length}/280</span>
                    <button
                      style={
                        commentText.trim()
                          ? s.btn
                          : { ...s.btn, opacity: 0.45, cursor: "default" }
                      }
                      disabled={!commentText.trim()}
                      onClick={handlePostComment}
                    >
                      Post Comment
                    </button>
                  </div>
                </>
              ) : (
                <p style={s.loginPrompt}>🔒 Log in to leave a comment</p>
              )}
            </div>

            <div style={s.commentList}>
              {comments.length === 0 ? (
                <p style={s.emptyState}>No comments yet — be the first!</p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      ...s.commentItem,
                      animation: "fadeInUp 0.3s ease both",
                    }}
                  >
                    <div style={s.commentHeader}>
                      <div style={s.commentAuthorBlock}>
                        <span style={s.commentAuthor}>{c.authorNickname}</span>
                        <span style={s.commentStatsId}>{c.authorStatsId}</span>
                      </div>
                      <div style={s.commentRight}>
                        <span style={s.commentTime}>
                          {relativeTime(c.timestamp)}
                        </span>
                        {c.authorStatsId === myStatsId && (
                          <button
                            style={s.deleteBtn}
                            onClick={() => handleDeleteComment(c.id)}
                            title="Delete comment"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={s.commentText}>{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* On own profile page: read-only view of received comments */}
        {!sharedProfile && statsIdProp && (
          <div style={s.commentsSection}>
            <h2 style={s.sectionTitle}>💬 Comments on Your Profile</h2>
            <div style={s.commentList}>
              {comments.length === 0 ? (
                <p style={s.emptyState}>
                  No comments yet. Share your profile to get comments!
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} style={s.commentItem}>
                    <div style={s.commentHeader}>
                      <div style={s.commentAuthorBlock}>
                        <span style={s.commentAuthor}>{c.authorNickname}</span>
                        <span style={s.commentStatsId}>{c.authorStatsId}</span>
                      </div>
                      <span style={s.commentTime}>
                        {relativeTime(c.timestamp)}
                      </span>
                    </div>
                    <p style={s.commentText}>{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  // Layout
  section: {
    paddingTop: "4rem",
    background: "transparent",
  },
  container: {
    maxWidth: "820px",
    margin: "0 auto",
    padding: "0 1.5rem 4rem",
  },

  // View banner
  viewBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "0.5rem",
    background: "rgba(29,185,84,0.08)",
    border: "1px solid rgba(29,185,84,0.25)",
    borderRadius: "10px",
    padding: "0.75rem 1.25rem",
    marginBottom: "2rem",
    color: "#e5e5e5",
    fontSize: "0.9rem",
  },

  featureBlock: {
    marginBottom: "3.5rem",
  },

  sectionTitle: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#fff",
    marginBottom: "1.25rem",
    letterSpacing: "0.02em",
  },

  sectionDesc: {
    color: "#888",
    fontSize: "0.9rem",
    marginBottom: "1.25rem",
    lineHeight: 1.6,
  },

  // ── Profile card ────────────────────────────────────────────────────────────
  cardWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1.25rem",
  },

  shareCard: {
    width: "380px",
    background: "linear-gradient(145deg, #141418 0%, #1a1a2e 100%)",
    border: "1px solid rgba(29,185,84,0.18)",
    borderRadius: "16px",
    padding: "1.5rem",
    position: "relative" as const,
    overflow: "hidden",
    boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
  },

  starsLayer: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "1px",
    height: "1px",
    background: "transparent",
    pointerEvents: "none" as const,
    zIndex: 0,
    boxShadow: [
      "22px 32px 0 1px rgba(29,185,84,0.5)",
      "280px 22px 0 1px rgba(255,255,255,0.45)",
      "180px 70px 0 1px rgba(29,185,84,0.35)",
      "350px 130px 0 1px rgba(29,185,84,0.45)",
      "62px 188px 0 1px rgba(255,255,255,0.3)",
      "318px 255px 0 1px rgba(29,185,84,0.35)",
      "138px 310px 0 1px rgba(255,255,255,0.25)",
      "385px 12px 0 1px rgba(29,185,84,0.3)",
      "102px 345px 0 1px rgba(29,185,84,0.28)",
      "48px 98px 0 1px rgba(29,185,84,0.32)",
    ].join(","),
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "14px",
    position: "relative" as const,
    zIndex: 1,
  },
  cardAvatarWrap: {
    position: "relative" as const,
    flexShrink: 0,
  },
  cardAvatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    border: "2px solid rgba(29,185,84,0.6)",
    display: "block",
    objectFit: "cover" as const,
  },
  initialsSmall: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "#1db954",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.8rem",
    fontWeight: "700",
  },
  cardAvatarRing: {
    position: "absolute" as const,
    top: "-4px",
    left: "-4px",
    right: "-4px",
    bottom: "-4px",
    borderRadius: "50%",
    border: "1px solid rgba(29,185,84,0.3)",
  },
  cardName: {
    fontSize: "1.05rem",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "8px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  archetypePill: {
    display: "inline-block",
    background: "rgba(29,185,84,0.15)",
    border: "1px solid rgba(29,185,84,0.4)",
    color: "#1db954",
    borderRadius: "20px",
    padding: "3px 10px",
    fontSize: "0.72rem",
    fontWeight: "600",
    letterSpacing: "0.02em",
  },
  divider: {
    height: "1px",
    background: "rgba(29,185,84,0.12)",
    margin: "12px 0",
    position: "relative" as const,
    zIndex: 1,
  },
  cardBlock: {
    marginBottom: "12px",
    position: "relative" as const,
    zIndex: 1,
  },
  cardBlockLabel: {
    fontSize: "0.65rem",
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    marginBottom: "5px",
  },
  cardRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  cardRank: {
    color: "#1db954",
    fontSize: "0.7rem",
    fontWeight: "700",
    minWidth: "22px",
    flexShrink: 0,
  },
  cardRowName: {
    color: "#fff",
    fontSize: "0.82rem",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  cardRowSub: {
    color: "#888",
    fontSize: "0.7rem",
    flexShrink: 0,
    maxWidth: "90px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  moodTrack: {
    width: "100%",
    height: "5px",
    background: "rgba(29,185,84,0.1)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  moodFill: {
    height: "100%",
    background: "linear-gradient(90deg,#1db954,#06b6d4)",
    borderRadius: "3px",
    transition: "width 0.5s ease",
  },
  brandingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative" as const,
    zIndex: 1,
    marginTop: "4px",
  },
  brandingText: {
    color: "#555",
    fontSize: "0.72rem",
    fontWeight: "600",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
  },
  brandingId: {
    color: "#555",
    fontSize: "0.68rem",
    fontFamily: "monospace",
  },

  // Stats ID row
  statsIdRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    marginBottom: "0.75rem",
    flexWrap: "wrap" as const,
  },
  statsIdLabel: {
    color: "#888",
    fontSize: "0.85rem",
  },
  statsIdCode: {
    background: "rgba(29,185,84,0.08)",
    border: "1px solid rgba(29,185,84,0.2)",
    borderRadius: "6px",
    padding: "2px 8px",
    color: "#1db954",
    fontSize: "0.85rem",
    fontFamily: "monospace",
    letterSpacing: "0.05em",
  },

  // Buttons & toast
  actionRow: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
    alignItems: "center",
  },
  btn: {
    padding: "0.6rem 1.1rem",
    background: "rgba(29,185,84,0.12)",
    border: "1px solid rgba(29,185,84,0.35)",
    borderRadius: "8px",
    color: "#1db954",
    fontSize: "0.88rem",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.2s ease, transform 0.15s ease",
  },
  btnSuccess: {
    background: "rgba(29,185,84,0.25)",
    border: "1px solid rgba(29,185,84,0.6)",
  },
  smallBtn: {
    padding: "0.35rem 0.75rem",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "6px",
    color: "#888",
    fontSize: "0.78rem",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  toast: {
    marginTop: "0.75rem",
    display: "inline-block",
    background: "rgba(29,185,84,0.1)",
    border: "1px solid rgba(29,185,84,0.35)",
    color: "#1db954",
    borderRadius: "8px",
    padding: "0.45rem 0.9rem",
    fontSize: "0.84rem",
  },

  // ── Compare section ─────────────────────────────────────────────────────────
  compareSection: {
    marginTop: "3rem",
    paddingTop: "2.5rem",
    borderTop: "1px solid rgba(29,185,84,0.1)",
    marginBottom: "3.5rem",
  },
  inputRow: {
    display: "flex",
    gap: "0.75rem",
    marginBottom: "0.75rem",
    flexWrap: "wrap" as const,
    alignItems: "center",
  },
  linkInput: {
    flex: 1,
    minWidth: "220px",
    background: "rgba(20,20,25,0.8)",
    border: "1px solid rgba(29,185,84,0.25)",
    borderRadius: "8px",
    padding: "0.65rem 1rem",
    color: "#fff",
    fontSize: "0.88rem",
    fontFamily: "inherit",
    outline: "none",
  },
  errorText: {
    color: "#f59e0b",
    fontSize: "0.85rem",
    marginBottom: "1rem",
    lineHeight: 1.5,
  },

  // ── Animated reveal ─────────────────────────────────────────────────────────
  revealSection: {
    marginTop: "2rem",
    padding: "1.5rem",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
  },
  revealHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
    marginBottom: "1.5rem",
  },
  revealAvatarBlock: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.4rem",
    flexShrink: 0,
    width: "80px",
  },
  revealAvatarImg: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.15)",
    objectFit: "cover" as const,
    display: "block",
  },
  revealAvatarInitials: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#1a1a2e,#1db954)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    fontWeight: "700",
  },
  revealAvatarName: {
    color: "#fff",
    fontSize: "0.78rem",
    fontWeight: "600",
    textAlign: "center" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    width: "100%",
  },
  revealAvatarSub: {
    color: "#666",
    fontSize: "0.7rem",
    textAlign: "center" as const,
  },
  revealCenter: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.5rem",
    minWidth: 0,
  },
  revealScore: {
    fontSize: "3.5rem",
    fontWeight: "800",
    lineHeight: 1,
    letterSpacing: "-0.02em",
  },
  revealScorePct: {
    fontSize: "1.6rem",
    fontWeight: "700",
    marginLeft: "2px",
  },
  revealTierLabel: {
    fontSize: "0.95rem",
    fontWeight: "700",
    letterSpacing: "0.03em",
  },

  // Breakdown bars
  breakdownSection: {
    marginBottom: "1.75rem",
  },
  subHeading: {
    fontSize: "0.95rem",
    fontWeight: "700",
    color: "#ccc",
    marginBottom: "0.9rem",
    letterSpacing: "0.02em",
  },
  breakdownRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.55rem",
  },
  breakdownLabel: {
    color: "#aaa",
    fontSize: "0.8rem",
    width: "120px",
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: "8px",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: "4px",
    width: "0%",
  },
  breakdownScore: {
    color: "#888",
    fontSize: "0.75rem",
    width: "36px",
    textAlign: "right" as const,
    flexShrink: 0,
  },

  // Radar card
  radarCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "1.25rem",
    marginBottom: "1.75rem",
  },

  // Shared favorites
  sharedSection: {
    marginBottom: "1.75rem",
  },
  sharedBlock: {
    marginBottom: "0.75rem",
  },
  sharedBlockLabel: {
    fontSize: "0.72rem",
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    marginBottom: "0.5rem",
  },
  tagRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.4rem",
  },
  genreTag: {
    background: "rgba(29,185,84,0.1)",
    border: "1px solid rgba(29,185,84,0.3)",
    borderRadius: "20px",
    padding: "3px 10px",
    color: "#1db954",
    fontSize: "0.78rem",
    fontWeight: "500",
  },
  artistTag: {
    background: "rgba(6,182,212,0.1)",
    border: "1px solid rgba(6,182,212,0.3)",
    borderRadius: "20px",
    padding: "3px 10px",
    color: "#06b6d4",
    fontSize: "0.78rem",
    fontWeight: "500",
  },

  // Differences
  diffsSection: {
    marginBottom: "1.75rem",
  },
  diffItem: {
    padding: "0.5rem 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    color: "#ccc",
    fontSize: "0.88rem",
  },

  // Match card
  matchCard: {
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)",
    border: "1px solid rgba(29,185,84,0.25)",
    borderRadius: "14px",
    overflow: "hidden",
    marginBottom: "1.25rem",
  },
  matchCardInner: {
    padding: "1.5rem",
    textAlign: "center" as const,
  },
  matchCardLabel: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase" as const,
    letterSpacing: "0.15em",
    marginBottom: "0.5rem",
  },
  matchCardNames: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "0.75rem",
  },
  matchCardScore: {
    fontSize: "3rem",
    fontWeight: "800",
    lineHeight: 1,
    marginBottom: "0.4rem",
  },
  matchCardTier: {
    fontSize: "1rem",
    fontWeight: "700",
    marginBottom: "0.5rem",
  },
  matchCardGenres: {
    color: "#666",
    fontSize: "0.8rem",
    letterSpacing: "0.05em",
  },

  // ── Comments section ────────────────────────────────────────────────────────
  commentsSection: {
    paddingTop: "2.5rem",
    borderTop: "1px solid rgba(29,185,84,0.1)",
    marginBottom: "3rem",
  },
  commentInputWrapper: {
    marginBottom: "1.5rem",
  },
  commentTextarea: {
    width: "100%",
    background: "rgba(20,20,25,0.8)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    color: "#fff",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    resize: "vertical" as const,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  commentInputMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "0.5rem",
  },
  charCount: {
    color: "#666",
    fontSize: "0.78rem",
  },
  loginPrompt: {
    color: "#888",
    fontSize: "0.9rem",
    padding: "1rem",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "8px",
    textAlign: "center" as const,
  },
  commentList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  },
  emptyState: {
    color: "#666",
    fontSize: "0.9rem",
    textAlign: "center" as const,
    padding: "2rem",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  commentItem: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "10px",
    padding: "0.9rem 1rem",
    position: "relative" as const,
  },
  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "0.5rem",
    gap: "0.5rem",
  },
  commentAuthorBlock: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  commentAuthor: {
    color: "#fff",
    fontWeight: "700",
    fontSize: "0.88rem",
  },
  commentStatsId: {
    color: "#555",
    fontSize: "0.72rem",
    fontFamily: "monospace",
    letterSpacing: "0.03em",
  },
  commentRight: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexShrink: 0,
  },
  commentTime: {
    color: "#555",
    fontSize: "0.75rem",
    whiteSpace: "nowrap" as const,
  },
  deleteBtn: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "4px",
    color: "#ef4444",
    fontSize: "0.72rem",
    cursor: "pointer",
    padding: "2px 6px",
    lineHeight: 1,
    fontFamily: "inherit",
  },
  commentText: {
    color: "#ccc",
    fontSize: "0.88rem",
    lineHeight: 1.55,
    margin: 0,
  },
};

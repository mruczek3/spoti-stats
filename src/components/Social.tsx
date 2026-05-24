import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { UserProfile } from '../data/mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SharedProfileData {
  nickname: string;
  avatar: string;
  topArtists: { name: string; genres: string[] }[];
  topTracks: { name: string; artist: string }[];
  listenerArchetype: string;
  moodScore: number;
  genres: string[]; // top genre names
}

interface SocialProps {
  profile: UserProfile;
  nickname?: string;
  /** Decoded from URL ?profile=<base64> by the caller (e.g. App.tsx) */
  sharedProfile?: SharedProfileData | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildShareData(profile: UserProfile, displayName: string): SharedProfileData {
  const moodScore =
    profile.moodTimeline.length > 0
      ? Math.round(
          profile.moodTimeline.reduce((s, m) => s + m.valence, 0) /
            profile.moodTimeline.length,
        )
      : 0;

  return {
    nickname: displayName,
    avatar: profile.avatar,
    topArtists: profile.topArtists
      .slice(0, 3)
      .map((a) => ({ name: a.name, genres: a.genre })),
    topTracks: profile.topTracks
      .slice(0, 3)
      .map((t) => ({ name: t.name, artist: t.artist })),
    listenerArchetype: profile.listenerArchetype,
    moodScore,
    genres: Array.from(profile.genres.keys()).slice(0, 5),
  };
}

function calcCompatibility(a: SharedProfileData, b: SharedProfileData): number {
  const setA = new Set(a.genres);
  const setB = new Set(b.genres);
  const allGenres = new Set([...a.genres, ...b.genres]);
  const shared = [...setA].filter((g) => setB.has(g)).length;
  const genreOverlap = allGenres.size > 0 ? (shared / allGenres.size) * 60 : 0;
  const moodSimilarity = (1 - Math.abs(a.moodScore - b.moodScore) / 100) * 40;
  return Math.round(genreOverlap + moodSimilarity);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const GaugeArc: React.FC<{ score: number }> = ({ score }) => {
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * (score / 100);
  const empty = circumference - filled;
  const color = score >= 70 ? '#1db954' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="12"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${empty}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x={cx}
        y={cy - 7}
        textAnchor="middle"
        fill="#ffffff"
        fontSize="22"
        fontWeight="700"
        fontFamily="inherit"
      >
        {score}%
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="#b3b3b3"
        fontSize="11"
        fontFamily="inherit"
      >
        match
      </text>
    </svg>
  );
};

const ProfileCard: React.FC<{ data: SharedProfileData; label: string }> = ({
  data,
  label,
}) => (
  <div className="card" style={compCardStyles.card}>
    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
      {data.avatar ? (
        <img
          src={data.avatar}
          alt={data.nickname}
          style={compCardStyles.avatar}
        />
      ) : (
        <div style={compCardStyles.initialsAvatar}>
          {data.nickname.charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{ fontWeight: '700', marginTop: '0.5rem', color: '#fff' }}>
        {label}
      </div>
      <div style={{ color: '#b3b3b3', fontSize: '0.78rem', marginTop: '0.2rem' }}>
        {data.listenerArchetype}
      </div>
    </div>

    <div style={compCardStyles.sectionLabel}>🎤 Top Artists</div>
    {data.topArtists.map((a, i) => (
      <div key={i} style={compCardStyles.listItem}>
        <span style={compCardStyles.rank}>#{i + 1}</span>
        <span style={compCardStyles.itemText}>{a.name}</span>
      </div>
    ))}

    <div style={{ ...compCardStyles.sectionLabel, marginTop: '0.75rem' }}>
      🎵 Top Tracks
    </div>
    {data.topTracks.map((t, i) => (
      <div key={i} style={compCardStyles.listItem}>
        <span style={compCardStyles.rank}>#{i + 1}</span>
        <span style={compCardStyles.itemText}>{t.name}</span>
      </div>
    ))}

    <div style={{ marginTop: '0.75rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.25rem',
        }}
      >
        <span style={compCardStyles.sectionLabel}>😊 Mood</span>
        <span style={{ color: '#1db954', fontSize: '0.8rem', fontWeight: '700' }}>
          {data.moodScore}%
        </span>
      </div>
      <div style={compCardStyles.moodTrack}>
        <div
          style={{
            ...compCardStyles.moodFill,
            width: `${data.moodScore}%`,
          }}
        />
      </div>
    </div>
  </div>
);

const compCardStyles: Record<string, React.CSSProperties> = {
  card: { padding: '1.5rem' },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    border: '2px solid rgba(29,185,84,0.5)',
    objectFit: 'cover',
    display: 'block',
    margin: '0 auto',
  },
  initialsAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#1db954',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    fontWeight: '700',
    margin: '0 auto',
  },
  sectionLabel: {
    fontSize: '0.68rem',
    fontWeight: '700',
    color: '#b3b3b3',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: '0.4rem',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 0',
    fontSize: '0.83rem',
    color: '#e0e0e0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  rank: {
    color: '#1db954',
    fontSize: '0.72rem',
    fontWeight: '700',
    minWidth: '22px',
  },
  itemText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  moodTrack: {
    width: '100%',
    height: '5px',
    background: 'rgba(29,185,84,0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  moodFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #1db954, #06b6d4)',
    borderRadius: '3px',
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const Social: React.FC<SocialProps> = ({
  profile,
  nickname,
  sharedProfile,
}) => {
  const [copied, setCopied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [comparedProfile, setComparedProfile] = useState<SharedProfileData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  const displayName = nickname || profile.displayName;
  const myShareData = buildShareData(profile, displayName);

  const avgMoodScore = myShareData.moodScore;

  // ── Share URL ──────────────────────────────────────────────────────────────

  const buildShareUrl = () => {
    const encoded = btoa(
      unescape(encodeURIComponent(JSON.stringify(myShareData))),
    );
    return (
      window.location.origin +
      window.location.pathname +
      '?profile=' +
      encoded
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API unavailable — silently fail
    }
  };

  // ── Download ───────────────────────────────────────────────────────────────

  const handleDownload = async () => {
    const el = document.getElementById('shareable-profile-card');
    if (!el) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${displayName.replace(/\s+/g, '-')}-spotify-stats.png`;
      link.click();
    } finally {
      setIsCapturing(false);
    }
  };

  // ── Profile comparison parsing ─────────────────────────────────────────────

  const handleParseProfile = () => {
    setParseError(null);
    try {
      let base64 = pasteInput.trim();
      if (base64.includes('?profile=')) {
        base64 = base64.split('?profile=')[1].split('&')[0];
      }
      const decoded = JSON.parse(
        decodeURIComponent(escape(atob(base64))),
      ) as SharedProfileData;
      setComparedProfile(decoded);
    } catch {
      setParseError(
        'Could not parse that profile link. Make sure you pasted the full URL.',
      );
    }
  };

  // The active profile we compare against
  const activeComparison = sharedProfile ?? comparedProfile;
  const compatibility =
    activeComparison != null
      ? calcCompatibility(myShareData, activeComparison)
      : null;

  const radarData =
    activeComparison != null
      ? [
          {
            label: 'Mood',
            A: myShareData.moodScore,
            B: activeComparison.moodScore,
          },
          {
            label: 'Diversity',
            A: Math.min(myShareData.genres.length * 10, 100),
            B: Math.min(activeComparison.genres.length * 10, 100),
          },
          {
            label: 'Artists',
            A: Math.min(myShareData.topArtists.length * 25, 100),
            B: Math.min(activeComparison.topArtists.length * 25, 100),
          },
        ]
      : [];

  // ── Compatibility label ────────────────────────────────────────────────────

  const compatLabel =
    compatibility == null
      ? ''
      : compatibility >= 70
      ? '🔥 Musical soulmates!'
      : compatibility >= 40
      ? '🎶 Good vibes together'
      : '🎸 Refreshingly different tastes';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="section" style={styles.section}>
      <div style={styles.container}>
        <h2 style={{ marginBottom: '0.5rem' }}>Social &amp; Sharing</h2>
        <p style={{ marginBottom: '2.5rem' }}>
          Share your music taste and compare with friends
        </p>

        {/* ── Feature 2: Banner when viewing a shared profile ── */}
        {sharedProfile != null && (
          <div style={styles.viewBanner} className="animate-in">
            <span style={{ fontSize: '1.05rem', color: '#fff' }}>
              👤 Viewing{' '}
              <strong style={{ color: '#1db954' }}>{sharedProfile.nickname}</strong>
              's Profile
            </span>
            <button
              className="btn btn-secondary btn-small"
              onClick={() =>
                comparisonRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Compare with mine ↓
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            Feature 1 — Shareable Profile Card
        ════════════════════════════════════════════════════ */}
        <div style={styles.featureBlock}>
          <h3 style={{ marginBottom: '1.5rem' }}>Your Profile Card</h3>

          {/* The card itself */}
          <div style={styles.cardWrapper}>
            <div id="shareable-profile-card" style={styles.shareCard}>
              {/* Stars/sparkles layer */}
              <div style={styles.starsLayer} aria-hidden="true" />

              {/* Header: avatar + name + archetype */}
              <div style={styles.cardHeader}>
                <div style={styles.cardAvatarWrap}>
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={displayName}
                      style={styles.cardAvatar}
                    />
                  ) : (
                    <div style={{ ...styles.cardAvatar, ...styles.initialsSmall }}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={styles.cardAvatarRing} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.cardName}>{displayName}</div>
                  <div style={styles.archetypePill}>
                    {profile.listenerArchetype}
                  </div>
                </div>
              </div>

              <div style={styles.divider} />

              {/* Top Artists */}
              <div style={styles.cardBlock}>
                <div style={styles.cardBlockLabel}>🎤 Top Artists</div>
                {profile.topArtists.slice(0, 3).map((a, i) => (
                  <div key={i} style={styles.cardRow}>
                    <span style={styles.cardRank}>#{i + 1}</span>
                    <span style={styles.cardRowName}>{a.name}</span>
                    <span style={styles.cardRowSub}>
                      {a.genre.slice(0, 2).join(', ')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Top Tracks */}
              <div style={styles.cardBlock}>
                <div style={styles.cardBlockLabel}>🎵 Top Tracks</div>
                {profile.topTracks.slice(0, 3).map((t, i) => (
                  <div key={i} style={styles.cardRow}>
                    <span style={styles.cardRank}>#{i + 1}</span>
                    <span style={styles.cardRowName}>{t.name}</span>
                    <span style={styles.cardRowSub}>{t.artist}</span>
                  </div>
                ))}
              </div>

              {/* Mood progress bar */}
              <div style={styles.cardBlock}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span style={styles.cardBlockLabel}>😊 Avg Mood</span>
                  <span
                    style={{
                      color: '#1db954',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                    }}
                  >
                    {avgMoodScore}%
                  </span>
                </div>
                <div style={styles.moodTrack}>
                  <div
                    style={{ ...styles.moodFill, width: `${avgMoodScore}%` }}
                  />
                </div>
              </div>

              <div style={styles.divider} />

              {/* Branding footer */}
              <div style={styles.brandingRow}>
                <span style={{ color: '#1db954', fontSize: '0.7rem' }}>●</span>
                <span style={styles.brandingText}>Spotify Stats</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={styles.actionRow}>
            <button className="btn btn-primary" onClick={handleCopyLink}>
              {copied ? '✓ Copied!' : '🔗 Copy Link'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDownload}
              disabled={isCapturing}
            >
              {isCapturing ? '⏳ Capturing…' : '📥 Download as Image'}
            </button>
          </div>

          {copied && (
            <div style={styles.toast} className="animate-in">
              ✓ Profile link copied to clipboard!
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════
            Feature 3 — Profile Comparison
        ════════════════════════════════════════════════════ */}
        <div ref={comparisonRef} style={styles.compareSection}>
          <h3 style={{ marginBottom: '0.5rem' }}>Compare Profiles</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Paste a friend's profile link to see how your music tastes align
          </p>

          {/* Input — only shown when we're NOT already viewing a shared profile */}
          {sharedProfile == null && (
            <div style={styles.inputRow}>
              <input
                type="text"
                placeholder="Paste a profile link here…"
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleParseProfile()}
                style={styles.linkInput}
              />
              <button
                className="btn btn-primary btn-small"
                onClick={handleParseProfile}
                disabled={!pasteInput.trim()}
              >
                Compare
              </button>
              {comparedProfile != null && (
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    setComparedProfile(null);
                    setPasteInput('');
                    setParseError(null);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {parseError && <p style={styles.errorText}>{parseError}</p>}

          {/* Comparison result */}
          {activeComparison != null && (
            <div className="animate-in">
              {/* Side-by-side cards with gauge in the middle */}
              <div style={styles.compGrid}>
                <ProfileCard data={myShareData} label="You" />

                <div style={styles.gaugeCol}>
                  <div style={styles.gaugeLabel}>Compatibility</div>
                  <GaugeArc score={compatibility!} />
                  <p style={styles.compatLabel}>{compatLabel}</p>
                </div>

                <ProfileCard
                  data={activeComparison}
                  label={activeComparison.nickname}
                />
              </div>

              {/* Radar chart */}
              <div className="card mt-4" style={styles.radarCard}>
                <h4 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  Profile Overlap
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis
                      dataKey="label"
                      tick={{ fill: '#b3b3b3', fontSize: 13 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: '#b3b3b3', fontSize: 10 }}
                    />
                    <Radar
                      name="You"
                      dataKey="A"
                      stroke="#1db954"
                      fill="#1db954"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name={activeComparison.nickname}
                      dataKey="B"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.3}
                    />
                    <Legend
                      formatter={(value: string) => (
                        <span style={{ color: '#fff', fontSize: '0.85rem' }}>
                          {value}
                        </span>
                      )}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════
            Feature 2 (continued) — Read-only view of shared profile
        ════════════════════════════════════════════════════ */}
        {sharedProfile != null && (
          <div className="card animate-in mt-4" style={styles.sharedSection}>
            <h3 style={{ marginBottom: '1.5rem' }}>
              👤 {sharedProfile.nickname}'s Highlights
            </h3>
            <div style={styles.sharedGrid}>
              {/* Artists column */}
              <div>
                <div style={styles.sharedLabel}>🎤 Top Artists</div>
                {sharedProfile.topArtists.map((a, i) => (
                  <div key={i} style={styles.sharedRow}>
                    <span style={styles.sharedRank}>#{i + 1}</span>
                    <span style={styles.sharedItemName}>{a.name}</span>
                    <span style={styles.sharedItemSub}>
                      {a.genres.slice(0, 2).join(', ')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tracks column */}
              <div>
                <div style={styles.sharedLabel}>🎵 Top Tracks</div>
                {sharedProfile.topTracks.map((t, i) => (
                  <div key={i} style={styles.sharedRow}>
                    <span style={styles.sharedRank}>#{i + 1}</span>
                    <span style={styles.sharedItemName}>{t.name}</span>
                    <span style={styles.sharedItemSub}>{t.artist}</span>
                  </div>
                ))}
              </div>

              {/* Archetype + Mood column */}
              <div>
                <div style={styles.sharedLabel}>🏷️ Archetype</div>
                <div style={styles.archetypePill}>{sharedProfile.listenerArchetype}</div>

                <div style={{ ...styles.sharedLabel, marginTop: '1.5rem' }}>
                  😊 Avg Mood
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <div style={{ ...styles.moodTrack, flex: 1 }}>
                    <div
                      style={{
                        ...styles.moodFill,
                        width: `${sharedProfile.moodScore}%`,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      color: '#1db954',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                    }}
                  >
                    {sharedProfile.moodScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  section: {
    paddingTop: '8rem',
    background:
      'linear-gradient(135deg, rgba(29, 185, 84, 0.04) 0%, transparent 100%)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
  },

  // ── Banner ──
  viewBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
    background: 'rgba(29, 185, 84, 0.08)',
    border: '1px solid rgba(29, 185, 84, 0.3)',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    marginBottom: '2.5rem',
  },

  // ── Feature block wrapper ──
  featureBlock: {
    marginBottom: '3rem',
  },

  // ── Shareable card ──
  cardWrapper: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '1.5rem',
  },
  shareCard: {
    width: '400px',
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid rgba(29, 185, 84, 0.4)',
    borderRadius: '16px',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow:
      '0 0 40px rgba(29, 185, 84, 0.07), 0 24px 60px rgba(0,0,0,0.65)',
    flexShrink: 0,
  },
  // A tiny 1×1 anchor element whose box-shadows become the "stars"
  starsLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '1px',
    height: '1px',
    background: 'transparent',
    pointerEvents: 'none',
    zIndex: 0,
    boxShadow: `
      22px 32px 0 1px rgba(29,185,84,0.5),
      280px 22px 0 1px rgba(255,255,255,0.45),
      180px 70px 0 1px rgba(29,185,84,0.35),
      350px 130px 0 1px rgba(29,185,84,0.45),
      62px 188px 0 1px rgba(255,255,255,0.3),
      318px 255px 0 1px rgba(29,185,84,0.35),
      138px 310px 0 1px rgba(255,255,255,0.25),
      385px 12px 0 1px rgba(29,185,84,0.3),
      102px 345px 0 1px rgba(29,185,84,0.28),
      252px 165px 0 1px rgba(255,255,255,0.2),
      48px 98px 0 1px rgba(29,185,84,0.32),
      312px 295px 0 1px rgba(29,185,84,0.22)
    `,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '14px',
    position: 'relative',
    zIndex: 1,
  },
  cardAvatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  cardAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '2px solid rgba(29,185,84,0.6)',
    display: 'block',
    objectFit: 'cover',
  },
  initialsSmall: {
    background: '#1db954',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: '700',
  },
  cardAvatarRing: {
    position: 'absolute',
    top: '-4px',
    left: '-4px',
    right: '-4px',
    bottom: '-4px',
    borderRadius: '50%',
    border: '1px solid rgba(29,185,84,0.3)',
  },
  cardName: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  archetypePill: {
    display: 'inline-block',
    background: 'rgba(29, 185, 84, 0.15)',
    border: '1px solid rgba(29, 185, 84, 0.4)',
    color: '#1db954',
    borderRadius: '20px',
    padding: '3px 10px',
    fontSize: '0.72rem',
    fontWeight: '600',
    letterSpacing: '0.02em',
  },
  divider: {
    height: '1px',
    background: 'rgba(29, 185, 84, 0.15)',
    margin: '14px 0',
    position: 'relative',
    zIndex: 1,
  },
  cardBlock: {
    marginBottom: '14px',
    position: 'relative',
    zIndex: 1,
  },
  cardBlockLabel: {
    fontSize: '0.68rem',
    fontWeight: '700',
    color: '#b3b3b3',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '6px',
  },
  cardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  cardRank: {
    color: '#1db954',
    fontSize: '0.7rem',
    fontWeight: '700',
    minWidth: '22px',
    flexShrink: 0,
  },
  cardRowName: {
    color: '#fff',
    fontSize: '0.82rem',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardRowSub: {
    color: '#b3b3b3',
    fontSize: '0.7rem',
    flexShrink: 0,
    maxWidth: '90px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  moodTrack: {
    width: '100%',
    height: '5px',
    background: 'rgba(29,185,84,0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  moodFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #1db954, #06b6d4)',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  brandingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    position: 'relative',
    zIndex: 1,
    marginTop: '4px',
  },
  brandingText: {
    color: '#b3b3b3',
    fontSize: '0.72rem',
    fontWeight: '600',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
  },

  // ── Action row ──
  actionRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  toast: {
    marginTop: '1rem',
    display: 'inline-block',
    background: 'rgba(29, 185, 84, 0.12)',
    border: '1px solid rgba(29, 185, 84, 0.4)',
    color: '#1db954',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.88rem',
  },

  // ── Compare section ──
  compareSection: {
    marginTop: '3.5rem',
    paddingTop: '3rem',
    borderTop: '1px solid rgba(29, 185, 84, 0.1)',
  },
  inputRow: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  linkInput: {
    flex: 1,
    minWidth: '200px',
    background: 'rgba(20, 20, 25, 0.8)',
    border: '1px solid rgba(29, 185, 84, 0.3)',
    borderRadius: '8px',
    padding: '0.72rem 1rem',
    color: '#fff',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  compGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: '1.25rem',
    alignItems: 'start',
    marginTop: '1.5rem',
  },
  gaugeCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem 0.5rem',
  },
  gaugeLabel: {
    fontSize: '0.68rem',
    color: '#b3b3b3',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontWeight: '700',
    marginBottom: '0.75rem',
  },
  compatLabel: {
    fontSize: '0.82rem',
    color: '#b3b3b3',
    textAlign: 'center',
    marginTop: '0.5rem',
    maxWidth: '120px',
  },
  radarCard: {
    background: 'var(--card-bg)',
  },

  // ── Shared profile view ──
  sharedSection: {},
  sharedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '2rem',
  },
  sharedLabel: {
    fontSize: '0.68rem',
    fontWeight: '700',
    color: '#b3b3b3',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.6rem',
  },
  sharedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 0',
    fontSize: '0.88rem',
    color: '#e0e0e0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexWrap: 'wrap',
  },
  sharedRank: {
    color: '#1db954',
    fontSize: '0.72rem',
    fontWeight: '700',
    minWidth: '22px',
    flexShrink: 0,
  },
  sharedItemName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sharedItemSub: {
    color: '#b3b3b3',
    fontSize: '0.72rem',
    flexShrink: 0,
  },
};

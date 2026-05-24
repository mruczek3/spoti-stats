import React, { useState, useEffect, useRef } from "react";
import type { Artist } from "../data/mockData";
import * as spotifyApi from "../services/spotifyApi";
import { hasValidToken } from "../services/auth";
import { spotifyArtistsToLocal } from "../utils/converters";

type TimeRange = "short_term" | "medium_term" | "long_term";

interface TopArtistsProps {
  artists: Artist[];
}

export const TopArtists: React.FC<TopArtistsProps> = ({
  artists: initialArtists,
}) => {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  // newFrom: first index of the most recently revealed batch so new cards can animate in.
  // Initialise to artists.length so no card is "new" on first render.
  const [newFrom, setNewFrom] = useState<number>(initialArtists.length);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const handleRangeChange = async (range: TimeRange) => {
    if (loading) return;
    setLoading(true);

    if (hasValidToken()) {
      try {
        const data = (await spotifyApi.getTopArtists(range, 50)) as {
          items: any[];
        };
        const newArtists = spotifyArtistsToLocal(data.items);
        console.log(
          "[TopArtists] order from API:",
          newArtists.slice(0, 5).map((a) => a.name),
        );
        setArtists(newArtists);
      } catch (err) {
        console.error("[TopArtists] fetch failed:", err);
      }
    }

    // Demo mode: timeRange still updates so button highlights correctly; artists unchanged.
    // Set newFrom high so none of the initial 10 cards animate as "new".
    setTimeRange(range);
    setVisibleCount(10);
    setNewFrom(50);
    setLoading(false);
  };

  const showMore = () => {
    setNewFrom(visibleCount);
    setVisibleCount((prev) => Math.min(prev + 10, artists.length));
  };

  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollToTop = () => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const hasMore = visibleCount < artists.length;
  const nextCount = Math.min(visibleCount + 10, artists.length);

  return (
    <section
      ref={sectionRef}
      style={styles.section}
      className="section fade-on-scroll"
    >
      <div style={styles.container}>
        {/* Header with time range selector */}
        <div style={styles.header}>
          <h2>Top Artists</h2>
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
          <div style={styles.artistsGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-card card"
                style={{ minHeight: "380px", animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        ) : (
          <>
            {/* overflow:hidden prevents the expand from shifting layout during animation */}
            <div style={{ overflow: "hidden", transition: "height 0.4s ease" }}>
              <div style={styles.artistsGrid}>
                {artists.slice(0, visibleCount).map((artist, idx) => {
                  const isNew = idx >= newFrom;
                  return (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      rank={idx + 1}
                      isNew={isNew}
                      animDelay={isNew ? (idx - newFrom) * 0.08 : 0}
                      loyaltyBadge={undefined}
                    />
                  );
                })}
              </div>
            </div>

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
                  Show more ({nextCount}/{artists.length})
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating back-to-top button: visible only after scrolling + more than 10 artists shown */}
      {visibleCount > 10 && showScrollTop && (
        <button
          style={styles.scrollTopBtn}
          onClick={scrollToTop}
          aria-label="Back to top of artists section"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#1ed760";
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#1db954";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          ↑
        </button>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
// ArtistCard
// ---------------------------------------------------------------------------

interface ArtistCardProps {
  artist: Artist;
  rank: number;
  isNew: boolean;
  animDelay: number;
  loyaltyBadge?: "bronze" | "silver" | "gold";
}

const ArtistCard: React.FC<ArtistCardProps> = ({
  artist,
  rank,
  isNew,
  animDelay,
  loyaltyBadge,
}) => {
  const years = Math.floor(
    (Date.now() - artist.firstListenedAt.getTime()) /
      (365 * 24 * 60 * 60 * 1000),
  );

  const compatibility = Math.round(
    (artist.loyaltyScore + artist.popularity) / 2,
  );

  const badgeEmoji =
    loyaltyBadge === "bronze"
      ? "🥉"
      : loyaltyBadge === "silver"
        ? "🥈"
        : loyaltyBadge === "gold"
          ? "🥇"
          : null;

  return (
    <div
      style={{
        ...styles.artistCard,
        backgroundImage: `linear-gradient(135deg, rgba(10,10,10,0.85), rgba(10,10,10,0.4)), url(${artist.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        // For newly revealed cards: use `both` fill-mode so the `from` keyframe hides
        // the card during the delay, then the `to` keyframe keeps it visible afterward.
        ...(isNew
          ? {
              animation: "fadeInUp 0.4s ease-out both",
              animationDelay: `${animDelay}s`,
            }
          : {}),
      }}
      className="card animate-in"
    >
      <div style={styles.cardContent}>
        {/* Rank Badge */}
        <div style={styles.rankBadge}>{rank}</div>

        {/* Loyalty Badge Icon — positioned below the rank badge */}
        {badgeEmoji && <div style={styles.loyaltyBadgeIcon}>{badgeEmoji}</div>}

        {/* Compatibility Badge */}
        <div style={styles.compatibilityBadge}>{compatibility}% Match</div>

        {/* Artist Info */}
        <div style={styles.artistInfo}>
          <h3 style={{ marginBottom: "0.5rem", fontSize: "1.4rem" }}>
            {artist.name}
          </h3>

          {/* Genre Pills */}
          <div style={styles.genrePills}>
            {artist.genre.slice(0, 2).map((g, i) => (
              <span key={i} className="pill" style={styles.genrePill}>
                {g}
              </span>
            ))}
          </div>

          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            <StatBlock
              label="Loyalty"
              value={`${Math.round(artist.loyaltyScore)}%`}
              color="#1db954"
            />
            <StatBlock
              label="Years"
              value={years > 0 ? `${years}y` : "<1y"}
              color="#f59e0b"
            />
            <StatBlock
              label="Popularity"
              value={`${artist.popularity}%`}
              color="#06b6d4"
            />
          </div>

          {/* Loyalty Progress Bar */}
          <div style={styles.progressSection}>
            <label
              style={{
                fontSize: "0.75rem",
                color: "#b3b3b3",
                marginBottom: "0.25rem",
                display: "block",
              }}
            >
              Your Connection
            </label>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${artist.loyaltyScore}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// StatBlock
// ---------------------------------------------------------------------------

interface StatBlockProps {
  label: string;
  value: string;
  color: string;
}

const StatBlock: React.FC<StatBlockProps> = ({ label, value, color }) => (
  <div style={styles.statBlock}>
    <span style={{ fontSize: "0.75rem", color: "#b3b3b3" }}>{label}</span>
    <span style={{ color, fontWeight: "700", fontSize: "1.1rem" }}>
      {value}
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
  artistsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
  },
  artistCard: {
    position: "relative",
    minHeight: "380px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    overflow: "hidden",
    borderRadius: "16px",
    border: "1px solid rgba(29, 185, 84, 0.15)",
    backdropFilter: "blur(20px)",
    transition:
      "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
  },
  cardContent: {
    position: "relative",
    zIndex: 2,
    padding: "1.5rem",
    background: "linear-gradient(180deg, transparent, rgba(10, 10, 10, 0.95))",
  },
  rankBadge: {
    position: "absolute",
    top: "1rem",
    left: "1rem",
    background: "rgba(29, 185, 84, 0.9)",
    color: "#000",
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    fontWeight: "700",
    fontSize: "1.1rem",
    zIndex: 3,
  },
  // Positioned below the rank badge (44px tall + 1rem top offset + 8px gap)
  loyaltyBadgeIcon: {
    position: "absolute",
    top: "calc(1rem + 52px)",
    left: "1rem",
    fontSize: "1.4rem",
    zIndex: 3,
    lineHeight: "1",
  },
  compatibilityBadge: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "rgba(6, 182, 212, 0.9)",
    color: "#000",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "700",
    zIndex: 3,
  },
  artistInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  genrePills: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  genrePill: {
    fontSize: "0.75rem",
    padding: "0.4rem 0.7rem",
    background: "rgba(29, 185, 84, 0.2)",
    border: "1px solid rgba(29, 185, 84, 0.3)",
    color: "#1db954",
    borderRadius: "16px",
    fontWeight: "600",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
    marginBottom: "1rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid rgba(29, 185, 84, 0.2)",
  },
  statBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.25rem",
    textAlign: "center" as const,
  },
  progressSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  progressBar: {
    width: "100%",
    height: "6px",
    background: "rgba(29, 185, 84, 0.2)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #1db954, #06b6d4)",
    transition: "width 0.6s ease",
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
  scrollTopBtn: {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    zIndex: 999,
    background: "#1db954",
    color: "#000",
    border: "none",
    borderRadius: "50%",
    width: "56px",
    height: "56px",
    fontSize: "1.4rem",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(29, 185, 84, 0.45)",
    transition: "background 0.2s ease, transform 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
  },
};

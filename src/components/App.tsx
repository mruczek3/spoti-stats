import React, { useState, useEffect, useRef } from "react";
import "../styles.css";
import { Navbar } from "./Navbar";
import { HeroDashboard } from "./HeroDashboard";
import { TopTracks } from "./TopTracks";
import { TopArtists } from "./TopArtists";
import { PersonalityProfile } from "./PersonalityProfile";
import { ListeningClock } from "./ListeningClock";
import { GenreUniverse } from "./GenreUniverse";
import { MoodTimeline } from "./MoodTimeline";
import { ReportCard } from "./ReportCard";
import { CompareMode } from "./CompareMode";
import { Minigames } from "./Minigames";
import { Social } from "./Social";
import type { SharedProfileData } from "./Social";
import { Footer } from "./Footer";
import {
  isAuthenticated,
  hasValidToken,
  redirectToSpotifyAuth,
  clearAuthToken,
  refreshAccessToken,
  exchangeCodeForToken,
  getNickname,
  setNickname as saveNickname,
} from "../services/auth";
import * as spotifyApi from "../services/spotifyApi";
import { generateMockUserProfile, generateComparison } from "../data/mockData";
import type { UserProfile } from "../data/mockData";
import {
  getNetworkInfo,
  getRecommendedRedirectUris,
  logNetworkInfo,
} from "../services/networkUtils";

// ── Toast ─────────────────────────────────────────────────────────────────────
interface ToastData {
  id: number;
  msg: string;
  type?: "success" | "info";
}

const ToastContainer: React.FC<{
  toasts: ToastData[];
  onRemove: (id: number) => void;
}> = ({ toasts, onRemove }) => (
  <div
    style={{
      position: "fixed",
      bottom: "2rem",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      alignItems: "center",
    }}
  >
    {toasts.map((t) => (
      <div
        key={t.id}
        onClick={() => onRemove(t.id)}
        style={{
          background: t.type === "success" ? "#1db954" : "rgba(20,20,25,0.97)",
          color: t.type === "success" ? "#000" : "#fff",
          border: "1px solid rgba(29,185,84,0.4)",
          padding: "0.75rem 1.5rem",
          borderRadius: "50px",
          fontWeight: 600,
          cursor: "pointer",
          animation: "fadeInUp 0.3s ease",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.9rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          whiteSpace: "nowrap",
        }}
      >
        {t.msg}
      </div>
    ))}
  </div>
);

// ── URL profile parsing ───────────────────────────────────────────────────────
function parseSharedProfile(search: string): SharedProfileData | null {
  try {
    const params = new URLSearchParams(search);
    const encoded = params.get("profile");
    if (!encoded) return null;
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch {
    return null;
  }
}

// ── Main App ─────────────────────────────────────────────────────────────────
export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [comparisonData, setComparisonData] = useState<{
    user1: UserProfile;
    user2: UserProfile;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpotifyAuth, setIsSpotifyAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetupInfo, setShowSetupInfo] = useState(false);
  const [spotifyUserId, setSpotifyUserId] = useState("");
  const [nickname, setNicknameState] = useState<string>("");
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastId = useRef(0);

  // Read ?profile= from URL for shared profile view
  const sharedProfile = parseSharedProfile(window.location.search);

  const addToast = (
    msg: string,
    type: ToastData["type"] = "info",
    duration = 3500,
  ) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  };
  const removeToast = (id: number) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  // ── Fetch Spotify data ─────────────────────────────────────────────────────
  async function fetchSpotifyData(silent = false) {
    try {
      setError(null);
      if (!silent) setIsLoading(true);

      const [userRes, topTracksRes, topArtistsRes, recentlyPlayedRes] =
        await Promise.all([
          spotifyApi.getCurrentUser().catch(() => null),
          spotifyApi.getTopTracks("medium_term", 50).catch(() => null),
          spotifyApi.getTopArtists("medium_term", 50).catch(() => null),
          spotifyApi.getRecentlyPlayed(50).catch(() => null),
        ]);

      if (!userRes || !topTracksRes || !topArtistsRes) {
        throw new Error("Failed to fetch Spotify data");
      }

      const spotifyProfile = convertSpotifyDataToProfile(
        userRes,
        topTracksRes,
        topArtistsRes,
        recentlyPlayedRes,
      );
      setProfile(spotifyProfile);
      setComparisonData(generateComparison());
      setIsSpotifyAuth(true);

      // Store userId and load saved nickname
      const uid: string = (userRes as any).id || "";
      setSpotifyUserId(uid);
      const saved = getNickname(uid);
      if (saved) {
        setNicknameState(saved);
        if (silent) addToast(`Auto-logged in as @${saved} 🎵`, "success");
      } else {
        if (silent)
          addToast(
            `Auto-logged in as ${(userRes as any).display_name || "you"} 🎵`,
            "success",
          );
      }
    } catch (err) {
      console.error("Error fetching Spotify data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load Spotify data",
      );
      setProfile(generateMockUserProfile());
      setComparisonData(generateComparison());
    } finally {
      if (!silent) setIsLoading(false);
    }
  }

  // ── Auto-login on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // If shared profile in URL, show social tab (no login needed)
      if (sharedProfile) {
        setActiveSection("social");
        return;
      }

      // Pick up OAuth code stored by callback.html (GitHub Pages bridge)
      const pendingCode = sessionStorage.getItem("spotify_oauth_code");
      const pendingError = sessionStorage.getItem("spotify_oauth_error");
      if (pendingError) {
        sessionStorage.removeItem("spotify_oauth_error");
        setError(`Spotify auth error: ${pendingError}`);
        return;
      }
      if (pendingCode) {
        sessionStorage.removeItem("spotify_oauth_code");
        setIsLoading(true);
        try {
          await exchangeCodeForToken(pendingCode);
          await fetchSpotifyData(false);
        } catch (e) {
          setError("Token exchange failed. Please try logging in again.");
          setIsLoading(false);
        }
        return;
      }

      if (hasValidToken()) {
        // Token is still valid — load data silently
        fetchSpotifyData(true);
        return;
      }

      if (isAuthenticated()) {
        // Token expired but refresh token exists — try refresh
        const newToken = await refreshAccessToken();
        if (newToken) {
          fetchSpotifyData(true);
          return;
        }
      }
      // Not logged in — show login page
    };

    init();

    // Intersection observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    }, observerOptions);
    document
      .querySelectorAll(".fade-on-scroll")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Nickname handler ───────────────────────────────────────────────────────
  const handleNicknameChange = (newNickname: string) => {
    setNicknameState(newNickname);
    if (spotifyUserId) saveNickname(spotifyUserId, newNickname);
    addToast("Nickname saved! 🎉", "success");
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    clearAuthToken();
    setProfile(null);
    setIsSpotifyAuth(false);
    setNicknameState("");
    setSpotifyUserId("");
    // Remove ?profile= from URL if present
    window.history.replaceState({}, "", window.location.pathname);
    window.location.reload();
  };

  // ── Convert Spotify API → UserProfile ─────────────────────────────────────
  function convertSpotifyDataToProfile(
    user: any,
    topTracks: any,
    topArtists: any,
    _recentlyPlayed: any,
  ): UserProfile {
    const mockProfile = generateMockUserProfile();

    const tracks = (topTracks.items || []).map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists?.[0]?.name || "Unknown",
      artistId: track.artists?.[0]?.id || "",
      album: track.album?.name || "",
      albumArt: track.album?.images?.[0]?.url || "",
      duration: Math.round((track.duration_ms || 180000) / 1000),
      playCount: Math.floor(Math.random() * 1000) + 100,
      hoursListened: Math.floor(Math.random() * 200) + 10,
      moodScore: Math.floor(Math.random() * 100),
      releaseDate: track.album?.release_date || "2020-01-01",
      popularity: track.popularity || 50,
      audioFeatures: {
        energy: Math.floor(Math.random() * 100),
        danceability: Math.floor(Math.random() * 100),
        acousticness: Math.floor(Math.random() * 100),
        valence: Math.floor(Math.random() * 100),
        liveness: Math.floor(Math.random() * 100),
        speechiness: Math.floor(Math.random() * 100),
        bpm: Math.floor(Math.random() * 120) + 60,
      },
      addedAt: new Date(),
      isUnderrated: Math.random() > 0.7,
    }));

    const artists = (topArtists.items || []).map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      image: artist.images?.[0]?.url || "",
      genre: artist.genres || [],
      totalPlaytime: Math.floor(Math.random() * 1000) + 100,
      trackCount: Math.floor(Math.random() * 50) + 5,
      followerCount: artist.followers?.total || 0,
      popularity: artist.popularity || 50,
      loyaltyScore: 50 + Math.floor(Math.random() * 50),
      firstListenedAt: new Date(
        Date.now() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000,
      ),
    }));

    const genreMap = new Map<string, { count: number; hours: number }>();
    artists.forEach((a: any) => {
      a.genre.forEach((g: string) => {
        const cur = genreMap.get(g) || { count: 0, hours: 0 };
        genreMap.set(g, {
          count: cur.count + 1,
          hours: cur.hours + Math.random() * 10,
        });
      });
    });

    // Spotify's API doesn't provide historical mood / listening time data,
    // so we enrich with mock data for those sections.
    const mock = mockProfile;

    return {
      id: user.id || "user_" + Date.now(), // internal only — never shown
      displayName: user.display_name || "Spotify User", // real name, shown by default
      avatar: user.images?.[0]?.url || "",
      topTracks: tracks,
      topArtists: artists,
      totalMinutesListened: 0,
      artistsDiscovered: artists.length,
      listeningStreak: 0,
      personality: mock.personality,
      listenerArchetype: mock.listenerArchetype,
      archetypeDescription: mock.archetypeDescription,
      currentlyPlaying: null,
      listeningHistory: mock.listeningHistory,
      weeklyHeatmap: mock.weeklyHeatmap,
      moodTimeline: mock.moodTimeline,
      genres: genreMap.size > 0 ? genreMap : mock.genres,
      discoveries: mock.discoveries,
    };
  }

  // ── Login screen ───────────────────────────────────────────────────────────
  if (!isAuthenticated() && !profile && !sharedProfile) {
    const networkInfo = getNetworkInfo();
    const recommendedUris = getRecommendedRedirectUris();
    logNetworkInfo();

    if (showSetupInfo) {
      return (
        <div style={styles.loginContainer}>
          <div style={styles.setupContent}>
            <button
              onClick={() => setShowSetupInfo(false)}
              style={styles.backButton}
            >
              ← Back
            </button>
            <h2 style={{ marginBottom: "1.5rem", color: "#1db954" }}>
              🔧 Spotify OAuth Setup
            </h2>
            <div style={styles.setupBox}>
              <h3 style={{ marginBottom: "1rem" }}>Your Current Setup:</h3>
              <div style={styles.infoBlock}>
                <div style={styles.infoPair}>
                  <span style={styles.infoLabel}>Access URL:</span>
                  <code style={styles.infoValue}>
                    {networkInfo.redirectUri.replace("/callback", "")}
                  </code>
                </div>
                <div style={styles.infoPair}>
                  <span style={styles.infoLabel}>Redirect URI:</span>
                  <code style={styles.infoValue}>
                    {networkInfo.redirectUri}
                  </code>
                </div>
              </div>
              <h3 style={{ marginTop: "2rem", marginBottom: "1rem" }}>
                Setup Steps:
              </h3>
              <ol style={styles.setupSteps}>
                <li>
                  Go to{" "}
                  <a
                    href="https://developer.spotify.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    Spotify Developer Dashboard
                  </a>
                </li>
                <li>Select your app and copy its Client ID</li>
                <li>
                  Click "Edit Settings" → Add these Redirect URIs:
                  <div style={styles.uriList}>
                    {recommendedUris.map((uri, i) => (
                      <div key={i} style={styles.uriItem}>
                        <code>{uri}</code>
                      </div>
                    ))}
                  </div>
                </li>
                <li>Click "Save" then come back and login</li>
              </ol>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginContent}>
          <h1 style={styles.loginTitle}>🎵 Spotify Stats</h1>
          <p style={styles.loginSubtitle}>
            Your premium listening analytics dashboard
          </p>
          <p style={styles.loginDesc}>
            Connect your Spotify account to see your personalized music insights
          </p>

          <div style={styles.currentAccessInfo}>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#b3b3b3",
                marginBottom: "0.5rem",
              }}
            >
              📍 Accessing from:
            </p>
            <code style={styles.accessCode}>
              {networkInfo.redirectUri.replace("/callback", "")}
            </code>
          </div>

          <button
            onClick={() => redirectToSpotifyAuth()}
            style={styles.loginButton}
          >
            <span style={styles.spotifyIcon}>🎧</span>
            Login with Spotify
          </button>

          <button
            onClick={() => setShowSetupInfo(true)}
            style={styles.setupButton}
          >
            🔧 Setup Instructions
          </button>

          <p style={styles.demoText}>
            Or explore with{" "}
            <button
              onClick={() => {
                setProfile(generateMockUserProfile());
                setComparisonData(generateComparison());
              }}
              style={styles.demoButton}
            >
              demo data
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading || (!profile && !sharedProfile)) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader} />
        <p style={{ color: "#1db954", marginTop: "2rem", fontSize: "1.1rem" }}>
          Loading your listening stats...
        </p>
      </div>
    );
  }

  // ── Shared-profile-only view (no login needed) ─────────────────────────────
  if (sharedProfile && !profile) {
    return (
      <div style={styles.app}>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div
          style={{ maxWidth: "900px", margin: "4rem auto", padding: "0 2rem" }}
        >
          <Social
            profile={generateMockUserProfile()}
            sharedProfile={sharedProfile}
          />
        </div>
      </div>
    );
  }

  // ── Main dashboard ─────────────────────────────────────────────────────────
  return (
    <div style={styles.app}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Navbar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        nickname={nickname || undefined}
        onLogout={isSpotifyAuth || profile ? handleLogout : undefined}
      />

      {error && (
        <div style={styles.errorBanner}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={styles.closeError}>
            ×
          </button>
        </div>
      )}

      <main>
        {(activeSection === "hero" || activeSection === "") && (
          <HeroDashboard
            profile={profile!}
            nickname={nickname || undefined}
            onNicknameChange={handleNicknameChange}
          />
        )}
        {activeSection === "tracks" && (
          <TopTracks tracks={profile!.topTracks} />
        )}
        {activeSection === "artists" && (
          <TopArtists artists={profile!.topArtists} />
        )}
        {activeSection === "personality" && (
          <PersonalityProfile profile={profile!} />
        )}
        {activeSection === "listening" && <ListeningClock profile={profile!} />}
        {activeSection === "genres" && <GenreUniverse profile={profile!} />}
        {activeSection === "mood" && <MoodTimeline profile={profile!} />}
        {activeSection === "report" && <ReportCard profile={profile!} />}
        {activeSection === "compare" && (
          <CompareMode
            user1={comparisonData?.user1 || profile!}
            user2={comparisonData?.user2 || generateMockUserProfile()}
          />
        )}
        {activeSection === "games" && <Minigames profile={profile!} />}
        {activeSection === "social" && (
          <Social
            profile={profile || generateMockUserProfile()}
            nickname={nickname || undefined}
            sharedProfile={sharedProfile}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
  },
  loginContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
    padding: "2rem",
  },
  loginContent: {
    textAlign: "center",
    maxWidth: "500px",
  },
  loginTitle: {
    fontSize: "3.5rem",
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: "1rem",
    fontFamily: "Bebas Neue, sans-serif",
    letterSpacing: "2px",
  },
  loginSubtitle: {
    fontSize: "1.5rem",
    color: "#1db954",
    marginBottom: "1rem",
    fontFamily: "Playfair Display, serif",
  },
  loginDesc: {
    fontSize: "1rem",
    color: "#b3b3b3",
    marginBottom: "2rem",
    fontFamily: "DM Sans, sans-serif",
    lineHeight: "1.6",
  },
  loginButton: {
    padding: "1rem 2rem",
    fontSize: "1.1rem",
    fontWeight: "bold",
    backgroundColor: "#1db954",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
    marginBottom: "1rem",
    fontFamily: "DM Sans, sans-serif",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    margin: "0 auto 1rem",
    boxShadow: "0 0 20px rgba(29, 185, 84, 0.3)",
  },
  spotifyIcon: { fontSize: "1.5rem" },
  setupButton: {
    display: "block",
    margin: "0 auto 1rem",
    padding: "0.75rem 1.5rem",
    background: "rgba(29,185,84,0.1)",
    border: "1px solid rgba(29,185,84,0.3)",
    color: "#1db954",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "0.95rem",
  },
  currentAccessInfo: {
    background: "rgba(29,185,84,0.05)",
    border: "1px solid rgba(29,185,84,0.15)",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "2rem",
    textAlign: "left",
  },
  accessCode: {
    fontSize: "0.85rem",
    color: "#1db954",
    fontFamily: "monospace",
    wordBreak: "break-all",
  },
  demoText: { color: "#b3b3b3", fontSize: "0.9rem", marginTop: "1rem" },
  demoButton: {
    background: "none",
    border: "none",
    color: "#1db954",
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
    fontSize: "inherit",
    fontFamily: "inherit",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
  },
  loader: {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(29, 185, 84, 0.2)",
    borderTop: "4px solid #1db954",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorBanner: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid #ef4444",
    color: "#fca5a5",
    padding: "1rem",
    margin: "1rem",
    borderRadius: "0.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeError: {
    background: "none",
    border: "none",
    color: "#fca5a5",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: 0,
  },
  setupContent: {
    maxWidth: "800px",
    width: "100%",
    background: "rgba(20,20,25,0.95)",
    border: "1px solid rgba(29,185,84,0.2)",
    borderRadius: "16px",
    padding: "2.5rem",
    backdropFilter: "blur(20px)",
  },
  backButton: {
    background: "rgba(29,185,84,0.2)",
    border: "1px solid rgba(29,185,84,0.4)",
    color: "#1db954",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
    marginBottom: "1.5rem",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "0.9rem",
  },
  setupBox: {
    background: "rgba(10,10,10,0.5)",
    border: "1px solid rgba(29,185,84,0.1)",
    borderRadius: "12px",
    padding: "1.5rem",
    marginTop: "1.5rem",
  },
  infoBlock: {
    background: "rgba(29,185,84,0.05)",
    border: "1px solid rgba(29,185,84,0.1)",
    borderRadius: "8px",
    padding: "1rem",
  },
  infoPair: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  infoLabel: { color: "#b3b3b3", fontSize: "0.85rem", fontWeight: "bold" },
  infoValue: {
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(29,185,84,0.2)",
    color: "#1db954",
    padding: "0.5rem 0.75rem",
    borderRadius: "4px",
    fontSize: "0.85rem",
    fontFamily: "monospace",
    wordBreak: "break-all",
  },
  setupSteps: { color: "#b3b3b3", lineHeight: "1.8", paddingLeft: "1.5rem" },
  link: { color: "#1db954", textDecoration: "underline", cursor: "pointer" },
  uriList: {
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(29,185,84,0.1)",
    borderRadius: "6px",
    padding: "1rem",
    marginTop: "0.5rem",
    maxHeight: "200px",
    overflowY: "auto",
  },
  uriItem: {
    background: "rgba(29,185,84,0.05)",
    border: "1px solid rgba(29,185,84,0.1)",
    borderRadius: "4px",
    padding: "0.4rem 0.75rem",
    marginBottom: "0.4rem",
    fontFamily: "monospace",
    fontSize: "0.8rem",
    color: "#1db954",
    wordBreak: "break-all",
  },
};

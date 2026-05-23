import React, { useState, useEffect } from 'react';
import '../styles.css';
import { Navbar } from './Navbar';
import { HeroDashboard } from './HeroDashboard';
import { TopTracks } from './TopTracks';
import { TopArtists } from './TopArtists';
import { PersonalityProfile } from './PersonalityProfile';
import { ListeningClock } from './ListeningClock';
import { GenreUniverse } from './GenreUniverse';
import { MoodTimeline } from './MoodTimeline';
import { ReportCard } from './ReportCard';
import { CompareMode } from './CompareMode';
import { Footer } from './Footer';
import { isAuthenticated, redirectToSpotifyAuth, clearAuthToken } from '../services/auth';
import * as spotifyApi from '../services/spotifyApi';
import { generateMockUserProfile, generateComparison } from '../data/mockData';
import type { UserProfile } from '../data/mockData';
import { getNetworkInfo, getRecommendedRedirectUris, logNetworkInfo } from '../services/networkUtils';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [comparisonData, setComparisonData] = useState<{ user1: UserProfile; user2: UserProfile } | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start as false - loading only when fetching
  const [isSpotifyAuth, setIsSpotifyAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetupInfo, setShowSetupInfo] = useState(false);

  // Fetch real Spotify data
  async function fetchSpotifyData() {
    try {
      setError(null);
      setIsLoading(true);

      // Fetch user data in parallel
      const [userRes, topTracksRes, topArtistsRes, recentlyPlayedRes] = await Promise.all([
        spotifyApi.getCurrentUser().catch(() => null),
        spotifyApi.getTopTracks('medium_term', 50).catch(() => null),
        spotifyApi.getTopArtists('medium_term', 50).catch(() => null),
        spotifyApi.getRecentlyPlayed(50).catch(() => null),
      ]);

      if (!userRes || !topTracksRes || !topArtistsRes) {
        throw new Error('Failed to fetch some Spotify data');
      }

      // Convert Spotify data to UserProfile format
      const spotifyProfile = convertSpotifyDataToProfile(
        userRes,
        topTracksRes,
        topArtistsRes,
        recentlyPlayedRes
      );

      setProfile(spotifyProfile);
      setComparisonData(generateComparison());
      setIsSpotifyAuth(true);
    } catch (err) {
      console.error('Error fetching Spotify data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Spotify data');
      // Fallback to mock data
      setProfile(generateMockUserProfile());
      setComparisonData(generateComparison());
    } finally {
      setIsLoading(false);
    }
  }

  // Convert Spotify API response to UserProfile format
  function convertSpotifyDataToProfile(
    user: any,
    topTracks: any,
    topArtists: any,
    recentlyPlayed: any
  ): UserProfile {
    const mockProfile = generateMockUserProfile();

    // Map Spotify tracks
    const tracks = topTracks.items.map((track: any) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0]?.name || 'Unknown',
      image: track.album?.images?.[0]?.url || '',
      playCount: Math.floor(Math.random() * 1000) + 100,
      hoursListened: Math.floor(Math.random() * 200) + 10,
      moodScore: Math.floor(Math.random() * 100),
      bpm: Math.floor(Math.random() * 120) + 60,
      energy: Math.floor(Math.random() * 100),
    }));

    // Map Spotify artists
    const artists = topArtists.items.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      image: artist.images?.[0]?.url || '',
      genres: artist.genres || [],
      loyaltyScore: 50 + Math.floor(Math.random() * 50),
      listeningYears: Math.floor(Math.random() * 15) + 1,
      popularity: artist.popularity || 50,
      followerCount: artist.followers?.total || 0,
    }));

    // Extract genres from recently played
    const genreMap = new Map<string, { count: number; hours: number }>();
    if (recentlyPlayed?.items) {
      recentlyPlayed.items.forEach((item: any) => {
        const track = item.track;
        if (track?.artists?.[0]?.id) {
          const genres = track.artists[0].genres || [];
          genres.forEach((genre: string) => {
            const current = genreMap.get(genre) || { count: 0, hours: 0 };
            genreMap.set(genre, {
              count: current.count + 1,
              hours: current.hours + Math.random() * 2
            });
          });
        }
      });
    }

    const genres = genreMap.size > 0 ? genreMap : mockProfile.genres;

    return {
      id: user.id || 'user_' + Date.now(),
      displayName: user.display_name || user.email || 'Spotify User',
      avatar: user.images?.[0]?.url || 'https://platform.slack-edge.com/img/default_application_icon.png',
      topTracks: tracks.slice(0, 20),
      topArtists: artists.slice(0, 10),
      totalMinutesListened: 0,
      artistsDiscovered: artists.length,
      listeningStreak: 0,
      personality: mockProfile.personality,
      listenerArchetype: mockProfile.listenerArchetype,
      archetypeDescription: mockProfile.archetypeDescription,
      currentlyPlaying: null,
      listeningHistory: mockProfile.listeningHistory,
      weeklyHeatmap: mockProfile.weeklyHeatmap,
      moodTimeline: mockProfile.moodTimeline,
      genres,
      discoveries: mockProfile.discoveries || [],
    };
  }

  useEffect(() => {
    // Only fetch Spotify data if user is already authenticated
    // (e.g., returning from OAuth callback)
    if (isAuthenticated()) {
      fetchSpotifyData();
    }
    // Do NOT auto-load mock data - wait for user to explicitly click "demo data"

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Show login screen if not authenticated
  if (!isAuthenticated() && !profile) {
    const networkInfo = getNetworkInfo();
    const recommendedUris = getRecommendedRedirectUris();

    // Log network info to console
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
            <h2 style={{ marginBottom: '1.5rem', color: '#1db954' }}>
              🔧 Spotify OAuth Setup
            </h2>
            
            <div style={styles.setupBox}>
              <h3 style={{ marginBottom: '1rem' }}>Your Current Setup:</h3>
              <div style={styles.infoBlock}>
                <div style={styles.infoPair}>
                  <span style={styles.infoLabel}>Access URL:</span>
                  <code style={styles.infoValue}>
                    {networkInfo.redirectUri.replace('/callback', '')}
                  </code>
                </div>
                <div style={styles.infoPair}>
                  <span style={styles.infoLabel}>Redirect URI:</span>
                  <code style={styles.infoValue}>{networkInfo.redirectUri}</code>
                </div>
              </div>

              <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Setup Steps:</h3>
              <ol style={styles.setupSteps}>
                <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" style={styles.link}>Spotify Developer Dashboard</a></li>
                <li>Select your app (Client ID: fa5e8ae611124119aee7fd0ba733228c)</li>
                <li>Click "Edit Settings"</li>
                <li>Add these Redirect URIs:
                  <div style={styles.uriList}>
                    {recommendedUris.map((uri, idx) => (
                      <div key={idx} style={styles.uriItem}>
                        <code>{uri}</code>
                      </div>
                    ))}
                  </div>
                </li>
                <li>Click "Save"</li>
                <li>Come back here and click "Login with Spotify"</li>
              </ol>

              <p style={{ marginTop: '2rem', color: '#b3b3b3', fontSize: '0.9rem' }}>
                ℹ️ The redirect URI must match EXACTLY (including protocol and port).
                If you change the port, update it in Spotify settings.
              </p>
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
            <p style={{ fontSize: '0.9rem', color: '#b3b3b3', marginBottom: '0.5rem' }}>
              📍 Accessing from:
            </p>
            <code style={styles.accessCode}>
              {networkInfo.redirectUri.replace('/callback', '')}
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
            Or explore with{' '}
            <button
              onClick={() => {
                setProfile(generateMockUserProfile());
                setComparisonData(generateComparison());
                setIsLoading(false);
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

  if (isLoading || !profile) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader} />
        <p style={{ color: '#1db954', marginTop: '2rem', fontSize: '1.1rem' }}>
          Loading your listening stats...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <Navbar activeSection={activeSection} onSectionChange={setActiveSection} />

      {error && (
        <div style={styles.errorBanner}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={styles.closeError}>×</button>
        </div>
      )}

      {isSpotifyAuth && (
        <div style={styles.spotifyBadge}>
          🎵 Connected to Spotify
          <button
            onClick={() => {
              clearAuthToken();
              setProfile(null);
              setIsSpotifyAuth(false);
              window.location.href = '/';
            }}
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      )}

      <main>
        {(activeSection === 'hero' || activeSection === '') && (
          <HeroDashboard profile={profile} />
        )}

        {activeSection === 'tracks' && (
          <TopTracks tracks={profile.topTracks} />
        )}

        {activeSection === 'artists' && (
          <TopArtists artists={profile.topArtists} />
        )}

        {activeSection === 'personality' && (
          <PersonalityProfile profile={profile} />
        )}

        {activeSection === 'listening' && (
          <ListeningClock profile={profile} />
        )}

        {activeSection === 'genres' && (
          <GenreUniverse profile={profile} />
        )}

        {activeSection === 'mood' && (
          <MoodTimeline profile={profile} />
        )}

        {activeSection === 'report' && (
          <ReportCard profile={profile} />
        )}

        {activeSection === 'compare' && (
          <CompareMode 
            user1={comparisonData?.user1 || profile} 
            user2={comparisonData?.user2 || generateMockUserProfile()} 
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
  },
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
    padding: '2rem',
  },
  loginContent: {
    textAlign: 'center',
    maxWidth: '500px',
  },
  loginTitle: {
    fontSize: '3.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '1rem',
    fontFamily: 'Bebas Neue, sans-serif',
    letterSpacing: '2px',
  },
  loginSubtitle: {
    fontSize: '1.5rem',
    color: '#1db954',
    marginBottom: '1rem',
    fontFamily: 'Playfair Display, serif',
  },
  loginDesc: {
    fontSize: '1rem',
    color: '#b3b3b3',
    marginBottom: '2rem',
    fontFamily: 'DM Sans, sans-serif',
    lineHeight: '1.6',
  },
  loginButton: {
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    backgroundColor: '#1db954',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    marginBottom: '2rem',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    margin: '0 auto 2rem',
    boxShadow: '0 0 20px rgba(29, 185, 84, 0.3)',
  },
  spotifyIcon: {
    fontSize: '1.5rem',
  },
  demoText: {
    color: '#b3b3b3',
    fontSize: '0.9rem',
    marginTop: '1rem',
  },
  demoButton: {
    background: 'none',
    border: 'none',
    color: '#1db954',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
    fontSize: 'inherit',
    fontFamily: 'inherit',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
  },
  loader: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(29, 185, 84, 0.2)',
    borderTop: '4px solid #1db954',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    padding: '1rem',
    margin: '1rem',
    borderRadius: '0.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeError: {
    background: 'none',
    border: 'none',
    color: '#fca5a5',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: 0,
  },
  spotifyBadge: {
    background: 'rgba(29, 185, 84, 0.1)',
    border: '1px solid #1db954',
    color: '#1db954',
    padding: '0.75rem 1.5rem',
    margin: '1rem',
    borderRadius: '0.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'DM Sans, sans-serif',
  },
  logoutButton: {
    background: 'rgba(29, 185, 84, 0.2)',
    border: '1px solid #1db954',
    color: '#1db954',
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    marginLeft: '1rem',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'all 0.3s ease',
  },
  setupContent: {
    maxWidth: '800px',
    width: '100%',
    background: 'rgba(20, 20, 25, 0.95)',
    border: '1px solid rgba(29, 185, 84, 0.2)',
    borderRadius: '16px',
    padding: '2.5rem',
    backdropFilter: 'blur(20px)',
  },
  backButton: {
    background: 'rgba(29, 185, 84, 0.2)',
    border: '1px solid rgba(29, 185, 84, 0.4)',
    color: '#1db954',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    marginBottom: '1.5rem',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
  },
  setupBox: {
    background: 'rgba(10, 10, 10, 0.5)',
    border: '1px solid rgba(29, 185, 84, 0.1)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginTop: '1.5rem',
  },
  infoBlock: {
    background: 'rgba(29, 185, 84, 0.05)',
    border: '1px solid rgba(29, 185, 84, 0.1)',
    borderRadius: '8px',
    padding: '1rem',
  },
  infoPair: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
    flexWrap: 'wrap' as const,
    gap: '1rem',
  },
  infoLabel: {
    color: '#b3b3b3',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  infoValue: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(29, 185, 84, 0.2)',
    color: '#1db954',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
    overflowX: 'auto' as const,
    wordBreak: 'break-all' as const,
  },
  setupSteps: {
    color: '#b3b3b3',
    lineHeight: '1.8',
    paddingLeft: '1.5rem',
  },
  link: {
    color: '#1db954',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  uriList: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(29, 185, 84, 0.1)',
    borderRadius: '6px',
    padding: '1rem',
    marginTop: '0.5rem',
    maxHeight: '300px',
    overflowY: 'auto' as const,
  },
  uriItem: {
    background: 'rgba(29, 185, 84, 0.05)',
    border: '1px solid rgba(29, 185, 84, 0.1)',
    borderRadius: '4px',
    padding: '0.5rem 0.75rem',
    marginBottom: '0.5rem',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: '#1db954',
    wordBreak: 'break-all' as const,
  },
  setupButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    backgroundColor: 'transparent',
    color: '#06b6d4',
    border: '1px solid #06b6d4',
    borderRadius: '50px',
    cursor: 'pointer',
    margin: '0 auto',
    display: 'block',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'all 0.3s ease',
  },
  currentAccessInfo: {
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '2rem',
  },
  accessCode: {
    background: 'rgba(0, 0, 0, 0.3)',
    color: '#06b6d4',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    display: 'block',
    wordBreak: 'break-all' as const,
    border: '1px solid rgba(6, 182, 212, 0.2)',
  },
};

const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

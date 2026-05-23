import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { calculateCompatibility } from '../data/mockData';
import type { UserProfile } from '../data/mockData';

interface CompareModeProps {
  user1: UserProfile;
  user2: UserProfile;
}

export const CompareMode: React.FC<CompareModeProps> = ({ user1, user2 }) => {
  const compatibility = useMemo(
    () => calculateCompatibility(user1.personality, user2.personality),
    [user1.personality, user2.personality]
  );

  const comparisonData = [
    { dimension: 'Energy', user1: Math.round(user1.personality.energy), user2: Math.round(user2.personality.energy) },
    { dimension: 'Danceability', user1: Math.round(user1.personality.danceability), user2: Math.round(user2.personality.danceability) },
    { dimension: 'Acousticness', user1: Math.round(user1.personality.acousticness), user2: Math.round(user2.personality.acousticness) },
    { dimension: 'Valence', user1: Math.round(user1.personality.valence), user2: Math.round(user2.personality.valence) },
    { dimension: 'Liveness', user1: Math.round(user1.personality.liveness), user2: Math.round(user2.personality.liveness) },
    { dimension: 'Speechiness', user1: Math.round(user1.personality.speechiness), user2: Math.round(user2.personality.speechiness) },
  ];

  const sharedFavorites = useMemo(() => {
    const user1Tracks = new Set(user1.topTracks.map((t) => t.name));
    return user2.topTracks.filter((t) => user1Tracks.has(t.name));
  }, [user1, user2]);

  const sharedArtists = useMemo(() => {
    const user1Artists = new Set(user1.topArtists.map((a) => a.name));
    return user2.topArtists.filter((a) => user1Artists.has(a.name));
  }, [user1, user2]);

  return (
    <section style={styles.section} className="section fade-on-scroll">
      <div style={styles.container}>
        <h2 style={{ marginBottom: '3rem' }}>Compare Listening Taste</h2>

        {/* User Profiles Header */}
        <div style={styles.userComparisonHeader}>
          <UserProfileCard user={user1} />
          <div style={styles.compatibilityCircle}>
            <svg viewBox="0 0 200 200" style={styles.compatibilitySvg}>
              {/* Circle background */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="rgba(29, 185, 84, 0.1)"
                strokeWidth="2"
              />

              {/* Compatibility arc */}
              const angle = (compatibility / 100) * 2 * Math.PI;
              const x = 100 + 90 * Math.cos(angle - Math.PI / 2);
              const y = 100 + 90 * Math.sin(angle - Math.PI / 2);
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="url(#compatGradient)"
                strokeWidth="3"
                strokeDasharray={`${(compatibility / 100) * 565} 565`}
                transform="rotate(-90 100 100)"
              />

              <defs>
                <linearGradient id="compatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1db954" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>

              {/* Center text */}
              <text
                x="100"
                y="85"
                textAnchor="middle"
                fill="#1db954"
                fontSize="28"
                fontWeight="700"
              >
                {compatibility}%
              </text>
              <text
                x="100"
                y="115"
                textAnchor="middle"
                fill="#b3b3b3"
                fontSize="12"
              >
                Compatible
              </text>
            </svg>

            <p style={styles.compatibilityText}>
              {compatibility > 80
                ? "You're musical soulmates! 🎵"
                : compatibility > 60
                  ? 'Great taste match! 🎶'
                  : 'Interesting contrast! 🎼'}
            </p>
          </div>

          <UserProfileCard user={user2} />
        </div>

        {/* Comparison Content */}
        <div style={styles.contentGrid}>
          {/* Audio Features Comparison */}
          <div style={styles.chartContainer} className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>
              Taste Dimensions Comparison
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid stroke="rgba(29, 185, 84, 0.1)" />
                <XAxis dataKey="dimension" stroke="#b3b3b3" style={{ fontSize: '12px' }} />
                <YAxis stroke="#b3b3b3" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10, 10, 10, 0.9)',
                    border: '1px solid rgba(29, 185, 84, 0.3)',
                    borderRadius: '8px',
                  }}
                  cursor={{ fill: 'rgba(29, 185, 84, 0.1)' }}
                />
                <Legend wrapperStyle={{ color: '#b3b3b3' }} />
                <Bar dataKey="user1" fill="#1db954" name={user1.displayName} />
                <Bar dataKey="user2" fill="#06b6d4" name={user2.displayName} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Shared Favorites */}
          <div style={styles.sharedContainer}>
            <div className="card animate-in" style={styles.sharedCard}>
              <h3 style={{ marginBottom: '1rem' }}>Shared Favorite Tracks</h3>
              {sharedFavorites.length > 0 ? (
                <div style={styles.favoritesList}>
                  {sharedFavorites.slice(0, 5).map((track, idx) => (
                    <div key={idx} style={styles.favoriteItem}>
                      <span style={{ color: '#b3b3b3', fontWeight: '600' }}>
                        {track.name}
                      </span>
                      <span style={{ color: '#1db954', fontSize: '0.9rem' }}>
                        {track.artist}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#b3b3b3' }}>No shared favorite tracks.</p>
              )}
            </div>

            <div className="card animate-in" style={styles.sharedCard}>
              <h3 style={{ marginBottom: '1rem' }}>Shared Favorite Artists</h3>
              {sharedArtists.length > 0 ? (
                <div style={styles.favoritesList}>
                  {sharedArtists.slice(0, 5).map((artist, idx) => (
                    <div key={idx} style={styles.favoriteItem}>
                      <span style={{ color: '#b3b3b3', fontWeight: '600' }}>
                        {artist.name}
                      </span>
                      <span style={{ color: '#1db954', fontSize: '0.9rem' }}>
                        {artist.genre.join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#b3b3b3' }}>No shared favorite artists.</p>
              )}
            </div>
          </div>
        </div>

        {/* Divergence Map */}
        <div style={styles.divergenceSection} className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Where You Diverge</h3>
          <div style={styles.divergenceGrid}>
            {comparisonData.map((item) => {
              const diff = Math.abs(item.user1 - item.user2);
              const user1Higher = item.user1 > item.user2;
              return (
                <div key={item.dimension} style={styles.divergenceItem}>
                  <h4 style={{ marginBottom: '0.5rem' }}>{item.dimension}</h4>
                  <div style={styles.divergenceBar}>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: user1Higher ? `${50 - diff / 2}%` : '50%',
                          width: `${diff / 2}%`,
                          height: '20px',
                          background: user1Higher ? '#1db954' : '#06b6d4',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>
                  <div style={styles.divergenceLabel}>
                    <span style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
                      {user1.displayName}
                    </span>
                    <span style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
                      {user2.displayName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

interface UserProfileCardProps {
  user: UserProfile;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => (
  <div style={styles.userCard} className="card">
    <img src={user.avatar} alt={user.displayName} style={styles.userAvatar} />
    <h4 style={{ marginTop: '1rem', textAlign: 'center' }}>{user.displayName}</h4>
    <p style={{ color: '#b3b3b3', textAlign: 'center', fontSize: '0.9rem' }}>
      {user.listenerArchetype}
    </p>
    <div style={styles.userStats}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#b3b3b3', marginBottom: '0.25rem' }}>Top Artist</p>
        <p style={{ color: '#1db954', fontWeight: '600', fontSize: '0.9rem' }}>
          {user.topArtists[0]?.name}
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#b3b3b3', marginBottom: '0.25rem' }}>Top Track</p>
        <p style={{ color: '#1db954', fontWeight: '600', fontSize: '0.9rem' }}>
          {user.topTracks[0]?.name}
        </p>
      </div>
    </div>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  section: {
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 100%)',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 2rem',
  },
  userComparisonHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '2rem',
    alignItems: 'center',
    marginBottom: '3rem',
  },
  userCard: {
    textAlign: 'center',
    padding: '2rem',
  },
  userAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '3px solid #1db954',
    margin: '0 auto',
  },
  userStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(29, 185, 84, 0.2)',
  },
  compatibilityCircle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  compatibilitySvg: {
    width: '200px',
    height: '200px',
  },
  compatibilityText: {
    color: '#1db954',
    fontWeight: '600',
    textAlign: 'center',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginBottom: '2rem',
  },
  chartContainer: {},
  sharedContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  sharedCard: {
    padding: '1.5rem',
  },
  favoritesList: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
  },
  favoriteItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid rgba(29, 185, 84, 0.1)',
  },
  divergenceSection: {},
  divergenceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
  },
  divergenceItem: {},
  divergenceBar: {
    width: '100%',
    height: '30px',
    background: 'rgba(29, 185, 84, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    margin: '0.5rem 0',
  },
  divergenceLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
  },
};

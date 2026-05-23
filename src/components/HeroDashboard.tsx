import React, { useEffect, useState } from 'react';
import type { UserProfile } from '../data/mockData';

interface HeroDashboardProps {
  profile: UserProfile;
}

export const HeroDashboard: React.FC<HeroDashboardProps> = ({ profile }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setProgress((prev) => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <section style={styles.section} className="section">
      <div style={styles.container}>
        {/* Hero Header */}
        <div
          style={{
            ...styles.heroHeader,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease',
          }}
        >
          <div style={styles.greeting}>
            <div style={styles.avatarContainer}>
              <img
                src={profile.avatar}
                alt={profile.displayName}
                style={styles.avatar}
              />
              <div style={styles.auraRing}></div>
            </div>
            <div>
              <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>
                Hello, <span style={{ color: '#1db954' }}>{profile.displayName.split(' ')[0]}</span>
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#b3b3b3' }}>
                {profile.listenerArchetype}
              </p>
              <p style={{ marginTop: '0.5rem', maxWidth: '500px' }}>
                {profile.archetypeDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Currently Playing Card */}
        <div style={styles.gridContainer} className="mt-4">
          <div style={styles.currentlyPlayingCard} className="card animate-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>
              Now Playing
            </h3>
            {profile.currentlyPlaying ? (
              <>
                <img
                  src={profile.currentlyPlaying.albumArt}
                  alt="Album Art"
                  style={styles.albumArt}
                />
                <h4 style={{ marginTop: '1.5rem' }}>
                  {profile.currentlyPlaying.name}
                </h4>
                <p style={{ color: '#b3b3b3', marginBottom: '1rem' }}>
                  {profile.currentlyPlaying.artist}
                </p>

                {/* Progress Bar */}
                <div style={styles.progressContainer}>
                  <div
                    style={{
                      ...styles.progressBar,
                      width: `${progress}%`,
                    }}
                  />
                </div>
                <div style={styles.timeInfo}>
                  <span>{Math.floor((progress / 100) * profile.currentlyPlaying.duration)}</span>
                  <span>{profile.currentlyPlaying.duration}s</span>
                </div>

                {/* Audio Features */}
                <div style={styles.features}>
                  <div style={styles.featureItem}>
                    <span>BPM</span>
                    <span style={{ color: '#1db954', fontWeight: '700' }}>
                      {profile.currentlyPlaying.audioFeatures.bpm}
                    </span>
                  </div>
                  <div style={styles.featureItem}>
                    <span>Energy</span>
                    <span style={{ color: '#f59e0b', fontWeight: '700' }}>
                      {Math.round(profile.currentlyPlaying.audioFeatures.energy)}%
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

        {/* Listening Streak Tracker */}
        <div style={styles.streakSection} className="card animate-in mt-4">
          <h3 style={{ marginBottom: '1.5rem' }}>Listening Streak</h3>
          <div style={styles.streakVisual}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.streakDay,
                  background:
                    i < profile.listeningStreak % 30
                      ? '#1db954'
                      : 'rgba(29, 185, 84, 0.1)',
                }}
                title={`Day ${i + 1}`}
              />
            ))}
          </div>
          <p style={{ marginTop: '1rem', color: '#b3b3b3' }}>
            You've been listening for <span style={{ color: '#1db954', fontWeight: '700' }}>
              {profile.listeningStreak} days
            </span> in a row!
          </p>
        </div>
      </div>
    </section>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => (
  <div style={{ ...styles.statCard, borderColor: color }} className="card">
    <p style={{ color: '#b3b3b3', marginBottom: '0.5rem' }}>{label}</p>
    <h3 style={{ color, fontSize: '2.5rem' }}>{value}</h3>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  section: {
    paddingTop: '8rem',
    background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.05) 0%, transparent 100%)',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 2rem',
  },
  heroHeader: {
    marginBottom: '3rem',
  },
  greeting: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  avatarContainer: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '3px solid #1db954',
    display: 'block',
  },
  auraRing: {
    position: 'absolute',
    top: '-8px',
    left: '-8px',
    right: '-8px',
    bottom: '-8px',
    borderRadius: '50%',
    border: '2px solid #1db954',
    animation: 'pulse 2s ease-in-out infinite',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '2rem',
  },
  currentlyPlayingCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  albumArt: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '12px',
    objectFit: 'cover',
  },
  progressContainer: {
    width: '100%',
    height: '6px',
    background: 'rgba(29, 185, 84, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '1rem',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #1db954, #06b6d4)',
    transition: 'width 0.1s linear',
  },
  timeInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: '#b3b3b3',
    marginTop: '0.5rem',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid rgba(29, 185, 84, 0.2)',
  },
  featureItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  statCard: {
    borderLeft: '3px solid',
    padding: '2rem',
  },
  streakSection: {
    maxWidth: '800px',
  },
  streakVisual: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(25px, 1fr))',
    gap: '8px',
  },
  streakDay: {
    aspectRatio: '1',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

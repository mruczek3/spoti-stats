import React from 'react';
import type { Artist } from '../data/mockData';

interface TopArtistsProps {
  artists: Artist[];
}

export const TopArtists: React.FC<TopArtistsProps> = ({ artists }) => {
  return (
    <section style={styles.section} className="section fade-on-scroll">
      <div style={styles.container}>
        <h2 style={{ marginBottom: '3rem' }}>Top Artists</h2>

        <div style={styles.artistsGrid}>
          {artists.slice(0, 12).map((artist, idx) => (
            <ArtistCard key={artist.id} artist={artist} rank={idx + 1} />
          ))}
        </div>
      </div>
    </section>
  );
};

interface ArtistCardProps {
  artist: Artist;
  rank: number;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, rank }) => {
  const years = Math.floor(
    (Date.now() - artist.firstListenedAt.getTime()) / (365 * 24 * 60 * 60 * 1000)
  );
  
  // Calculate compatibility percentage based on various metrics
  const compatibility = Math.round((artist.loyaltyScore + artist.popularity) / 2);

  return (
    <div
      style={{
        ...styles.artistCard,
        backgroundImage: `linear-gradient(135deg, rgba(10,10,10,0.85), rgba(10,10,10,0.4)), url(${artist.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      className="card animate-in"
    >
      <div style={styles.cardContent}>
        {/* Rank Badge */}
        <div style={styles.rankBadge}>{rank}</div>

        {/* Compatibility Badge */}
        <div style={styles.compatibilityBadge}>
          {compatibility}% Match
        </div>

        {/* Artist Info */}
        <div style={styles.artistInfo}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>{artist.name}</h3>

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
              value={years > 0 ? `${years}y` : '<1y'}
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
            <label style={{ fontSize: '0.75rem', color: '#b3b3b3', marginBottom: '0.25rem', display: 'block' }}>
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

interface StatBlockProps {
  label: string;
  value: string;
  color: string;
}

const StatBlock: React.FC<StatBlockProps> = ({ label, value, color }) => (
  <div style={styles.statBlock}>
    <span style={{ fontSize: '0.75rem', color: '#b3b3b3' }}>{label}</span>
    <span style={{ color, fontWeight: '700', fontSize: '1.1rem' }}>
      {value}
    </span>
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
  artistsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  artistCard: {
    position: 'relative',
    minHeight: '380px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: '16px',
    border: '1px solid rgba(29, 185, 84, 0.15)',
    backdropFilter: 'blur(20px)',
    transition: 'all 0.3s ease',
  },
  cardContent: {
    position: 'relative',
    zIndex: 2,
    padding: '1.5rem',
    background: 'linear-gradient(180deg, transparent, rgba(10, 10, 10, 0.95))',
  },
  rankBadge: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    background: 'rgba(29, 185, 84, 0.9)',
    color: '#000',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    fontWeight: '700',
    fontSize: '1.1rem',
    zIndex: 3,
  },
  compatibilityBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'rgba(6, 182, 212, 0.9)',
    color: '#000',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '700',
    zIndex: 3,
  },
  artistInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  genrePills: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  genrePill: {
    fontSize: '0.75rem',
    padding: '0.4rem 0.7rem',
    background: 'rgba(29, 185, 84, 0.2)',
    border: '1px solid rgba(29, 185, 84, 0.3)',
    color: '#1db954',
    borderRadius: '16px',
    fontWeight: '600',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.75rem',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(29, 185, 84, 0.2)',
  },
  statBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    textAlign: 'center' as const,
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  progressBar: {
    width: '100%',
    height: '6px',
    background: 'rgba(29, 185, 84, 0.2)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #1db954, #06b6d4)',
    transition: 'width 0.6s ease',
  },
};

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import type { UserProfile } from '../data/mockData';

interface ReportCardProps {
  profile: UserProfile;
}

export const ReportCard: React.FC<ReportCardProps> = ({ profile }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'minimal' | 'detailed' | 'artistic'>('detailed');
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `spotify-stats-${new Date().getTime()}.png`;
      link.click();
    } catch (error) {
      console.error('Failed to export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          alert('Card copied to clipboard!');
        }
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <section style={styles.section} className="section fade-on-scroll">
      <div style={styles.container}>
        <h2 style={{ marginBottom: '3rem' }}>Your Listening Report Card</h2>

        {/* Template Selector */}
        <div style={styles.templateSelector}>
          {(['minimal', 'detailed', 'artistic'] as const).map((template) => (
            <button
              key={template}
              onClick={() => setSelectedTemplate(template)}
              style={{
                ...styles.templateBtn,
                ...(selectedTemplate === template
                  ? styles.templateBtnActive
                  : {}),
              }}
            >
              {template.charAt(0).toUpperCase() + template.slice(1)}
            </button>
          ))}
        </div>

        <div style={styles.contentGrid}>
          {/* Card Preview */}
          <div style={styles.previewContainer}>
            <div
              ref={cardRef}
              style={styles[`card_${selectedTemplate}` as keyof typeof styles] as React.CSSProperties}
            >
              {selectedTemplate === 'minimal' && (
                <MinimalCard profile={profile} />
              )}
              {selectedTemplate === 'detailed' && (
                <DetailedCard profile={profile} />
              )}
              {selectedTemplate === 'artistic' && (
                <ArtisticCard profile={profile} />
              )}
            </div>
          </div>

          {/* Export Options */}
          <div style={styles.exportContainer}>
            <h3 style={{ marginBottom: '1.5rem' }}>Export Options</h3>

            <button
              onClick={handleExport}
              disabled={isExporting}
              style={{
                ...styles.exportBtn,
                opacity: isExporting ? 0.5 : 1,
              }}
              className="btn btn-primary"
            >
              {isExporting ? 'Exporting...' : '⬇️ Download as PNG'}
            </button>

            <button
              onClick={handleCopy}
              style={styles.exportBtn}
              className="btn btn-secondary"
            >
              📋 Copy to Clipboard
            </button>

            <div style={styles.shareInfo} className="card">
              <h4 style={{ marginBottom: '1rem' }}>Share Your Stats</h4>
              <p style={{ color: '#b3b3b3', marginBottom: '1rem' }}>
                Export your report card and share it on social media to show
                off your listening profile!
              </p>
              <div style={styles.socialLinks}>
                <a href="#" style={styles.socialLink}>
                  Twitter
                </a>
                <a href="#" style={styles.socialLink}>
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const MinimalCard: React.FC<{ profile: UserProfile }> = ({ profile }) => (
  <div style={styles.cardContent}>
    <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#1db954' }}>
      MY 2024
    </h2>
    <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
      LISTENING REPORT
    </h2>

    <div style={styles.statRow}>
      <span>Top Track</span>
      <span style={{ color: '#1db954', fontWeight: '700' }}>
        {profile.topTracks[0]?.name}
      </span>
    </div>

    <div style={styles.statRow}>
      <span>Top Artist</span>
      <span style={{ color: '#1db954', fontWeight: '700' }}>
        {profile.topArtists[0]?.name}
      </span>
    </div>

    <div style={styles.statRow}>
      <span>Total Listening</span>
      <span style={{ color: '#1db954', fontWeight: '700' }}>
        {Math.round(profile.totalMinutesListened / 60 / 24)} days
      </span>
    </div>

    <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(29, 185, 84, 0.3)' }}>
      <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
        You are a {profile.listenerArchetype}
      </p>
    </div>
  </div>
);

const DetailedCard: React.FC<{ profile: UserProfile }> = ({ profile }) => (
  <div style={styles.cardContent}>
    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
      <h2 style={{ marginBottom: '0.5rem', color: '#1db954' }}>
        {profile.displayName}'s
      </h2>
      <h2 style={{ marginBottom: '1rem' }}>LISTENING REPORT 2024</h2>
      <p style={{ color: '#b3b3b3' }}>{profile.listenerArchetype}</p>
    </div>

    <div style={styles.detailedStats}>
      <StatCard
        label="Total Minutes"
        value={profile.totalMinutesListened.toLocaleString()}
      />
      <StatCard
        label="Artists Discovered"
        value={profile.artistsDiscovered.toString()}
      />
      <StatCard
        label="Listening Streak"
        value={`${profile.listeningStreak}d`}
      />
    </div>

    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(29, 185, 84, 0.3)' }}>
      <h4 style={{ marginBottom: '1rem' }}>Top 3 Tracks</h4>
      {profile.topTracks.slice(0, 3).map((track, idx) => (
        <div key={idx} style={styles.trackItem}>
          <span>{idx + 1}.</span>
          <span>{track.name}</span>
          <span style={{ color: '#b3b3b3' }}>{track.artist}</span>
        </div>
      ))}
    </div>

    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(29, 185, 84, 0.3)', textAlign: 'center' }}>
      <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
        Generated by Spotify Stats | {new Date().getFullYear()}
      </p>
    </div>
  </div>
);

const ArtisticCard: React.FC<{ profile: UserProfile }> = ({ profile }) => (
  <div style={{...styles.cardContent, background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.1), rgba(6, 182, 212, 0.1))'}}>
    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</div>
      <h1 style={{ color: '#1db954', marginBottom: '0.5rem' }}>
        {profile.listenerArchetype}
      </h1>
      <p style={{ color: '#b3b3b3' }}>Your Unique Listening Identity</p>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#b3b3b3', marginBottom: '0.5rem' }}>FAVORITE TRACK</p>
        <h4 style={{ color: '#1db954', marginBottom: '0.25rem' }}>
          {profile.topTracks[0]?.name}
        </h4>
        <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
          by {profile.topTracks[0]?.artist}
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#b3b3b3', marginBottom: '0.5rem' }}>FAVORITE ARTIST</p>
        <h4 style={{ color: '#1db954', marginBottom: '0.25rem' }}>
          {profile.topArtists[0]?.name}
        </h4>
        <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
          {profile.topArtists[0]?.trackCount} tracks
        </p>
      </div>
    </div>

    <div style={{ background: 'rgba(29, 185, 84, 0.1)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
      <p style={{ color: '#b3b3b3', fontSize: '0.95rem', fontStyle: 'italic' }}>
        "{profile.archetypeDescription}"
      </p>
    </div>

    <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(29, 185, 84, 0.3)' }}>
      <p style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
        {Math.round(profile.totalMinutesListened / 60)} hrs | {profile.artistsDiscovered} artists | {profile.listeningStreak} day streak
      </p>
    </div>
  </div>
);

interface StatCardProps {
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <div style={styles.detailedStatCard}>
    <p style={{ color: '#b3b3b3', marginBottom: '0.5rem' }}>{label}</p>
    <h3 style={{ color: '#1db954' }}>{value}</h3>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  section: {
    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, transparent 100%)',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 2rem',
  },
  templateSelector: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
  },
  templateBtn: {
    padding: '0.75rem 1.5rem',
    background: 'rgba(29, 185, 84, 0.1)',
    border: '1px solid rgba(29, 185, 84, 0.2)',
    color: '#b3b3b3',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'DM Sans', sans-serif",
  },
  templateBtnActive: {
    background: '#1db954',
    color: '#000',
    borderColor: '#1db954',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
  },
  previewContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  card_minimal: {
    width: '500px',
    height: '600px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    border: '2px solid #1db954',
    borderRadius: '20px',
    padding: '3rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  card_detailed: {
    width: '500px',
    height: '600px',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    border: '2px solid #1db954',
    borderRadius: '20px',
    padding: '3rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  card_artistic: {
    width: '500px',
    height: '600px',
    border: '2px solid #1db954',
    borderRadius: '20px',
    padding: '3rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  detailedStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '2rem',
  },
  detailedStatCard: {
    textAlign: 'center',
  },
  trackItem: {
    display: 'grid',
    gridTemplateColumns: '30px 1fr auto',
    gap: '1rem',
    paddingBottom: '0.75rem',
    color: '#b3b3b3',
    fontSize: '0.9rem',
    borderBottom: '1px solid rgba(29, 185, 84, 0.1)',
    marginBottom: '0.75rem',
  },
  exportContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  exportBtn: {
    width: '100%',
  },
  shareInfo: {
    marginTop: '2rem',
  },
  socialLinks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
  },
  socialLink: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    background: 'rgba(29, 185, 84, 0.1)',
    border: '1px solid rgba(29, 185, 84, 0.3)',
    color: '#1db954',
    borderRadius: '8px',
    textDecoration: 'none',
    textAlign: 'center',
    transition: 'all 0.3s ease',
  },
};

import React, { useEffect, useRef, useState } from 'react';
import type { UserProfile } from '../data/mockData';

interface GenreUniverseProps {
  profile: UserProfile;
}

export const GenreUniverse: React.FC<GenreUniverseProps> = ({ profile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const bubblePositionsRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map());

  const genres = Array.from(profile.genres.entries()).map(([name, data]) => ({
    name,
    size: Math.sqrt(data.hours) * 2, // Size based on hours
    hours: data.hours,
    count: data.count,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Initialize positions if needed
    if (bubblePositionsRef.current.size === 0) {
      genres.forEach((genre) => {
        bubblePositionsRef.current.set(genre.name, {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
        });
      });
    }

    const animate = () => {
      // Clear canvas with gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(10, 10, 10, 0)');
      gradient.addColorStop(1, 'rgba(29, 185, 84, 0.02)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Update positions (simple physics)
      genres.forEach((genre) => {
        const pos = bubblePositionsRef.current.get(genre.name)!;

        // Add some noise for organic movement
        pos.vx += (Math.random() - 0.5) * 0.05;
        pos.vy += (Math.random() - 0.5) * 0.05;

        // Damping
        pos.vx *= 0.99;
        pos.vy *= 0.99;

        // Update position
        pos.x += pos.vx;
        pos.y += pos.vy;

        // Bounce off walls
        if (pos.x - genre.size < 0 || pos.x + genre.size > width) {
          pos.vx *= -1;
          pos.x = Math.max(genre.size, Math.min(width - genre.size, pos.x));
        }
        if (pos.y - genre.size < 0 || pos.y + genre.size > height) {
          pos.vy *= -1;
          pos.y = Math.max(genre.size, Math.min(height - genre.size, pos.y));
        }

        // Repel from other bubbles
        genres.forEach((otherGenre) => {
          if (genre.name === otherGenre.name) return;
          const otherPos = bubblePositionsRef.current.get(otherGenre.name)!;
          const dx = otherPos.x - pos.x;
          const dy = otherPos.y - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = genre.size + otherGenre.size + 10;

          if (distance < minDistance) {
            const angle = Math.atan2(dy, dx);
            const force = (minDistance - distance) * 0.1;
            pos.vx -= Math.cos(angle) * force;
            pos.vy -= Math.sin(angle) * force;
          }
        });
      });

      // Draw bubbles
      genres.forEach((genre) => {
        const pos = bubblePositionsRef.current.get(genre.name)!;
        const isSelected = selectedGenre === genre.name;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(pos.x + 4, pos.y + 4, genre.size, 0, Math.PI * 2);
        ctx.fill();

        // Bubble
        const bubbleGradient = ctx.createRadialGradient(
          pos.x - genre.size / 3,
          pos.y - genre.size / 3,
          0,
          pos.x,
          pos.y,
          genre.size
        );
        bubbleGradient.addColorStop(
          0,
          isSelected ? 'rgba(29, 185, 84, 0.8)' : 'rgba(29, 185, 84, 0.4)'
        );
        bubbleGradient.addColorStop(
          1,
          isSelected ? 'rgba(6, 182, 212, 0.6)' : 'rgba(6, 182, 212, 0.2)'
        );
        ctx.fillStyle = bubbleGradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, genre.size, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = isSelected
          ? 'rgba(29, 185, 84, 0.8)'
          : 'rgba(29, 185, 84, 0.3)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = `${isSelected ? 'bold' : 'normal'} 14px 'DM Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Truncate text if needed
        let text = genre.name;
        while (
          ctx.measureText(text).width > genre.size * 1.5 &&
          text.length > 1
        ) {
          text = text.slice(0, -1);
        }
        ctx.fillText(text, pos.x, pos.y);

        // Draw hours below
        if (isSelected) {
          ctx.font = '12px "DM Sans", sans-serif';
          ctx.fillStyle = '#b3b3b3';
          ctx.fillText(`${genre.hours}h`, pos.x, pos.y + 20);
        }
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [genres, selectedGenre]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check which bubble was clicked
    for (const genre of genres) {
      const pos = bubblePositionsRef.current.get(genre.name)!;
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < genre.size) {
        setSelectedGenre(selectedGenre === genre.name ? null : genre.name);
        return;
      }
    }
  };

  const selectedGenreData = selectedGenre
    ? genres.find((g) => g.name === selectedGenre)
    : null;

  return (
    <section style={styles.section} className="section fade-on-scroll">
      <div style={styles.container}>
        <h2 style={{ marginBottom: '3rem' }}>Genre Universe</h2>

        <div style={styles.contentGrid}>
          <div style={styles.canvasContainer} className="card">
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              onClick={handleCanvasClick}
              style={styles.canvas}
            />
            <p style={{ marginTop: '1rem', textAlign: 'center', color: '#b3b3b3' }}>
              Click bubbles to explore
            </p>
          </div>

          {selectedGenreData ? (
            <div style={styles.detailsContainer} className="card animate-in">
              <h3 style={{ marginBottom: '1.5rem' }}>{selectedGenreData.name}</h3>

              <div style={styles.statsGrid}>
                <StatItem
                  label="Total Hours"
                  value={selectedGenreData.hours.toString()}
                  color="#1db954"
                />
                <StatItem
                  label="Track Count"
                  value={selectedGenreData.count.toString()}
                  color="#f59e0b"
                />
                <StatItem
                  label="Avg Per Track"
                  value={Math.round(
                    selectedGenreData.hours / selectedGenreData.count
                  ).toString()}
                  color="#06b6d4"
                />
              </div>

              <div style={styles.progressSection}>
                <label style={{ color: '#b3b3b3', marginBottom: '0.5rem', display: 'block' }}>
                  Share of Listening Time
                </label>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${Math.min(
                        100,
                        (selectedGenreData.hours /
                          Array.from(profile.genres.values()).reduce(
                            (sum, g) => sum + g.hours,
                            0
                          )) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => setSelectedGenre(null)}
                style={styles.closeBtn}
                className="btn btn-secondary btn-small"
              >
                Close
              </button>
            </div>
          ) : (
            <div style={styles.infoContainer} className="card animate-in">
              <h3 style={{ marginBottom: '1rem' }}>Your Genre Profile</h3>
              <p style={{ marginBottom: '1.5rem', color: '#b3b3b3' }}>
                Click on any bubble to explore a genre in detail. Bubble size
                represents your listening time.
              </p>
              <div style={styles.genreList}>
                {genres.map((genre, idx) => (
                  <GenreItem key={genre.name} genre={genre} index={idx} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

interface StatItemProps {
  label: string;
  value: string;
  color: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color }) => (
  <div style={styles.statItem}>
    <p style={{ color: '#b3b3b3', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
      {label}
    </p>
    <h4 style={{ color, fontSize: '1.8rem' }}>{value}</h4>
  </div>
);

interface GenreItemProps {
  genre: { name: string; hours: number; count: number; size: number };
  index: number;
}

const GenreItem: React.FC<GenreItemProps> = ({ genre, index }) => (
  <div
    style={{
      ...styles.genreItem,
      animation: 'fadeInUp 0.6s ease-out forwards',
      animationDelay: `${index * 0.05}s`,
      opacity: 0,
    }}
  >
    <div style={styles.genreItemHeader}>
      <h4>{genre.name}</h4>
      <span style={{ color: '#1db954', fontWeight: '700' }}>
        {genre.hours}h
      </span>
    </div>
    <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
      {genre.count} tracks
    </p>
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
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    alignItems: 'start',
  },
  canvasContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  canvas: {
    width: '100%',
    height: 'auto',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  detailsContainer: {},
  infoContainer: {},
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '2rem',
    paddingBottom: '2rem',
    borderBottom: '1px solid rgba(29, 185, 84, 0.2)',
  },
  statItem: {
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: '2rem',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(29, 185, 84, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #1db954, #06b6d4)',
    transition: 'width 0.6s ease',
  },
  closeBtn: {
    width: '100%',
  },
  genreList: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
  },
  genreItem: {
    padding: '1rem',
    background: 'rgba(29, 185, 84, 0.05)',
    borderRadius: '8px',
    borderLeft: '3px solid #1db954',
  },
  genreItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
};

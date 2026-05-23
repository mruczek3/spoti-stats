import React, { useMemo } from 'react';
import type { UserProfile } from '../data/mockData';

interface ListeningClockProps {
  profile: UserProfile;
}

export const ListeningClock: React.FC<ListeningClockProps> = ({ profile }) => {
  const maxCount = useMemo(
    () => Math.max(...profile.listeningHistory.map((h) => h.count)),
    [profile.listeningHistory]
  );

  const peakHour = useMemo(
    () =>
      profile.listeningHistory.reduce((max, curr) =>
        curr.count > max.count ? curr : max
      ),
    [profile.listeningHistory]
  );

  // Generate heatmap data for weekly view
  const heatmapData = useMemo(() => {
    const data = [];
    for (let week = 0; week < 52; week++) {
      for (let day = 0; day < 7; day++) {
        data.push({
          week,
          day,
          value: profile.weeklyHeatmap[week]?.[day] || 0,
        });
      }
    }
    return data;
  }, [profile.weeklyHeatmap]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getHeatmapColor = (value: number, max: number) => {
    if (value === 0) return 'rgba(29, 185, 84, 0.05)';
    const intensity = value / max;
    if (intensity < 0.25) return 'rgba(29, 185, 84, 0.2)';
    if (intensity < 0.5) return 'rgba(29, 185, 84, 0.4)';
    if (intensity < 0.75) return 'rgba(29, 185, 84, 0.6)';
    return 'rgba(29, 185, 84, 0.9)';
  };

  const maxHeatmapValue = Math.max(...heatmapData.map((h) => h.value));

  return (
    <section style={styles.section} className="section fade-on-scroll">
      <div style={styles.container}>
        <h2 style={{ marginBottom: '3rem' }}>Listening Patterns</h2>

        <div style={styles.contentGrid}>
          {/* 24-Hour Clock */}
          <div style={styles.clockSection} className="card">
            <h3 style={{ marginBottom: '2rem' }}>Listening Clock (24h)</h3>
            <div style={styles.clockContainer}>
              <svg viewBox="0 0 300 300" style={styles.clockSvg}>
                {/* Background circle */}
                <circle
                  cx="150"
                  cy="150"
                  r="140"
                  fill="none"
                  stroke="rgba(29, 185, 84, 0.1)"
                  strokeWidth="1"
                />

                {/* Grid lines */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
                  const x1 = 150 + Math.cos(angle) * 120;
                  const y1 = 150 + Math.sin(angle) * 120;
                  const x2 = 150 + Math.cos(angle) * 135;
                  const y2 = 150 + Math.sin(angle) * 135;
                  return (
                    <line
                      key={`line-${i}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(29, 185, 84, 0.2)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Listening segments */}
                {profile.listeningHistory.map((hour) => {
                  const startAngle = (hour.hour / 24) * Math.PI * 2 - Math.PI / 2;
                  const endAngle = ((hour.hour + 1) / 24) * Math.PI * 2 - Math.PI / 2;
                  const intensity = hour.count / maxCount;
                  const radius = 80 + intensity * 50;

                  const x1 = 150 + Math.cos(startAngle) * 80;
                  const y1 = 150 + Math.sin(startAngle) * 80;
                  const x2 = 150 + Math.cos(startAngle) * radius;
                  const y2 = 150 + Math.sin(startAngle) * radius;
                  const x3 = 150 + Math.cos(endAngle) * radius;
                  const y3 = 150 + Math.sin(endAngle) * radius;
                  const x4 = 150 + Math.cos(endAngle) * 80;
                  const y4 = 150 + Math.sin(endAngle) * 80;

                  return (
                    <path
                      key={`segment-${hour.hour}`}
                      d={`M ${x1} ${y1} L ${x2} ${y2} A ${radius} ${radius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A 80 80 0 0 0 ${x1} ${y1}`}
                      fill={`rgba(29, 185, 84, ${0.2 + intensity * 0.6})`}
                      stroke="rgba(29, 185, 84, 0.3)"
                      strokeWidth="0.5"
                    />
                  );
                })}

                {/* Hour labels */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
                  const x = 150 + Math.cos(angle) * 160;
                  const y = 150 + Math.sin(angle) * 160;
                  return (
                    <text
                      key={`label-${i}`}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#b3b3b3"
                      fontSize="11"
                    >
                      {i}
                    </text>
                  );
                })}

                {/* Center */}
                <circle cx="150" cy="150" r="10" fill="#1db954" />
              </svg>
            </div>

            {/* Peak Hour Info */}
            <div style={styles.peakHourCard} className="card">
              <p style={{ color: '#b3b3b3', marginBottom: '0.5rem' }}>Peak Hour</p>
              <h3 style={{ fontSize: '2rem', color: '#1db954' }}>
                {peakHour.hour}:00
              </h3>
              <p style={{ color: '#b3b3b3', marginTop: '0.5rem' }}>
                {peakHour.count} songs listened
              </p>
            </div>
          </div>

          {/* Weekly Heatmap */}
          <div style={styles.heatmapSection} className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Weekly Heatmap</h3>
            <div style={styles.heatmapContainer}>
              {/* Days header */}
              <div style={styles.heatmapHeader}>
                <div style={styles.emptyCell} />
                {dayLabels.map((day) => (
                  <div key={day} style={styles.dayLabel}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              {Array.from({ length: 52 }).map((_, weekIdx) => (
                <div key={`week-${weekIdx}`} style={styles.heatmapRow}>
                  {weekIdx % 4 === 0 && (
                    <div style={styles.monthLabel}>
                      {monthLabels[Math.floor(weekIdx / 4.33)]}
                    </div>
                  )}
                  {weekIdx % 4 !== 0 && <div style={styles.emptyCell} />}

                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    const dataIdx = weekIdx * 7 + dayIdx;
                    const data = heatmapData[dataIdx];
                    return (
                      <div
                        key={`${weekIdx}-${dayIdx}`}
                        style={{
                          ...styles.heatmapCell,
                          background: getHeatmapColor(
                            data?.value || 0,
                            maxHeatmapValue
                          ),
                        }}
                        title={`Week ${weekIdx + 1}, ${dayLabels[dayIdx]}: ${data?.value || 0} plays`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={styles.heatmapLegend}>
              <span style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
                Less
              </span>
              {[0.2, 0.4, 0.6, 0.9].map((intensity, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '12px',
                    height: '12px',
                    background: `rgba(29, 185, 84, ${intensity})`,
                    borderRadius: '2px',
                  }}
                />
              ))}
              <span style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
                More
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const styles: Record<string, React.CSSProperties> = {
  section: {
    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, transparent 100%)',
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
  },
  clockSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  clockContainer: {
    width: '100%',
    maxWidth: '400px',
  },
  clockSvg: {
    width: '100%',
    height: 'auto',
  },
  peakHourCard: {
    textAlign: 'center',
    marginTop: '2rem',
    padding: '1.5rem',
  },
  heatmapSection: {},
  heatmapContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
    gap: '2px',
    marginBottom: '1rem',
  },
  heatmapHeader: {
    display: 'contents',
  },
  emptyCell: {
    display: 'contents',
  },
  dayLabel: {
    textAlign: 'center',
    fontSize: '0.8rem',
    color: '#b3b3b3',
    padding: '0.5rem',
  },
  monthLabel: {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: '#b3b3b3',
    padding: '0.5rem',
    fontWeight: '600',
  },
  heatmapRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(30px, auto) repeat(7, 1fr)',
    gap: '2px',
    marginBottom: '2px',
  },
  heatmapCell: {
    aspectRatio: '1',
    borderRadius: '3px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(29, 185, 84, 0.1)',
  },
  heatmapLegend: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    justifyContent: 'flex-end',
    marginTop: '1rem',
  },
};

import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { UserProfile } from '../data/mockData';

interface MoodTimelineProps {
  profile: UserProfile;
}

export const MoodTimeline: React.FC<MoodTimelineProps> = ({ profile }) => {
  const data = profile.moodTimeline;

  const moodShifts = [];
  for (let i = 1; i < data.length; i++) {
    const diff = Math.abs(data[i].valence - data[i - 1].valence);
    if (diff > 15) {
      moodShifts.push({
        month: data[i].month,
        prevMonth: data[i - 1].month,
        change: data[i].valence - data[i - 1].valence,
        magnitude: diff,
      });
    }
  }

  const avgValence =
    data.reduce((sum, d) => sum + d.valence, 0) / data.length;
  const maxValence = Math.max(...data.map((d) => d.valence));
  const minValence = Math.min(...data.map((d) => d.valence));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={styles.tooltip}>
          <p style={{ color: '#1db954', fontWeight: '700' }}>
            {payload[0].payload.month}
          </p>
          <p style={{ color: '#b3b3b3' }}>
            Valence: {Math.round(payload[0].value)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section style={styles.section} className="section fade-on-scroll">
      <div style={styles.container}>
        <h2 style={{ marginBottom: '3rem' }}>Mood Timeline</h2>

        <div style={styles.contentGrid}>
          {/* Chart */}
          <div style={styles.chartContainer} className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Your 12-Month Mood Journey</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1db954" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1db954" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(29, 185, 84, 0.1)" strokeDasharray="3" />
                <XAxis
                  dataKey="month"
                  stroke="#b3b3b3"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#b3b3b3"
                  domain={[0, 100]}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="valence"
                  stroke="#1db954"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValence)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats & Insights */}
          <div>
            {/* Key Stats */}
            <div style={styles.statsCard} className="card animate-in">
              <h3 style={{ marginBottom: '1.5rem' }}>Key Insights</h3>

              <div style={styles.statBlock}>
                <p style={{ color: '#b3b3b3', marginBottom: '0.5rem' }}>
                  Average Valence (Happiness)
                </p>
                <h4 style={{ color: '#1db954', fontSize: '2rem' }}>
                  {Math.round(avgValence)}%
                </h4>
              </div>

              <div style={{ ...styles.statBlock, borderTop: '1px solid rgba(29, 185, 84, 0.2)', paddingTop: '1.5rem' }}>
                <p style={{ color: '#b3b3b3', marginBottom: '0.5rem' }}>
                  Happiest Period
                </p>
                <h4 style={{ color: '#1db954', fontSize: '1.3rem' }}>
                  {data[data.findIndex((d) => d.valence === maxValence)].month}
                  <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>
                    {Math.round(maxValence)}%
                  </span>
                </h4>
              </div>

              <div style={{ ...styles.statBlock, borderTop: '1px solid rgba(29, 185, 84, 0.2)', paddingTop: '1.5rem' }}>
                <p style={{ color: '#b3b3b3', marginBottom: '0.5rem' }}>
                  Most Melancholic Period
                </p>
                <h4 style={{ color: '#f59e0b', fontSize: '1.3rem' }}>
                  {data[data.findIndex((d) => d.valence === minValence)].month}
                  <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>
                    {Math.round(minValence)}%
                  </span>
                </h4>
              </div>
            </div>

            {/* Mood Shifts */}
            <div style={styles.shiftsCard} className="card animate-in">
              <h3 style={{ marginBottom: '1.5rem' }}>Major Mood Shifts</h3>

              {moodShifts.length > 0 ? (
                <div style={styles.shiftsList}>
                  {moodShifts.map((shift, idx) => (
                    <MoodShiftItem key={idx} shift={shift} index={idx} />
                  ))}
                </div>
              ) : (
                <p style={{ color: '#b3b3b3' }}>
                  Your mood remained fairly consistent throughout the year.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface MoodShiftItemProps {
  shift: {
    month: string;
    prevMonth: string;
    change: number;
    magnitude: number;
  };
  index: number;
}

const MoodShiftItem: React.FC<MoodShiftItemProps> = ({ shift, index }) => (
  <div
    style={{
      ...styles.shiftItem,
      animation: 'fadeInUp 0.6s ease-out forwards',
      animationDelay: `${index * 0.1}s`,
      opacity: 0,
    }}
  >
    <div style={styles.shiftHeader}>
      <span style={{ fontWeight: '600' }}>
        {shift.prevMonth} → {shift.month}
      </span>
      <span
        style={{
          color: shift.change > 0 ? '#06b6d4' : '#f59e0b',
          fontWeight: '700',
        }}
      >
        {shift.change > 0 ? '↑' : '↓'} {Math.abs(Math.round(shift.change))}%
      </span>
    </div>
    <div style={styles.shiftDescription}>
      {shift.change > 0
        ? `You became ${Math.round(Math.abs(shift.change))}% happier`
        : `You became ${Math.round(Math.abs(shift.change))}% more melancholic`}
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
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
  },
  chartContainer: {},
  tooltip: {
    background: 'rgba(10, 10, 10, 0.9)',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid rgba(29, 185, 84, 0.3)',
  },
  statsCard: {},
  statBlock: {
    marginBottom: '1.5rem',
  },
  shiftsCard: {},
  shiftsList: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
  },
  shiftItem: {
    padding: '1rem',
    background: 'rgba(29, 185, 84, 0.05)',
    borderRadius: '8px',
    borderLeft: '3px solid #1db954',
  },
  shiftHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  shiftDescription: {
    color: '#b3b3b3',
    fontSize: '0.9rem',
  },
};

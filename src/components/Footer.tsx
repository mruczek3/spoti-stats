import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.content}>
          <div>
            <h4 style={{ marginBottom: '0.5rem' }}>Spotify Stats</h4>
            <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
              A premium listening analytics dashboard
            </p>
          </div>
          <div>
            <h4 style={{ marginBottom: '0.5rem' }}>Features</h4>
            <ul style={styles.links}>
              <li><a href="#" style={styles.link}>Dashboard</a></li>
              <li><a href="#" style={styles.link}>Analytics</a></li>
              <li><a href="#" style={styles.link}>Reports</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: '0.5rem' }}>Connect</h4>
            <ul style={styles.links}>
              <li><a href="#" style={styles.link}>Twitter</a></li>
              <li><a href="#" style={styles.link}>GitHub</a></li>
              <li><a href="#" style={styles.link}>Email</a></li>
            </ul>
          </div>
        </div>
        <div style={styles.bottom}>
          <p style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} Spotify Stats. Not affiliated with Spotify AB.
          </p>
        </div>
      </div>
    </footer>
  );
};

const styles: Record<string, React.CSSProperties> = {
  footer: {
    background: 'rgba(10, 10, 10, 0.8)',
    borderTop: '1px solid rgba(29, 185, 84, 0.1)',
    padding: '4rem 0 2rem',
    marginTop: '6rem',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 2rem',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem',
    marginBottom: '2rem',
    paddingBottom: '2rem',
    borderBottom: '1px solid rgba(29, 185, 84, 0.1)',
  },
  links: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  link: {
    color: '#b3b3b3',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
  },
  bottom: {
    textAlign: 'center',
  },
};

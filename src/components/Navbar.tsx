import React from 'react';

interface NavbarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSection, onSectionChange }) => {
  const sections = [
    { id: 'hero', label: 'Dashboard' },
    { id: 'tracks', label: 'Top Tracks' },
    { id: 'artists', label: 'Artists' },
    { id: 'personality', label: 'Profile' },
    { id: 'listening', label: 'Listening' },
    { id: 'genres', label: 'Genres' },
    { id: 'mood', label: 'Mood' },
    { id: 'report', label: 'Report' },
  ];

  return (
    <nav className="navbar" style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.logo}>
          <span style={styles.logoText}>STATS</span>
        </div>
        <div style={styles.nav}>
          {sections.map((section) => (
            <button
              key={section.id}
              style={{
                ...styles.navLink,
                ...(activeSection === section.id ? styles.navLinkActive : {}),
              }}
              onClick={() => onSectionChange(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    background: 'rgba(10, 10, 10, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(29, 185, 84, 0.1)',
    padding: '1rem 0',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoText: {
    fontSize: '1.8rem',
    fontWeight: '700',
    fontFamily: "'Bebas Neue', serif",
    color: '#1db954',
    letterSpacing: '0.1em',
  },
  nav: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center',
  },
  navLink: {
    background: 'none',
    border: 'none',
    color: '#b3b3b3',
    fontSize: '0.9rem',
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: '0.5rem 0',
    borderBottom: '2px solid transparent',
  },
  navLinkActive: {
    color: '#1db954',
    borderBottomColor: '#1db954',
  },
};

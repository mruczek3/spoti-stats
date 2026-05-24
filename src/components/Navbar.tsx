import React, { useState, useEffect } from "react";

interface NavbarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  nickname?: string;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onSectionChange,
  nickname,
  onLogout,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const sections = [
    { id: "hero", label: "Dashboard" },
    { id: "tracks", label: "Top Tracks" },
    { id: "artists", label: "Artists" },
    { id: "personality", label: "Profile" },
    { id: "listening", label: "Listening" },
    { id: "genres", label: "Genres" },
    { id: "mood", label: "Mood" },
    { id: "report", label: "Report" },
    { id: "games", label: "🎮 Games" },
    { id: "social", label: "🔗 Social" },
  ];

  return (
    <nav
      style={{
        ...styles.navbar,
        boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,0.5)" : "none",
      }}
    >
      <div style={styles.container}>
        {/* Logo */}
        <button style={styles.logoBtn} onClick={() => onSectionChange("hero")}>
          <span style={styles.logoText}>STATS</span>
        </button>

        {/* Desktop Nav */}
        <div style={styles.nav}>
          {sections.map((s) => (
            <button
              key={s.id}
              style={{
                ...styles.navLink,
                ...(activeSection === s.id ? styles.navLinkActive : {}),
              }}
              onClick={() => onSectionChange(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div style={styles.rightSide}>
          {nickname && <span style={styles.nicknameChip}>@{nickname}</span>}
          {onLogout && (
            <button style={styles.logoutBtn} onClick={onLogout}>
              Log out
            </button>
          )}
          {/* Mobile hamburger */}
          <button
            style={styles.hamburger}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div style={styles.mobileMenu}>
          {sections.map((s) => (
            <button
              key={s.id}
              style={{
                ...styles.mobileLink,
                ...(activeSection === s.id ? styles.mobileLinkActive : {}),
              }}
              onClick={() => {
                onSectionChange(s.id);
                setMobileOpen(false);
              }}
            >
              {s.label}
            </button>
          ))}
          {onLogout && (
            <button
              style={{ ...styles.mobileLink, color: "#ef4444" }}
              onClick={() => {
                onLogout();
                setMobileOpen(false);
              }}
            >
              Log out
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    background: "rgba(10, 10, 10, 0.97)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(29, 185, 84, 0.12)",
    transition: "box-shadow 0.3s ease",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "56px",
  },
  logoBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  },
  logoText: {
    fontSize: "1.6rem",
    fontWeight: "700",
    fontFamily: "'Bebas Neue', serif",
    color: "#1db954",
    letterSpacing: "0.1em",
  },
  nav: {
    display: "flex",
    gap: "0.25rem",
    alignItems: "center",
    flexWrap: "nowrap",
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  navLink: {
    background: "none",
    border: "none",
    color: "#b3b3b3",
    fontSize: "0.82rem",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "color 0.2s ease, border-color 0.2s ease",
    padding: "0.45rem 0.7rem",
    borderBottom: "2px solid transparent",
    whiteSpace: "nowrap",
    borderRadius: "4px",
  },
  navLinkActive: {
    color: "#1db954",
    borderBottomColor: "#1db954",
    background: "rgba(29, 185, 84, 0.06)",
  },
  rightSide: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexShrink: 0,
  },
  nicknameChip: {
    fontSize: "0.8rem",
    color: "#1db954",
    background: "rgba(29, 185, 84, 0.1)",
    border: "1px solid rgba(29, 185, 84, 0.25)",
    padding: "0.3rem 0.75rem",
    borderRadius: "20px",
    fontFamily: "'DM Sans', sans-serif",
    display: "none", // hidden on small screens; override via media query if needed
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid rgba(239,68,68,0.4)",
    color: "#ef4444",
    padding: "0.35rem 0.9rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s ease",
  },
  hamburger: {
    display: "none",
    background: "none",
    border: "none",
    color: "#b3b3b3",
    fontSize: "1.3rem",
    cursor: "pointer",
    padding: "0.25rem",
  },
  mobileMenu: {
    display: "flex",
    flexDirection: "column",
    background: "rgba(10,10,10,0.98)",
    borderTop: "1px solid rgba(29,185,84,0.1)",
    padding: "0.5rem 0",
  },
  mobileLink: {
    background: "none",
    border: "none",
    color: "#b3b3b3",
    fontSize: "1rem",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    padding: "0.9rem 1.5rem",
    textAlign: "left",
    transition: "color 0.2s",
  },
  mobileLinkActive: {
    color: "#1db954",
    background: "rgba(29,185,84,0.05)",
  },
};

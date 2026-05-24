import React, { useState, useEffect, useRef, useCallback } from "react";
import type { UserProfile, Track, Artist } from "../data/mockData";

interface MinigamesProps {
  profile: UserProfile;
}

type GameId = "hub" | "guess1" | "impostor" | "rank" | "era";

// ── Utilities ────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast: React.FC<{ msg: string }> = ({ msg }) => (
  <div
    style={{
      position: "fixed",
      bottom: "2rem",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#1db954",
      color: "#000",
      padding: "0.75rem 1.5rem",
      borderRadius: "50px",
      fontWeight: "700",
      zIndex: 9999,
      animation: "fadeInUp 0.3s ease",
      fontFamily: "'DM Sans', sans-serif",
      boxShadow: "0 4px 20px rgba(29,185,84,0.4)",
    }}
  >
    {msg}
  </div>
);

// ── LS helpers ────────────────────────────────────────────────────────────────
const lsGet = (k: string, def: number) =>
  parseInt(localStorage.getItem(k) || String(def));
const lsSet = (k: string, v: number) => localStorage.setItem(k, String(v));

// ═════════════════════════════════════════════════════════════════════════════
// GAME 1 — "Guess Your #1"
// ═════════════════════════════════════════════════════════════════════════════
const GuessGame: React.FC<{ tracks: Track[]; onBack: () => void }> = ({
  tracks,
  onBack,
}) => {
  const ROUNDS = 10;
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<Track[]>([]);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [toast, setToast] = useState("");
  const hi = lsGet("game1_highscore", 0);

  const newRound = useCallback(() => {
    if (tracks.length < 4) return;
    const pool = getRandom(tracks, 4);
    const best = pool.reduce((m, t) => (t.playCount > m.playCount ? t : m));
    const idx = pool.indexOf(best);
    setOptions(pool);
    setCorrectIdx(idx);
    setSelected(null);
  }, [tracks]);

  useEffect(() => {
    newRound();
  }, [newRound]);

  const pick = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const won = idx === correctIdx;
    if (won) setScore((s) => s + 1);
    setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        const newScore = score + (won ? 1 : 0);
        if (newScore > hi) lsSet("game1_highscore", newScore);
        setGameOver(true);
      } else {
        setRound((r) => r + 1);
        newRound();
      }
    }, 1000);
  };

  const share = () => {
    navigator.clipboard.writeText(
      `I scored ${score}/${ROUNDS} on "Guess Your #1" in Spotify Stats! 🎵`,
    );
    setToast("Copied to clipboard!");
    setTimeout(() => setToast(""), 2000);
  };

  if (tracks.length < 4) return <NotEnoughData onBack={onBack} />;

  if (gameOver) {
    const newHi = score > hi;
    return (
      <GameOverScreen
        title="Guess Your #1"
        score={score}
        total={ROUNDS}
        isNewHigh={newHi}
        onShare={share}
        onReplay={() => {
          setRound(0);
          setScore(0);
          setGameOver(false);
          newRound();
        }}
        onBack={onBack}
      />
    );
  }

  return (
    <div style={gStyles.gameWrap}>
      {toast && <Toast msg={toast} />}
      <GameHeader
        title="Guess Your #1"
        subtitle="Which of these is your most played?"
        round={round + 1}
        total={ROUNDS}
        score={score}
        onBack={onBack}
      />
      <div style={gStyles.grid2x2}>
        {options.map((t, i) => {
          let bg = "rgba(29,185,84,0.08)";
          let border = "1px solid rgba(29,185,84,0.2)";
          if (selected !== null) {
            if (i === correctIdx) {
              bg = "rgba(29,185,84,0.25)";
              border = "2px solid #1db954";
            } else if (i === selected) {
              bg = "rgba(239,68,68,0.2)";
              border = "2px solid #ef4444";
            }
          }
          return (
            <button
              key={t.id}
              style={{ ...gStyles.optionBtn, background: bg, border }}
              onClick={() => pick(i)}
            >
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#fff",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                {t.name}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#b3b3b3" }}>
                {t.artist}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// GAME 2 — "Artist or Impostor?"
// ═════════════════════════════════════════════════════════════════════════════
const IMPOSTORS = [
  "DJ Phantom",
  "The Hollow Kings",
  "Neon Wraith",
  "Crystal Static",
  "Velvet Echo",
  "Midnight Circuit",
  "The Pale Frontier",
  "Solar Drift",
  "Obsidian Wave",
  "Vapor Trail",
  "Cerulean Noise",
  "The Lost Signal",
  "Ghost Frequency",
  "Amber Static",
  "The Broken Compass",
];

const ImpostorGame: React.FC<{ artists: Artist[]; onBack: () => void }> = ({
  artists,
  onBack,
}) => {
  const ROUNDS = 20;
  const [round, setRound] = useState(0);
  const [current, setCurrent] = useState("");
  const [isReal, setIsReal] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(lsGet("game2_beststreak", 0));
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [toast, setToast] = useState("");

  const realNames = artists.map((a) => a.name);

  const nextQuestion = useCallback(() => {
    const real = Math.random() > 0.5;
    setIsReal(real);
    if (real) {
      setCurrent(realNames[Math.floor(Math.random() * realNames.length)]);
    } else {
      setCurrent(IMPOSTORS[Math.floor(Math.random() * IMPOSTORS.length)]);
    }
    setAnswer(null);
  }, [realNames]);

  useEffect(() => {
    nextQuestion();
  }, [nextQuestion]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (answer !== null) return;
      if (e.key === "y" || e.key === "Y") respond(true);
      if (e.key === "n" || e.key === "N") respond(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const respond = (guessReal: boolean) => {
    if (answer !== null) return;
    setAnswer(guessReal);
    const won = guessReal === isReal;
    const newStreak = won ? streak + 1 : 0;
    if (won) setCorrect((c) => c + 1);
    setStreak(newStreak);
    if (newStreak > bestStreak) {
      setBestStreak(newStreak);
      lsSet("game2_beststreak", newStreak);
    }
    setTimeout(() => {
      if (round + 1 >= ROUNDS) setGameOver(true);
      else {
        setRound((r) => r + 1);
        nextQuestion();
      }
    }, 700);
  };

  const share = () => {
    navigator.clipboard.writeText(
      `I scored ${correct}/${ROUNDS} on "Artist or Impostor?" with a streak of ${bestStreak}! 🎵`,
    );
    setToast("Copied!");
    setTimeout(() => setToast(""), 2000);
  };

  if (artists.length < 4) return <NotEnoughData onBack={onBack} />;

  if (gameOver) {
    return (
      <GameOverScreen
        title="Artist or Impostor?"
        score={correct}
        total={ROUNDS}
        isNewHigh={bestStreak > lsGet("game2_beststreak", 0)}
        onShare={share}
        onReplay={() => {
          setRound(0);
          setStreak(0);
          setCorrect(0);
          setGameOver(false);
          nextQuestion();
        }}
        onBack={onBack}
        extra={
          <p style={{ color: "#1db954", marginTop: "1rem" }}>
            Best Streak: 🔥 {bestStreak}
          </p>
        }
      />
    );
  }

  const resultColor =
    answer !== null
      ? answer === isReal
        ? "#1db954"
        : "#ef4444"
      : "transparent";

  return (
    <div style={gStyles.gameWrap}>
      {toast && <Toast msg={toast} />}
      <GameHeader
        title="Artist or Impostor?"
        subtitle="Is this one of your top artists?"
        round={round + 1}
        total={ROUNDS}
        score={correct}
        onBack={onBack}
      />
      <div style={{ textAlign: "center", margin: "1rem 0" }}>
        <span style={{ color: "#1db954", fontSize: "1rem" }}>
          🔥 Streak: {streak}
        </span>
        <span
          style={{
            color: "#b3b3b3",
            fontSize: "0.85rem",
            marginLeft: "1.5rem",
          }}
        >
          Best: {bestStreak}
        </span>
      </div>
      <div
        style={{
          ...gStyles.artistNameBox,
          borderColor:
            resultColor !== "transparent" ? resultColor : "rgba(29,185,84,0.3)",
        }}
      >
        <span style={{ fontSize: "2rem", fontWeight: 700, color: "#fff" }}>
          {current}
        </span>
        {answer !== null && (
          <p
            style={{ color: resultColor, marginTop: "0.5rem", fontWeight: 700 }}
          >
            {answer === isReal
              ? "✓ Correct!"
              : `✗ It was ${isReal ? "REAL" : "FAKE"}!`}
          </p>
        )}
      </div>
      <div style={gStyles.binaryBtns}>
        <button
          style={{
            ...gStyles.bigBtn,
            background: "rgba(29,185,84,0.15)",
            border: "1px solid #1db954",
          }}
          onClick={() => respond(true)}
        >
          ✓ YES <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>(Y)</span>
        </button>
        <button
          style={{
            ...gStyles.bigBtn,
            background: "rgba(239,68,68,0.15)",
            border: "1px solid #ef4444",
            color: "#ef4444",
          }}
          onClick={() => respond(false)}
        >
          ✗ NO <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>(N)</span>
        </button>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// GAME 3 — "Rank It!"
// ═════════════════════════════════════════════════════════════════════════════
const RankGame: React.FC<{ tracks: Track[]; onBack: () => void }> = ({
  tracks,
  onBack,
}) => {
  const ROUNDS = 5;
  const [round, setRound] = useState(0);
  const [roundTracks, setRoundTracks] = useState<Track[]>([]);
  const [order, setOrder] = useState([0, 1, 2]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [toast, setToast] = useState("");
  const hi = lsGet("game3_highscore", 0);

  const newRound = useCallback(() => {
    setRoundTracks(getRandom(tracks, 3));
    setOrder([0, 1, 2]);
    setRevealed(false);
    setRoundScore(0);
  }, [tracks]);

  useEffect(() => {
    newRound();
  }, [newRound]);

  const handleDragStart = (i: number) => setDragFrom(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragFrom === null || dragFrom === i) return;
    const newOrder = [...order];
    const [removed] = newOrder.splice(dragFrom, 1);
    newOrder.splice(i, 0, removed);
    setOrder(newOrder);
    setDragFrom(i);
  };
  const handleDragEnd = () => setDragFrom(null);

  const reveal = () => {
    const actualOrder = [...roundTracks]
      .map((t, i) => ({ t, i }))
      .sort((a, b) => b.t.playCount - a.t.playCount)
      .map((x) => x.i);
    let sc = 0;
    order.forEach((trackIdx, pos) => {
      if (actualOrder[pos] === trackIdx) sc++;
    });
    setRoundScore(sc);
    setTotalScore((t) => t + sc);
    setRevealed(true);
  };

  const next = () => {
    if (round + 1 >= ROUNDS) {
      const newTotal = totalScore + roundScore;
      if (newTotal > hi) lsSet("game3_highscore", newTotal);
      setGameOver(true);
    } else {
      setRound((r) => r + 1);
      newRound();
    }
  };

  const share = () => {
    navigator.clipboard.writeText(
      `I scored ${totalScore + roundScore}/${ROUNDS * 3} on "Rank It!" in Spotify Stats! 🎵`,
    );
    setToast("Copied!");
    setTimeout(() => setToast(""), 2000);
  };

  if (tracks.length < 3) return <NotEnoughData onBack={onBack} />;

  if (gameOver) {
    return (
      <GameOverScreen
        title="Rank It!"
        score={totalScore}
        total={ROUNDS * 3}
        isNewHigh={totalScore > hi}
        onShare={share}
        onReplay={() => {
          setRound(0);
          setTotalScore(0);
          setGameOver(false);
          newRound();
        }}
        onBack={onBack}
      />
    );
  }

  const actualOrder = revealed
    ? [...roundTracks]
        .map((t, i) => ({ t, i }))
        .sort((a, b) => b.t.playCount - a.t.playCount)
        .map((x) => x.i)
    : [];

  return (
    <div style={gStyles.gameWrap}>
      {toast && <Toast msg={toast} />}
      <GameHeader
        title="Rank It!"
        subtitle="Drag to rank: most played → least played"
        round={round + 1}
        total={ROUNDS}
        score={totalScore}
        onBack={onBack}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          margin: "1.5rem 0",
        }}
      >
        {order.map((trackIdx, pos) => {
          const t = roundTracks[trackIdx];
          if (!t) return null;
          let borderColor = "rgba(29,185,84,0.25)";
          if (revealed) {
            borderColor = actualOrder[pos] === trackIdx ? "#1db954" : "#f59e0b";
          }
          return (
            <div
              key={trackIdx}
              draggable
              style={{
                ...gStyles.rankCard,
                border: `2px solid ${borderColor}`,
                cursor: revealed ? "default" : "grab",
                opacity: dragFrom === pos ? 0.5 : 1,
              }}
              onDragStart={() => handleDragStart(pos)}
              onDragOver={(e) => handleDragOver(e, pos)}
              onDragEnd={handleDragEnd}
            >
              <span
                style={{
                  color: "#b3b3b3",
                  marginRight: "1rem",
                  fontSize: "1.2rem",
                }}
              >
                ≡
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#fff" }}>{t.name}</div>
                <div style={{ fontSize: "0.8rem", color: "#b3b3b3" }}>
                  {t.artist}
                </div>
              </div>
              {revealed && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#1db954", fontSize: "0.85rem" }}>
                    {t.playCount} plays
                  </div>
                  <div
                    style={{
                      color:
                        actualOrder[pos] === trackIdx ? "#1db954" : "#f59e0b",
                      fontSize: "0.8rem",
                    }}
                  >
                    {actualOrder[pos] === trackIdx ? "✓ correct" : "✗ wrong"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!revealed ? (
        <button style={gStyles.actionBtn} onClick={reveal}>
          Reveal Ranking
        </button>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: "#1db954",
              fontSize: "1.2rem",
              marginBottom: "1rem",
            }}
          >
            Round score: {roundScore}/3{" "}
            {roundScore === 3 ? "🎉" : roundScore >= 2 ? "👍" : "😅"}
          </p>
          <button style={gStyles.actionBtn} onClick={next}>
            {round + 1 >= ROUNDS ? "See Final Score" : "Next Round"}
          </button>
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// GAME 4 — "Music Era Quiz"
// ═════════════════════════════════════════════════════════════════════════════
const DECADES = ["70s", "80s", "90s", "00s", "10s", "20s"];

function getDecade(releaseDate: string): string {
  try {
    const year = new Date(releaseDate).getFullYear();
    if (isNaN(year)) return "10s";
    const dec = Math.floor(year / 10) * 10;
    if (dec <= 1979) return "70s";
    if (dec === 1980) return "80s";
    if (dec === 1990) return "90s";
    if (dec === 2000) return "00s";
    if (dec === 2010) return "10s";
    return "20s";
  } catch {
    return "10s";
  }
}

// Simple canvas confetti
function triggerConfetti(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = canvas.offsetWidth || 400;
  canvas.height = canvas.offsetHeight || 300;
  const colors = ["#1db954", "#06b6d4", "#f59e0b", "#fff", "#a855f7"];
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
  }));
  let frame = 0;
  function animate() {
    if (!ctx || !canvas) return;
    if (frame > 120) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    frame++;
    requestAnimationFrame(animate);
  }
  animate();
}

const EraGame: React.FC<{ tracks: Track[]; onBack: () => void }> = ({
  tracks,
  onBack,
}) => {
  const ROUNDS = 10;
  const [round, setRound] = useState(0);
  const [current, setCurrent] = useState<Track | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [toast, setToast] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hi = lsGet("game4_highscore", 0);

  const nextTrack = useCallback(() => {
    const t = tracks[Math.floor(Math.random() * tracks.length)];
    setCurrent(t);
    setSelected(null);
  }, [tracks]);

  useEffect(() => {
    nextTrack();
  }, [nextTrack]);

  const pick = (decade: string) => {
    if (selected !== null || !current) return;
    setSelected(decade);
    const correct = getDecade(current.releaseDate);
    const won = decade === correct;
    if (won) {
      setScore((s) => s + 1);
      triggerConfetti(canvasRef.current);
    }
    setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        const ns = score + (won ? 1 : 0);
        if (ns > hi) lsSet("game4_highscore", ns);
        setGameOver(true);
      } else {
        setRound((r) => r + 1);
        nextTrack();
      }
    }, 1100);
  };

  const share = () => {
    navigator.clipboard.writeText(
      `I scored ${score}/${ROUNDS} on "Music Era Quiz" in Spotify Stats! 🎵`,
    );
    setToast("Copied!");
    setTimeout(() => setToast(""), 2000);
  };

  if (!tracks.length) return <NotEnoughData onBack={onBack} />;

  if (gameOver) {
    return (
      <GameOverScreen
        title="Music Era Quiz"
        score={score}
        total={ROUNDS}
        isNewHigh={score > hi}
        onShare={share}
        onReplay={() => {
          setRound(0);
          setScore(0);
          setGameOver(false);
          nextTrack();
        }}
        onBack={onBack}
      />
    );
  }

  const correctDecade = current ? getDecade(current.releaseDate) : "";

  return (
    <div
      style={{ ...gStyles.gameWrap, position: "relative", overflow: "hidden" }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
          width: "100%",
          height: "100%",
        }}
      />
      {toast && <Toast msg={toast} />}
      <GameHeader
        title="Music Era Quiz"
        subtitle="Which decade was this track released?"
        round={round + 1}
        total={ROUNDS}
        score={score}
        onBack={onBack}
      />
      {current && (
        <div style={{ textAlign: "center", margin: "2rem 0 1.5rem" }}>
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#fff",
              marginBottom: "0.5rem",
            }}
          >
            {current.name}
          </div>
          <div style={{ color: "#b3b3b3" }}>{current.artist}</div>
        </div>
      )}
      <div style={gStyles.grid3x2}>
        {DECADES.map((d) => {
          let bg = "rgba(29,185,84,0.08)";
          let border = "1px solid rgba(29,185,84,0.2)";
          let color: string = "#fff";
          if (selected !== null) {
            if (d === correctDecade) {
              bg = "rgba(29,185,84,0.3)";
              border = "2px solid #1db954";
              color = "#1db954";
            } else if (d === selected) {
              bg = "rgba(239,68,68,0.2)";
              border = "2px solid #ef4444";
              color = "#ef4444";
            }
          }
          return (
            <button
              key={d}
              style={{ ...gStyles.decadeBtn, background: bg, border, color }}
              onClick={() => pick(d)}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// Shared UI Components
// ═════════════════════════════════════════════════════════════════════════════
const GameHeader: React.FC<{
  title: string;
  subtitle: string;
  round: number;
  total: number;
  score: number;
  onBack: () => void;
}> = ({ title, subtitle, round, total, score, onBack }) => (
  <div style={{ marginBottom: "1.5rem" }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "0.5rem",
      }}
    >
      <button style={gStyles.backBtn} onClick={onBack}>
        ← Games
      </button>
      <span style={{ color: "#b3b3b3", fontSize: "0.9rem" }}>
        Round {round}/{total}
      </span>
      <span style={{ color: "#1db954", fontWeight: 700 }}>Score: {score}</span>
    </div>
    <h2
      style={{
        color: "#1db954",
        fontSize: "1.6rem",
        fontFamily: "'Bebas Neue', serif",
        letterSpacing: "0.05em",
      }}
    >
      {title}
    </h2>
    <p style={{ color: "#b3b3b3", fontSize: "0.9rem", marginTop: "0.25rem" }}>
      {subtitle}
    </p>
  </div>
);

const GameOverScreen: React.FC<{
  title: string;
  score: number;
  total: number;
  isNewHigh: boolean;
  onShare: () => void;
  onReplay: () => void;
  onBack: () => void;
  extra?: React.ReactNode;
}> = ({ title, score, total, isNewHigh, onShare, onReplay, onBack, extra }) => {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v = Math.min(v + 1, score);
      setDisplayed(v);
      if (v >= score) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [score]);
  const pct = Math.round((score / total) * 100);

  return (
    <div style={{ ...gStyles.gameWrap, textAlign: "center" }}>
      <h2
        style={{
          color: "#1db954",
          fontFamily: "'Bebas Neue', serif",
          fontSize: "2rem",
          marginBottom: "0.5rem",
        }}
      >
        {title} — Final Score
      </h2>
      {isNewHigh && (
        <p
          style={{ color: "#f59e0b", fontWeight: 700, marginBottom: "0.5rem" }}
        >
          🏆 New High Score!
        </p>
      )}
      <div
        style={{
          fontSize: "5rem",
          fontWeight: 900,
          color: "#1db954",
          lineHeight: 1,
          margin: "1.5rem 0",
        }}
      >
        {displayed}
      </div>
      <p style={{ color: "#b3b3b3", marginBottom: "0.25rem" }}>
        out of {total} ({pct}%)
      </p>
      {pct >= 80 ? (
        <p style={{ color: "#1db954" }}>🎉 Outstanding!</p>
      ) : pct >= 50 ? (
        <p style={{ color: "#f59e0b" }}>👍 Good effort!</p>
      ) : (
        <p style={{ color: "#b3b3b3" }}>Keep practicing!</p>
      )}
      {extra}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          marginTop: "2rem",
          flexWrap: "wrap",
        }}
      >
        <button style={gStyles.actionBtn} onClick={onReplay}>
          Play Again
        </button>
        <button
          style={{
            ...gStyles.actionBtn,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
          onClick={onShare}
        >
          Share 📋
        </button>
        <button
          style={{
            ...gStyles.actionBtn,
            background: "transparent",
            border: "1px solid rgba(29,185,84,0.3)",
            color: "#1db954",
          }}
          onClick={onBack}
        >
          Back to Games
        </button>
      </div>
    </div>
  );
};

const NotEnoughData: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div style={{ ...gStyles.gameWrap, textAlign: "center" }}>
    <p style={{ color: "#b3b3b3", fontSize: "1.1rem", marginBottom: "1.5rem" }}>
      Not enough Spotify data to play this game yet.
    </p>
    <button style={gStyles.actionBtn} onClick={onBack}>
      ← Back to Games
    </button>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// HUB SCREEN
// ═════════════════════════════════════════════════════════════════════════════
const HUB_GAMES = [
  {
    id: "guess1" as GameId,
    emoji: "🎯",
    name: "Guess Your #1",
    desc: "Identify your most played track from 4 options",
    lsKey: "game1_highscore",
    max: 10,
  },
  {
    id: "impostor" as GameId,
    emoji: "🕵️",
    name: "Artist or Impostor?",
    desc: "Is this artist in your top list or a fake?",
    lsKey: "game2_beststreak",
    label: "Best Streak",
  },
  {
    id: "rank" as GameId,
    emoji: "📊",
    name: "Rank It!",
    desc: "Sort 3 tracks by how much you've listened",
    lsKey: "game3_highscore",
    max: 15,
  },
  {
    id: "era" as GameId,
    emoji: "📅",
    name: "Music Era Quiz",
    desc: "Guess the decade a track was released in",
    lsKey: "game4_highscore",
    max: 10,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export const Minigames: React.FC<MinigamesProps> = ({ profile }) => {
  const [activeGame, setActiveGame] = useState<GameId>("hub");
  const tracks = profile.topTracks;
  const artists = profile.topArtists;

  if (activeGame === "guess1")
    return (
      <div style={gStyles.section}>
        <GuessGame tracks={tracks} onBack={() => setActiveGame("hub")} />
      </div>
    );
  if (activeGame === "impostor")
    return (
      <div style={gStyles.section}>
        <ImpostorGame artists={artists} onBack={() => setActiveGame("hub")} />
      </div>
    );
  if (activeGame === "rank")
    return (
      <div style={gStyles.section}>
        <RankGame tracks={tracks} onBack={() => setActiveGame("hub")} />
      </div>
    );
  if (activeGame === "era")
    return (
      <div style={gStyles.section}>
        <EraGame tracks={tracks} onBack={() => setActiveGame("hub")} />
      </div>
    );

  // HUB
  return (
    <section style={gStyles.section} className="section fade-on-scroll">
      <div style={gStyles.container}>
        <h2 style={{ marginBottom: "0.5rem" }}>🎮 Music Minigames</h2>
        <p style={{ color: "#b3b3b3", marginBottom: "3rem" }}>
          Test your knowledge of your own taste
        </p>
        <div style={gStyles.hubGrid}>
          {HUB_GAMES.map((g) => {
            const hiVal = lsGet(g.lsKey, 0);
            return (
              <div key={g.id} style={gStyles.hubCard} className="card">
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
                  {g.emoji}
                </div>
                <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                  {g.name}
                </h3>
                <p
                  style={{
                    color: "#b3b3b3",
                    fontSize: "0.9rem",
                    marginBottom: "1.5rem",
                    lineHeight: 1.5,
                  }}
                >
                  {g.desc}
                </p>
                {hiVal > 0 && (
                  <p
                    style={{
                      color: "#f59e0b",
                      fontSize: "0.85rem",
                      marginBottom: "1rem",
                    }}
                  >
                    🏆 {g.label || "Best"}: {hiVal}
                    {g.max ? `/${g.max}` : ""}
                  </p>
                )}
                <button
                  style={gStyles.actionBtn}
                  onClick={() => setActiveGame(g.id)}
                >
                  Play →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const gStyles: Record<string, React.CSSProperties> = {
  section: {
    background:
      "linear-gradient(135deg, rgba(29,185,84,0.04) 0%, transparent 100%)",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "0 2rem",
  },
  gameWrap: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "2rem",
    background: "rgba(20,20,25,0.95)",
    border: "1px solid rgba(29,185,84,0.15)",
    borderRadius: "16px",
    backdropFilter: "blur(20px)",
  },
  hubGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1.5rem",
  },
  hubCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "2rem",
  },
  grid2x2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
    margin: "1.5rem 0",
  },
  grid3x2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "0.75rem",
    margin: "1.5rem 0",
  },
  optionBtn: {
    padding: "1.25rem",
    border: "1px solid rgba(29,185,84,0.2)",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
  },
  artistNameBox: {
    textAlign: "center",
    padding: "2.5rem 1rem",
    border: "2px solid",
    borderRadius: "16px",
    margin: "1.5rem 0",
    background: "rgba(29,185,84,0.04)",
    transition: "border-color 0.3s ease",
  },
  binaryBtns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  bigBtn: {
    padding: "1.25rem",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#fff",
    transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
  },
  rankCard: {
    display: "flex",
    alignItems: "center",
    padding: "1rem 1.25rem",
    borderRadius: "12px",
    background: "rgba(20,20,25,0.8)",
    transition: "all 0.2s ease",
  },
  decadeBtn: {
    padding: "1.25rem",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1.2rem",
    fontWeight: 700,
    transition: "all 0.2s ease",
    fontFamily: "'Bebas Neue', serif",
    letterSpacing: "0.05em",
  },
  actionBtn: {
    padding: "0.85rem 2rem",
    background: "#1db954",
    color: "#000",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.95rem",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s ease",
  },
  backBtn: {
    background: "none",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#b3b3b3",
    padding: "0.4rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontFamily: "'DM Sans', sans-serif",
  },
};

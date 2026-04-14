/* ============================================================
   ADHD FOCUS SPACE — DailySplash
   Design: Dreamy aura gradient opening animation, shown every page load
   - Duration: ~7s hold + 1.2s fade-out = ~8.2s total
   - Daily rotating motivation sentences (deterministic by date)
   - Tap anywhere to skip
   ============================================================ */

import { useEffect, useState } from "react";

// 30 daily motivation sentences — one per day of month (deterministic)
const DAILY_QUOTES = [
  { text: "If you're growing slow,\nyou're still growing.", sub: "Progress is progress." },
  { text: "Your brain is not broken —\nit just works differently.", sub: "" },
  { text: "One thing at a time.\nThat's enough.", sub: "" },
  { text: "Progress, not perfection.\nEvery small step counts.", sub: "" },
  { text: "Small steps still\nmove you forward.", sub: "" },
  { text: "You don't have to do\neverything today.", sub: "Just one thing." },
  { text: "Rest is not laziness.\nIt's part of the work.", sub: "" },
  { text: "You showed up.\nThat already counts.", sub: "" },
  { text: "Be patient with yourself —\nyou're learning as you go.", sub: "" },
  { text: "The messy middle\nis still the middle.", sub: "You're moving." },
  { text: "Done is better\nthan perfect.", sub: "" },
  { text: "Your focus will return.\nBe gentle with yourself.", sub: "" },
  { text: "Every day is a\nfresh start.", sub: "" },
  { text: "You are more capable\nthan you think.", sub: "" },
  { text: "Chaos is okay.\nYou can work with chaos.", sub: "" },
  { text: "Celebrate the small wins.\nThey add up.", sub: "" },
  { text: "You don't need\nto have it all figured out.", sub: "Just begin." },
  { text: "Your ideas matter.\nDump them, sort them later.", sub: "" },
  { text: "Slow down.\nYour best thinking happens here.", sub: "" },
  { text: "It's okay to\nstart over.", sub: "" },
  { text: "You are not behind.\nYou are exactly where you need to be.", sub: "" },
  { text: "Breathe first.\nThen begin.", sub: "" },
  { text: "The goal is consistency,\nnot intensity.", sub: "" },
  { text: "You've gotten through\nevery hard day so far.", sub: "" },
  { text: "One focused hour\nbeats ten scattered ones.", sub: "" },
  { text: "Your brain is wired\nfor creativity.", sub: "Use it." },
  { text: "Imperfect action\nbeats perfect inaction.", sub: "" },
  { text: "Today's effort\nis tomorrow's momentum.", sub: "" },
  { text: "You are building something\nreal, one day at a time.", sub: "" },
  { text: "Start anywhere.\nMomentum will follow.", sub: "" },
];

function getTodayKey() {
  return `adhd-splash-${new Date().toDateString()}`;
}

function getTodayQuote() {
  const day = new Date().getDate(); // 1–31
  return DAILY_QUOTES[(day - 1) % DAILY_QUOTES.length];
}

export default function DailySplash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "done">("in");
  const quote = getTodayQuote();

  useEffect(() => {
    // in → hold after 0.9s (fade in)
    const t1 = setTimeout(() => setPhase("hold"), 900);
    // hold → out after 8s (much longer to read)
    const t2 = setTimeout(() => setPhase("out"), 8000);
    // out → done after 9.2s (1.2s fade-out)
    const t3 = setTimeout(() => {
      setPhase("done");
      onDone();
    }, 9200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const handleSkip = () => {
    setPhase("out");
    setTimeout(() => { setPhase("done"); onDone(); }, 1000);
  };

  if (phase === "done") return null;

  const opacity = phase === "in" ? 0 : phase === "out" ? 0 : 1;
  const transition = phase === "in"
    ? "opacity 0.9s ease-out"
    : phase === "out"
    ? "opacity 1.2s ease-in"
    : "opacity 0.9s ease-out";

  return (
    <div
      onClick={handleSkip}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        cursor: "pointer",
        overflow: "hidden",
        opacity,
        transition,
      }}
    >
      {/* Aura background */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <radialGradient id="sp-base" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#fdf0e8" />
            <stop offset="100%" stopColor="#f0e4d8" />
          </radialGradient>
          <radialGradient id="sp-rose" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e09090" stopOpacity="0.70" />
            <stop offset="55%" stopColor="#d07070" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#d07070" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sp-orange" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8935a" stopOpacity="0.65" />
            <stop offset="55%" stopColor="#e07840" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#e07840" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sp-gold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d4a96a" stopOpacity="0.60" />
            <stop offset="55%" stopColor="#c49050" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#c49050" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sp-blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8b4b8" stopOpacity="0.50" />
            <stop offset="60%" stopColor="#dda0a4" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#dda0a4" stopOpacity="0" />
          </radialGradient>
          <filter id="sp-blur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="90" />
          </filter>
        </defs>

        {/* Base */}
        <rect width="800" height="900" fill="url(#sp-base)" />

        {/* Animated orbs */}
        <g filter="url(#sp-blur)">
          <ellipse cx="180" cy="160" rx="380" ry="340" fill="url(#sp-rose)">
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 40,25; -20,45; 0,0" dur="6s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" />
          </ellipse>
          <ellipse cx="620" cy="100" rx="320" ry="290" fill="url(#sp-orange)">
            <animateTransform attributeName="transform" type="translate"
              values="0,0; -30,35; 25,-20; 0,0" dur="7s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" />
          </ellipse>
          <ellipse cx="400" cy="820" rx="450" ry="280" fill="url(#sp-gold)">
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 50,-25; -35,15; 0,0" dur="8s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" />
          </ellipse>
          <ellipse cx="100" cy="750" rx="340" ry="260" fill="url(#sp-blush)">
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 25,-35; -15,25; 0,0" dur="9s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" />
          </ellipse>
        </g>
      </svg>

      {/* Text content */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "0 40px",
        textAlign: "center",
      }}>
        {/* App name */}
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.68rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "oklch(0.45 0.06 35 / 0.65)",
          marginBottom: 8,
        }}>
          ADHD Focus Space
        </div>

        {/* Quote */}
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(1.6rem, 5vw, 2.4rem)",
          fontWeight: 700,
          fontStyle: "italic",
          color: "oklch(0.28 0.025 35)",
          lineHeight: 1.35,
          whiteSpace: "pre-line",
          maxWidth: 480,
          textShadow: "0 1px 24px oklch(0.98 0.01 50 / 0.6)",
        }}>
          {quote.text}
        </div>

        {quote.sub && (
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.85rem",
            color: "oklch(0.50 0.04 35 / 0.70)",
            letterSpacing: "0.04em",
            fontStyle: "italic",
          }}>
            {quote.sub}
          </div>
        )}

        {/* Tap to continue hint */}
        <div style={{
          position: "absolute",
          bottom: 36,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.65rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "oklch(0.50 0.04 35 / 0.45)",
          animation: "pulse-hint 2s ease-in-out infinite",
        }}>
          Tap to continue
        </div>
      </div>

      <style>{`
        @keyframes pulse-hint {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

/** Returns true if the splash should be shown — every page load */
export function shouldShowSplash(): boolean {
  try {
    // Use sessionStorage so it shows on every fresh page load
    return !sessionStorage.getItem('adhd-splash-shown');
  } catch {
    return true;
  }
}

/** Mark splash as seen for this session */
export function markSplashSeen(): void {
  try {
    sessionStorage.setItem('adhd-splash-shown', '1');
  } catch { /* ignore */ }
}

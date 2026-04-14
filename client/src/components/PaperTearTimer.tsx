/* ============================================================
   ADHD FOCUS SPACE — PaperTearTimer v4.0 (Peeling Strip)
   Design: The active strip looks like a physical paper strip
   that's been partially peeled off the page — raised with a
   drop shadow underneath, right corner curling up like a
   sticky note peeling off. Strips below sit flat on the page.
   Retro lo-fi: Space Mono, warm parchment, ruled lines.
   ============================================================ */

import { useEffect, useRef, useState } from "react";

// ── Inject keyframes once ─────────────────────────────────────────────────────
const STYLE_ID = "paper-peel-keyframes-v5";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes starTwinkle {
      0%,100% { opacity: 0.6; transform: scale(1) rotate(0deg); }
      50%     { opacity: 1;   transform: scale(1.4) rotate(20deg); }
    }
    @keyframes starFloat {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      50%     { transform: translateY(-3px) rotate(10deg); }
    }
    @keyframes stripTearAway {
      0%   { transform: translateX(0) rotate(0deg) scaleY(1); opacity: 1; }
      15%  { transform: translateX(-8px) rotate(-1.5deg) scaleY(1.02); opacity: 1; }
      100% { transform: translateX(140%) rotate(-6deg) scaleY(0.7); opacity: 0; }
    }
    @keyframes stripShake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-3px); }
      40%     { transform: translateX(4px); }
      60%     { transform: translateX(-2px); }
      80%     { transform: translateX(2px); }
    }
    @keyframes curlPulse {
      0%,100% { transform: scale(1) rotate(0deg); }
      50%     { transform: scale(1.22) rotate(-4deg); }
    }
    @keyframes peelEdgePulse {
      0%,100% { opacity: 0.7; }
      50%     { opacity: 1; }
    }
    .strip-tearing { animation: stripTearAway 0.65s cubic-bezier(0.4,0,1,1) forwards; }
    .strip-shake   { animation: stripShake 0.25s ease-in-out; }
    .curl-pulse    { animation: curlPulse 3.2s ease-in-out infinite; }
    .peel-edge-pulse { animation: peelEdgePulse 2.4s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

// ── Strip content ─────────────────────────────────────────────────────────────
const STRIPS = [
  "overthinking",
  "email backlog",
  "that awkward thing",
  "yesterday's worries",
  "the meeting dread",
  "unread messages",
  "tomorrow's anxiety",
  "the mental noise",
];

const STRIP_H = 40; // px height per strip

// ── Single strip ──────────────────────────────────────────────────────────────
function TearStrip({
  text,
  index,
  state,
  isActive,
  progress,
}: {
  text: string;
  index: number;
  state: "attached" | "tearing" | "torn";
  isActive: boolean;
  progress: number; // 0..1 for active strip fill
}) {
  const [cls, setCls] = useState("");
  const [hidden, setHidden] = useState(false);
  const prevState = useRef(state);

  useEffect(() => {
    if (state === "tearing" && prevState.current !== "tearing") {
      setCls("strip-shake");
      const t1 = setTimeout(() => {
        setCls("strip-tearing");
        setTimeout(() => setHidden(true), 700);
      }, 260);
      prevState.current = "tearing";
      return () => clearTimeout(t1);
    }
    if (state === "attached") {
      setCls("");
      setHidden(false);
      prevState.current = "attached";
    }
  }, [state]);

  if (hidden || state === "torn") return null;

  // Colors — watercolor pastel theme
  const bgActive   = "oklch(0.96 0.018 310 / 0.55)"; // soft lavender tint
  const bgInactive = "oklch(0.97 0.010 300 / 0.35)"; // very light lavender
  const inkActive  = "oklch(0.22 0.030 300)";
  const inkInactive = "oklch(0.48 0.020 290)";
  const dotColor   = "oklch(0.55 0.18 340)"; // pink dot
  const ruleColor  = "oklch(0.80 0.018 300)";
  const marginColor = "oklch(0.65 0.15 340)";

  return (
    <div
      className={cls}
      style={{
        position: "relative",
        height: STRIP_H,
        transformOrigin: "left center",
        // Active strip is raised above the page with shadow
        zIndex: isActive ? 4 : 1,
        marginBottom: isActive ? 0 : 0,
      }}
    >
      {/* ── Strip body ── */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: isActive ? bgActive : bgInactive,
        // Active strip: elevated with shadow to look peeled off page
        boxShadow: isActive
          ? "0 3px 12px oklch(0.55 0.12 310 / 0.25), 0 1px 3px oklch(0.55 0.12 310 / 0.15)"
          : "none",
        borderBottom: `1px solid oklch(0.82 0.018 300 / 0.5)`,
        transition: "box-shadow 0.3s, background 0.3s",
        overflow: "hidden",
      }}>
        {/* Pink margin line */}
        <div style={{
          position: "absolute",
          left: 34,
          top: 0,
          bottom: 0,
          width: 1,
          background: marginColor,
          opacity: 0.30,
        }} />
        {/* Ruled line */}
        <div style={{
          position: "absolute",
          left: 34,
          right: 0,
          top: "50%",
          height: 1,
          background: ruleColor,
          opacity: 0.35,
          transform: "translateY(-50%)",
        }} />

        {/* Peel-away effect: right side fades as strip is torn from right to left */}
        {isActive && (
          <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            // The "torn away" portion grows from right to left as progress increases
            width: `${progress * 100}%`,
            background: `linear-gradient(to left,
              oklch(0.94 0.018 70 / 0.85) 0%,
              oklch(0.90 0.016 70 / 0.50) 40%,
              transparent 100%
            )`,
            transition: "width 1s linear",
            pointerEvents: "none",
          }} />
        )}
        {/* Jagged tear edge line — vertical line at the peel boundary */}
        {isActive && progress > 0.01 && (
          <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: `${progress * 100}%`,
            width: 2,
            background: "linear-gradient(to bottom, transparent 0%, oklch(0.72 0.022 65 / 0.6) 30%, oklch(0.72 0.022 65 / 0.6) 70%, transparent 100%)",
            pointerEvents: "none",
          }} />
        )}
      </div>

      {/* ── Content ── */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        paddingLeft: 44,
        paddingRight: 28,
        zIndex: 2,
      }}>
        {/* Active dot */}
        {isActive && (
          <div style={{
            position: "absolute",
            left: 13,
            top: "50%",
            transform: "translateY(-50%)",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: dotColor,
            boxShadow: `0 0 5px ${dotColor}80`,
          }} />
        )}
        {/* Row number for inactive */}
        {!isActive && (
          <span style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "'Space Mono', monospace",
            fontSize: 8,
            color: inkInactive,
            opacity: 0.5,
          }}>
            {index + 1}
          </span>
        )}
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: isActive ? 10 : 9,
          letterSpacing: "0.07em",
          color: isActive ? inkActive : inkInactive,
          fontWeight: isActive ? 700 : 400,
          transition: "color 0.3s, font-size 0.2s",
        }}>
          {text}
        </span>
      </div>

      {/* ── Corner peel on active strip (top-right) ── */}
      {isActive && (
        <div
          className="curl-pulse"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 10,
            pointerEvents: "none",
            transformOrigin: "top right",
          }}
        >
          {/* The peeled corner triangle at top-right — watercolor pastel */}
          <svg width={32} height={32} viewBox="0 0 32 32" style={{ display: "block" }}>
            <defs>
              <linearGradient id="peelGradTR" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#e8d5f0" stopOpacity="1" />
                <stop offset="100%" stopColor="#c8b4e0" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="peelShadowTR" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9b7fc0" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#9b7fc0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points="0,0 32,0 32,28" fill="url(#peelShadowTR)" />
            <polygon points="10,0 32,0 32,22" fill="url(#peelGradTR)" />
            <line x1="10" y1="0" x2="32" y2="22" stroke="#f0e8ff" strokeWidth="0.9" opacity="0.9" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface PaperTearTimerProps {
  durationMinutes?: number;
}

export function PaperTearTimer({ durationMinutes = 25 }: PaperTearTimerProps) {
  const totalSec = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"idle" | "running" | "paused" | "complete">("idle");
  const [tornCount, setTornCount] = useState(0);
  const [stripStates, setStripStates] = useState<Array<"attached" | "tearing" | "torn">>(
    STRIPS.map(() => "attached")
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTornRef = useRef(0);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");

  const allStrips = [...STRIPS, ...customItems];

  const progress = (totalSec - remaining) / totalSec;
  const stripsToTear = Math.min(Math.floor(progress * allStrips.length), allStrips.length);
  const stripProgress = (progress * allStrips.length) % 1;

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  // Sync strip states
  useEffect(() => {
    if (stripsToTear > prevTornRef.current && running) {
      const idx = prevTornRef.current;
      prevTornRef.current = stripsToTear;
      setStripStates(prev => prev.map((s, i) => {
        if (i < idx) return "torn";
        if (i === idx) return "tearing";
        return "attached";
      }));
      setTimeout(() => {
        setStripStates(prev => prev.map((s, i) => i <= idx ? "torn" : s));
        setTornCount(stripsToTear);
      }, 1000);
    }
  }, [stripsToTear, running]);

  // Timer tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setPhase("complete");
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleStart = () => {
    if (phase === "complete") {
      setRemaining(totalSec);
      setTornCount(0);
      prevTornRef.current = 0;
      setStripStates(allStrips.map(() => "attached"));
      setPhase("running");
      setRunning(true);
    } else {
      setPhase(running ? "paused" : "running");
      setRunning(r => !r);
    }
  };

  const handleReset = () => {
    setRunning(false);
    setRemaining(totalSec);
    setTornCount(0);
    prevTornRef.current = 0;
    setStripStates(allStrips.map(() => "attached"));
    setPhase("idle");
  };

  const addItem = () => {
    const t = newItem.trim();
    if (!t) return;
    setCustomItems(c => [...c, t]);
    setStripStates(s => [...s, "attached"]);
    setNewItem("");
  };

  // Active strip index = first non-torn strip
  const activeIdx = stripStates.findIndex(s => s !== "torn");

  // Colors / tokens — watercolor pastel
  const C = {
    bg:       "oklch(0.96 0.020 300)",  // soft lavender
    border:   "oklch(0.80 0.025 300)",  // lavender border
    ink:      "oklch(0.22 0.030 300)",  // deep purple-ink
    muted:    "oklch(0.52 0.022 290)",  // muted lavender
    accent:   "oklch(0.50 0.18 340)",   // pink-rose accent
    shadow:   "oklch(0.55 0.12 310 / 0.20)",
  };

  return (
    <div style={{
      fontFamily: "'Space Mono', monospace",
      background: C.bg,
      border: `2px solid ${C.border}`,
      borderRadius: 4,
      boxShadow: `4px 4px 0 ${C.shadow}, 0 0 0 1px oklch(0.88 0.018 300 / 0.4)`,
      overflow: "hidden",
      userSelect: "none",
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: "10px 14px 8px",
        borderBottom: `1px solid ${C.border}`,
        background: "linear-gradient(135deg, oklch(0.95 0.025 310) 0%, oklch(0.97 0.018 280) 50%, oklch(0.96 0.022 340) 100%)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 8, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" }}>
            FOCUS TIMER
          </span>
          <button
            onClick={handleReset}
            style={{
              fontSize: 8, letterSpacing: "0.08em", color: C.muted,
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'Space Mono', monospace", textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            reset
          </button>
        </div>

        {/* Timer display */}
        <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
          <div style={{ fontSize: 8, letterSpacing: "0.1em", color: C.muted, marginBottom: 2 }}>
            things to let go of
          </div>
          <div style={{
            fontSize: 36,
            fontWeight: 700,
            color: C.accent,
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}>
            {mm}:{ss}
          </div>
        </div>
      </div>

      {/* ── Strip list — watercolor background ── */}
      <div style={{
        position: "relative",
        // Dreamy pastel watercolor gradient: lavender → pink → peach
        background: `
          radial-gradient(ellipse at 20% 30%, oklch(0.88 0.060 310 / 0.55) 0%, transparent 55%),
          radial-gradient(ellipse at 75% 15%, oklch(0.90 0.045 340 / 0.45) 0%, transparent 50%),
          radial-gradient(ellipse at 55% 70%, oklch(0.92 0.038 280 / 0.50) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 80%, oklch(0.93 0.040 50 / 0.35) 0%, transparent 45%),
          radial-gradient(ellipse at 10% 85%, oklch(0.90 0.035 200 / 0.30) 0%, transparent 45%),
          oklch(0.97 0.012 300)
        `,
        // Ruled notebook lines
        backgroundBlendMode: "normal",
      }}>
        {/* Glitter star confetti — decorative scattered stars */}
        {[
          { x: "12%",  y: "8%",  size: 7,  color: "#e060a0", delay: "0s",    rot: 15 },
          { x: "78%",  y: "5%",  size: 6,  color: "#40b0e0", delay: "0.8s",  rot: -20 },
          { x: "88%",  y: "28%", size: 5,  color: "#f0a030", delay: "1.4s",  rot: 35 },
          { x: "6%",   y: "45%", size: 8,  color: "#9060d0", delay: "0.4s",  rot: -10 },
          { x: "60%",  y: "38%", size: 5,  color: "#e04080", delay: "2.0s",  rot: 50 },
          { x: "35%",  y: "62%", size: 6,  color: "#30c080", delay: "1.1s",  rot: -30 },
          { x: "82%",  y: "58%", size: 7,  color: "#d060c0", delay: "0.6s",  rot: 25 },
          { x: "22%",  y: "80%", size: 5,  color: "#4080e0", delay: "1.7s",  rot: -45 },
          { x: "65%",  y: "88%", size: 6,  color: "#e08030", delay: "0.3s",  rot: 10 },
          { x: "48%",  y: "18%", size: 4,  color: "#c050a0", delay: "2.3s",  rot: 60 },
          { x: "92%",  y: "72%", size: 5,  color: "#50b0d0", delay: "1.5s",  rot: -15 },
          { x: "15%",  y: "25%", size: 4,  color: "#f0c040", delay: "0.9s",  rot: 40 },
        ].map((star, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              pointerEvents: "none",
              zIndex: 0,
              animation: `starTwinkle ${2.5 + i * 0.3}s ease-in-out infinite`,
              animationDelay: star.delay,
            }}
          >
            <svg viewBox="0 0 10 10" width={star.size} height={star.size}>
              <polygon
                points="5,0 6.2,3.8 10,3.8 7,6.2 8.1,10 5,7.6 1.9,10 3,6.2 0,3.8 3.8,3.8"
                fill={star.color}
                opacity="0.85"
                transform={`rotate(${star.rot}, 5, 5)`}
              />
            </svg>
          </div>
        ))}
        {/* Repeating ruled lines overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            transparent,
            transparent ${STRIP_H - 1}px,
            oklch(0.78 0.020 300 / 0.20) ${STRIP_H - 1}px,
            oklch(0.78 0.020 300 / 0.20) ${STRIP_H}px
          )`,
          pointerEvents: "none",
          zIndex: 0,
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
        {allStrips.map((text, i) => {
          const s = stripStates[i] ?? "attached";
          const isActive = i === activeIdx;
          return (
            <TearStrip
              key={i}
              text={text}
              index={i}
              state={s}
              isActive={isActive}
              progress={isActive && running ? stripProgress : (isActive ? 0 : 0)}
            />
          );
        })}
        </div>
      </div>

      {/* ── Add item ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderTop: `1px dashed ${C.border}`,
        background: "oklch(0.96 0.018 300 / 0.85)",
      }}>
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addItem()}
          placeholder="add something to let go of…"
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: C.ink,
            letterSpacing: "0.06em",
          }}
        />
        <button
          onClick={addItem}
          style={{
            width: 20, height: 20,
            background: C.accent,
            border: "none",
            borderRadius: 2,
            color: "oklch(0.97 0.010 70)",
            fontSize: 14,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >+</button>
      </div>

      {/* ── Footer / Start button ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderTop: `1px solid ${C.border}`,
        background: "linear-gradient(135deg, oklch(0.95 0.025 310) 0%, oklch(0.97 0.018 280) 100%)",
      }}>
        <button
          onClick={handleStart}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 16px",
            background: phase === "complete" ? "oklch(0.52 0.14 145)" : C.accent,
            color: "oklch(0.97 0.010 70)",
            border: "none",
            borderRadius: 3,
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontWeight: 700,
            boxShadow: "2px 2px 0 oklch(0.30 0.018 55 / 0.20)",
          }}
        >
          {phase === "complete" ? "▶ AGAIN" : running ? "⏸ PAUSE" : "▶ START"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Progress dots */}
          <div style={{ display: "flex", gap: 4 }}>
            {allStrips.slice(0, Math.min(allStrips.length, 8)).map((_, i) => (
              <div key={i} style={{
                width: 6, height: 6,
                borderRadius: "50%",
                background: i < tornCount
                  ? C.accent
                  : i === activeIdx
                    ? "oklch(0.72 0.040 68)"
                    : "oklch(0.84 0.014 68)",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
          <span style={{ fontSize: 8, color: C.muted, letterSpacing: "0.06em" }}>
            {tornCount}/{allStrips.length}
          </span>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div style={{
        padding: "4px 12px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "space-between",
        background: "oklch(0.94 0.022 300 / 0.90)",
      }}>
        <span style={{ fontSize: 7.5, color: C.muted, letterSpacing: "0.08em" }}>
          {durationMinutes} MIN · FOCUS
        </span>
        <span style={{ fontSize: 7.5, color: C.muted, letterSpacing: "0.08em" }}>
          {tornCount}/{allStrips.length} STRIPS TORN
        </span>
      </div>
    </div>
  );
}

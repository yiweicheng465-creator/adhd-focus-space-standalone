/*
 * TIMER PROTOTYPE SHOWCASE
 * Design: Morandi palette — terracotta #C8603A, sage #8B9E7A, cream #F5EFE6, warm brown #5C3D2E
 * 4 distinct timer designs for user selection before integrating into main app.
 */

import { useState, useEffect, useRef } from "react";
import { PaperTearTimer } from "@/components/PaperTearTimer";
import { CyberPetTimer } from "@/components/CyberPetTimer";

// ─── Shared helpers ───────────────────────────────────────────────────────────
const DEMO_TOTAL = 25 * 60; // 25 min demo

function useCountdown(total: number) {
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && remaining > 0) {
      ref.current = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running, remaining]);

  const toggle = () => setRunning((r) => !r);
  const reset = () => { setRunning(false); setRemaining(total); };
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = (total - remaining) / total; // 0→1

  return { remaining, running, toggle, reset, mm, ss, progress };
}

// ─── PROTOTYPE A: Gradient Big Number ─────────────────────────────────────────
function ProtoA() {
  const { running, toggle, reset, mm, ss, progress } = useCountdown(DEMO_TOTAL);
  return (
    <div className="proto-card" style={{ background: "linear-gradient(135deg, #C8603A 0%, #D4845A 40%, #E8A87C 70%, #B08090 100%)", borderRadius: 20, padding: 0, overflow: "hidden", position: "relative", minHeight: 340 }}>
      <div style={{ position: "absolute", top: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,200,150,0.25)", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", bottom: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(180,120,140,0.3)", filter: "blur(35px)" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 32px", gap: 8 }}>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, letterSpacing: 3, textTransform: "uppercase", fontFamily: "system-ui", margin: 0 }}>Focus Session</p>
        <div style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui", fontWeight: 700, fontSize: 88, lineHeight: 1, color: "#fff", letterSpacing: -4, textShadow: "0 4px 24px rgba(0,0,0,0.15)" }}>
          {mm}:{ss}
        </div>
        <div style={{ width: "100%", maxWidth: 260, height: 3, background: "rgba(255,255,255,0.25)", borderRadius: 2, marginTop: 8 }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: "#fff", borderRadius: 2, transition: "width 1s linear" }} />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button onClick={toggle} style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 50, padding: "10px 28px", fontSize: 14, cursor: "pointer", backdropFilter: "blur(8px)", fontWeight: 600 }}>
            {running ? "Pause" : "Start"}
          </button>
          <button onClick={reset} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.7)", borderRadius: 50, padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PROTOTYPE B: Tomato Pomodoro ─────────────────────────────────────────────
function ProtoB() {
  const { running, toggle, reset, mm, ss, progress } = useCountdown(DEMO_TOTAL);
  const R = 90;
  const cx = 120, cy = 115;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference * progress;

  return (
    <div className="proto-card" style={{ background: "#F5EFE6", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px 24px", gap: 0 }}>
      <p style={{ color: "#8B9E7A", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px", fontFamily: "system-ui" }}>Pomodoro</p>
      <svg width="240" height="220" viewBox="0 0 240 220" style={{ overflow: "visible" }}>
        <rect x="117" y="12" width="6" height="22" rx="3" fill="#5C3D2E" />
        <path d="M120 20 Q108 8 96 14 Q104 22 120 20Z" fill="#8B9E7A" />
        <path d="M120 20 Q132 8 144 14 Q136 22 120 20Z" fill="#8B9E7A" />
        <path d="M120 20 Q112 4 118 0 Q124 4 120 20Z" fill="#6B8A5E" />
        <path d="M120 20 Q128 4 122 0 Q116 4 120 20Z" fill="#6B8A5E" />
        <circle cx={cx} cy={cy} r={R} fill="#C8603A" />
        <ellipse cx="88" cy="78" rx="14" ry="22" fill="rgba(255,255,255,0.18)" transform="rotate(-20 88 78)" />
        <circle cx={cx} cy={cy} r={R - 8} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="14" />
        <circle cx={cx} cy={cy} r={R - 8} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="14"
          strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dashoffset 1s linear" }} />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize="32" fontWeight="700" fontFamily="'SF Pro Display', system-ui" letterSpacing="-1">{mm}:{ss}</text>
        <text x={cx} y={cy + 18} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11" fontFamily="system-ui" letterSpacing="2">FOCUS</text>
      </svg>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button onClick={toggle} style={{ background: "#C8603A", border: "none", color: "#fff", borderRadius: 50, padding: "10px 28px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={reset} style={{ background: "transparent", border: "1.5px solid #C8603A", color: "#C8603A", borderRadius: 50, padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── PROTOTYPE C: Cat Companion (Enhanced) ────────────────────────────────────
// Inspired by: peeking cat, headphone focus cat, "you can do this" sticky note cat
// Cat states: idle (big eyes + sticky note), running (squint + headphones), done (happy closed eyes), peek (last 60s)

type CatState = "idle" | "running" | "done" | "peek";

function CatSVG({ state, blink }: { state: CatState; blink: boolean }) {
  const CAT = "#9C8B7A";        // warm grey-brown (like the "you can do this" cat)
  const CAT_DARK = "#4A3728";   // outline / dark areas
  const EAR_INNER = "#C8A0A0";  // dusty rose inner ear
  const EYE_BG = "#F5EFE6";     // cream eye whites
  const PUPIL = "#2A1A0E";
  const NOSE = "#C8603A";
  const NOTE = "#F0D898";       // warm yellow sticky note
  const NOTE_TEXT = "#5C3D2E";

  // Peeking: just ears + top of head over the card edge
  if (state === "peek") {
    return (
      <svg width="200" height="80" viewBox="0 0 200 80" style={{ display: "block" }}>
        {/* Left ear */}
        <path d="M58 78 Q46 34 66 10 Q78 32 80 78Z" fill={CAT} stroke={CAT_DARK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M63 72 Q54 38 67 18 Q74 36 75 72Z" fill={EAR_INNER} opacity="0.65" />
        {/* Right ear */}
        <path d="M142 78 Q154 34 134 10 Q122 32 120 78Z" fill={CAT} stroke={CAT_DARK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M137 72 Q146 38 133 18 Q126 36 125 72Z" fill={EAR_INNER} opacity="0.65" />
        {/* Top of head arc */}
        <path d="M58 78 Q100 18 142 78Z" fill={CAT} stroke={CAT_DARK} strokeWidth="2.5" />
        {/* Big eyes peeking over */}
        <circle cx="78" cy="68" r="11" fill={EYE_BG} stroke={CAT_DARK} strokeWidth="1.5" />
        <circle cx="122" cy="68" r="11" fill={EYE_BG} stroke={CAT_DARK} strokeWidth="1.5" />
        <circle cx="78" cy="70" r="6" fill={PUPIL} />
        <circle cx="122" cy="70" r="6" fill={PUPIL} />
        <circle cx="81" cy="67" r="2.5" fill="rgba(255,255,255,0.85)" />
        <circle cx="125" cy="67" r="2.5" fill="rgba(255,255,255,0.85)" />
      </svg>
    );
  }

  return (
    <svg width="200" height="220" viewBox="0 0 200 220" style={{ display: "block" }}>
      {/* Tail curling to the right */}
      <path d="M138 170 Q175 158 178 128 Q180 108 162 104" fill="none" stroke={CAT} strokeWidth="16" strokeLinecap="round" />
      <path d="M138 170 Q175 158 178 128 Q180 108 162 104" fill="none" stroke={CAT_DARK} strokeWidth="2" strokeLinecap="round" opacity="0.25" />

      {/* Body — chonky rounded shape */}
      <ellipse cx="100" cy="160" rx="56" ry="48" fill={CAT} />
      <ellipse cx="100" cy="160" rx="56" ry="48" fill="none" stroke={CAT_DARK} strokeWidth="2.5" />

      {/* Belly patch */}
      <ellipse cx="100" cy="168" rx="30" ry="28" fill="#B8A898" opacity="0.45" />

      {/* Head */}
      <circle cx="100" cy="88" r="50" fill={CAT} />
      <circle cx="100" cy="88" r="50" fill="none" stroke={CAT_DARK} strokeWidth="2.5" />

      {/* Left ear */}
      <path d="M58 58 Q46 18 70 30 Q78 46 80 62Z" fill={CAT} stroke={CAT_DARK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M62 56 Q53 24 68 34 Q74 46 75 58Z" fill={EAR_INNER} opacity="0.65" />
      {/* Right ear */}
      <path d="M142 58 Q154 18 130 30 Q122 46 120 62Z" fill={CAT} stroke={CAT_DARK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M138 56 Q147 24 132 34 Q126 46 125 58Z" fill={EAR_INNER} opacity="0.65" />

      {/* Eyes — state-dependent */}
      {state === "done" ? (
        // Happy closed curved lines + rosy cheeks
        <>
          <path d="M74 88 Q84 78 94 88" fill="none" stroke={CAT_DARK} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M106 88 Q116 78 126 88" fill="none" stroke={CAT_DARK} strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="80" cy="98" rx="11" ry="7" fill="#E8A0A0" opacity="0.35" />
          <ellipse cx="120" cy="98" rx="11" ry="7" fill="#E8A0A0" opacity="0.35" />
        </>
      ) : state === "running" ? (
        // Focused squint eyes + headphones
        <>
          {blink ? (
            <>
              <path d="M74 88 Q84 84 94 88" fill="none" stroke={CAT_DARK} strokeWidth="3.5" strokeLinecap="round" />
              <path d="M106 88 Q116 84 126 88" fill="none" stroke={CAT_DARK} strokeWidth="3.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Half-closed squinting eyes */}
              <path d="M74 90 Q84 80 94 90" fill={CAT_DARK} />
              <path d="M106 90 Q116 80 126 90" fill={CAT_DARK} />
              <path d="M74 90 Q84 95 94 90" fill={CAT} />
              <path d="M106 90 Q116 95 126 90" fill={CAT} />
              {/* Small pupils */}
              <circle cx="84" cy="87" r="4" fill={PUPIL} />
              <circle cx="116" cy="87" r="4" fill={PUPIL} />
              {/* Concentration lines — like the headphone cat */}
              <line x1="68" y1="82" x2="62" y2="78" stroke={CAT_DARK} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="70" y1="86" x2="63" y2="85" stroke={CAT_DARK} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="132" y1="82" x2="138" y2="78" stroke={CAT_DARK} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="130" y1="86" x2="137" y2="85" stroke={CAT_DARK} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </>
          )}
          {/* Headphones arc over head */}
          <path d="M50 82 Q50 46 100 46 Q150 46 150 82" fill="none" stroke={CAT_DARK} strokeWidth="6" strokeLinecap="round" />
          {/* Ear cups */}
          <rect x="40" y="76" width="18" height="24" rx="9" fill={CAT_DARK} />
          <rect x="142" y="76" width="18" height="24" rx="9" fill={CAT_DARK} />
          <rect x="43" y="80" width="12" height="16" rx="6" fill="#3A2818" />
          <rect x="145" y="80" width="12" height="16" rx="6" fill="#3A2818" />
        </>
      ) : (
        // Idle — big round cute eyes
        <>
          {blink ? (
            <>
              <path d="M74 88 Q84 84 94 88" fill="none" stroke={CAT_DARK} strokeWidth="3.5" strokeLinecap="round" />
              <path d="M106 88 Q116 84 126 88" fill="none" stroke={CAT_DARK} strokeWidth="3.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="84" cy="88" r="14" fill={EYE_BG} stroke={CAT_DARK} strokeWidth="2" />
              <circle cx="116" cy="88" r="14" fill={EYE_BG} stroke={CAT_DARK} strokeWidth="2" />
              <circle cx="84" cy="88" r="8" fill={PUPIL} />
              <circle cx="116" cy="88" r="8" fill={PUPIL} />
              {/* Shine spots */}
              <circle cx="88" cy="83" r="3.5" fill="rgba(255,255,255,0.85)" />
              <circle cx="120" cy="83" r="3.5" fill="rgba(255,255,255,0.85)" />
              <circle cx="81" cy="91" r="1.5" fill="rgba(255,255,255,0.5)" />
              <circle cx="113" cy="91" r="1.5" fill="rgba(255,255,255,0.5)" />
            </>
          )}
        </>
      )}

      {/* Nose */}
      <path d="M100 104 L95 111 L105 111 Z" fill={NOSE} />
      {/* Mouth */}
      {state === "done" ? (
        <path d="M93 113 Q100 122 107 113" fill="none" stroke={CAT_DARK} strokeWidth="2.5" strokeLinecap="round" />
      ) : (
        <path d="M95 113 Q100 118 105 113" fill="none" stroke={CAT_DARK} strokeWidth="2" strokeLinecap="round" />
      )}

      {/* Whiskers */}
      <line x1="100" y1="107" x2="58" y2="96" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="100" y1="110" x2="55" y2="110" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="100" y1="113" x2="60" y2="122" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="100" y1="107" x2="142" y2="96" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="100" y1="110" x2="145" y2="110" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="100" y1="113" x2="140" y2="122" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />

      {/* Sticky note on head — idle and done states */}
      {(state === "idle" || state === "done") && (
        <g transform="translate(100, 42) rotate(-7)">
          {/* Shadow */}
          <rect x="-30" y="-30" width="60" height="56" rx="3" fill="rgba(0,0,0,0.10)" transform="translate(2,2)" />
          {/* Note body */}
          <rect x="-30" y="-30" width="60" height="56" rx="3" fill={NOTE} />
          {/* Ruled lines */}
          <line x1="-20" y1="-12" x2="20" y2="-12" stroke={NOTE_TEXT} strokeWidth="1.5" opacity="0.25" />
          <line x1="-20" y1="-3" x2="20" y2="-3" stroke={NOTE_TEXT} strokeWidth="1.5" opacity="0.25" />
          <line x1="-20" y1="6" x2="20" y2="6" stroke={NOTE_TEXT} strokeWidth="1.5" opacity="0.25" />
          {/* Note text */}
          <text x="0" y="-18" textAnchor="middle" fill={NOTE_TEXT} fontSize="9" fontWeight="800" fontFamily="system-ui" letterSpacing="0.5">
            {state === "done" ? "GREAT" : "YOU CAN"}
          </text>
          <text x="0" y="-7" textAnchor="middle" fill={NOTE_TEXT} fontSize="9" fontWeight="800" fontFamily="system-ui" letterSpacing="0.5">
            {state === "done" ? "JOB!" : "DO THIS"}
          </text>
          <text x="0" y="4" textAnchor="middle" fill={NOTE_TEXT} fontSize="9" fontWeight="800" fontFamily="system-ui" letterSpacing="0.5">
            {state === "done" ? "✓ Rest" : ":)"}
          </text>
          {/* Tape strip at top */}
          <rect x="-14" y="-34" width="28" height="8" rx="2" fill="rgba(200,160,112,0.55)" />
        </g>
      )}

      {/* Paws */}
      <ellipse cx="70" cy="202" rx="20" ry="11" fill={CAT} stroke={CAT_DARK} strokeWidth="2" />
      <ellipse cx="130" cy="202" rx="20" ry="11" fill={CAT} stroke={CAT_DARK} strokeWidth="2" />
      {/* Toe lines */}
      <line x1="64" y1="197" x2="64" y2="206" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="70" y1="196" x2="70" y2="206" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="76" y1="197" x2="76" y2="206" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="124" y1="197" x2="124" y2="206" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="130" y1="196" x2="130" y2="206" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="136" y1="197" x2="136" y2="206" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function ProtoC() {
  const { running, toggle, reset, mm, ss, remaining } = useCountdown(DEMO_TOTAL);
  const [blink, setBlink] = useState(false);
  const [task, setTask] = useState("");
  const [taskSet, setTaskSet] = useState(false);

  const catState: CatState =
    remaining === 0 ? "done" :
    running && remaining < 90 ? "peek" :   // last 90s: peeking!
    running ? "running" : "idle";

  // Cat blinks — slower when focused
  useEffect(() => {
    const interval = running ? 7000 : 3500;
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, interval);
    return () => clearInterval(id);
  }, [running]);

  const encouragements = [
    "You've got this!", "Stay with it!", "One step at a time.",
    "Deep breaths.", "You're doing great!", "Keep going!"
  ];
  const [encourageIdx] = useState(() => Math.floor(Math.random() * encouragements.length));

  return (
    <div className="proto-card" style={{
      background: "#F5EFE6",
      borderRadius: 20,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px 20px 24px",
      gap: 0,
      overflow: "hidden",
      position: "relative",
    }}>

      {/* Cat — peeking variant overlaps the card top */}
      {catState === "peek" ? (
        <div style={{ width: "100%", position: "relative", height: 0, zIndex: 2, marginBottom: 0 }}>
          <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)" }}>
            <CatSVG state="peek" blink={blink} />
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: -6 }}>
          <CatSVG state={catState} blink={blink} />
        </div>
      )}

      {/* Timer card */}
      <div style={{
        background: catState === "done" ? "#EFF5E8" : "#fff",
        borderRadius: 16,
        padding: "22px 28px 20px",
        width: "100%",
        maxWidth: 300,
        textAlign: "center",
        boxShadow: "0 2px 18px rgba(92,61,46,0.10)",
        transition: "background 0.6s ease",
        position: "relative",
        zIndex: 1,
        marginTop: catState === "peek" ? 72 : 0,
      }}>
        {/* Mode label */}
        <p style={{ color: "#8B9E7A", fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", margin: "0 0 2px", fontFamily: "system-ui" }}>
          {catState === "done" ? "Session complete!" : running ? "focusing" : "ready to start"}
        </p>

        {/* Big time display */}
        <div style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontWeight: 400,
          fontSize: 62,
          color: catState === "done" ? "#8B9E7A" : "#C8603A",
          letterSpacing: -3,
          lineHeight: 1,
          transition: "color 0.5s",
        }}>
          {mm}:{ss}
        </div>

        {/* Task intention */}
        {!taskSet && !running && remaining === DEMO_TOTAL ? (
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && task.trim() && setTaskSet(true)}
            placeholder="What will you focus on?"
            style={{
              width: "100%",
              border: "none",
              borderBottom: "1.5px solid #E8D8C8",
              background: "transparent",
              textAlign: "center",
              fontSize: 12,
              color: "#5C3D2E",
              padding: "6px 0",
              outline: "none",
              fontStyle: "italic",
              marginTop: 10,
              marginBottom: 2,
              boxSizing: "border-box",
            }}
          />
        ) : task ? (
          <p style={{ color: "#8B9E7A", fontSize: 12, margin: "8px 0 0", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {catState === "done" ? `✓ ${task}` : `→ ${task}`}
          </p>
        ) : (
          <p style={{ color: "#C8A870", fontSize: 11, margin: "8px 0 0", fontStyle: "italic" }}>
            {running ? encouragements[encourageIdx] : "What would you like to accomplish?"}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {remaining > 0 && (
            <button
              onClick={() => { if (!taskSet && task.trim()) setTaskSet(true); toggle(); }}
              style={{
                flex: 1,
                background: running ? "#F5EFE6" : "#C8603A",
                border: "none",
                color: running ? "#C8603A" : "#fff",
                borderRadius: 10,
                padding: "12px",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.2s",
                letterSpacing: 0.5,
              }}
            >
              {running ? "Pause" : "Start"}
            </button>
          )}
          <button
            onClick={() => { reset(); setTask(""); setTaskSet(false); }}
            style={{
              flex: remaining === 0 ? 2 : 1,
              background: "#F5EFE6",
              border: "none",
              color: "#8B9E7A",
              borderRadius: 10,
              padding: "12px",
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {remaining === 0 ? "New Session" : "Reset"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PROTOTYPE D: Balloon Focus ───────────────────────────────────────────────
function ProtoD() {
  const { running, toggle, reset, mm, ss, progress, remaining } = useCountdown(DEMO_TOTAL);
  const balloonScale = 1 - progress * 0.55;
  const balloonOpacity = 0.4 + (1 - progress) * 0.6;

  return (
    <div className="proto-card" style={{ background: "#F5EFE6", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px 28px", gap: 0, position: "relative", overflow: "hidden" }}>
      <p style={{ color: "#8B9E7A", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px", fontFamily: "system-ui" }}>Focus Balloon</p>
      <div style={{ transition: "transform 1s ease, opacity 1s ease", transform: `scale(${balloonScale})`, opacity: balloonOpacity, transformOrigin: "bottom center" }}>
        <svg width="160" height="200" viewBox="0 0 160 200">
          <ellipse cx="80" cy="85" rx="62" ry="72" fill="#C8603A" />
          <ellipse cx="58" cy="58" rx="16" ry="24" fill="rgba(255,255,255,0.2)" transform="rotate(-20 58 58)" />
          <path d="M72 157 Q80 165 88 157 Q84 162 80 168 Q76 162 72 157Z" fill="#A04828" />
          <path d="M80 168 Q72 185 80 200" fill="none" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" />
          <text x="80" y="78" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="600" fontFamily="system-ui" letterSpacing="1">MY FOCUS</text>
          <text x="80" y="100" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="700" fontFamily="'SF Pro Display', system-ui" letterSpacing="-1">{mm}:{ss}</text>
        </svg>
      </div>
      {remaining === 0 && (
        <p style={{ color: "#C8603A", fontSize: 13, fontWeight: 600, marginTop: -20, marginBottom: 8 }}>Session complete!</p>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: remaining === 0 ? 0 : -16 }}>
        <button onClick={toggle} style={{ background: "#C8603A", border: "none", color: "#fff", borderRadius: 50, padding: "10px 28px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={reset} style={{ background: "transparent", border: "1.5px solid #C8603A", color: "#C8603A", borderRadius: 50, padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>
          Reset
        </button>
      </div>
    </div>
  );
}


// ─── PROTOTYPE E: Balloon Inflate (grow to pop) ───────────────────────────────
// Balloon starts tiny, grows as focus time accumulates.
// On complete: hand with needle appears outside balloon (threatening — you earned it!).
// Styling: warm cream bg, flat illustration, bold text inside balloon, like the reference.
type BalloonInflateState = "idle" | "running" | "complete" | "popped";

function HandWithNeedle({ threatening = false }: { threatening?: boolean }) {
  // Flat illustrated hand holding a needle, pointing left toward the balloon
  // Skin: warm peach #E8A87C, outline: #8B5E3C
  const SKIN = "#E8A87C";
  const SKIN_DARK = "#C87850";
  const OUTLINE = "#8B5E3C";
  return (
    <svg width="110" height="90" viewBox="0 0 110 90" style={{ display: "block" }}>
      {/* Needle — long thin line pointing left */}
      <line x1="0" y1="44" x2="72" y2="44" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />
      {/* Needle eye hole */}
      <ellipse cx="70" cy="44" rx="3.5" ry="2" fill="none" stroke="#888" strokeWidth="1.2" />
      {/* Palm */}
      <ellipse cx="86" cy="50" rx="20" ry="18" fill={SKIN} />
      <ellipse cx="86" cy="50" rx="20" ry="18" fill="none" stroke={OUTLINE} strokeWidth="1.8" />
      {/* Thumb — pointing down-left */}
      <path d="M70 44 Q64 36 68 28 Q76 24 80 34 Q78 40 72 44Z" fill={SKIN} stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Index finger — extended forward holding needle */}
      <path d="M68 44 Q60 40 58 34 Q60 26 68 28 Q74 30 74 38 L72 44Z" fill={SKIN} stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Middle finger curled */}
      <path d="M72 56 Q66 50 68 42 Q74 38 78 44 Q80 50 76 56Z" fill={SKIN} stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Ring finger curled */}
      <path d="M80 60 Q76 54 78 48 Q84 46 88 52 Q90 58 86 62Z" fill={SKIN} stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Pinky */}
      <path d="M88 64 Q86 58 88 54 Q94 52 96 58 Q98 64 94 66Z" fill={SKIN} stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Knuckle shading */}
      <path d="M78 46 Q84 44 90 46" fill="none" stroke={SKIN_DARK} strokeWidth="1" opacity="0.4" />
      <path d="M80 52 Q86 50 92 52" fill="none" stroke={SKIN_DARK} strokeWidth="1" opacity="0.4" />
      {/* Wrist */}
      <path d="M96 38 Q108 40 110 50 Q108 62 96 64 L92 60 Q102 50 92 40Z" fill={SKIN} stroke={OUTLINE} strokeWidth="1.5" />
    </svg>
  );
}

function BalloonSVG({ scale, label, color, showHighlight = true }: { scale: number; label: string; color: string; showHighlight?: boolean }) {
  // Flat balloon illustration matching reference image style
  // scale: 0→1, 0 = tiny, 1 = full size
  const s = Math.max(0.12, scale);
  const rx = 62 * s;
  const ry = 72 * s;
  const cx = 80;
  const cy = 85;
  // Knot position at bottom of balloon
  const knotY = cy + ry;
  const knotSize = 7 * s;
  // String
  const stringY1 = knotY + knotSize;
  const stringY2 = 195;
  // Highlight
  const hlRx = 14 * s;
  const hlRy = 22 * s;
  const hlCx = cx - rx * 0.35;
  const hlCy = cy - ry * 0.25;

  return (
    <svg width="160" height="210" viewBox="0 0 160 210" style={{ display: "block", overflow: "visible" }}>
      {/* Balloon body */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} />
      {/* Highlight */}
      {showHighlight && s > 0.3 && (
        <ellipse cx={hlCx} cy={hlCy} rx={hlRx} ry={hlRy} fill="rgba(255,255,255,0.28)" transform={`rotate(-20 ${hlCx} ${hlCy})`} />
      )}
      {/* Knot */}
      {s > 0.15 && (
        <path
          d={`M${cx - knotSize} ${knotY} Q${cx} ${knotY + knotSize * 1.4} ${cx + knotSize} ${knotY} Q${cx} ${knotY + knotSize * 0.6} ${cx - knotSize} ${knotY}Z`}
          fill={color}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="0.8"
        />
      )}
      {/* String */}
      {s > 0.15 && (
        <path d={`M${cx} ${stringY1} Q${cx - 12} ${(stringY1 + stringY2) / 2} ${cx} ${stringY2}`} fill="none" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" />
      )}
      {/* Label text inside balloon */}
      {s > 0.45 && (
        <>
          <text x={cx} y={cy - 8} textAnchor="middle" fill="#fff" fontSize={Math.round(13 * s)} fontWeight="700" fontFamily="'Playfair Display', Georgia, serif" letterSpacing="0.5">
            {label}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize={Math.round(11 * s)} fontFamily="system-ui" letterSpacing="1">
            FOCUS
          </text>
        </>
      )}
    </svg>
  );
}

function ProtoE() {
  const TOTAL = 5 * 60; // 5 min demo for faster testing
  const [remaining, setRemaining] = useState(TOTAL);
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<BalloonInflateState>("idle");
  const [popped, setPopped] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = (TOTAL - remaining) / TOTAL; // 0→1 elapsed
  const balloonScale = 0.12 + progress * 0.88; // tiny→full
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  useEffect(() => {
    if (running && remaining > 0) {
      ref.current = setInterval(() => setRemaining((r) => {
        if (r <= 1) {
          clearInterval(ref.current!);
          setRunning(false);
          setState("complete");
          return 0;
        }
        return r - 1;
      }), 1000);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running, remaining]);

  const handleStart = () => {
    if (state === "complete" || state === "popped") return;
    setRunning((r) => !r);
    setState(running ? "idle" : "running");
  };

  const handleReset = () => {
    clearInterval(ref.current!);
    setRunning(false);
    setRemaining(TOTAL);
    setState("idle");
    setPopped(false);
  };

  // Balloon color: terracotta, deepens as it inflates
  const balloonColor = state === "complete" ? "#B05040" : "#C8603A";

  return (
    <div style={{ background: "#FAF0E8", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px 24px", gap: 0, position: "relative", overflow: "hidden", boxShadow: "0 4px 24px rgba(92,61,46,0.10)", minHeight: 420 }}>

      {/* Scene: balloon on left, hand on right when complete */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", width: "100%", minHeight: 230, position: "relative" }}>

        {/* Balloon */}
        <div style={{ transition: "transform 0.8s cubic-bezier(0.34,1.56,0.64,1)", transform: `scale(${state === "popped" ? 0 : 1})`, transformOrigin: "bottom center" }}>
          <BalloonSVG scale={balloonScale} label={mm + ":" + ss} color={balloonColor} />
        </div>

        {/* Hand with needle — slides in from right when complete */}
        <div style={{
          position: "absolute",
          right: state === "complete" ? 0 : -120,
          bottom: 80,
          transition: "right 0.9s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          <HandWithNeedle threatening={false} />
        </div>
      </div>

      {/* Time display below balloon */}
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <div style={{ fontSize: 38, fontWeight: 700, color: "#3D2B1F", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em", lineHeight: 1 }}>
          {mm}:{ss}
        </div>
        <p style={{ fontSize: 11, color: "#8B9E7A", margin: "6px 0 0", fontStyle: "italic", fontFamily: "'Playfair Display', serif" }}>
          {state === "complete"
            ? "You did it! Your balloon is fully inflated."
            : state === "running"
            ? "Keep going — your balloon is growing!"
            : "Start focusing to inflate your balloon."}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {state !== "complete" && (
          <button onClick={handleStart} style={{ background: "#C8603A", border: "none", color: "#fff", borderRadius: 50, padding: "10px 28px", fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily: "system-ui" }}>
            {running ? "Pause" : "Start"}
          </button>
        )}
        <button onClick={handleReset} style={{ background: "transparent", border: "1.5px solid #C8603A", color: "#C8603A", borderRadius: 50, padding: "10px 20px", fontSize: 13, cursor: "pointer", fontFamily: "system-ui" }}>
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── PROTOTYPE F: Balloon Deflate (air leaks out while focusing) ──────────────
// Balloon starts fully inflated. Air slowly escapes as focus progresses (balloon shrinks).
// If timer is abandoned (reset while running): hand drives needle in → balloon pops.
// Styling: white/light bg, flat outline balloon style (like the second reference image).
function SketchBalloon({ scale, timeLabel }: { scale: number; timeLabel: string }) {
  // Hand-painted sketch style balloon — wobbly paths, rough outline, golden fill
  const s = Math.max(0.15, scale);
  const cx = 100, cy = 95;
  const rx = 68 * s, ry = 80 * s;
  const knotY = cy + ry;
  const knotSize = 9 * s;
  const stringY1 = knotY + knotSize * 1.2;
  const stringY2 = 240;
  const FILL = "#E8C06A";
  const STROKE = "#2a1f14";
  const sw = 2.2; // stroke width — slightly thick for sketch feel

  // Wobbly balloon outline — hand-drawn feel using a cubic bezier path
  // Slightly asymmetric to look like it was drawn freehand
  const bPath = `
    M ${cx} ${cy - ry}
    C ${cx + rx * 1.18} ${cy - ry * 0.95},
      ${cx + rx * 1.22} ${cy + ry * 0.55},
      ${cx + rx * 0.12} ${cy + ry * 0.92}
    C ${cx - rx * 0.08} ${cy + ry * 1.02},
      ${cx - rx * 0.08} ${cy + ry * 1.02},
      ${cx - rx * 0.22} ${cy + ry * 0.90}
    C ${cx - rx * 1.28} ${cy + ry * 0.52},
      ${cx - rx * 1.20} ${cy - ry * 0.92},
      ${cx} ${cy - ry}
    Z
  `;

  // Highlight gloss — two small curved strokes inside upper-left
  const h1 = `M ${cx - rx * 0.38} ${cy - ry * 0.58} Q ${cx - rx * 0.22} ${cy - ry * 0.72} ${cx - rx * 0.05} ${cy - ry * 0.62}`;
  const h2 = `M ${cx - rx * 0.42} ${cy - ry * 0.38} Q ${cx - rx * 0.30} ${cy - ry * 0.48} ${cx - rx * 0.18} ${cy - ry * 0.40}`;

  return (
    <svg width="200" height="260" viewBox="0 0 200 260" style={{ display: "block", overflow: "visible" }}>
      {/* Balloon fill */}
      <path d={bPath} fill={FILL} />
      {/* Balloon outline — slightly rough */}
      <path d={bPath} fill="none" stroke={STROKE} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
      {/* Gloss highlights */}
      {s > 0.4 && (
        <>
          <path d={h1} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={sw * 0.9} strokeLinecap="round" />
          <path d={h2} fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth={sw * 0.7} strokeLinecap="round" />
        </>
      )}
      {/* Knot — arrow/diamond shape */}
      {s > 0.22 && (
        <path
          d={`M${cx - knotSize * 0.75} ${knotY} L${cx} ${knotY + knotSize * 1.3} L${cx + knotSize * 0.75} ${knotY} L${cx} ${knotY - knotSize * 0.25}Z`}
          fill={FILL}
          stroke={STROKE}
          strokeWidth={sw * 0.85}
          strokeLinejoin="round"
        />
      )}
      {/* String — slightly wavy */}
      {s > 0.22 && (
        <path
          d={`M${cx} ${stringY1} C${cx - 18} ${(stringY1 + stringY2) * 0.45} ${cx + 10} ${(stringY1 + stringY2) * 0.72} ${cx} ${stringY2}`}
          fill="none" stroke={STROKE} strokeWidth={sw * 0.75} strokeLinecap="round"
        />
      )}
      {/* Text inside */}
      {s > 0.5 && (
        <>
          <text x={cx} y={cy - 12} textAnchor="middle" fill={STROKE}
            fontSize={Math.round(15 * s)} fontWeight="800"
            fontFamily="'Playfair Display', Georgia, serif" letterSpacing="1">
            MY
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill={STROKE}
            fontSize={Math.round(15 * s)} fontWeight="800"
            fontFamily="'Playfair Display', Georgia, serif" letterSpacing="1">
            FOCUS
          </text>
          <text x={cx} y={cy + 30} textAnchor="middle" fill={STROKE}
            fontSize={Math.round(12 * s)} fontFamily="'JetBrains Mono', monospace" letterSpacing="1.5">
            {timeLabel}
          </text>
        </>
      )}
    </svg>
  );
}

function SketchNeedle({ touching }: { touching?: boolean }) {
  // Hand-drawn needle — thin converging lines, eye at right end
  // When touching=true the needle tip is at x=0 (balloon surface)
  const tipX = touching ? 2 : 0;
  return (
    <svg width="130" height="36" viewBox="0 0 130 36" style={{ display: "block" }}>
      {/* Upper line */}
      <path
        d={`M ${tipX} 16 C 30 14, 70 13, 112 18`}
        fill="none" stroke="#2a1f14" strokeWidth="1.8" strokeLinecap="round"
      />
      {/* Lower line */}
      <path
        d={`M ${tipX} 20 C 30 22, 70 23, 112 18`}
        fill="none" stroke="#2a1f14" strokeWidth="1.8" strokeLinecap="round"
      />
      {/* Eye of needle — oval at right */}
      <ellipse cx="118" cy="18" rx="5" ry="3" fill="none" stroke="#2a1f14" strokeWidth="1.6" />
      {/* Tiny hole in eye */}
      <ellipse cx="118" cy="18" rx="2" ry="1.2" fill="none" stroke="#2a1f14" strokeWidth="1" />
    </svg>
  );
}


// ── SceneSVG: balloon + needle in one SVG so needle always tracks balloon edge ──
// The balloon is drawn at scale `s` from its natural center (100, 95).
// The balloon right edge in SVG coords = cx + rx = 100 + 68*s.
// The needle tip is placed at (balloonRightEdge + needleGap) horizontally,
// vertically centered on the balloon center (cy = 95).
// The needle SVG is 130×36; we embed it via <image> or re-draw it inline.
function SceneSVG({
  balloonScale, timeLabel, showNeedle, touching,
}: {
  balloonScale: number;
  timeLabel: string;
  showNeedle: boolean;
  touching: boolean;
}) {
  const s = Math.max(0.15, balloonScale);
  const cx = 100, cy = 95;
  const rx = 68 * s, ry = 80 * s;
  const knotY = cy + ry;
  const knotSize = 9 * s;
  const stringY1 = knotY + knotSize * 1.2;
  const stringY2 = 240;
  const FILL = "#E8C06A";
  const STROKE = "#2a1f14";
  const sw = 2.2;

  const bPath = `
    M ${cx} ${cy - ry}
    C ${cx + rx * 1.18} ${cy - ry * 0.95},
      ${cx + rx * 1.22} ${cy + ry * 0.55},
      ${cx + rx * 0.12} ${cy + ry * 0.92}
    C ${cx - rx * 0.08} ${cy + ry * 1.02},
      ${cx - rx * 0.08} ${cy + ry * 1.02},
      ${cx - rx * 0.22} ${cy + ry * 0.90}
    C ${cx - rx * 1.28} ${cy + ry * 0.52},
      ${cx - rx * 1.20} ${cy - ry * 0.92},
      ${cx} ${cy - ry}
    Z
  `;
  const h1 = `M ${cx - rx * 0.38} ${cy - ry * 0.58} Q ${cx - rx * 0.22} ${cy - ry * 0.72} ${cx - rx * 0.05} ${cy - ry * 0.62}`;
  const h2 = `M ${cx - rx * 0.42} ${cy - ry * 0.38} Q ${cx - rx * 0.30} ${cy - ry * 0.48} ${cx - rx * 0.18} ${cy - ry * 0.40}`;

  // Needle geometry — tip at (needleTipX, cy), eye 130px to the right
  // Gap: when not touching start at 80px away, shrinks with progress; touching = -4 (overlapping)
  // We receive the gap via touching flag; balloonScale encodes progress implicitly
  // gap = touching ? -4 : lerp(80→10) based on balloonScale (1→0.15)
  const progressFromScale = (1 - balloonScale) / 0.85; // 0→1
  const needleGap = touching ? -4 : Math.max(10, 80 - progressFromScale * 70);
  const balloonRightEdge = cx + rx; // in SVG coords
  const needleTipX = balloonRightEdge + needleGap;
  const needleEyeX = needleTipX + 130;
  const needleY = cy; // vertically aligned to balloon center

  // SVG canvas wide enough to fit needle at full scale
  const svgW = 340;
  const svgH = 260;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Balloon fill */}
      <path d={bPath} fill={FILL} />
      {/* Balloon outline */}
      <path d={bPath} fill="none" stroke={STROKE} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
      {/* Gloss highlights */}
      {s > 0.4 && (
        <>
          <path d={h1} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={sw * 0.9} strokeLinecap="round" />
          <path d={h2} fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth={sw * 0.7} strokeLinecap="round" />
        </>
      )}
      {/* Knot */}
      {s > 0.22 && (
        <path
          d={`M${cx - knotSize * 0.75} ${knotY} L${cx} ${knotY + knotSize * 1.3} L${cx + knotSize * 0.75} ${knotY} L${cx} ${knotY - knotSize * 0.25}Z`}
          fill={FILL} stroke={STROKE} strokeWidth={sw * 0.85} strokeLinejoin="round"
        />
      )}
      {/* String */}
      {s > 0.22 && (
        <path
          d={`M${cx} ${stringY1} C${cx - 18} ${(stringY1 + stringY2) * 0.45} ${cx + 10} ${(stringY1 + stringY2) * 0.72} ${cx} ${stringY2}`}
          fill="none" stroke={STROKE} strokeWidth={sw * 0.75} strokeLinecap="round"
        />
      )}
      {/* Text inside balloon */}
      {s > 0.5 && (
        <>
          <text x={cx} y={cy - 12} textAnchor="middle" fill={STROKE}
            fontSize={Math.round(15 * s)} fontWeight="800"
            fontFamily="'Playfair Display', Georgia, serif" letterSpacing="1">
            MY
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill={STROKE}
            fontSize={Math.round(15 * s)} fontWeight="800"
            fontFamily="'Playfair Display', Georgia, serif" letterSpacing="1">
            FOCUS
          </text>
          <text x={cx} y={cy + 30} textAnchor="middle" fill={STROKE}
            fontSize={Math.round(12 * s)} fontFamily="'JetBrains Mono', monospace" letterSpacing="1.5">
            {timeLabel}
          </text>
        </>
      )}

      {/* Needle — drawn inline, tip tracks balloon right edge */}
      {showNeedle && (
        <g style={{
          transition: touching
            ? "transform 0.5s cubic-bezier(0.25, 0, 0.5, 1)"
            : "transform 0.4s ease-out",
        }}>
          {/* Upper line */}
          <path
            d={`M ${needleTipX} ${needleY - 2} C ${needleTipX + 30} ${needleY - 4}, ${needleTipX + 70} ${needleY - 5}, ${needleEyeX - 12} ${needleY}`}
            fill="none" stroke="#2a1f14" strokeWidth="1.8" strokeLinecap="round"
          />
          {/* Lower line */}
          <path
            d={`M ${needleTipX} ${needleY + 2} C ${needleTipX + 30} ${needleY + 4}, ${needleTipX + 70} ${needleY + 5}, ${needleEyeX - 12} ${needleY}`}
            fill="none" stroke="#2a1f14" strokeWidth="1.8" strokeLinecap="round"
          />
          {/* Eye */}
          <ellipse cx={needleEyeX - 6} cy={needleY} rx="5" ry="3" fill="none" stroke="#2a1f14" strokeWidth="1.6" />
          <ellipse cx={needleEyeX - 6} cy={needleY} rx="2" ry="1.2" fill="none" stroke="#2a1f14" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}

function SketchPopBurst() {
  // Hand-drawn starburst — irregular ray lengths, slightly rotated
  const rays = [
    [0, 18, 52], [28, 16, 44], [55, 20, 58], [82, 15, 48],
    [110, 22, 60], [138, 17, 50], [165, 21, 55], [195, 14, 46],
    [222, 19, 54], [250, 16, 42], [278, 23, 58], [308, 18, 50],
    [335, 20, 52],
  ];
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" style={{ display: "block" }}>
      {rays.map(([angle, r1, r2], i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 90 + r1 * Math.cos(rad), y1 = 90 + r1 * Math.sin(rad);
        const x2 = 90 + r2 * Math.cos(rad), y2 = 90 + r2 * Math.sin(rad);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={i % 3 === 0 ? "#C8603A" : i % 3 === 1 ? "#E8C06A" : "#2a1f14"}
            strokeWidth={1.8 + (i % 3) * 0.6} strokeLinecap="round" opacity="0.85" />
        );
      })}
      {/* Confetti dots */}
      {[30, 90, 150, 210, 270, 330].map((a, i) => {
        const r = 38 + (i % 2) * 10;
        const rad = (a * Math.PI) / 180;
        return <circle key={i} cx={90 + r * Math.cos(rad)} cy={90 + r * Math.sin(rad)} r={3.5}
          fill={i % 2 === 0 ? "#C8603A" : "#E8C06A"} opacity="0.9" />;
      })}
      <text x="90" y="97" textAnchor="middle" fill="#C8603A" fontSize="20" fontWeight="900"
        fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic">POP!</text>
    </svg>
  );
}

type BalloonDeflateState = "idle" | "running" | "complete" | "popping" | "popped";

function ProtoF() {
  const TOTAL = 5 * 60;
  const [remaining, setRemaining] = useState(TOTAL);
  const [running, setRunning] = useState(false);
  const [deflateState, setDeflateState] = useState<BalloonDeflateState>("idle");
  const [touching, setTouching] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = (TOTAL - remaining) / TOTAL; // 0→1 elapsed
  // Balloon deflates: starts full (scale 1), shrinks to 0.15 at end
  const balloonScale = deflateState === "popped" ? 0 : 1 - progress * 0.85;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  useEffect(() => {
    if (running && remaining > 0) {
      ref.current = setInterval(() => setRemaining((r) => {
        if (r <= 1) {
          clearInterval(ref.current!);
          setRunning(false);
          setDeflateState("complete");
          return 0;
        }
        return r - 1;
      }), 1000);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running, remaining]);

  const handleStart = () => {
    if (deflateState === "complete" || deflateState === "popped" || deflateState === "popping") return;
    const next = !running;
    setRunning(next);
    setDeflateState(next ? "running" : "idle");
  };

  const handleReset = () => {
    const wasRunning = running && progress > 0.05;
    clearInterval(ref.current!);
    setRunning(false);
    if (wasRunning) {
      // Step 1: needle slides to touch balloon
      setDeflateState("popping");
      setTouching(true);
      // Step 2: after 700ms needle has touched — pop!
      setTimeout(() => {
        setDeflateState("popped");
        setTouching(false);
        // Step 3: reset after showing burst
        setTimeout(() => {
          setRemaining(TOTAL);
          setDeflateState("idle");
        }, 2200);
      }, 700);
    } else {
      setRemaining(TOTAL);
      setDeflateState("idle");
    }
  };

  // Needle position:
  // idle → far right (off screen), needle eye at right
  // running → needle tip ~30px from balloon right edge, creeps closer as progress grows
  // popping/touching → needle tip AT balloon surface
  // popped → hidden
  const isVisible = deflateState === "running" || deflateState === "popping";
  // When running: start 80px away, end 10px away as progress goes 0→1
  const needleGap = touching ? -4 : Math.max(10, 80 - progress * 70);
  // needleGap = distance in px between needle tip and balloon right edge

  return (
    <div style={{
      background: "#FDFAF5",
      borderRadius: 20,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "32px 20px 24px",
      gap: 0,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(42,31,20,0.10)",
      minHeight: 440,
      border: "1px solid #e8dcc8",
    }}>

      {/* Scene — balloon + needle in a shared SVG coordinate space */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight: 260,
        position: "relative",
      }}>
        {deflateState === "popped" ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220 }}>
            <SketchPopBurst />
          </div>
        ) : (
          /* Unified SVG: balloon shrinks from its bottom-center anchor;
             needle tip is always computed from the actual balloon right-edge in SVG coords */
          <SceneSVG
            balloonScale={balloonScale}
            timeLabel={mm + ":" + ss}
            showNeedle={isVisible}
            touching={touching}
          />
        )}
      </div>

      {/* Time display */}
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <div style={{
          fontSize: 40,
          fontWeight: 700,
          color: "#2a1f14",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          {mm}:{ss}
        </div>
        <p style={{
          fontSize: 12,
          color: "#8B9E7A",
          margin: "8px 0 0",
          fontStyle: "italic",
          fontFamily: "'Playfair Display', serif",
          maxWidth: 230,
          textAlign: "center",
          lineHeight: 1.5,
        }}>
          {deflateState === "complete"
            ? "All the air is out. Session complete!"
            : deflateState === "popped" || deflateState === "popping"
            ? "Your focus balloon popped. Try again!"
            : deflateState === "running"
            ? "Stay focused — the needle is watching..."
            : "Start the timer — breathe out your stress, one second at a time."}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        {deflateState !== "complete" && deflateState !== "popped" && deflateState !== "popping" && (
          <button
            onClick={handleStart}
            style={{
              background: "#2a1f14",
              border: "none",
              color: "#fff",
              borderRadius: 50,
              padding: "10px 28px",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 600,
              fontFamily: "'DM Sans', system-ui",
            }}
          >
            {running ? "Pause" : "Start"}
          </button>
        )}
        <button
          onClick={handleReset}
          style={{
            background: "transparent",
            border: "1.5px solid #2a1f14",
            color: "#2a1f14",
            borderRadius: 50,
            padding: "10px 20px",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "'DM Sans', system-ui",
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── Main showcase page ───────────────────────────────────────────────────────

/* ============================================================
   SHARED — ElegantNeedle helper (sewing needle, no connecting line)
   ============================================================ */
function ElegantNeedle({ size = 180, angle = 0, opacity = 1 }: { size?: number; angle?: number; opacity?: number }) {
  return (
    <svg width={size} height={size * 0.22} viewBox="0 0 200 44"
      style={{ display: "block", opacity, transform: `rotate(${angle}deg)`, transformOrigin: "center" }}>
      {/* Needle body — tapered from eye end to sharp tip */}
      <path d="M 170,22 C 155,19 100,20 30,21.5 C 10,22 2,22 1,22 C 2,22 10,22 30,22.5 C 100,24 155,25 170,22 Z" fill="#1a1a1a" />
      {/* Eye — oval at thick end */}
      <ellipse cx="175" cy="22" rx="11" ry="7" fill="none" stroke="#1a1a1a" strokeWidth="2.5" />
      <ellipse cx="175" cy="22" rx="5.5" ry="3.5" fill="#f5ede2" />
      {/* Subtle shine on body */}
      <path d="M 70,20.5 C 100,19.5 145,19.5 168,20.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/* ============================================================
   PROTO G — Golden Balloon (warm golden, FOCUS text, elegant needle)
   ============================================================ */
function ProtoG() {
  const DURATION = 5 * 60;
  const [seconds, setSeconds] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const [popped, setPopped] = useState(false);
  const [popAnim, setPopAnim] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = seconds / DURATION;
  const elapsed = DURATION - seconds;
  const elapsedFrac = elapsed / DURATION;
  // Needle starts at x=390, creeps to x=290 as balloon shrinks
  const needleX = 390 - elapsedFrac * 100;
  const r = 110 * progress;
  const cx = 155; const cy = 130;
  const face = popped ? "none" : running ? "calm" : elapsed > 0 ? "worried" : "none";

  useEffect(() => {
    if (running && !popped) {
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { clearInterval(timerRef.current!); setRunning(false); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, popped]);

  function handleReset() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (elapsed > DURATION * 0.05 && !popped) {
      setRunning(false); setPopAnim(true);
      setTimeout(() => { setPopped(true); setPopAnim(false); }, 600);
      setTimeout(() => { setPopped(false); setSeconds(DURATION); }, 2800);
    } else { setRunning(false); setSeconds(DURATION); setPopped(false); }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{ background: "#f5ede2", borderRadius: 20, padding: "28px 20px 24px", fontFamily: "'DM Sans',system-ui", minHeight: 380 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <svg width="500" height="300" viewBox="0 0 500 300" style={{ overflow: "visible" }}>
          {popped ? (
            <g>
              {[0,40,80,120,160,200,240,280,320].map((a, i) => (
                <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a*Math.PI/180)*70} y2={cy + Math.sin(a*Math.PI/180)*70} stroke="#C8603A" strokeWidth="3" strokeLinecap="round" />
              ))}
              <text x={cx} y={cy+8} textAnchor="middle" fontFamily="'Playfair Display',serif" fontSize="22" fontWeight="700" fill="#C8603A">POP!</text>
            </g>
          ) : (
            <g>
              {/* String */}
              <path d={`M ${cx},${cy+r} C ${cx-8},${cy+r+28} ${cx+8},${cy+r+52} ${cx},${cy+r+82}`} fill="none" stroke="#2a1a0e" strokeWidth="1.8" strokeLinecap="round" />
              {/* Balloon body */}
              <ellipse cx={cx} cy={cy} rx={r*0.88} ry={r} fill={popAnim ? "#C8603A" : "#D4A96A"} />
              <ellipse cx={cx} cy={cy} rx={r*0.88} ry={r} fill="none" stroke="#2a1a0e" strokeWidth="2.2" />
              {/* Highlight */}
              {progress > 0.15 && <ellipse cx={cx-r*0.28} cy={cy-r*0.32} rx={r*0.18} ry={r*0.11} fill="#E8C98A" opacity="0.7" transform={`rotate(-20,${cx-r*0.28},${cy-r*0.32})`} />}
              {/* Knot */}
              {progress > 0.2 && <path d={`M ${cx-7*progress},${cy+r-4} Q ${cx},${cy+r+8} ${cx+7*progress},${cy+r-4}`} fill="#D4A96A" stroke="#2a1a0e" strokeWidth="1.8" />}
              {/* Face */}
              {face === "calm" && progress > 0.3 && <>
                <path d={`M ${cx-r*0.18},${cy-r*0.05} Q ${cx-r*0.12},${cy-r*0.13} ${cx-r*0.06},${cy-r*0.05}`} fill="none" stroke="#2a1a0e" strokeWidth="2" strokeLinecap="round" />
                <path d={`M ${cx+r*0.06},${cy-r*0.05} Q ${cx+r*0.12},${cy-r*0.13} ${cx+r*0.18},${cy-r*0.05}`} fill="none" stroke="#2a1a0e" strokeWidth="2" strokeLinecap="round" />
                <path d={`M ${cx-r*0.12},${cy+r*0.12} Q ${cx},${cy+r*0.22} ${cx+r*0.12},${cy+r*0.12}`} fill="none" stroke="#2a1a0e" strokeWidth="2" strokeLinecap="round" />
              </>}
              {face === "worried" && progress > 0.3 && <>
                <circle cx={cx-r*0.14} cy={cy-r*0.06} r={r*0.04} fill="#2a1a0e" />
                <circle cx={cx+r*0.14} cy={cy-r*0.06} r={r*0.04} fill="#2a1a0e" />
                <path d={`M ${cx-r*0.12},${cy+r*0.16} Q ${cx},${cy+r*0.09} ${cx+r*0.12},${cy+r*0.16}`} fill="none" stroke="#2a1a0e" strokeWidth="2" strokeLinecap="round" />
              </>}
              {/* Timer text */}
              {progress > 0.25 && <>
                <text x={cx} y={cy-r*0.08} textAnchor="middle" fontFamily="'DM Sans',system-ui" fontSize="11" fontWeight="700" fill="#2a1a0e" letterSpacing="3" opacity="0.75">FOCUS</text>
                <text x={cx} y={cy+r*0.14} textAnchor="middle" fontFamily="'Playfair Display',serif" fontSize="22" fontWeight="700" fill="#2a1a0e">{mm}:{ss}</text>
              </>}
            </g>
          )}
          {/* Elegant needle — no connecting line */}
          {!popped && (
            <g transform={`translate(${needleX},122)`} style={{ transition: running ? "transform 1s linear" : "none" }}>
              <ElegantNeedle size={160} angle={0} opacity={running || elapsed > 0 ? 1 : 0.3} />
            </g>
          )}
        </svg>
      </div>
      <p style={{ textAlign: "center", fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 13, color: "#8B7355", margin: "0 0 16px" }}>
        {popped ? "The balloon popped — try again." : seconds === 0 ? "Session complete! Stress released." : running ? "Breathe. The needle is patient." : elapsed > 0 ? "Paused — the needle is waiting. Don't let it win." : "Start to let the stress out slowly."}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={() => setRunning(r => !r)} disabled={popped || seconds === 0} style={{ padding: "8px 22px", borderRadius: 30, border: "none", cursor: "pointer", background: running ? "#8B9E7A" : "#C8603A", color: "#fff", fontWeight: 600, fontSize: 13, letterSpacing: 1 }}>{running ? "PAUSE" : "START"}</button>
        <button onClick={handleReset} style={{ padding: "8px 22px", borderRadius: 30, border: "1.5px solid #C8603A", cursor: "pointer", background: "transparent", color: "#C8603A", fontWeight: 600, fontSize: 13, letterSpacing: 1 }}>RESET</button>
      </div>
    </div>
  );
}

/* ============================================================
   PROTO H — Round Coral Balloon (cute round, face, coral fill)
   ============================================================ */
function ProtoH() {
  const DURATION = 5 * 60;
  const [seconds, setSeconds] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const [popped, setPopped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = seconds / DURATION;
  const elapsed = DURATION - seconds;
  const elapsedFrac = elapsed / DURATION;
  const needleX = 390 - elapsedFrac * 100;
  const r = 115 * progress;
  const cx = 155; const cy = 130;
  const face = popped ? "none" : running ? "calm" : elapsed > 0 ? "worried" : "none";

  useEffect(() => {
    if (running && !popped) {
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { clearInterval(timerRef.current!); setRunning(false); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, popped]);

  function handleReset() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (elapsed > DURATION * 0.05 && !popped) {
      setRunning(false);
      setTimeout(() => setPopped(true), 400);
      setTimeout(() => { setPopped(false); setSeconds(DURATION); }, 2800);
    } else { setRunning(false); setSeconds(DURATION); setPopped(false); }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss_str = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{ background: "#edeae4", borderRadius: 20, padding: "28px 20px 24px", fontFamily: "'DM Sans',system-ui", minHeight: 380 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <svg width="500" height="300" viewBox="0 0 500 300" style={{ overflow: "visible" }}>
          {popped ? (
            <g>
              {[0,45,90,135,180,225,270,315].map((a, i) => (
                <line key={i} x1={cx} y1={cy} x2={cx+Math.cos(a*Math.PI/180)*80} y2={cy+Math.sin(a*Math.PI/180)*80} stroke="#E07060" strokeWidth="3.5" strokeLinecap="round" />
              ))}
              <text x={cx} y={cy+8} textAnchor="middle" fontFamily="'Playfair Display',serif" fontSize="24" fontWeight="700" fill="#E07060">POP!</text>
            </g>
          ) : (
            <g>
              <path d={`M ${cx},${cy+r} C ${cx-8},${cy+r+28} ${cx+8},${cy+r+52} ${cx},${cy+r+82}`} fill="none" stroke="#2a1a0e" strokeWidth="1.8" strokeLinecap="round" />
              <ellipse cx={cx} cy={cy} rx={r} ry={r} fill="#E8856A" />
              <ellipse cx={cx} cy={cy} rx={r} ry={r} fill="none" stroke="#2a1a0e" strokeWidth="2.5" />
              {progress > 0.15 && <ellipse cx={cx-r*0.28} cy={cy-r*0.3} rx={r*0.2} ry={r*0.13} fill="#F2A88A" opacity="0.65" transform={`rotate(-18,${cx-r*0.28},${cy-r*0.3})`} />}
              {progress > 0.2 && <path d={`M ${cx-7*progress},${cy+r-4} Q ${cx},${cy+r+8} ${cx+7*progress},${cy+r-4}`} fill="#E8856A" stroke="#2a1a0e" strokeWidth="1.8" />}
              {face === "calm" && progress > 0.3 && <>
                <path d={`M ${cx-r*0.18},${cy-r*0.07} Q ${cx-r*0.11},${cy-r*0.16} ${cx-r*0.04},${cy-r*0.07}`} fill="none" stroke="#2a1a0e" strokeWidth="2.2" strokeLinecap="round" />
                <path d={`M ${cx+r*0.04},${cy-r*0.07} Q ${cx+r*0.11},${cy-r*0.16} ${cx+r*0.18},${cy-r*0.07}`} fill="none" stroke="#2a1a0e" strokeWidth="2.2" strokeLinecap="round" />
                <path d={`M ${cx-r*0.14},${cy+r*0.12} Q ${cx},${cy+r*0.24} ${cx+r*0.14},${cy+r*0.12}`} fill="none" stroke="#2a1a0e" strokeWidth="2.2" strokeLinecap="round" />
              </>}
              {face === "worried" && progress > 0.3 && <>
                <circle cx={cx-r*0.14} cy={cy-r*0.05} r={r*0.045} fill="#2a1a0e" />
                <circle cx={cx+r*0.14} cy={cy-r*0.05} r={r*0.045} fill="#2a1a0e" />
                <path d={`M ${cx-r*0.13},${cy+r*0.16} Q ${cx},${cy+r*0.09} ${cx+r*0.13},${cy+r*0.16}`} fill="none" stroke="#2a1a0e" strokeWidth="2.2" strokeLinecap="round" />
              </>}
              {progress > 0.35 && <text x={cx} y={cy+r*0.08} textAnchor="middle" fontFamily="'Playfair Display',serif" fontSize="20" fontWeight="700" fill="#2a1a0e">{mm}:{ss_str}</text>}
            </g>
          )}
          {!popped && (
            <g transform={`translate(${needleX},122)`} style={{ transition: running ? "transform 1s linear" : "none" }}>
              <ElegantNeedle size={160} angle={0} opacity={running || elapsed > 0 ? 1 : 0.3} />
            </g>
          )}
        </svg>
      </div>
      <p style={{ textAlign: "center", fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 13, color: "#7A6A5A", margin: "0 0 16px" }}>
        {popped ? "Oops — the balloon popped." : seconds === 0 ? "You did it! Stress released." : running ? "Releasing stress, one breath at a time." : elapsed > 0 ? "Paused — the needle is watching." : "Start to let the stress out slowly."}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={() => setRunning(r => !r)} disabled={popped || seconds === 0} style={{ padding: "8px 22px", borderRadius: 30, border: "none", cursor: "pointer", background: running ? "#8B9E7A" : "#C8603A", color: "#fff", fontWeight: 600, fontSize: 13, letterSpacing: 1 }}>{running ? "PAUSE" : "START"}</button>
        <button onClick={handleReset} style={{ padding: "8px 22px", borderRadius: 30, border: "1.5px solid #C8603A", cursor: "pointer", background: "transparent", color: "#C8603A", fontWeight: 600, fontSize: 13, letterSpacing: 1 }}>RESET</button>
      </div>
    </div>
  );
}

/* ============================================================
   PROTO I — Soft Glow Balloon (pale cream, radial glow, minimal dot eyes)
   ============================================================ */
function ProtoI() {
  const DURATION = 5 * 60;
  const [seconds, setSeconds] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const [popped, setPopped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = seconds / DURATION;
  const elapsed = DURATION - seconds;
  const elapsedFrac = elapsed / DURATION;
  const needleX = 400 - elapsedFrac * 110;
  const r = 115 * progress;
  const cx = 155; const cy = 130;

  useEffect(() => {
    if (running && !popped) {
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { clearInterval(timerRef.current!); setRunning(false); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, popped]);

  function handleReset() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (elapsed > DURATION * 0.05 && !popped) {
      setRunning(false);
      setTimeout(() => setPopped(true), 400);
      setTimeout(() => { setPopped(false); setSeconds(DURATION); }, 2800);
    } else { setRunning(false); setSeconds(DURATION); setPopped(false); }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss_str = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{ background: "#f0ece6", borderRadius: 20, padding: "28px 20px 24px", fontFamily: "'DM Sans',system-ui", minHeight: 380 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <svg width="500" height="300" viewBox="0 0 500 300" style={{ overflow: "visible" }}>
          <defs>
            <radialGradient id="iglow" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fdf6f0" />
              <stop offset="60%" stopColor="#f0ddd0" />
              <stop offset="100%" stopColor="#e0c8b8" />
            </radialGradient>
          </defs>
          {popped ? (
            <g>
              {[0,36,72,108,144,180,216,252,288,324].map((a, i) => (
                <line key={i} x1={cx} y1={cy} x2={cx+Math.cos(a*Math.PI/180)*75} y2={cy+Math.sin(a*Math.PI/180)*75} stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round" />
              ))}
              <text x={cx} y={cy+8} textAnchor="middle" fontFamily="'Playfair Display',serif" fontSize="22" fontWeight="700" fontStyle="italic" fill="#8B7355">pop.</text>
            </g>
          ) : (
            <g>
              <path d={`M ${cx},${cy+r} C ${cx-7},${cy+r+26} ${cx+7},${cy+r+50} ${cx},${cy+r+80}`} fill="none" stroke="#5a4030" strokeWidth="1.6" strokeLinecap="round" />
              <ellipse cx={cx} cy={cy+r*0.12} rx={r*0.85} ry={r*0.28} fill="rgba(200,160,120,0.10)" />
              <ellipse cx={cx} cy={cy} rx={r*0.92} ry={r} fill="url(#iglow)" />
              <ellipse cx={cx} cy={cy} rx={r*0.92} ry={r} fill="none" stroke="#5a4030" strokeWidth="1.8" />
              {progress > 0.2 && <path d={`M ${cx-6*progress},${cy+r-3} Q ${cx},${cy+r+9} ${cx+6*progress},${cy+r-3}`} fill="#f0ddd0" stroke="#5a4030" strokeWidth="1.6" />}
              {progress > 0.3 && <>
                <circle cx={cx-r*0.12} cy={cy-r*0.04} r={r*0.035} fill="#5a4030" />
                <circle cx={cx+r*0.12} cy={cy-r*0.04} r={r*0.035} fill="#5a4030" />
                {running && <path d={`M ${cx-r*0.1},${cy+r*0.14} Q ${cx},${cy+r*0.22} ${cx+r*0.1},${cy+r*0.14}`} fill="none" stroke="#5a4030" strokeWidth="1.6" strokeLinecap="round" />}
                {!running && elapsed > 0 && <path d={`M ${cx-r*0.1},${cy+r*0.18} Q ${cx},${cy+r*0.11} ${cx+r*0.1},${cy+r*0.18}`} fill="none" stroke="#5a4030" strokeWidth="1.6" strokeLinecap="round" />}
              </>}
              {progress > 0.35 && <text x={cx} y={cy+r*0.1} textAnchor="middle" fontFamily="'Playfair Display',serif" fontSize={Math.max(14, r*0.18)} fontWeight="700" fontStyle="italic" fill="#5a4030" opacity="0.8">{mm}:{ss_str}</text>}
            </g>
          )}
          {!popped && (
            <g transform={`translate(${needleX},122)`} style={{ transition: running ? "transform 1s linear" : "none" }}>
              <ElegantNeedle size={160} angle={0} opacity={running || elapsed > 0 ? 0.9 : 0.22} />
            </g>
          )}
        </svg>
      </div>
      <p style={{ textAlign: "center", fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 13, color: "#8B7355", margin: "0 0 16px" }}>
        {popped ? "The tension broke — breathe and reset." : seconds === 0 ? "Fully released. You made it." : running ? "Softly, slowly — let it go." : elapsed > 0 ? "Paused — the needle is waiting." : "Start to let the stress out slowly."}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={() => setRunning(r => !r)} disabled={popped || seconds === 0} style={{ padding: "8px 22px", borderRadius: 30, border: "none", cursor: "pointer", background: running ? "#8B9E7A" : "#C8603A", color: "#fff", fontWeight: 600, fontSize: 13, letterSpacing: 1 }}>{running ? "PAUSE" : "START"}</button>
        <button onClick={handleReset} style={{ padding: "8px 22px", borderRadius: 30, border: "1.5px solid #C8603A", cursor: "pointer", background: "transparent", color: "#C8603A", fontWeight: 600, fontSize: 13, letterSpacing: 1 }}>RESET</button>
      </div>
    </div>
  );
}

export default function TimerPrototypes() {
  return (
    <div style={{ minHeight: "100vh", background: "oklch(0.975 0.012 80)", padding: "40px 24px 60px", fontFamily: "system-ui" }}>
      <style>{`
        .proto-card { width: 100%; box-shadow: 0 4px 24px rgba(92,61,46,0.10); }
        .proto-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #8B9E7A; margin: 0 0 6px; }
        .proto-badge { display: inline-block; background: #C8603A; color: #fff; font-size: 10px; letter-spacing: 1px; padding: 2px 8px; border-radius: 20px; margin-left: 8px; vertical-align: middle; }
        .proto-badge-rec { display: inline-block; background: #8B9E7A; color: #fff; font-size: 10px; letter-spacing: 1px; padding: 2px 8px; border-radius: 20px; margin-left: 8px; vertical-align: middle; }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 960, margin: "0 auto 40px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#3D2B1F", margin: "0 0 8px", fontStyle: "italic" }}>
          Timer Design Prototypes
        </h1>
        <p style={{ color: "#8B9E7A", fontSize: 14, margin: 0 }}>
          6 interactive prototypes — click Start to test each one. Pick your favourite and I'll integrate it into the main app.
        </p>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>

        {/* A */}
        <div>
          <p className="proto-label">A — Gradient Fullscreen <span className="proto-badge">Minimal</span></p>
          <ProtoA />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            Bold gradient background, giant countdown digits. Clean and distraction-free. Great for full-focus mode.
          </p>
        </div>

        {/* B */}
        <div>
          <p className="proto-label">B — Tomato Pomodoro <span className="proto-badge">Playful</span></p>
          <ProtoB />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            Flat illustrated tomato with a white arc ring depleting inside it. Classic Pomodoro metaphor, warm Morandi colors.
          </p>
        </div>

        {/* C */}
        <div>
          <p className="proto-label">C — Cat Companion <span className="proto-badge">Cute</span> <span className="proto-badge-rec">Recommended</span></p>
          <ProtoC />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            Chonky cat with sticky note sits above the timer. Changes expression: big eyes (idle) → headphones squint (focus) → happy closed eyes (done) → peeking over card (last 90s). Type your intention and press Enter.
          </p>
        </div>

        {/* D */}
        <div>
          <p className="proto-label">D — Focus Balloon <span className="proto-badge">Metaphor</span></p>
          <ProtoD />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            Balloon slowly deflates as time runs out — a visual metaphor for focus depleting. Unique and memorable.
          </p>
        </div>

      </div>


        {/* E */}
        <div>
          <p className="proto-label">E — Balloon Inflate <span className="proto-badge">Grow</span></p>
          <ProtoE />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            Balloon starts tiny and grows as you focus. When the session completes, a hand holding a needle slides in from the right — you earned the full balloon, the needle is just a threat.
          </p>
        </div>

        {/* F */}
        <div>
          <p className="proto-label">F — Balloon Deflate <span className="proto-badge">Pressure</span></p>
          <ProtoF />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            Balloon starts fully inflated. Air slowly escapes as focus progresses (balloon shrinks). The needle creeps closer while you're running. Reset mid-session and the needle pops the balloon!
          </p>
        </div>


        {/* G */}
        <div>
          <p className="proto-label">G — Golden Balloon <span className="proto-badge">Elegant</span></p>
          <ProtoG />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            Warm golden balloon with FOCUS text inside. Elegant sewing needle on the right. Deflates as you focus — needle creeps in when paused.
          </p>
        </div>
        {/* H */}
        <div>
          <p className="proto-label">H — Round Cute Balloon <span className="proto-badge">Playful</span></p>
          <ProtoH />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            Coral round balloon with a cute face — smiles when running, looks worried when paused. Elegant needle approaches from the right.
          </p>
        </div>
        {/* I */}
        <div>
          <p className="proto-label">I — Soft Glow Balloon <span className="proto-badge">Minimal</span></p>
          <ProtoI />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            Pale cream balloon with a soft radial glow and minimal dot eyes. Quiet and calming. Needle barely visible until you pause.
          </p>
        </div>
        {/* J — Paper Tear */}
        <div>
          <p className="proto-label">J — Paper Tear <span className="proto-badge">New</span> <span className="proto-badge-rec">Cathartic</span></p>
          <PaperTearTimer durationMinutes={1} />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            A piece of paper with your worries written on it. As you focus, the bottom strips tear off one by one. Quit and the paper recovers. Complete the session and the whole page tears away in a satisfying cascade.
          </p>
        </div>

        {/* K — Cyber Pet */}
        <div style={{ gridColumn: "1 / -1" }}>
          <p className="proto-label">K — Cyber Pet Timer <span className="proto-badge">Experimental</span> <span className="proto-badge-rec">Tamagotchi</span></p>
          <CyberPetTimer />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            A Tamagotchi-style focus companion. Your cyber pet stays alive as long as you keep focusing — it bubbles hearts and shows care actions (feed, bathe, play). Quit early and the pet dies. Deaths are counted as focus failures. Complete the session and your pet thrives.
          </p>
        </div>

      {/* ─── Balloon Stage Preview ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: "48px auto 0" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#3D2B1F", margin: "0 0 4px", fontStyle: "italic" }}>
          Live Timer — Balloon Stages
        </h2>
        <p style={{ color: "#8B9E7A", fontSize: 13, margin: "0 0 24px" }}>
          The active timer shrinks the balloon across 10 stages as your session progresses. Stage 1 is the start (big), Stage 10 is the end (tiny). Stages 8–10 pulse red.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {Array.from({ length: 10 }, (_, i) => {
            const stageNum = i + 1;
            const scale = Math.max(0.25, 1.0 - stageNum * 0.075);
            const s = Math.max(0.18, scale);
            const rx = 72 * s, ry = 84 * s;
            const cx = 80, cy = 90;
            const knotY = cy + ry;
            const knotSize = 8 * s;
            const stringY1 = knotY + knotSize;
            const stringY2 = 185;
            const hlRx = 13 * s, hlRy = 20 * s;
            const hlCx = cx - rx * 0.32, hlCy = cy - ry * 0.28;
            const isUrgent = stageNum >= 8;
            const fillColor = isUrgent
              ? (stageNum === 10 ? "oklch(0.48 0.18 25)" : stageNum === 9 ? "oklch(0.52 0.16 28)" : "oklch(0.56 0.14 32)")
              : "oklch(0.65 0.13 35)";
            const timerFontSize = Math.max(7, Math.round(rx * 0.32));
            // Needle tip tracks balloon right edge
            const balloonRight = cx + rx;
            const progress = stageNum / 10;
            const gap = Math.max(4, 20 - progress * 16);
            const needleTipX = balloonRight + gap;
            const needleEyeX = needleTipX + 60;
            const needleY = cy;
            return (
              <div key={stageNum} style={{
                background: isUrgent ? "oklch(0.97 0.012 25)" : "oklch(0.985 0.008 80)",
                border: `1px solid ${isUrgent ? "oklch(0.88 0.04 25)" : "oklch(0.87 0.014 75)"}`,
                borderRadius: 12,
                padding: "12px 8px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: isUrgent ? "oklch(0.52 0.14 25)" : "oklch(0.55 0.010 70)",
                  fontFamily: "'DM Sans', sans-serif",
                }}>STAGE {stageNum}</span>
                <svg width="160" height="200" viewBox="0 0 160 200" style={{ overflow: "visible" }}>
                  {/* Balloon body */}
                  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fillColor} stroke="oklch(0.35 0.06 35)" strokeWidth="1.8" />
                  {/* Highlight */}
                  {s > 0.3 && (
                    <ellipse cx={hlCx} cy={hlCy} rx={hlRx} ry={hlRy}
                      fill="rgba(255,255,255,0.22)" transform={`rotate(-20 ${hlCx} ${hlCy})`} />
                  )}
                  {/* Knot */}
                  {s > 0.22 && (
                    <path
                      d={`M${cx - knotSize}${knotY} Q${cx}${knotY + knotSize * 1.4}${cx + knotSize}${knotY} Q${cx}${knotY + knotSize * 0.6}${cx - knotSize}${knotY}Z`}
                      fill={fillColor} stroke="oklch(0.35 0.06 35)" strokeWidth="0.8"
                    />
                  )}
                  {/* String */}
                  {s > 0.22 && (
                    <path
                      d={`M${cx}${stringY1} C${cx - 10}${(stringY1 + stringY2) * 0.5}${cx + 6}${(stringY1 + stringY2) * 0.75}${cx}${stringY2}`}
                      fill="none" stroke="oklch(0.45 0.04 50)" strokeWidth="1.2" strokeLinecap="round"
                    />
                  )}
                  {/* Timer text inside balloon */}
                  <text x={cx} y={cy + timerFontSize * 0.38}
                    textAnchor="middle"
                    fill="oklch(0.25 0.04 35)"
                    fontSize={timerFontSize}
                    fontWeight="700"
                    fontFamily="'JetBrains Mono', monospace"
                    letterSpacing="1"
                  >
                    {String(Math.floor((25 - stageNum * 2.5))).padStart(2, "0")}:00
                  </text>
                  {/* Needle — tip tracks balloon right edge */}
                  <line
                    x1={needleTipX} y1={needleY}
                    x2={needleEyeX} y2={needleY}
                    stroke="oklch(0.25 0.02 50)" strokeWidth="1.2" strokeLinecap="round"
                  />
                  <ellipse cx={needleEyeX} cy={needleY} rx="3.5" ry="2"
                    fill="none" stroke="oklch(0.25 0.02 50)" strokeWidth="1.2"
                  />
                </svg>
                <span style={{
                  fontSize: 9,
                  color: isUrgent ? "oklch(0.52 0.14 25)" : "oklch(0.62 0.010 70)",
                  fontFamily: "'DM Sans', sans-serif",
                }}>{Math.round(scale * 100)}% size{isUrgent ? " 🔴" : ""}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ maxWidth: 960, margin: "48px auto 0", padding: "24px", background: "#fff", borderRadius: 16, textAlign: "center", boxShadow: "0 2px 12px rgba(92,61,46,0.06)" }}>
        <p style={{ color: "#5C3D2E", fontSize: 15, margin: "0 0 4px", fontWeight: 600 }}>Which design do you prefer?</p>
        <p style={{ color: "#8B9E7A", fontSize: 13, margin: 0 }}>Reply with A–J — or mix elements from multiple designs — and I'll build it into the main app.</p>
      </div>
    </div>
  );
}

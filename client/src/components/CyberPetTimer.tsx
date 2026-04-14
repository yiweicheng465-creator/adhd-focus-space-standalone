/* ============================================================
   CyberPetTimer — Tamagotchi-style focus timer
   - Pixel art cyber pet that stays alive during focus
   - Care actions feed (feed chicken, bathe, play, etc.)
   - Floating heart bubbles while running
   - Pet dies if you quit early → death counter
   ============================================================ */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

/* ── Pixel art pet SVGs ── */

// Alive pet — blob creature with eyes and blush
function PetAlive({ blink }: { blink: boolean }) {
  return (
    <svg viewBox="0 0 32 32" width="96" height="96" style={{ imageRendering: "pixelated" }}>
      {/* Body */}
      <rect x="8" y="10" width="16" height="14" fill="#C8B4E8" />
      <rect x="6" y="12" width="2" height="10" fill="#C8B4E8" />
      <rect x="24" y="12" width="2" height="10" fill="#C8B4E8" />
      <rect x="10" y="8" width="12" height="2" fill="#C8B4E8" />
      <rect x="8" y="24" width="4" height="2" fill="#C8B4E8" />
      <rect x="20" y="24" width="4" height="2" fill="#C8B4E8" />
      {/* Eyes */}
      {blink ? (
        <>
          <rect x="11" y="14" width="4" height="1" fill="#3D2E5E" />
          <rect x="17" y="14" width="4" height="1" fill="#3D2E5E" />
        </>
      ) : (
        <>
          <rect x="11" y="13" width="4" height="4" fill="#3D2E5E" />
          <rect x="17" y="13" width="4" height="4" fill="#3D2E5E" />
          <rect x="12" y="14" width="1" height="1" fill="#fff" />
          <rect x="18" y="14" width="1" height="1" fill="#fff" />
        </>
      )}
      {/* Blush */}
      <rect x="10" y="18" width="3" height="2" fill="#E8A0B8" />
      <rect x="19" y="18" width="3" height="2" fill="#E8A0B8" />
      {/* Mouth smile */}
      <rect x="13" y="20" width="6" height="1" fill="#3D2E5E" />
      <rect x="12" y="19" width="1" height="1" fill="#3D2E5E" />
      <rect x="19" y="19" width="1" height="1" fill="#3D2E5E" />
      {/* Tiny tail */}
      <rect x="4" y="15" width="2" height="2" fill="#C8B4E8" />
    </svg>
  );
}

// Dead pet — X eyes, flat mouth, grey
function PetDead() {
  return (
    <svg viewBox="0 0 32 32" width="96" height="96" style={{ imageRendering: "pixelated" }}>
      {/* Body grey */}
      <rect x="8" y="10" width="16" height="14" fill="#B0A8B8" />
      <rect x="6" y="12" width="2" height="10" fill="#B0A8B8" />
      <rect x="24" y="12" width="2" height="10" fill="#B0A8B8" />
      <rect x="10" y="8" width="12" height="2" fill="#B0A8B8" />
      <rect x="8" y="24" width="4" height="2" fill="#B0A8B8" />
      <rect x="20" y="24" width="4" height="2" fill="#B0A8B8" />
      {/* X eyes */}
      <rect x="11" y="13" width="1" height="1" fill="#5A4A6A" />
      <rect x="12" y="14" width="1" height="1" fill="#5A4A6A" />
      <rect x="13" y="15" width="1" height="1" fill="#5A4A6A" />
      <rect x="14" y="14" width="1" height="1" fill="#5A4A6A" />
      <rect x="13" y="13" width="1" height="1" fill="#5A4A6A" />
      <rect x="11" y="15" width="1" height="1" fill="#5A4A6A" />
      <rect x="17" y="13" width="1" height="1" fill="#5A4A6A" />
      <rect x="18" y="14" width="1" height="1" fill="#5A4A6A" />
      <rect x="19" y="15" width="1" height="1" fill="#5A4A6A" />
      <rect x="20" y="14" width="1" height="1" fill="#5A4A6A" />
      <rect x="19" y="13" width="1" height="1" fill="#5A4A6A" />
      <rect x="17" y="15" width="1" height="1" fill="#5A4A6A" />
      {/* Flat mouth */}
      <rect x="13" y="20" width="6" height="1" fill="#5A4A6A" />
      {/* Tiny stars around */}
      <rect x="3" y="8" width="2" height="2" fill="#D4C0E8" />
      <rect x="27" y="10" width="2" height="2" fill="#D4C0E8" />
      <rect x="5" y="22" width="2" height="2" fill="#D4C0E8" />
    </svg>
  );
}

// Paused pet — worried/sad face (sweat drop, wavy mouth)
function PetPaused() {
  return (
    <svg viewBox="0 0 32 32" width="96" height="96" style={{ imageRendering: "pixelated" }}>
      {/* Body */}
      <rect x="8" y="10" width="16" height="14" fill="#B8A8D8" />
      <rect x="6" y="12" width="2" height="10" fill="#B8A8D8" />
      <rect x="24" y="12" width="2" height="10" fill="#B8A8D8" />
      <rect x="10" y="8" width="12" height="2" fill="#B8A8D8" />
      <rect x="8" y="24" width="4" height="2" fill="#B8A8D8" />
      <rect x="20" y="24" width="4" height="2" fill="#B8A8D8" />
      {/* Worried eyes — angled inward (sad brows) */}
      <rect x="11" y="12" width="1" height="1" fill="#3D2E5E" />
      <rect x="14" y="11" width="1" height="1" fill="#3D2E5E" />
      <rect x="17" y="11" width="1" height="1" fill="#3D2E5E" />
      <rect x="20" y="12" width="1" height="1" fill="#3D2E5E" />
      {/* Eyes — wide open worried */}
      <rect x="11" y="13" width="4" height="4" fill="#3D2E5E" />
      <rect x="17" y="13" width="4" height="4" fill="#3D2E5E" />
      <rect x="12" y="14" width="1" height="1" fill="#fff" />
      <rect x="18" y="14" width="1" height="1" fill="#fff" />
      {/* Wavy / sad mouth */}
      <rect x="13" y="21" width="2" height="1" fill="#3D2E5E" />
      <rect x="15" y="20" width="2" height="1" fill="#3D2E5E" />
      <rect x="17" y="21" width="2" height="1" fill="#3D2E5E" />
      {/* Sweat drop */}
      <rect x="23" y="10" width="1" height="2" fill="#88B4D8" />
      <rect x="22" y="11" width="1" height="1" fill="#88B4D8" />
      {/* Tiny tail */}
      <rect x="4" y="15" width="2" height="2" fill="#B8A8D8" />
    </svg>
  );
}

// Idle pet — sleepy eyes
function PetIdle() {
  return (
    <svg viewBox="0 0 32 32" width="96" height="96" style={{ imageRendering: "pixelated" }}>
      <rect x="8" y="10" width="16" height="14" fill="#C8B4E8" />
      <rect x="6" y="12" width="2" height="10" fill="#C8B4E8" />
      <rect x="24" y="12" width="2" height="10" fill="#C8B4E8" />
      <rect x="10" y="8" width="12" height="2" fill="#C8B4E8" />
      <rect x="8" y="24" width="4" height="2" fill="#C8B4E8" />
      <rect x="20" y="24" width="4" height="2" fill="#C8B4E8" />
      {/* Sleepy eyes — half closed */}
      <rect x="11" y="15" width="4" height="2" fill="#3D2E5E" />
      <rect x="17" y="15" width="4" height="2" fill="#3D2E5E" />
      {/* ZZZ */}
      <rect x="22" y="8" width="2" height="1" fill="#9A88C0" />
      <rect x="23" y="9" width="1" height="1" fill="#9A88C0" />
      <rect x="22" y="10" width="2" height="1" fill="#9A88C0" />
      {/* Neutral mouth */}
      <rect x="13" y="20" width="6" height="1" fill="#3D2E5E" />
      <rect x="4" y="15" width="2" height="2" fill="#C8B4E8" />
    </svg>
  );
}

/* ── Heart bubble ── */
interface HeartBubble {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  vy: number;
}

/* ── Care action feed ── */
const CARE_ACTIONS = [
  { emoji: "🍗", text: "feeding chicken" },
  { emoji: "🛁", text: "bath time" },
  { emoji: "🎮", text: "playing together" },
  { emoji: "💤", text: "nap time" },
  { emoji: "🍵", text: "tea break" },
  { emoji: "🎵", text: "listening to music" },
  { emoji: "🌸", text: "flower picking" },
  { emoji: "🍙", text: "snack time" },
  { emoji: "🪀", text: "yo-yo tricks" },
  { emoji: "🌙", text: "stargazing" },
];

interface CareEntry {
  id: number;
  emoji: string;
  text: string;
  ts: number;
}

/* ── Main component ── */
interface CyberPetTimerProps {
  durationMinutes?: number;
}

export function CyberPetTimer({ durationMinutes = 25 }: CyberPetTimerProps) {
  const [deaths, setDeaths] = useLocalStorage<number>("cyber-pet-deaths", 0);
  const [phase, setPhase] = useState<"idle" | "running" | "paused" | "dead" | "complete">("idle");
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const [duration, setDuration] = useState(durationMinutes * 60);
  const [customMin, setCustomMin] = useState(durationMinutes);
  const [blink, setBlink] = useState(false);
  const [hearts, setHearts] = useState<HeartBubble[]>([]);
  const [careLog, setCareLog] = useState<CareEntry[]>([]);
  const [showDeathScreen, setShowDeathScreen] = useState(false);
  const [bounce, setBounce] = useState(false);
  const heartIdRef = useRef(0);
  const careIdRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const careRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blinkRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pct = Math.round(((duration - remaining) / duration) * 100);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  /* ── Blink ── */
  useEffect(() => {
    if (phase !== "running") return;
    blinkRef.current = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000 + Math.random() * 3000);
    return () => { if (blinkRef.current) clearInterval(blinkRef.current); };
  }, [phase]);

  /* ── Bounce ── */
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 300);
    }, 6000);
    return () => clearInterval(id);
  }, [phase]);

  /* ── Countdown tick ── */
  useEffect(() => {
    if (phase !== "running") {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setPhase("complete");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase]);

  /* ── Heart bubbles ── */
  const spawnHeart = useCallback(() => {
    const id = heartIdRef.current++;
    // Spawn hearts from pet center area (40–60% x), starting at mid-height (45–55% y)
    // Give them a horizontal drift (vx) so they float left or right as they rise
    const side = Math.random() < 0.5 ? -1 : 1; // left or right drift
    const newHeart: HeartBubble = {
      id,
      x: 42 + Math.random() * 16,   // near pet center horizontally
      y: 42 + Math.random() * 12,   // near pet center vertically (as % from bottom)
      size: 8 + Math.random() * 8,
      opacity: 0.9,
      vy: 1.0 + Math.random() * 0.6, // float upward
      vx: side * (0.3 + Math.random() * 0.5), // drift left or right
    } as HeartBubble & { vx: number };
    setHearts((prev) => [...prev.slice(-12), newHeart]);
  }, []);

  useEffect(() => {
    if (phase !== "running") {
      if (heartRef.current) clearInterval(heartRef.current);
      return;
    }
    heartRef.current = setInterval(spawnHeart, 1200);
    return () => { if (heartRef.current) clearInterval(heartRef.current); };
  }, [phase, spawnHeart]);

  // Animate hearts upward with sideways drift
  useEffect(() => {
    if (hearts.length === 0) return;
    const id = requestAnimationFrame(() => {
      setHearts((prev) =>
        prev
          .map((h) => {
            const hAny = h as HeartBubble & { vx?: number };
            return {
              ...h,
              y: h.y + h.vy,           // increase y% = move up (bottom-anchored)
              x: h.x + (hAny.vx ?? 0), // drift sideways
              opacity: h.opacity - 0.010,
            };
          })
          .filter((h) => h.opacity > 0.05 && h.y < 95)
      );
    });
    return () => cancelAnimationFrame(id);
  }, [hearts]);

  /* ── Care action log ── */
  const addCareEntry = useCallback(() => {
    const action = CARE_ACTIONS[Math.floor(Math.random() * CARE_ACTIONS.length)];
    const entry: CareEntry = {
      id: careIdRef.current++,
      emoji: action.emoji,
      text: action.text,
      ts: Date.now(),
    };
    setCareLog((prev) => [entry, ...prev].slice(0, 8));
  }, []);

  useEffect(() => {
    if (phase !== "running") {
      if (careRef.current) clearInterval(careRef.current);
      return;
    }
    addCareEntry(); // immediate first entry
    careRef.current = setInterval(addCareEntry, 15000 + Math.random() * 10000);
    return () => { if (careRef.current) clearInterval(careRef.current); };
  }, [phase, addCareEntry]);

  /* ── Actions ── */
  const start = () => {
    const secs = customMin * 60;
    setDuration(secs);
    setRemaining(secs);
    setCareLog([]);
    setHearts([]);
    setShowDeathScreen(false);
    setPhase("running");
  };

  const pause = () => setPhase("paused");
  const resume = () => setPhase("running");

  const quit = () => {
    setPhase("dead");
    setDeaths((d) => d + 1);
    setShowDeathScreen(true);
    setHearts([]);
  };

  const reset = () => {
    setPhase("idle");
    setRemaining(customMin * 60);
    setCareLog([]);
    setHearts([]);
    setShowDeathScreen(false);
  };

  const resetDeaths = () => setDeaths(0);

  /* ── Colours ── */
  const BG = "#E8DCFA";
  const PANEL = "#D0C0F0";
  const BORDER = "#7A6A9A";
  const DARK = "#3D2E5E";
  const ACCENT = "#9B7FD4";
  const BTN_BG = "#C8B4E8";

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      background: BG,
      border: `3px solid ${DARK}`,
      boxShadow: `4px 4px 0 ${DARK}`,
      maxWidth: 340,
      margin: "0 auto",
      overflow: "hidden",
    }}>
      {/* Title bar */}
      <div style={{
        background: PANEL,
        borderBottom: `2px solid ${DARK}`,
        padding: "0 10px",
        height: 28,
        display: "flex",
        alignItems: "center",
        userSelect: "none",
      }}>
        <span style={{ fontSize: 8, letterSpacing: "0.20em", textTransform: "uppercase", color: DARK, fontWeight: 700, flex: 1 }}>
          cyber_pet.exe
        </span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 7, color: BORDER, letterSpacing: "0.10em" }}>💀 {deaths}</span>
          {deaths > 0 && (
            <button onClick={resetDeaths} title="Reset death count" style={{ fontSize: 7, background: "none", border: "none", cursor: "pointer", color: BORDER, padding: "0 2px" }}>×</button>
          )}
        </div>
      </div>

      {/* Pet screen */}
      <div style={{
        background: "#B8A8D8",
        margin: 12,
        border: `2px solid ${DARK}`,
        position: "relative",
        height: 160,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        {/* Pixel grid overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 7px, rgba(0,0,0,0.04) 8px), repeating-linear-gradient(90deg, transparent, transparent 7px, rgba(0,0,0,0.04) 8px)",
          pointerEvents: "none",
        }} />

        {/* Hearts */}
        {hearts.map((h) => (
          <div key={h.id} style={{
            position: "absolute",
            left: `${h.x}%`,
            bottom: `${h.y}%`,
            fontSize: h.size,
            opacity: h.opacity,
            transform: "translateX(-50%)",
            pointerEvents: "none",
            transition: "none",
          }}>♥</div>
        ))}

        {/* Pet */}
        <div style={{
          transform: bounce ? "translateY(-6px)" : "translateY(0)",
          transition: "transform 0.15s ease",
        }}>
          {phase === "dead" || showDeathScreen ? <PetDead /> :
           phase === "idle" ? <PetIdle /> :
           phase === "paused" ? <PetPaused /> :
           <PetAlive blink={blink} />}
        </div>

        {/* Status text */}
        <div style={{
          position: "absolute",
          top: 6, left: 6,
          fontSize: 7,
          letterSpacing: "0.10em",
          color: DARK,
          textTransform: "uppercase",
          opacity: 0.75,
        }}>
          {phase === "idle" ? "SLEEPING..." :
           phase === "running" ? "HAPPY ♥" :
           phase === "paused" ? "PAUSED..." :
           phase === "complete" ? "FULL ★" :
           "GONE..."}
        </div>

        {/* Complete overlay */}
        {phase === "complete" && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(200,180,232,0.85)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 4,
          }}>
            <span style={{ fontSize: 28 }}>🌟</span>
            <span style={{ fontSize: 9, color: DARK, letterSpacing: "0.14em", fontWeight: 700 }}>SESSION COMPLETE!</span>
            <span style={{ fontSize: 8, color: DARK, opacity: 0.7 }}>your pet is thriving</span>
          </div>
        )}

        {/* Death overlay */}
        {showDeathScreen && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(90,74,106,0.85)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 4,
          }}>
            <span style={{ fontSize: 24 }}>💀</span>
            <span style={{ fontSize: 9, color: "#E8D8F8", letterSpacing: "0.14em", fontWeight: 700 }}>PET DIED</span>
            <span style={{ fontSize: 8, color: "#C8B8E8", opacity: 0.85 }}>deaths: {deaths}</span>
          </div>
        )}
      </div>

      {/* Timer display */}
      <div style={{ textAlign: "center", padding: "4px 0 8px" }}>
        <span style={{
          fontSize: 36,
          letterSpacing: "0.06em",
          color: phase === "dead" ? "#8A7A9A" : DARK,
          fontWeight: 700,
          lineHeight: 1,
        }}>
          {mm}:{ss}
        </span>
        {/* Progress bar */}
        <div style={{ margin: "6px 12px 0", height: 4, background: "#C8B4E8", border: `1px solid ${BORDER}` }}>
          <div style={{
            height: "100%",
            width: `${pct}%`,
            background: phase === "dead" ? "#8A7A9A" : ACCENT,
            transition: "width 1s linear",
          }} />
        </div>
      </div>

      {/* Duration selector (idle only) */}
      {(phase === "idle" || phase === "dead" || phase === "complete") && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "0 12px 8px" }}>
          {[10, 25, 45].map((m) => (
            <button
              key={m}
              onClick={() => { setCustomMin(m); setRemaining(m * 60); setDuration(m * 60); }}
              style={{
                padding: "3px 10px",
                fontSize: 8,
                letterSpacing: "0.12em",
                background: customMin === m ? ACCENT : BTN_BG,
                color: customMin === m ? "#fff" : DARK,
                border: `1.5px solid ${BORDER}`,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: customMin === m ? `1px 1px 0 ${DARK}` : "none",
              }}
            >{m} MIN</button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 6, padding: "0 12px 12px" }}>
        {phase === "idle" && (
          <button onClick={start} style={btnStyle(ACCENT, "#fff", DARK)}>▶ START</button>
        )}
        {phase === "running" && (
          <>
            <button onClick={pause} style={btnStyle(BTN_BG, DARK, BORDER)}>⏸ PAUSE</button>
            <button onClick={quit} style={btnStyle("#C8A0A0", DARK, "#9A6A6A")}>✕ QUIT</button>
          </>
        )}
        {phase === "paused" && (
          <>
            <button onClick={resume} style={btnStyle(ACCENT, "#fff", DARK)}>▶ RESUME</button>
            <button onClick={quit} style={btnStyle("#C8A0A0", DARK, "#9A6A6A")}>✕ QUIT</button>
          </>
        )}
        {(phase === "dead" || phase === "complete") && (
          <button onClick={reset} style={btnStyle(ACCENT, "#fff", DARK)}>↺ NEW PET</button>
        )}
      </div>

      {/* Care action log */}
      {careLog.length > 0 && (
        <div style={{
          borderTop: `1px solid ${BORDER}`,
          padding: "6px 12px 10px",
          background: PANEL,
        }}>
          <div style={{ fontSize: 7, letterSpacing: "0.14em", color: BORDER, marginBottom: 4, textTransform: "uppercase" }}>
            care log
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {careLog.slice(0, 5).map((entry, i) => (
              <div key={entry.id} style={{
                display: "flex", alignItems: "center", gap: 6,
                opacity: i === 0 ? 1 : 0.6 - i * 0.08,
              }}>
                <span style={{ fontSize: 12 }}>{entry.emoji}</span>
                <span style={{ fontSize: 8, color: DARK, letterSpacing: "0.06em" }}>{entry.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function btnStyle(bg: string, color: string, border: string): React.CSSProperties {
  return {
    flex: 1,
    padding: "6px 0",
    fontSize: 8,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    background: bg,
    color,
    border: `1.5px solid ${border}`,
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    boxShadow: `1px 1px 0 ${border}`,
  };
}

/* ============================================================
   ADHD FOCUS SPACE — PageDecor
   Soft botanical / Morandi watercolor decorative SVG elements.
   Each page gets a unique organic element: flowers, clouds,
   leaves, stars, spirals, constellation dots.
   
   All elements:
   - pointer-events: none (never block clicks)
   - opacity 0.12–0.22 (purely decorative)
   - gentle float animation (6s ease-in-out)
   - positioned absolutely in page background layer
   ============================================================ */

import React, { useEffect, useState } from "react";

/* ── Shared float animation via CSS keyframes injected once ── */
const STYLE_ID = "page-decor-anim";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes floatA { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-6px) rotate(1.5deg); } }
    @keyframes floatB { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-4px) rotate(-1deg); } }
    @keyframes floatC { 0%,100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-5px) scale(1.02); } }
    @keyframes driftR { 0%,100% { transform: translateX(0px); } 50% { transform: translateX(5px); } }
    .decor-float-a { animation: floatA 7s ease-in-out infinite; }
    .decor-float-b { animation: floatB 9s ease-in-out infinite; }
    .decor-float-c { animation: floatC 11s ease-in-out infinite; }
    .decor-drift-r { animation: driftR 8s ease-in-out infinite; }
  `;
  document.head.appendChild(style);
}

function useDecorStyles() {
  useEffect(() => { injectStyles(); }, []);
}

/* ── Shared wrapper ── */
function DecorWrap({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  useDecorStyles();
  return (
    <div
      style={{
        position: "absolute",
        pointerEvents: "none",
        zIndex: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   DASHBOARD — Loose watercolor poppy + scattered dots
   Top-right corner, terracotta + sage
   ════════════════════════════════════════════════════ */
export function DashboardDecor() {
  return (
    <>
      {/* Large poppy flower — top right */}
      <DecorWrap style={{ top: 20, right: 60, opacity: 0.16 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="decor-float-a">
          {/* Petals — 6 organic teardrop shapes */}
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const cx = 70 + 32 * Math.cos(rad);
            const cy = 70 + 32 * Math.sin(rad);
            return (
              <ellipse key={i} cx={cx} cy={cy} rx="14" ry="22"
                fill="#C8603A" opacity="0.85"
                transform={`rotate(${deg + 90} ${cx} ${cy})`}
              />
            );
          })}
          {/* Center */}
          <circle cx="70" cy="70" r="14" fill="#8B4A2A" opacity="0.9" />
          <circle cx="70" cy="70" r="7" fill="#F8C860" opacity="0.8" />
          {/* Stem */}
          <path d="M70 102 Q65 118 60 128" stroke="#8B9E7A" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Leaf */}
          <path d="M65 115 Q52 108 50 100 Q60 100 65 115Z" fill="#8B9E7A" opacity="0.9" />
        </svg>
      </DecorWrap>
      {/* Small scattered dots */}
      <DecorWrap style={{ top: 40, right: 200, opacity: 0.12 }}>
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="decor-float-b">
          <circle cx="10" cy="10" r="4" fill="#C8603A" />
          <circle cx="30" cy="20" r="3" fill="#8B9E7A" />
          <circle cx="50" cy="8" r="5" fill="#C8A870" />
          <circle cx="20" cy="45" r="3.5" fill="#B08090" />
          <circle cx="48" cy="40" r="2.5" fill="#C8603A" />
        </svg>
      </DecorWrap>
      {/* Small leaf sprig — bottom right */}
      <DecorWrap style={{ bottom: 40, right: 80, opacity: 0.10 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="decor-drift-r">
          <path d="M40 70 Q38 50 30 35 Q45 40 50 55 Q55 40 48 25 Q60 35 55 55 Q65 45 62 30 Q72 42 65 60 Q60 70 40 70Z" fill="#8B9E7A" />
        </svg>
      </DecorWrap>
    </>
  );
}

/* ════════════════════════════════════════════════════
   FOCUS TIMER — Soft cloud puffs, thought bubble style
   Dusty mauve + cream
   ════════════════════════════════════════════════════ */
export function FocusDecor() {
  return (
    <>
      {/* Large cloud — top right */}
      <DecorWrap style={{ top: 30, right: 40, opacity: 0.14 }}>
        <svg width="180" height="100" viewBox="0 0 180 100" fill="none" className="decor-float-c">
          <ellipse cx="90" cy="70" rx="75" ry="30" fill="#B08090" />
          <ellipse cx="60" cy="55" rx="40" ry="35" fill="#B08090" />
          <ellipse cx="110" cy="50" rx="45" ry="38" fill="#B08090" />
          <ellipse cx="80" cy="42" rx="32" ry="28" fill="#C8A8B8" />
          <ellipse cx="130" cy="45" rx="28" ry="24" fill="#C8A8B8" />
        </svg>
      </DecorWrap>
      {/* Small thought bubbles — bottom left */}
      <DecorWrap style={{ bottom: 60, left: 20, opacity: 0.10 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="decor-float-a">
          <circle cx="20" cy="60" r="14" fill="#B08090" />
          <circle cx="38" cy="40" r="10" fill="#C8A8B8" />
          <circle cx="52" cy="26" r="7" fill="#D8C0C8" />
          <circle cx="62" cy="16" r="4" fill="#E8D8E0" />
          <circle cx="68" cy="9" r="2.5" fill="#E8D8E0" />
        </svg>
      </DecorWrap>
    </>
  );
}

/* ════════════════════════════════════════════════════
   TASKS — Botanical branch with leaves
   Top right, sage green
   ════════════════════════════════════════════════════ */
export function TasksDecor() {
  return (
    <>
      {/* Branch with leaves — top right */}
      <DecorWrap style={{ top: 10, right: 30, opacity: 0.15 }}>
        <svg width="120" height="160" viewBox="0 0 120 160" fill="none" className="decor-float-b">
          {/* Main stem */}
          <path d="M60 155 Q58 120 55 90 Q52 60 50 30" stroke="#8B9E7A" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Leaves — alternating left/right */}
          <path d="M55 130 Q38 118 35 105 Q50 108 55 130Z" fill="#8B9E7A" opacity="0.9" />
          <path d="M54 110 Q72 100 75 88 Q62 90 54 110Z" fill="#A8C090" opacity="0.85" />
          <path d="M52 88 Q34 76 32 63 Q48 66 52 88Z" fill="#8B9E7A" opacity="0.9" />
          <path d="M51 68 Q68 58 70 46 Q57 48 51 68Z" fill="#A8C090" opacity="0.85" />
          <path d="M50 48 Q34 38 33 26 Q47 28 50 48Z" fill="#8B9E7A" opacity="0.9" />
          {/* Small flower at top */}
          <circle cx="50" cy="22" r="8" fill="#F8C8D4" opacity="0.8" />
          <circle cx="50" cy="22" r="4" fill="#F0A0B0" opacity="0.9" />
        </svg>
      </DecorWrap>
      {/* Small scattered leaves — bottom left */}
      <DecorWrap style={{ bottom: 30, left: 30, opacity: 0.09 }}>
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" className="decor-drift-r">
          <path d="M10 60 Q5 40 20 25 Q25 45 10 60Z" fill="#8B9E7A" />
          <path d="M30 55 Q28 35 42 22 Q44 42 30 55Z" fill="#A8C090" />
          <path d="M50 50 Q50 30 62 18 Q62 38 50 50Z" fill="#8B9E7A" />
        </svg>
      </DecorWrap>
    </>
  );
}

/* ════════════════════════════════════════════════════
   DAILY WINS — Stars + large flower
   Gold + terracotta, scattered
   ════════════════════════════════════════════════════ */
export function WinsDecor() {
  return (
    <>
      {/* Large flower — top right */}
      <DecorWrap style={{ top: 20, right: 50, opacity: 0.15 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="decor-float-a">
          {/* Petals */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const cx = 60 + 26 * Math.cos(rad);
            const cy = 60 + 26 * Math.sin(rad);
            return (
              <ellipse key={i} cx={cx} cy={cy} rx="11" ry="18"
                fill={i % 2 === 0 ? "#C8A870" : "#E8C880"}
                opacity="0.9"
                transform={`rotate(${deg + 90} ${cx} ${cy})`}
              />
            );
          })}
          <circle cx="60" cy="60" r="16" fill="#C8603A" opacity="0.9" />
          <circle cx="60" cy="60" r="8" fill="#F8E060" opacity="0.8" />
        </svg>
      </DecorWrap>
      {/* Star confetti */}
      <DecorWrap style={{ top: 60, right: 180, opacity: 0.13 }}>
        <svg width="100" height="80" viewBox="0 0 100 80" fill="none" className="decor-float-b">
          {/* 5-point stars */}
          {[
            { x: 15, y: 15, r: 8, c: "#C8A870" },
            { x: 50, y: 10, r: 6, c: "#C8603A" },
            { x: 80, y: 20, r: 9, c: "#F8C860" },
            { x: 30, y: 50, r: 7, c: "#B08090" },
            { x: 70, y: 55, r: 6, c: "#C8A870" },
            { x: 10, y: 65, r: 5, c: "#C8603A" },
          ].map((s, i) => {
            const pts = Array.from({ length: 5 }, (_, j) => {
              const a = (j * 72 - 90) * (Math.PI / 180);
              const ia = (j * 72 - 90 + 36) * (Math.PI / 180);
              return `${(s.x + s.r * Math.cos(a)).toFixed(1)},${(s.y + s.r * Math.sin(a)).toFixed(1)} ${(s.x + s.r * 0.4 * Math.cos(ia)).toFixed(1)},${(s.y + s.r * 0.4 * Math.sin(ia)).toFixed(1)}`;
            }).join(" ");
            return <polygon key={i} points={pts} fill={s.c} opacity="0.85" />;
          })}
        </svg>
      </DecorWrap>
    </>
  );
}

/* ════════════════════════════════════════════════════
   BRAIN DUMP — Swirling ink spiral + cloud puff
   Dusty mauve, top right
   ════════════════════════════════════════════════════ */
export function BrainDumpDecor() {
  return (
    <>
      {/* Spiral — top right */}
      <DecorWrap style={{ top: 20, right: 40, opacity: 0.13 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="decor-float-c">
          <path
            d="M60 60 C60 50 70 45 75 52 C80 59 75 70 65 72 C52 74 42 64 44 52 C46 38 60 30 72 34 C86 38 92 54 88 68 C84 84 68 92 54 88 C38 84 30 66 34 52 C38 36 56 26 72 30"
            stroke="#B08090" strokeWidth="3" strokeLinecap="round" fill="none"
          />
          {/* Small cloud */}
          <ellipse cx="30" cy="95" rx="18" ry="10" fill="#C8A8B8" opacity="0.6" />
          <ellipse cx="20" cy="88" rx="12" ry="10" fill="#C8A8B8" opacity="0.6" />
          <ellipse cx="38" cy="87" rx="14" ry="11" fill="#D8C0C8" opacity="0.6" />
        </svg>
      </DecorWrap>
      {/* Ink dots — scattered */}
      <DecorWrap style={{ bottom: 50, right: 60, opacity: 0.09 }}>
        <svg width="80" height="60" viewBox="0 0 80 60" fill="none" className="decor-float-a">
          <circle cx="10" cy="30" r="6" fill="#B08090" />
          <circle cx="30" cy="15" r="4" fill="#C8A8B8" />
          <circle cx="55" cy="40" r="7" fill="#B08090" />
          <circle cx="70" cy="20" r="3.5" fill="#D8C0C8" />
        </svg>
      </DecorWrap>
    </>
  );
}

/* ════════════════════════════════════════════════════
   GOALS — Target rings + flower blooming from center
   Terracotta, behind progress section
   ════════════════════════════════════════════════════ */
export function GoalsDecor() {
  return (
    <>
      {/* Target rings + flower — top right */}
      <DecorWrap style={{ top: 10, right: 40, opacity: 0.14 }}>
        <svg width="130" height="130" viewBox="0 0 130 130" fill="none" className="decor-float-b">
          {/* Concentric rings */}
          <circle cx="65" cy="65" r="58" stroke="#C8603A" strokeWidth="1.5" fill="none" opacity="0.5" />
          <circle cx="65" cy="65" r="44" stroke="#C8603A" strokeWidth="1.5" fill="none" opacity="0.6" />
          <circle cx="65" cy="65" r="30" stroke="#C8603A" strokeWidth="1.5" fill="none" opacity="0.7" />
          <circle cx="65" cy="65" r="16" fill="#C8603A" opacity="0.25" />
          {/* Flower petals from center */}
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const cx = 65 + 22 * Math.cos(rad);
            const cy = 65 + 22 * Math.sin(rad);
            return (
              <ellipse key={i} cx={cx} cy={cy} rx="7" ry="12"
                fill="#F8C8D4" opacity="0.75"
                transform={`rotate(${deg + 90} ${cx} ${cy})`}
              />
            );
          })}
          <circle cx="65" cy="65" r="10" fill="#C8603A" opacity="0.7" />
          <circle cx="65" cy="65" r="5" fill="#F8E060" opacity="0.8" />
        </svg>
      </DecorWrap>
      {/* Small leaf accent — bottom left */}
      <DecorWrap style={{ bottom: 40, left: 20, opacity: 0.09 }}>
        <svg width="60" height="80" viewBox="0 0 60 80" fill="none" className="decor-drift-r">
          <path d="M30 75 Q28 55 20 40 Q35 45 38 60 Q42 45 36 30 Q48 40 44 58 Q50 45 48 30 Q58 42 52 60 Q48 72 30 75Z" fill="#8B9E7A" />
        </svg>
      </DecorWrap>
    </>
  );
}

/* ════════════════════════════════════════════════════
   AI AGENTS — Constellation dots + connecting lines
   Sage + cream, top right
   ════════════════════════════════════════════════════ */
export function AgentsDecor() {
  const stars = [
    { x: 30, y: 20 }, { x: 80, y: 10 }, { x: 120, y: 35 },
    { x: 100, y: 70 }, { x: 60, y: 85 }, { x: 20, y: 65 },
    { x: 50, y: 45 }, { x: 140, y: 55 },
  ];
  const lines = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[6,3],[2,7]];
  return (
    <>
      <DecorWrap style={{ top: 20, right: 30, opacity: 0.14 }}>
        <svg width="170" height="110" viewBox="0 0 170 110" fill="none" className="decor-float-c">
          {/* Connecting lines */}
          {lines.map(([a, b], i) => (
            <line key={i}
              x1={stars[a].x} y1={stars[a].y}
              x2={stars[b].x} y2={stars[b].y}
              stroke="#8B9E7A" strokeWidth="0.8" opacity="0.6"
            />
          ))}
          {/* Star dots */}
          {stars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={i === 6 ? 5 : 3.5}
              fill={i % 3 === 0 ? "#8B9E7A" : i % 3 === 1 ? "#C8A870" : "#C8603A"}
              opacity="0.9"
            />
          ))}
          {/* Sparkle cross on main star */}
          <line x1="47" y1="45" x2="53" y2="45" stroke="#C8A870" strokeWidth="1.5" />
          <line x1="50" y1="42" x2="50" y2="48" stroke="#C8A870" strokeWidth="1.5" />
        </svg>
      </DecorWrap>
      {/* Small orbit rings — bottom right */}
      <DecorWrap style={{ bottom: 40, right: 50, opacity: 0.09 }}>
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" className="decor-float-a">
          <circle cx="35" cy="35" r="30" stroke="#8B9E7A" strokeWidth="1" fill="none" strokeDasharray="4 4" />
          <circle cx="35" cy="35" r="18" stroke="#C8A870" strokeWidth="1" fill="none" strokeDasharray="3 3" />
          <circle cx="35" cy="35" r="5" fill="#C8603A" opacity="0.7" />
          <circle cx="65" cy="35" r="3" fill="#8B9E7A" opacity="0.8" />
          <circle cx="35" cy="5" r="2.5" fill="#C8A870" opacity="0.8" />
        </svg>
      </DecorWrap>
    </>
  );
}

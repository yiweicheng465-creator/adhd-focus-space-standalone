/* ============================================================
   ADHD FOCUS SPACE — PixelIcons
   Cute pixel-art style SVG icons for sidebar navigation.
   All icons use the same beige/terracotta Morandi palette.
   No colored backgrounds — just the pixel character on transparent.
   
   7 icons:
   - PixelHome      → cute laptop/computer with smiley face
   - PixelFocus     → pixel clock/timer with face
   - PixelTasks     → pixel notepad/checklist with face
   - PixelWins      → pixel trophy/star with face
   - PixelDump      → pixel brain/cloud with face
   - PixelGoals     → pixel target/flower with face
   - PixelAgents    → pixel robot/computer with face
   ============================================================ */

import React from "react";

// Shared pixel color — terracotta/dark beige, same as sidebar active color
const PX = "#5A4A3A";   // main pixel color (dark warm brown)
const PX2 = "#8C7B6B";  // lighter pixel for details

interface PixelIconProps {
  size?: number;
  active?: boolean;
  color?: string;
}

/* ── Pixel rect helper: draws a filled square at pixel grid position ── */
function P({ x, y, s = 2, c }: { x: number; y: number; s?: number; c?: string }) {
  return <rect x={x} y={y} width={s} height={s} fill={c || PX} />;
}

/* ════════════════════════════════════════════════════
   HOME — Cute pixel laptop with smiley face
   ════════════════════════════════════════════════════ */
export function PixelHome({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  const c2 = color || (active ? "#D4845A" : PX2);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Screen body */}
      <rect x="2" y="3" width="16" height="11" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Screen inner */}
      <rect x="4" y="5" width="12" height="7" fill={c} opacity="0.12" />
      {/* Smiley eyes */}
      <rect x="7" y="7" width="2" height="2" fill={c} />
      <rect x="11" y="7" width="2" height="2" fill={c} />
      {/* Smiley mouth — pixel curve */}
      <rect x="7" y="10" width="2" height="1" fill={c} />
      <rect x="9" y="11" width="2" height="1" fill={c} />
      <rect x="11" y="10" width="2" height="1" fill={c} />
      {/* Base/stand */}
      <rect x="6" y="14" width="8" height="1.5" fill={c} />
      <rect x="4" y="15.5" width="12" height="1.5" fill={c} />
      {/* Screen border highlight */}
      <rect x="2" y="3" width="16" height="1" fill={c2} opacity="0.3" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   FOCUS — Cute pixel alarm clock / timer with face
   ════════════════════════════════════════════════════ */
export function PixelFocus({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Clock body — rounded square */}
      <rect x="3" y="4" width="14" height="13" rx="1" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Bell bumps on top */}
      <rect x="5" y="2" width="3" height="2" fill={c} />
      <rect x="12" y="2" width="3" height="2" fill={c} />
      {/* Eyes */}
      <rect x="7" y="8" width="2" height="2" fill={c} />
      <rect x="11" y="8" width="2" height="2" fill={c} />
      {/* Smile */}
      <rect x="7" y="12" width="2" height="1" fill={c} />
      <rect x="9" y="13" width="2" height="1" fill={c} />
      <rect x="11" y="12" width="2" height="1" fill={c} />
      {/* Clock hands */}
      <rect x="9.5" y="6" width="1" height="3" fill={c} />
      <rect x="9.5" y="9" width="3" height="1" fill={c} />
      {/* Feet */}
      <rect x="5" y="17" width="2" height="1" fill={c} />
      <rect x="13" y="17" width="2" height="1" fill={c} />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   TASKS — Cute pixel clipboard/notepad with face
   ════════════════════════════════════════════════════ */
export function PixelTasks({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Clipboard body */}
      <rect x="3" y="4" width="14" height="15" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Clip at top */}
      <rect x="7" y="2" width="6" height="3" fill={c} />
      <rect x="8" y="1" width="4" height="2" fill="none" stroke={c} strokeWidth="1" />
      {/* Eyes */}
      <rect x="7" y="9" width="2" height="2" fill={c} />
      <rect x="11" y="9" width="2" height="2" fill={c} />
      {/* Smile */}
      <rect x="7" y="13" width="2" height="1" fill={c} />
      <rect x="9" y="14" width="2" height="1" fill={c} />
      <rect x="11" y="13" width="2" height="1" fill={c} />
      {/* Lines (like list items) */}
      <rect x="5" y="7" width="10" height="1" fill={c} opacity="0.3" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   WINS — Cute pixel trophy / star with face
   ════════════════════════════════════════════════════ */
export function PixelWins({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Trophy cup body */}
      <rect x="5" y="3" width="10" height="9" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Cup handles */}
      <rect x="2" y="4" width="3" height="5" fill="none" stroke={c} strokeWidth="1" />
      <rect x="15" y="4" width="3" height="5" fill="none" stroke={c} strokeWidth="1" />
      {/* Eyes */}
      <rect x="7" y="7" width="2" height="2" fill={c} />
      <rect x="11" y="7" width="2" height="2" fill={c} />
      {/* Smile */}
      <rect x="8" y="10" width="4" height="1" fill={c} />
      {/* Stem */}
      <rect x="9" y="12" width="2" height="3" fill={c} />
      {/* Base */}
      <rect x="6" y="15" width="8" height="2" fill={c} />
      {/* Star above */}
      <rect x="9" y="1" width="2" height="2" fill={c} />
      <rect x="8" y="2" width="4" height="1" fill={c} />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   BRAIN DUMP — Cute pixel brain/cloud with face
   ════════════════════════════════════════════════════ */
export function PixelDump({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Cloud/brain body — blocky pixel cloud */}
      <rect x="4" y="6" width="12" height="9" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Cloud bumps on top */}
      <rect x="4" y="4" width="4" height="3" fill="none" stroke={c} strokeWidth="1" />
      <rect x="8" y="3" width="4" height="4" fill="none" stroke={c} strokeWidth="1" />
      <rect x="12" y="4" width="4" height="3" fill="none" stroke={c} strokeWidth="1" />
      {/* Eyes */}
      <rect x="7" y="9" width="2" height="2" fill={c} />
      <rect x="11" y="9" width="2" height="2" fill={c} />
      {/* Wavy mouth — pixel style */}
      <rect x="7" y="12" width="2" height="1" fill={c} />
      <rect x="9" y="13" width="2" height="1" fill={c} />
      <rect x="11" y="12" width="2" height="1" fill={c} />
      {/* Brain squiggle lines */}
      <rect x="9" y="6" width="2" height="1" fill={c} opacity="0.4" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   GOALS — Simple upward arrow / flag
   ════════════════════════════════════════════════════ */
export function PixelGoals({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {/* Flag pole */}
      <line x1="5" y1="3" x2="5" y2="17" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      {/* Flag */}
      <path d="M5 3 L15 6.5 L5 10 Z" fill={c} opacity="0.85" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   AGENTS — Cute pixel robot with face
   ════════════════════════════════════════════════════ */
export function PixelAgents({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Robot head */}
      <rect x="3" y="4" width="14" height="11" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Antenna */}
      <rect x="9" y="1" width="2" height="3" fill={c} />
      <rect x="8" y="1" width="4" height="1.5" fill={c} />
      {/* Robot eyes — square */}
      <rect x="6" y="7" width="3" height="3" fill={c} opacity="0.8" />
      <rect x="11" y="7" width="3" height="3" fill={c} opacity="0.8" />
      {/* Eye shine */}
      <rect x="7" y="8" width="1" height="1" fill="white" opacity="0.6" />
      <rect x="12" y="8" width="1" height="1" fill="white" opacity="0.6" />
      {/* Mouth — pixel grid */}
      <rect x="6" y="12" width="2" height="1" fill={c} />
      <rect x="9" y="12" width="2" height="1" fill={c} />
      <rect x="12" y="12" width="2" height="1" fill={c} />
      {/* Neck + body */}
      <rect x="8" y="15" width="4" height="2" fill={c} />
      <rect x="5" y="17" width="10" height="2" fill={c} opacity="0.5" />
      {/* Ear bolts */}
      <rect x="1" y="7" width="2" height="2" fill={c} />
      <rect x="17" y="7" width="2" height="2" fill={c} />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   URGENT — Pixel flame / fire icon
   ════════════════════════════════════════════════════ */
export function PixelFire({ size = 16, color }: PixelIconProps) {
  const c = color || PX;
  // Flame: wide base, tapered top, inner glow core — 20×20 grid
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Outer flame body */}
      <rect x="8" y="1" width="4" height="2" fill={c} />
      <rect x="6" y="3" width="8" height="2" fill={c} />
      <rect x="5" y="5" width="10" height="2" fill={c} />
      <rect x="4" y="7" width="12" height="2" fill={c} />
      <rect x="3" y="9" width="14" height="3" fill={c} />
      <rect x="4" y="12" width="12" height="2" fill={c} />
      <rect x="5" y="14" width="10" height="2" fill={c} />
      <rect x="6" y="16" width="8" height="2" fill={c} />
      {/* Inner glow — lighter centre */}
      <rect x="7" y="8" width="6" height="6" fill={c} opacity="0.35" />
      <rect x="8" y="10" width="4" height="3" fill="white" opacity="0.18" />
      {/* Tip spark */}
      <rect x="9" y="0" width="2" height="2" fill={c} opacity="0.7" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   ACTIVE — Pixel checkmark in circle
   ════════════════════════════════════════════════════ */
export function PixelCheck({ size = 16, color }: PixelIconProps) {
  const c = color || PX;
  // Big bold checkmark — thick tick on 20×20
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Circle outline */}
      <rect x="4" y="1" width="12" height="2" fill={c} />
      <rect x="2" y="3" width="2" height="14" fill={c} />
      <rect x="16" y="3" width="2" height="14" fill={c} />
      <rect x="4" y="17" width="12" height="2" fill={c} />
      {/* Thick checkmark — left downstroke */}
      <rect x="5" y="10" width="3" height="3" fill={c} />
      <rect x="6" y="12" width="3" height="3" fill={c} />
      {/* Right upstroke */}
      <rect x="8" y="13" width="3" height="2" fill={c} />
      <rect x="10" y="11" width="3" height="3" fill={c} />
      <rect x="12" y="8" width="3" height="4" fill={c} />
      <rect x="14" y="6" width="2" height="3" fill={c} />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   WINS / STAR — Pixel 4-point star
   ════════════════════════════════════════════════════ */
export function PixelStar({ size = 16, color }: PixelIconProps) {
  const c = color || PX;
  // Classic 5-point pixel star on 20×20
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Top point */}
      <rect x="9" y="1" width="2" height="3" fill={c} />
      {/* Upper-left arm */}
      <rect x="5" y="4" width="4" height="2" fill={c} />
      <rect x="3" y="6" width="3" height="2" fill={c} />
      {/* Upper-right arm */}
      <rect x="11" y="4" width="4" height="2" fill={c} />
      <rect x="14" y="6" width="3" height="2" fill={c} />
      {/* Middle horizontal band */}
      <rect x="1" y="8" width="18" height="2" fill={c} />
      {/* Centre body */}
      <rect x="6" y="7" width="8" height="4" fill={c} />
      {/* Lower-left leg */}
      <rect x="3" y="11" width="4" height="2" fill={c} />
      <rect x="1" y="13" width="4" height="2" fill={c} />
      {/* Lower-right leg */}
      <rect x="13" y="11" width="4" height="2" fill={c} />
      <rect x="15" y="13" width="4" height="2" fill={c} />
      {/* Bottom gap between legs */}
      <rect x="5" y="13" width="10" height="2" fill={c} opacity="0" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   GOALS — Pixel target / bullseye
   ════════════════════════════════════════════════════ */
export function PixelTarget({ size = 16, color }: PixelIconProps) {
  const c = color || PX;
  // Bullseye: 3 concentric rings + centre dot, 20×20
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Outer ring */}
      <rect x="4" y="1" width="12" height="2" fill={c} />
      <rect x="1" y="4" width="2" height="12" fill={c} />
      <rect x="17" y="4" width="2" height="12" fill={c} />
      <rect x="4" y="17" width="12" height="2" fill={c} />
      <rect x="2" y="2" width="2" height="2" fill={c} />
      <rect x="16" y="2" width="2" height="2" fill={c} />
      <rect x="2" y="16" width="2" height="2" fill={c} />
      <rect x="16" y="16" width="2" height="2" fill={c} />
      {/* Middle ring */}
      <rect x="6" y="5" width="8" height="2" fill={c} />
      <rect x="5" y="6" width="2" height="8" fill={c} />
      <rect x="13" y="6" width="2" height="8" fill={c} />
      <rect x="6" y="13" width="8" height="2" fill={c} />
      {/* Inner ring */}
      <rect x="8" y="8" width="4" height="1" fill={c} />
      <rect x="8" y="11" width="4" height="1" fill={c} />
      <rect x="8" y="8" width="1" height="4" fill={c} />
      <rect x="11" y="8" width="1" height="4" fill={c} />
      {/* Centre dot */}
      <rect x="9" y="9" width="2" height="2" fill={c} />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   NEXT UP — Pixel lightning bolt
   ════════════════════════════════════════════════════ */
export function PixelLightning({ size = 16, color }: PixelIconProps) {
  const c = color || PX;
  // Bold lightning bolt — thick diagonal slash, 20×20
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Top-right block */}
      <rect x="11" y="1" width="5" height="2" fill={c} />
      <rect x="9" y="3" width="5" height="2" fill={c} />
      <rect x="7" y="5" width="5" height="2" fill={c} />
      {/* Middle wide band */}
      <rect x="5" y="7" width="10" height="3" fill={c} />
      {/* Lower-left block */}
      <rect x="5" y="10" width="8" height="2" fill={c} />
      <rect x="4" y="12" width="6" height="2" fill={c} />
      <rect x="3" y="14" width="5" height="2" fill={c} />
      <rect x="3" y="16" width="3" height="2" fill={c} />
      {/* Highlight streak */}
      <rect x="10" y="8" width="2" height="2" fill="white" opacity="0.25" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   FOCUS TIMER (mini) — Pixel clock face
   ════════════════════════════════════════════════════ */
export function PixelClockMini({ size = 16, color }: PixelIconProps) {
  const c = color || PX;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges">
      {/* Clock circle */}
      <rect x="3" y="1" width="10" height="2" fill={c} />
      <rect x="1" y="3" width="2" height="10" fill={c} />
      <rect x="13" y="3" width="2" height="10" fill={c} />
      <rect x="3" y="13" width="10" height="2" fill={c} />
      {/* Hour hand (12 o'clock) */}
      <rect x="7" y="4" width="2" height="4" fill={c} />
      {/* Minute hand (3 o'clock) */}
      <rect x="8" y="7" width="4" height="2" fill={c} />
      {/* Center dot */}
      <rect x="7" y="7" width="2" height="2" fill={c} />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   WIN ITEM — Pixel trophy cup (small, for list items)
   ════════════════════════════════════════════════════ */
export function PixelTrophy({ size = 16, color }: PixelIconProps) {
  const c = color || PX;
  // Trophy cup: wide bowl, two handles, stem, wide base, star inside — 20×20
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Cup body */}
      <rect x="5" y="2" width="10" height="2" fill={c} />
      <rect x="4" y="4" width="2" height="6" fill={c} />
      <rect x="14" y="4" width="2" height="6" fill={c} />
      <rect x="5" y="10" width="10" height="2" fill={c} />
      {/* Cup bottom curve */}
      <rect x="6" y="11" width="8" height="1" fill={c} />
      {/* Left handle */}
      <rect x="2" y="4" width="2" height="2" fill={c} />
      <rect x="1" y="6" width="2" height="3" fill={c} />
      <rect x="2" y="9" width="2" height="2" fill={c} />
      {/* Right handle */}
      <rect x="16" y="4" width="2" height="2" fill={c} />
      <rect x="17" y="6" width="2" height="3" fill={c} />
      <rect x="16" y="9" width="2" height="2" fill={c} />
      {/* Stem */}
      <rect x="9" y="12" width="2" height="3" fill={c} />
      {/* Base */}
      <rect x="5" y="15" width="10" height="2" fill={c} />
      <rect x="4" y="17" width="12" height="2" fill={c} />
      {/* Star inside cup */}
      <rect x="9" y="4" width="2" height="4" fill={c} opacity="0.7" />
      <rect x="7" y="6" width="6" height="2" fill={c} opacity="0.7" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   BRAIN DUMP header — Pixel brain/cloud
   ════════════════════════════════════════════════════ */
export function PixelBrain({ size = 20, color }: PixelIconProps) {
  const c = color || PX;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Main brain/cloud body */}
      <rect x="4" y="7" width="12" height="8" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Top bumps */}
      <rect x="4" y="5" width="4" height="3" fill="none" stroke={c} strokeWidth="1" />
      <rect x="8" y="3" width="4" height="5" fill="none" stroke={c} strokeWidth="1" />
      <rect x="12" y="5" width="4" height="3" fill="none" stroke={c} strokeWidth="1" />
      {/* Brain squiggles inside */}
      <rect x="6" y="9" width="3" height="1" fill={c} opacity="0.5" />
      <rect x="11" y="9" width="3" height="1" fill={c} opacity="0.5" />
      <rect x="6" y="11" width="8" height="1" fill={c} opacity="0.3" />
      {/* Bottom */}
      <rect x="7" y="15" width="6" height="2" fill={c} opacity="0.4" />
    </svg>
  );
}

/* ============================================================
   ADHD FOCUS SPACE — Mood Check-In v6.0
   Design: Old squircle/geometric faces from reference screenshot
   5 shapes: flat circle (Drained), rounded squircle (Low),
             brown circle (Okay), mint circle (Good), spiky sun (Glowing)
   Simple dot eyes, minimal expression lines — calm & friendly.
   ============================================================ */

import { useState } from "react";
import { toast } from "sonner";

const MOODS = [
  { value: 1, label: "Drained",  shadow: "rgba(180,175,200,0.4)" },
  { value: 2, label: "Low",      shadow: "rgba(175,165,195,0.4)" },
  { value: 3, label: "Okay",     shadow: "rgba(160,140,110,0.4)" },
  { value: 4, label: "Good",     shadow: "rgba(140,195,165,0.4)" },
  { value: 5, label: "Glowing",  shadow: "rgba(240,160,120,0.4)" },
];

const MESSAGES: Record<number, string> = {
  1: "Rest when you can.",
  2: "Small steps still count.",
  3: "Steady wins the race.",
  4: "Great energy today.",
  5: "You're glowing — channel it.",
};

/* ── 1. Drained — flat grey circle, OVAL/sleepy eyes, flat line mouth ── */
function FaceDrained({ active }: { active: boolean }) {
  const fill = active ? "#B8B4C8" : "#CCC8D8";
  const c = "#5A5570";
  return (
    <svg viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="32" fill={fill} />
      {/* Oval/sleepy eyes — wider than tall, half-closed look */}
      <ellipse cx="28" cy="37" rx="4.5" ry="2.5" fill={c} />
      <ellipse cx="52" cy="37" rx="4.5" ry="2.5" fill={c} />
      <line x1="30" y1="52" x2="50" y2="52" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── 2. Low — lavender rounded squircle, sad dots, slight frown ── */
function FaceLow({ active }: { active: boolean }) {
  const fill = active ? "#C0B8D4" : "#D4CEEA";
  const c = "#5A5070";
  return (
    <svg viewBox="0 0 80 80" fill="none">
      {/* Squircle shape — rounded rectangle */}
      <rect x="8" y="8" width="64" height="64" rx="22" fill={fill} />
      <circle cx="28" cy="37" r="3" fill={c} />
      <circle cx="52" cy="37" r="3" fill={c} />
      {/* Slight frown */}
      <path d="M30 52 Q40 47 50 52" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ── 3. Okay — warm brown/tan circle, round dot eyes, small nose, flat mouth ── */
function FaceOkay({ active }: { active: boolean }) {
  const fill = active ? "#A89070" : "#C4AA88";
  const c = "#4A3820";
  return (
    <svg viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="32" fill={fill} />
      {/* Round dot eyes — clearly circular, distinct from Drained's ovals */}
      <circle cx="28" cy="35" r="3.5" fill={c} />
      <circle cx="52" cy="35" r="3.5" fill={c} />
      {/* Small nose — tiny dot below center */}
      <circle cx="40" cy="44" r="1.8" fill={c} opacity="0.7" />
      {/* Flat/neutral mouth — slightly lower */}
      <line x1="30" y1="53" x2="50" y2="53" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── 4. Good — mint green circle, happy curve eyes, soft smile ── */
function FaceGood({ active }: { active: boolean }) {
  const fill = active ? "#90C8A8" : "#B0D8C0";
  const c = "#2A5840";
  return (
    <svg viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="32" fill={fill} />
      {/* Happy arc eyes */}
      <path d="M24 36 Q28 31 32 36" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M48 36 Q52 31 56 36" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M30 50 Q40 57 50 50" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ── 5. Glowing — spiky sun shape, happy eyes, wide smile ── */
function FaceGlowing({ active }: { active: boolean }) {
  const fill = active ? "#F0A878" : "#F8C8A0";
  const c = "#7A3818";
  // Sun rays: alternating long/short points for a clear star/sun look
  const numRays = 10;
  const outerR = 38, innerR = 28;
  const points = Array.from({ length: numRays * 2 }, (_, i) => {
    const angle = (i * Math.PI) / numRays - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    return `${40 + r * Math.cos(angle)},${40 + r * Math.sin(angle)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 80 80" fill="none">
      {/* Spiky sun body */}
      <polygon points={points} fill={fill} />
      {/* Happy arc eyes */}
      <path d="M26 37 Q30 32 34 37" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M46 37 Q50 32 54 37" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Big smile */}
      <path d="M28 50 Q40 60 52 50" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const FACE_COMPONENTS = [
  FaceDrained,
  FaceLow,
  FaceOkay,
  FaceGood,
  FaceGlowing,
];

const MOOD_BARS = [
  "#C0BCCC",
  "#C8C0D8",
  "#B09878",
  "#90C8A8",
  "#F0A878",
];

const M = {
  ink:    "oklch(0.28 0.018 65)",
  muted:  "oklch(0.55 0.018 70)",
  border: "oklch(0.88 0.014 75)",
};

interface MoodCheckInProps {
  currentMood: number | null;
  onMoodChange: (mood: number) => void;
}

export function MoodCheckIn({ currentMood, onMoodChange }: MoodCheckInProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const selectMood = (value: number) => {
    onMoodChange(value);
    toast(MESSAGES[value] || "Mood logged.", { duration: 2500 });
  };

  const displayMood = hovered ?? currentMood;
  const displayData = MOODS.find((m) => m.value === displayMood);

  return (
    <div className="flex flex-col gap-4">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-medium tracking-widest uppercase"
          style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.12em" }}
        >
          How are you feeling?
        </p>
        {displayData && (
          <span
            className="text-xs transition-all duration-200"
            style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
          >
            {displayData.label}
          </span>
        )}
      </div>

      {/* Face icons row */}
      <div className="flex items-end justify-between gap-1">
        {MOODS.map((mood, i) => {
          const FaceIcon = FACE_COMPONENTS[i];
          const isSelected = currentMood === mood.value;
          const isHovered  = hovered === mood.value;
          const isActive   = isSelected || isHovered;

          return (
            <button
              key={mood.value}
              onClick={() => selectMood(mood.value)}
              onMouseEnter={() => setHovered(mood.value)}
              onMouseLeave={() => setHovered(null)}
              className="flex flex-col items-center gap-1 flex-1 transition-all duration-200 focus:outline-none"
              style={{
                transform: isActive ? "scale(1.20) translateY(-4px)" : "scale(1)",
                filter: isActive ? `drop-shadow(0 4px 12px ${mood.shadow})` : "none",
                opacity: currentMood !== null && !isSelected && !isHovered ? 0.45 : 1,
              }}
              aria-label={mood.label}
            >
              <div className="w-11 h-11 sm:w-13 sm:h-13">
                <FaceIcon active={isActive} />
              </div>
              <span
                className="text-[9px] font-medium tracking-wide transition-all duration-200"
                style={{
                  color: isActive ? M.ink : "transparent",
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "0.06em",
                }}
              >
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Thin colour progress bar */}
      <div className="flex gap-1 mt-1">
        {MOODS.map((mood, i) => (
          <div
            key={mood.value}
            className="flex-1 h-0.5 transition-all duration-300"
            style={{
              background: currentMood !== null && mood.value <= currentMood
                ? MOOD_BARS[i]
                : M.border,
            }}
          />
        ))}
      </div>
    </div>
  );
}

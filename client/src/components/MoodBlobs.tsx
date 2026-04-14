/* ============================================================
   ADHD FOCUS SPACE — MoodBlobs
   Cute Korean-style blob characters for the mood check-in.
   Each blob is a hand-crafted SVG with organic shape + face.
   Mapped moods: Drained → 피곤(tired), Low → 우울(depressed),
                 Okay → 평온(calm), Good → 기쁨(joy), Glowing → 행복(happy)
   ============================================================ */

import React from "react";

interface BlobProps {
  size?: number;
  selected?: boolean;
  label: string;
}

// ── Drained: 피곤 (tired) — pale grey blob, sleepy eyes ──
export function BlobDrained({ size = 64, selected, label }: BlobProps) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 80 68" fill="none">
      {/* Body — flat oval, pale grey */}
      <ellipse cx="40" cy="38" rx="36" ry="26"
        fill={selected ? "#D0CBCA" : "#E8E4E2"}
        stroke={selected ? "#B0A8A5" : "none"} strokeWidth="1.5"
      />
      {/* Sleepy half-closed eyes */}
      <ellipse cx="28" cy="36" rx="5" ry="3" fill="#6B6560" />
      <ellipse cx="52" cy="36" rx="5" ry="3" fill="#6B6560" />
      {/* Eyelid lines (droopy) */}
      <path d="M23 34 Q28 31 33 34" stroke="#6B6560" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M47 34 Q52 31 57 34" stroke="#6B6560" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Tiny zzz */}
      <text x="58" y="22" fontSize="8" fill="#B0A8A5" fontFamily="serif" opacity="0.8">z</text>
      <text x="63" y="16" fontSize="6" fill="#B0A8A5" fontFamily="serif" opacity="0.6">z</text>
      {/* Label */}
      <text x="40" y="68" textAnchor="middle" fontSize="9" fill={selected ? "#6B6560" : "#A09890"}
        fontFamily="'DM Sans', sans-serif" letterSpacing="0.05em">{label}</text>
    </svg>
  );
}

// ── Low: 우울 (depressed) — grey teardrop blob, sad face ──
export function BlobLow({ size = 64, selected, label }: BlobProps) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 80 68" fill="none">
      {/* Body — rounded blob, muted grey */}
      <path d="M40 10 C58 10 68 22 68 38 C68 54 56 62 40 62 C24 62 12 54 12 38 C12 22 22 10 40 10Z"
        fill={selected ? "#C8C4C8" : "#DDD8DC"}
        stroke={selected ? "#A8A0A8" : "none"} strokeWidth="1.5"
      />
      {/* Sad eyes — small dots with tear */}
      <circle cx="28" cy="36" r="3.5" fill="#5A5060" />
      <circle cx="52" cy="36" r="3.5" fill="#5A5060" />
      {/* Tears */}
      <path d="M28 40 Q27 46 28 48" stroke="#8BBCD4" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M52 40 Q51 46 52 48" stroke="#8BBCD4" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Sad mouth */}
      <path d="M32 50 Q40 46 48 50" stroke="#5A5060" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Label */}
      <text x="40" y="68" textAnchor="middle" fontSize="9" fill={selected ? "#5A5060" : "#9890A0"}
        fontFamily="'DM Sans', sans-serif" letterSpacing="0.05em">{label}</text>
    </svg>
  );
}

// ── Okay: 평온 (calm) — mint green cloud blob, gentle smile ──
export function BlobOkay({ size = 64, selected, label }: BlobProps) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 80 68" fill="none">
      {/* Body — soft cloud/pebble shape, mint green */}
      <path d="M20 42 C16 42 12 38 12 34 C12 30 15 27 19 27 C19 21 24 16 30 16 C33 13 37 12 40 12 C50 12 58 20 58 30 C62 30 68 34 68 40 C68 46 63 50 57 50 L23 50 C21 50 20 46 20 42Z"
        fill={selected ? "#B8D4C0" : "#D0E8D8"}
        stroke={selected ? "#90B898" : "none"} strokeWidth="1.5"
      />
      {/* Calm eyes — gentle curved lines */}
      <path d="M27 34 Q30 31 33 34" stroke="#4A7858" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M47 34 Q50 31 53 34" stroke="#4A7858" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Gentle smile */}
      <path d="M33 42 Q40 46 47 42" stroke="#4A7858" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Label */}
      <text x="40" y="68" textAnchor="middle" fontSize="9" fill={selected ? "#4A7858" : "#7A9880"}
        fontFamily="'DM Sans', sans-serif" letterSpacing="0.05em">{label}</text>
    </svg>
  );
}

// ── Good: 기쁨 (joy) — yellow blob, happy squinty eyes ──
export function BlobGood({ size = 64, selected, label }: BlobProps) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 80 68" fill="none">
      {/* Body — round cheerful blob, warm yellow */}
      <path d="M40 8 C56 8 70 20 70 36 C70 52 56 62 40 62 C24 62 10 52 10 36 C10 20 24 8 40 8Z"
        fill={selected ? "#F0C840" : "#F8E070"}
        stroke={selected ? "#D0A820" : "none"} strokeWidth="1.5"
      />
      {/* Happy squinty eyes — curved upward arcs */}
      <path d="M24 33 Q28 28 32 33" stroke="#5A4820" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M48 33 Q52 28 56 33" stroke="#5A4820" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Big smile */}
      <path d="M28 44 Q40 54 52 44" stroke="#5A4820" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Rosy cheeks */}
      <ellipse cx="22" cy="42" rx="5" ry="3" fill="#F0A080" opacity="0.4" />
      <ellipse cx="58" cy="42" rx="5" ry="3" fill="#F0A080" opacity="0.4" />
      {/* Label */}
      <text x="40" y="68" textAnchor="middle" fontSize="9" fill={selected ? "#5A4820" : "#8A7830"}
        fontFamily="'DM Sans', sans-serif" letterSpacing="0.05em">{label}</text>
    </svg>
  );
}

// ── Glowing: 행복 (happy) — pink blob, big smile + hearts ──
export function BlobGlowing({ size = 64, selected, label }: BlobProps) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 80 68" fill="none">
      {/* Body — soft round blob, warm pink */}
      <path d="M40 8 C57 8 70 20 70 38 C70 54 57 64 40 64 C23 64 10 54 10 38 C10 20 23 8 40 8Z"
        fill={selected ? "#F0A8B0" : "#F8C8D0"}
        stroke={selected ? "#D08090" : "none"} strokeWidth="1.5"
      />
      {/* Happy eyes — upward arcs */}
      <path d="M24 34 Q28 29 32 34" stroke="#8B3050" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M48 34 Q52 29 56 34" stroke="#8B3050" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Big wide smile */}
      <path d="M26 45 Q40 57 54 45" stroke="#8B3050" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Rosy cheeks */}
      <ellipse cx="20" cy="43" rx="6" ry="3.5" fill="#E07080" opacity="0.35" />
      <ellipse cx="60" cy="43" rx="6" ry="3.5" fill="#E07080" opacity="0.35" />
      {/* Small hearts above */}
      <path d="M36 16 C36 14 38 13 38 15 C38 13 40 14 40 16 C40 18 38 20 38 20 C38 20 36 18 36 16Z"
        fill="#E07080" opacity="0.7" />
      <path d="M42 12 C42 10.5 43.5 9.5 43.5 11 C43.5 9.5 45 10.5 45 12 C45 13.5 43.5 15 43.5 15 C43.5 15 42 13.5 42 12Z"
        fill="#E07080" opacity="0.5" />
      {/* Label */}
      <text x="40" y="68" textAnchor="middle" fontSize="9" fill={selected ? "#8B3050" : "#B06070"}
        fontFamily="'DM Sans', sans-serif" letterSpacing="0.05em">{label}</text>
    </svg>
  );
}

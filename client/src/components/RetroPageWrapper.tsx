/* ============================================================
   RetroPageWrapper — shared retro lo-fi window chrome for full pages
   Usage:
     <RetroPageWrapper title="tasks.txt" sticker="leaf">
       {children}
     </RetroPageWrapper>
   ============================================================ */

import React from "react";

const BORDER = "oklch(0.78 0.060 340)";
const TITLEBAR_BG = "oklch(0.88 0.060 340)";
const TITLEBAR_TEXT = "oklch(0.30 0.060 320)";
const GRID_COLOR = "oklch(0.72 0.060 340 / 0.14)";

/* Small sticker SVGs for title bars */
const STICKERS: Record<string, React.ReactNode> = {
  star: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.55 }}>
      <path d="M6 1 L7 4.2 L10.5 4.2 L7.8 6.3 L8.8 9.5 L6 7.4 L3.2 9.5 L4.2 6.3 L1.5 4.2 L5 4.2 Z" fill="oklch(0.62 0.10 50)" />
    </svg>
  ),
  leaf: (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ opacity: 0.55 }}>
      <line x1="5" y1="11" x2="5" y2="2" stroke="oklch(0.48 0.10 145)" strokeWidth="1" strokeLinecap="round" />
      <path d="M5 8 Q1 6 1 2 Q4 4 5 8Z" fill="oklch(0.52 0.12 145)" />
      <path d="M5 6 Q9 4 9 0 Q6 2 5 6Z" fill="oklch(0.48 0.10 145)" />
    </svg>
  ),
  sparkle: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.55 }}>
      <path d="M6 0 L6.5 5 L12 6 L6.5 7 L6 12 L5.5 7 L0 6 L5.5 5 Z" fill="oklch(0.62 0.10 50)" />
    </svg>
  ),
  moon: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.55 }}>
      <path d="M9 6c0 2.761-2.239 5-5 5a5.02 5.02 0 0 1-1.25-.158C3.7 11.594 4.83 12 6 12c3.314 0 6-2.686 6-6S9.314 0 6 0c-1.17 0-2.3.406-3.25 1.158A5.02 5.02 0 0 1 4 1c2.761 0 5 2.239 5 5z" fill="oklch(0.68 0.08 55)" />
    </svg>
  ),
  plant: (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ opacity: 0.55 }}>
      <path d="M3 10 Q2.5 11.5 2 12 L8 12 Q7.5 11.5 7 10 Z" fill="oklch(0.62 0.10 35)" />
      <rect x="2" y="9" width="6" height="1.5" rx="0.75" fill="oklch(0.55 0.12 32)" />
      <line x1="5" y1="9" x2="5" y2="4" stroke="oklch(0.48 0.10 145)" strokeWidth="1" strokeLinecap="round" />
      <path d="M5 7 Q2 5.5 2 2 Q4 4 5 7Z" fill="oklch(0.52 0.12 145)" />
      <path d="M5 5.5 Q8 4 8 1 Q6 3 5 5.5Z" fill="oklch(0.48 0.10 145)" />
    </svg>
  ),
};

interface RetroPageWrapperProps {
  title: string;
  sticker?: keyof typeof STICKERS;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function RetroPageWrapper({ title, sticker = "star", children, className = "", style }: RetroPageWrapperProps) {
  return (
    <div
      className={`retro-window overflow-hidden ${className}`}
      style={{ position: "relative", ...style }}
    >


      {/* Retro title bar */}
      <div
        className="relative z-10 flex items-center justify-between"
        style={{
          padding: "5px 10px",
          background: TITLEBAR_BG,
          borderBottom: `1.5px solid ${BORDER}`,
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          color: TITLEBAR_TEXT,
          flexShrink: 0,
        }}
      >
        <span>{title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {STICKERS[sticker]}
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: 4 }}>
            <span style={{ fontSize: 9, padding: "1px 5px", background: "oklch(0.92 0.040 355)", border: `1px solid ${BORDER}`, color: TITLEBAR_TEXT, fontFamily: "'Space Mono', monospace", lineHeight: 1.4, cursor: "default" }}>_</span>
            <span style={{ fontSize: 9, padding: "1px 5px", background: "oklch(0.92 0.040 355)", border: `1px solid ${BORDER}`, color: TITLEBAR_TEXT, fontFamily: "'Space Mono', monospace", lineHeight: 1.4, cursor: "default" }}>□</span>
            <span style={{ fontSize: 9, padding: "1px 5px", background: "oklch(0.92 0.040 355)", border: `1px solid ${BORDER}`, color: TITLEBAR_TEXT, fontFamily: "'Space Mono', monospace", lineHeight: 1.4, cursor: "default" }}>✕</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

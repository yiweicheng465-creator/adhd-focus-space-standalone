/* ============================================================
   BackgroundStickers — scattered decorative SVG stickers
   Fixed behind all content, pointer-events none, subtle opacity
   ============================================================ */

export default function BackgroundStickers() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* ── Crescent Moon — top left ── */}
      <svg
        width="52" height="52" viewBox="0 0 52 52" fill="none"
        style={{ position: "absolute", top: "6%", left: "3%", opacity: 0.13, transform: "rotate(-18deg)" }}
      >
        <path
          d="M34 8C24.06 8 16 16.06 16 26s8.06 18 18 18c2.1 0 4.1-.36 5.96-1.02C35.3 46.3 29.9 48 24 48 13.51 48 5 39.49 5 29S13.51 10 24 10c3.64 0 7.04 1.02 9.96 2.8-.66-.54-1.3-1.1-1.96-1.6C34 9.4 34 8.7 34 8z"
          fill="#c49050"
        />
        <circle cx="34" cy="26" r="18" fill="#f5ede2" />
        <path
          d="M34 8C24.06 8 16 16.06 16 26s8.06 18 18 18c2.1 0 4.1-.36 5.96-1.02C35.3 46.3 29.9 48 24 48 13.51 48 5 39.49 5 29S13.51 10 24 10c3.64 0 7.04 1.02 9.96 2.8z"
          fill="#d4a96a"
        />
      </svg>

      {/* ── Four-point star — top right ── */}
      <svg
        width="36" height="36" viewBox="0 0 36 36" fill="none"
        style={{ position: "absolute", top: "4%", right: "8%", opacity: 0.15, transform: "rotate(12deg)" }}
      >
        <path d="M18 2 L20.5 15.5 L34 18 L20.5 20.5 L18 34 L15.5 20.5 L2 18 L15.5 15.5 Z" fill="#e07840" />
      </svg>

      {/* ── Small sparkle star — top center-right ── */}
      <svg
        width="22" height="22" viewBox="0 0 22 22" fill="none"
        style={{ position: "absolute", top: "11%", right: "22%", opacity: 0.18, transform: "rotate(-8deg)" }}
      >
        <path d="M11 1 L12.5 9.5 L21 11 L12.5 12.5 L11 21 L9.5 12.5 L1 11 L9.5 9.5 Z" fill="#d4837a" />
      </svg>

      {/* ── Tiny dot stars cluster — upper right ── */}
      {[
        { cx: 88, cy: 14, r: 2.5 },
        { cx: 93, cy: 9,  r: 1.8 },
        { cx: 84, cy: 8,  r: 1.5 },
        { cx: 91, cy: 18, r: 1.2 },
      ].map((s, i) => (
        <svg
          key={i}
          width="6" height="6" viewBox="0 0 6 6"
          style={{
            position: "absolute",
            top: `${s.cy}%`,
            right: `${100 - s.cx}%`,
            opacity: 0.22,
          }}
        >
          <circle cx="3" cy="3" r="3" fill="#c49050" />
        </svg>
      ))}

      {/* ── Potted plant — bottom left ── */}
      <svg
        width="64" height="72" viewBox="0 0 64 72" fill="none"
        style={{ position: "absolute", bottom: "6%", left: "2%", opacity: 0.13, transform: "rotate(4deg)" }}
      >
        {/* pot */}
        <path d="M20 48 L44 48 L40 68 L24 68 Z" fill="#c49050" />
        <rect x="18" y="44" width="28" height="6" rx="3" fill="#d4a96a" />
        {/* stem */}
        <line x1="32" y1="44" x2="32" y2="20" stroke="#7a9a5a" strokeWidth="3" strokeLinecap="round" />
        {/* leaves */}
        <ellipse cx="32" cy="28" rx="12" ry="7" fill="#8ab56a" transform="rotate(-30 32 28)" />
        <ellipse cx="32" cy="22" rx="10" ry="6" fill="#6a9a4a" transform="rotate(25 32 22)" />
        <ellipse cx="32" cy="16" rx="8" ry="5" fill="#8ab56a" transform="rotate(-15 32 16)" />
      </svg>

      {/* ── Small leaf sprig — left middle ── */}
      <svg
        width="40" height="48" viewBox="0 0 40 48" fill="none"
        style={{ position: "absolute", top: "42%", left: "1.5%", opacity: 0.12, transform: "rotate(-10deg)" }}
      >
        <line x1="20" y1="48" x2="20" y2="8" stroke="#7a9a5a" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="20" cy="24" rx="9" ry="5" fill="#8ab56a" transform="rotate(-35 20 24)" />
        <ellipse cx="20" cy="16" rx="8" ry="4.5" fill="#6a9a4a" transform="rotate(30 20 16)" />
        <ellipse cx="20" cy="10" rx="6" ry="4" fill="#8ab56a" transform="rotate(-20 20 10)" />
      </svg>

      {/* ── Folder — right middle ── */}
      <svg
        width="60" height="50" viewBox="0 0 60 50" fill="none"
        style={{ position: "absolute", top: "38%", right: "2%", opacity: 0.13, transform: "rotate(6deg)" }}
      >
        <path d="M4 12 C4 9.8 5.8 8 8 8 L24 8 L28 14 L52 14 C54.2 14 56 15.8 56 18 L56 44 C56 46.2 54.2 48 52 48 L8 48 C5.8 48 4 46.2 4 44 Z" fill="#e8a87c" />
        <path d="M4 18 L56 18 L56 44 C56 46.2 54.2 48 52 48 L8 48 C5.8 48 4 46.2 4 44 Z" fill="#f0c090" />
        <line x1="16" y1="28" x2="44" y2="28" stroke="#c49050" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="16" y1="34" x2="38" y2="34" stroke="#c49050" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      </svg>

      {/* ── Speech bubble — top left-center ── */}
      <svg
        width="58" height="50" viewBox="0 0 58 50" fill="none"
        style={{ position: "absolute", top: "18%", left: "5%", opacity: 0.12, transform: "rotate(-6deg)" }}
      >
        <rect x="2" y="2" width="54" height="36" rx="10" fill="#e8a09a" />
        <path d="M14 38 L8 48 L22 38 Z" fill="#e8a09a" />
        <line x1="12" y1="16" x2="46" y2="16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <line x1="12" y1="24" x2="36" y2="24" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      </svg>

      {/* ── Diamond gem — bottom right ── */}
      <svg
        width="44" height="44" viewBox="0 0 44 44" fill="none"
        style={{ position: "absolute", bottom: "12%", right: "4%", opacity: 0.15, transform: "rotate(10deg)" }}
      >
        <polygon points="22,2 42,16 22,42 2,16" fill="#a8c8e8" />
        <polygon points="22,2 42,16 22,18 2,16" fill="#c8e0f4" />
        <polygon points="22,18 42,16 22,42" fill="#88aed0" />
        <polygon points="22,18 2,16 22,42" fill="#a0c0e0" />
      </svg>

      {/* ── Small diamond — bottom center-left ── */}
      <svg
        width="28" height="28" viewBox="0 0 28 28" fill="none"
        style={{ position: "absolute", bottom: "22%", left: "12%", opacity: 0.14, transform: "rotate(-14deg)" }}
      >
        <polygon points="14,2 26,10 14,26 2,10" fill="#b8a8d8" />
        <polygon points="14,2 26,10 14,12 2,10" fill="#d0c8ec" />
        <polygon points="14,12 26,10 14,26" fill="#9888c0" />
        <polygon points="14,12 2,10 14,26" fill="#a898cc" />
      </svg>

      {/* ── Four-point star — bottom center ── */}
      <svg
        width="28" height="28" viewBox="0 0 28 28" fill="none"
        style={{ position: "absolute", bottom: "8%", left: "45%", opacity: 0.14, transform: "rotate(20deg)" }}
      >
        <path d="M14 2 L16 12 L26 14 L16 16 L14 26 L12 16 L2 14 L12 12 Z" fill="#c49050" />
      </svg>

      {/* ── Crescent moon small — right upper ── */}
      <svg
        width="32" height="32" viewBox="0 0 32 32" fill="none"
        style={{ position: "absolute", top: "28%", right: "6%", opacity: 0.12, transform: "rotate(20deg)" }}
      >
        <path
          d="M20 4C13.37 4 8 9.37 8 16s5.37 12 12 12c1.4 0 2.74-.24 3.97-.68C21.53 29.53 18.34 30 15 30 7.82 30 2 24.18 2 17S7.82 4 15 4c1.74 0 3.4.34 4.9.96z"
          fill="#d4a96a"
        />
        <circle cx="20" cy="16" r="12" fill="#f5ede2" />
        <path
          d="M20 4C13.37 4 8 9.37 8 16s5.37 12 12 12c1.4 0 2.74-.24 3.97-.68C21.53 29.53 18.34 30 15 30 7.82 30 2 24.18 2 17S7.82 4 15 4c1.74 0 3.4.34 4.9.96z"
          fill="#c49050"
        />
      </svg>

      {/* ── Tiny sparkle dots — scattered ── */}
      {[
        { top: "33%", left: "18%", size: 5, color: "#e07840" },
        { top: "55%", left: "8%",  size: 4, color: "#d4837a" },
        { top: "72%", left: "28%", size: 6, color: "#c49050" },
        { top: "48%", right: "14%", size: 5, color: "#8ab56a" },
        { top: "62%", right: "18%", size: 4, color: "#a8c8e8" },
        { top: "15%", left: "32%", size: 4, color: "#b8a8d8" },
      ].map((dot, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: dot.top,
            left: (dot as any).left,
            right: (dot as any).right,
            width: dot.size,
            height: dot.size,
            borderRadius: "50%",
            background: dot.color,
            opacity: 0.2,
          }}
        />
      ))}
    </div>
  );
}

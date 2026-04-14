/* ============================================================
   ADHD FOCUS SPACE — Weekly Reset Nudge v3.0 (Morandi)
   Monday environment reset reminder — sage/coral palette
   ============================================================ */

import { useState } from "react";
import { CheckCircle2, RefreshCw, X } from "lucide-react";

const RESET_CHECKLIST = [
  { id: "desktop", label: "Clear desktop & downloads folder" },
  { id: "inbox",   label: "Clear unread emails" },
  { id: "tabs",    label: "Close leftover browser tabs from last week" },
  { id: "notes",   label: "Archive scattered notes into Brain Dump" },
  { id: "agents",  label: "Review last week's AI Agent completions" },
];

const M = {
  coral:    "oklch(0.55 0.09 35)",
  coralBg:  "oklch(0.55 0.09 35 / 0.08)",
  coralBdr: "oklch(0.55 0.09 35 / 0.28)",
  sage:     "oklch(0.52 0.07 145)",
  sageBg:   "oklch(0.52 0.07 145 / 0.08)",
  sageBdr:  "oklch(0.52 0.07 145 / 0.28)",
  ink:      "oklch(0.28 0.018 65)",
  muted:    "oklch(0.55 0.018 70)",
  border:   "oklch(0.88 0.014 75)",
  card:     "oklch(0.985 0.007 80)",
};

export function WeeklyResetNudge() {
  const [dismissed, setDismissed] = useState(false);
  const [checked,   setChecked]   = useState<Set<string>>(new Set());

  const isMonday  = new Date().getDay() === 1;
  const forceShow = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("reset");

  if (dismissed || (!isMonday && !forceShow)) return null;

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allDone = checked.size === RESET_CHECKLIST.length;

  return (
    <div
      className="transition-all overflow-hidden"
      style={{
        background: allDone ? M.sageBg : M.coralBg,
        border: `1.5px solid ${allDone ? M.sageBdr : M.coralBdr}`,
        position: "relative",
      }}
    >


      {/* Retro title bar */}
      <div className="relative z-10" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "4px 10px",
        background: allDone ? M.sageBg : "oklch(0.940 0.020 70)",
        borderBottom: `1px solid ${allDone ? M.sageBdr : M.coralBdr}`,
        fontFamily: "'Space Mono', monospace",
        fontSize: 9,
        color: "oklch(0.45 0.020 62)",
      }}>
        <span>weekly_reset.exe</span>
        <button
          onClick={() => setDismissed(true)}
          style={{ fontSize: 8, padding: "1px 5px", cursor: "pointer",
            background: "oklch(0.88 0.022 68)", border: `1px solid ${M.border}`,
            color: "oklch(0.45 0.020 62)", fontFamily: "'Space Mono', monospace",
            lineHeight: 1.4,
          }}
        >✕</button>
      </div>

      <div className="relative z-10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 shrink-0" style={{ color: allDone ? M.sage : M.coral }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
              {allDone ? "🎉 Weekly reset complete!" : "🗓️ Monday Reset — 10 min to clear the clutter"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
              {allDone ? "A clean environment makes it easier to focus." : "Reduce visual noise, reduce distraction. Do this once a week."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {RESET_CHECKLIST.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all"
              style={{
                background:  isChecked ? M.sageBg : M.card,
                border:      `1px solid ${isChecked ? M.sageBdr : M.border}`,
                color:       isChecked ? M.muted : M.ink,
                textDecoration: isChecked ? "line-through" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isChecked) (e.currentTarget as HTMLButtonElement).style.borderColor = M.coralBdr;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = isChecked ? M.sageBdr : M.border;
              }}
            >
              {isChecked
                ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: M.sage }} />
                : <div className="w-4 h-4 shrink-0" style={{ border: `2px solid ${M.muted}`, borderRadius: "50%" }} />
              }
              <span className="text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {allDone && (
        <button
          onClick={() => setDismissed(true)}
          className="mt-3 w-full py-2 text-sm font-medium transition-all hover:opacity-90"
          style={{ background: M.sage, color: "oklch(0.97 0.005 80)", fontFamily: "'DM Sans', sans-serif" }}
        >
          Done — dismiss reminder
        </button>
      )}
      </div>{/* /z-10 wrapper */}
    </div>
  );
}

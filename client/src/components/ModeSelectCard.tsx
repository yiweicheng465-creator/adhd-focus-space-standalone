/* ============================================================
   ADHD FOCUS SPACE — ModeSelectCard
   Daily opening card: "How is your brain feeling today?"
   Shows once per day (same localStorage-date logic as DailyCheckIn).
   Selecting a mode writes adhd-daily-mode + applies timer defaults.
   ============================================================ */

import { useState } from "react";
import {
  ALL_MODES,
  DailyMode,
  getModeConfig,
  getTodayMode,
  setTodayMode,
} from "@/lib/modeConfig";
import { useTimer } from "@/contexts/TimerContext";

/* ── localStorage key for "skip today" ── */
function getTodayKey() {
  return `adhd-mode-skip-${new Date().toDateString()}`;
}

/** Clear today's skip flag so the card shows again (useful for testing). */
export function resetModeCard(): void {
  try {
    // Clear skip flag for today
    localStorage.removeItem(getTodayKey());
    // Also clear the mode selection so the card shows as fresh
    localStorage.removeItem("adhd-daily-mode");
    localStorage.removeItem("adhd-daily-mode-date");
  } catch {}
}

export function useModeSelectCard() {
  const alreadyPicked = getTodayMode() !== null;
  const skipped = typeof localStorage !== "undefined"
    ? !!localStorage.getItem(getTodayKey())
    : false;
  const [show, setShow] = useState(!alreadyPicked && !skipped);

  const dismiss = (permanent: boolean) => {
    if (permanent) localStorage.setItem(getTodayKey(), "1");
    setShow(false);
  };

  return { show, dismiss };
}

interface ModeSelectCardProps {
  onDone: (mode: DailyMode) => void;
  onSkip: () => void;
  onClose: () => void;
  displayName?: string;
}

export function ModeSelectCard({ onDone, onSkip, onClose, displayName }: ModeSelectCardProps) {
  const [selected, setSelected] = useState<DailyMode | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const { applyDuration } = useTimer();

  const greeting = (() => {
    const h = new Date().getHours();
    const suffix = displayName ? `, ${displayName}` : "";
    if (h < 12) return `Good morning${suffix}`;
    if (h < 17) return `Good afternoon${suffix}`;
    if (h < 21) return `Good evening${suffix}`;
    return `Hey${suffix}`;
  })();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const handleSelect = (mode: DailyMode) => {
    setSelected(mode);
  };

  const handleConfirm = () => {
    if (!selected) return;
    const cfg = getModeConfig(selected);
    // Persist mode
    setTodayMode(selected);
    // Apply timer durations immediately
    applyDuration("focus", cfg.timerFocus);
    applyDuration("short", cfg.timerShort);
    applyDuration("long", cfg.timerLong);
    setConfirmed(true);
    // Small delay so user sees the confirmation flash
    setTimeout(() => onDone(selected), 900);
  };

  const M = {
    ink: "#4A1030",
    muted: "#C070A0",
    border: "rgba(212,88,152,0.18)",
    accent: "#D45898",
    bg: "oklch(0.982 0.008 355)",
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(180,60,120,0.22)", backdropFilter: "blur(7px)" }}
    >
      <div
        className="w-full max-w-lg animate-scale-in overflow-hidden"
        style={{
          background: M.bg,
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow:
            "0 32px 64px rgba(140,40,90,0.22), 0 12px 32px rgba(180,60,120,0.14), 0 4px 12px rgba(0,0,0,0.08)",
          position: "relative",
        }}
      >
        {/* Mac-style title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 14px 8px",
            borderBottom: "1px solid rgba(212,88,152,0.12)",
            background: "rgba(249,214,232,0.45)",
            borderRadius: "20px 20px 0 0",
          }}
        >
          <button
            onClick={onClose}
            title="Close"
            style={{
              width: 12, height: 12, borderRadius: "50%",
              background: "#FF5F57", border: "1px solid rgba(0,0,0,0.1)",
              cursor: "pointer", padding: 0, marginRight: 6, flexShrink: 0,
            }}
          />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E", border: "1px solid rgba(0,0,0,0.1)", marginRight: 6, flexShrink: 0 }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28C840", border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
          <span
            style={{
              flex: 1, textAlign: "center",
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.55rem", letterSpacing: "0.10em",
              color: "oklch(0.52 0.08 340)", textTransform: "lowercase",
            }}
          >
            daily_mode_select.exe
          </span>
          {/* X close button — right side of title bar */}
          <button
            onClick={onClose}
            title="Close (reappears on next refresh)"
            style={{
              width: 22, height: 22,
              borderRadius: 4,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "oklch(0.55 0.08 340)",
              fontSize: "0.75rem",
              lineHeight: 1,
              flexShrink: 0,
              transition: "background 0.12s, color 0.12s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,88,152,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.38 0.10 340)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.55 0.08 340)"; }}
          >
            ✕
          </button>
        </div>

        {/* Header */}
        <div style={{ padding: "22px 28px 6px" }}>
          <p style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: M.muted, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
            {today}
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.45rem", fontWeight: 700, fontStyle: "italic",
              color: M.ink, margin: 0,
            }}
          >
            {confirmed && selected
              ? `${getModeConfig(selected).icon} Entering ${getModeConfig(selected).label}…`
              : `${greeting} —`}
          </h2>
          {!confirmed && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "oklch(0.38 0.06 340)", marginTop: 4, lineHeight: 1.5 }}>
              How is your brain feeling today? Pick a mode and we'll adjust your routines and AI coach to match.
            </p>
          )}
        </div>

        {/* Mode cards grid */}
        {!confirmed && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              padding: "14px 28px 20px",
            }}
          >
            {ALL_MODES.map((mode) => {
              const cfg = getModeConfig(mode);
              const isSelected = selected === mode;
              return (
                <button
                  key={mode}
                  onClick={() => handleSelect(mode)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 5,
                    padding: "14px 14px 12px",
                    borderRadius: 12,
                    border: isSelected
                      ? `2px solid ${cfg.color}`
                      : "2px solid rgba(212,88,152,0.15)",
                    background: isSelected
                      ? `${cfg.color}14`
                      : "rgba(255,255,255,0.55)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.18s ease",
                    boxShadow: isSelected
                      ? `0 4px 16px ${cfg.color}30`
                      : "0 1px 4px rgba(0,0,0,0.06)",
                    transform: isSelected ? "scale(1.02)" : "scale(1)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Selected tick */}
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute", top: 8, right: 8,
                        width: 18, height: 18, borderRadius: "50%",
                        background: cfg.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.60rem", color: "white",
                      }}
                    >
                      ✓
                    </div>
                  )}

                  {/* Icon + label */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{cfg.icon}</span>
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 700, fontSize: "0.82rem",
                        color: isSelected ? cfg.color : M.ink,
                        transition: "color 0.18s",
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  {/* Tagline */}
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "0.48rem", letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: isSelected ? cfg.color : M.muted,
                      transition: "color 0.18s",
                    }}
                  >
                    {cfg.tagline}
                  </span>

                  {/* Description */}
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.72rem", lineHeight: 1.4,
                      color: "oklch(0.40 0.05 340)",
                    }}
                  >
                    {cfg.description}
                  </span>

                  {/* Timer badge */}
                  <div
                    style={{
                      marginTop: 4,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 7px",
                      borderRadius: 20,
                      background: isSelected ? `${cfg.color}20` : "rgba(212,88,152,0.07)",
                      border: `1px solid ${isSelected ? cfg.color + "40" : "rgba(212,88,152,0.15)"}`,
                    }}
                  >
                    <span style={{ fontSize: "0.55rem", color: M.muted }}>⏱</span>
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "0.48rem", letterSpacing: "0.06em",
                        color: isSelected ? cfg.color : M.muted,
                      }}
                    >
                      {cfg.timerFocus}m focus · {cfg.timerShort}m break
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Confirmed state — AI opener preview */}
        {confirmed && selected && (
          <div style={{ padding: "18px 28px 24px" }}>
            <div
              style={{
                background: "oklch(0.97 0.012 355)",
                border: `1px solid rgba(212,88,152,0.18)`,
                borderLeft: `4px solid ${getModeConfig(selected).color}`,
                borderRadius: 8,
                padding: "14px 16px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.90rem",
                color: "oklch(0.28 0.04 320)",
                lineHeight: 1.7,
                fontStyle: "italic",
              }}
            >
              "{getModeConfig(selected).aiOpener}"
            </div>
          </div>
        )}

        {/* Footer */}
        {!confirmed && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 28px 18px",
              borderTop: `1px solid ${M.border}`,
            }}
          >
            <button
              onClick={onSkip}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.78rem",
                color: M.muted,
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span style={{ fontSize: "0.70rem" }}>⏭</span>
              Skip for today
            </button>

            <button
              onClick={handleConfirm}
              disabled={!selected}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: "0.85rem",
                padding: "9px 22px",
                borderRadius: 8,
                border: "none",
                background: selected ? getModeConfig(selected).color : "oklch(0.82 0.04 340)",
                color: "white",
                cursor: selected ? "pointer" : "not-allowed",
                opacity: selected ? 1 : 0.55,
                transition: "all 0.18s",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              Enter workspace
              <span style={{ fontSize: "0.85rem" }}>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

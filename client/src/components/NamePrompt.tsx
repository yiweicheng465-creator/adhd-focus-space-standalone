/* ============================================================
   NamePrompt — one-time retro-styled name input modal
   Shows on first visit (when no name is saved).
   AI works out of the box — no key needed on first run.
   ============================================================ */

import { useState, useRef, useEffect } from "react";

interface NamePromptProps {
  onSave: (name: string) => void;
  onSkip: () => void;
}

const DARK   = "oklch(0.28 0.040 320)";
const ACCENT = "oklch(0.58 0.18 340)";
const BORDER = "oklch(0.78 0.060 340)";
const BG     = "oklch(0.970 0.022 355)";
const PANEL  = "oklch(0.960 0.018 350)";

export function NamePrompt({ onSave, onSkip }: NamePromptProps) {
  const [name, setName] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 80);
  }, []);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave(trimmedName);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onSkip();
  };

  return (
    /* Backdrop */
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "oklch(0.28 0.04 320 / 0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(2px)",
    }}>
      {/* Retro window */}
      <div style={{
        background: BG,
        border: `3px solid ${DARK}`,
        boxShadow: `5px 5px 0 ${DARK}`,
        width: 380,
        maxWidth: "92vw",
        fontFamily: "'JetBrains Mono', monospace",
        animation: "ft-fadeIn 0.3s ease forwards",
      }}>
        {/* Title bar */}
        <div style={{
          background: ACCENT,
          borderBottom: `2px solid ${DARK}`,
          padding: "5px 10px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 8, letterSpacing: "0.14em", color: "#FAF6F1", fontWeight: 700, textTransform: "uppercase" }}>
            hello.exe
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {["_", "□", "×"].map((c) => (
              <div key={c} style={{ width: 12, height: 12, background: "#FAF6F1", border: `1px solid ${DARK}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: DARK, cursor: c === "×" ? "pointer" : "default" }}
                onClick={c === "×" ? onSkip : undefined}
              >{c}</div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 20px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Emoji + heading */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}>✨</div>
            <p style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: 0, letterSpacing: "0.04em" }}>
              What should I call you?
            </p>
            <p style={{ fontSize: 9, color: BORDER, margin: "6px 0 0", letterSpacing: "0.06em", lineHeight: 1.5 }}>
              I'll use your name to greet you each day.
            </p>
          </div>

          {/* Name input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 7, letterSpacing: "0.16em", color: BORDER, textTransform: "uppercase" }}>
              Your name
            </label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKey}
              placeholder="e.g. Alex"
              maxLength={50}
              style={{
                border: `2px solid ${name.trim() ? ACCENT : BORDER}`,
                background: PANEL,
                padding: "8px 10px",
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                color: DARK,
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button
              onClick={onSkip}
              style={{
                background: "transparent",
                border: `1.5px solid ${BORDER}`,
                color: BORDER,
                padding: "6px 14px",
                fontSize: 8,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.10em",
              }}
            >
              skip for now
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              style={{
                background: name.trim() ? ACCENT : BORDER,
                border: "none",
                color: "#FAF6F1",
                padding: "6px 18px",
                fontSize: 8,
                cursor: name.trim() ? "pointer" : "not-allowed",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.12em",
                boxShadow: name.trim() ? `2px 2px 0 ${DARK}` : "none",
                transition: "background 0.15s, box-shadow 0.15s",
              }}
            >
              let's go ✦
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

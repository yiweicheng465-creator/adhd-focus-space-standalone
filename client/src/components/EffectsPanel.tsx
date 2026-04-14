/* ============================================================
   ADHD FOCUS SPACE — Settings Panel v3.0
   Sections: Film Grain | Theme Hue | Work Mode | OpenAI API Key
   ============================================================ */

import { useState, useEffect, useRef, useCallback } from "react";
import { useFilmGrain } from "@/components/FilmGrain";
import { useWorkMode } from "@/components/WorkModeToggle";
import { useHue, HUE_PRESETS } from "@/components/HueShift";
import { toast } from "sonner";

/* ─── Horizontal range slider ─────────────────────────────── */
function HSlider({
  value,
  onChange,
  accentColor,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  accentColor: string;
  disabled?: boolean;
}) {
  return (
    <div style={{ position: "relative", width: "100%", height: 16, display: "flex", alignItems: "center" }}>
      <div style={{
        position: "absolute", left: 0, right: 0, height: 4,
        background: disabled ? "oklch(0.88 0.015 330)" : "oklch(0.88 0.06 340)",
        borderRadius: 2,
        border: `1px solid ${disabled ? "oklch(0.82 0.010 330)" : "oklch(0.80 0.06 340)"}`,
        overflow: "hidden",
      }}>
        <div style={{
          width: `${value}%`, height: "100%",
          background: disabled ? "oklch(0.72 0.015 330)" : accentColor,
          borderRadius: 2,
          transition: "width 0.05s linear, background 0.2s",
        }} />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          position: "absolute", left: 0, right: 0, width: "100%",
          opacity: 0, cursor: disabled ? "not-allowed" : "ew-resize",
          height: 16, margin: 0, padding: 0,
        }}
      />
      <div style={{
        position: "absolute",
        left: `calc(${value}% - 6px)`,
        width: 12, height: 12,
        background: disabled ? "oklch(0.82 0.010 330)" : "white",
        border: `2px solid ${disabled ? "oklch(0.72 0.015 330)" : accentColor}`,
        borderRadius: "50%",
        boxShadow: disabled ? "none" : `0 1px 3px ${accentColor}55`,
        transition: "left 0.05s linear, border-color 0.2s, background 0.2s",
        pointerEvents: "none",
      }} />
    </div>
  );
}

/* ─── 3D glossy traffic-light dots ─────────────────────────── */
function TitleDots() {
  const dots = [
    { base: "oklch(0.72 0.18 25)",  hi: "oklch(0.88 0.12 25)",  sh: "oklch(0.52 0.20 25)" },
    { base: "oklch(0.78 0.14 85)",  hi: "oklch(0.92 0.10 85)",  sh: "oklch(0.58 0.16 85)" },
    { base: "oklch(0.72 0.14 160)", hi: "oklch(0.88 0.10 160)", sh: "oklch(0.52 0.16 160)" },
  ];
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {dots.map((d, i) => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${d.hi} 0%, ${d.base} 55%, ${d.sh} 100%)`,
          boxShadow: `0 1px 2px ${d.sh}88, inset 0 1px 1px ${d.hi}99`,
          flexShrink: 0,
        }} />
      ))}
    </div>
  );
}

/* ─── Main SettingsPanel ─────────────────────────────────────── */
export function EffectsPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { intensity, setIntensity, speed, setSpeed } = useFilmGrain();
  const { enabled: workMode, toggle: toggleWorkMode } = useWorkMode();
  const { hue, setHue, reset: resetHue } = useHue();

  // ── API Key state ──
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null); // null = not checked yet
  const [keyLoading, setKeyLoading] = useState(false);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [freeLimit, setFreeLimit] = useState<number>(5);

  // Check key status when panel opens
  useEffect(() => {
    if (!open) return;
    fetch("/api/key", { method: "GET", credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setHasKey(d.hasKey ?? false);
        setUsageCount(d.usageCount ?? 0);
        setFreeLimit(d.freeLimit ?? 5);
      })
      .catch(() => setHasKey(false));
  }, [open]);

  const saveKey = async () => {
    if (!apiKeyInput.trim()) return;
    setKeyLoading(true);
    try {
      const res = await fetch("/api/key", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKeyInput.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Failed to save key");
        return;
      }
      setHasKey(true);
      setApiKeyInput("");
      toast.success("API key saved securely.");
    } catch {
      toast.error("Failed to save key. Are you logged in?");
    } finally {
      setKeyLoading(false);
    }
  };

  const removeKey = async () => {
    setKeyLoading(true);
    try {
      const res = await fetch("/api/key", { method: "DELETE", credentials: "include" });
      if (!res.ok) { toast.error("Failed to remove key"); return; }
      setHasKey(false);
      setApiKeyInput("");
      // Re-fetch to get updated usage count
      fetch("/api/key", { method: "GET", credentials: "include" })
        .then((r) => r.json())
        .then((d) => { setUsageCount(d.usageCount ?? 0); setFreeLimit(d.freeLimit ?? 5); })
        .catch(() => {});
      toast.success("API key removed.");
    } catch {
      toast.error("Failed to remove key.");
    } finally {
      setKeyLoading(false);
    }
  };

  const grainOn = intensity > 0;
  const iconColor = (open || grainOn || workMode)
    ? "oklch(0.48 0.18 340)"
    : "oklch(0.60 0.060 330)";

  // Close on outside click or Escape key
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={panelRef} style={{ position: "relative", width: "100%" }}>
      {/* ── Sidebar button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Settings"
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px 0 5px",
          gap: 2,
          background: open ? "oklch(0.58 0.18 340 / 0.10)" : "none",
          border: "none",
          cursor: "pointer",
          transition: "background 0.15s",
          position: "relative",
        }}
      >

        {/* Gear icon */}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span style={{
          fontSize: "0.40rem",
          fontFamily: "'Space Mono', monospace",
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: iconColor,
          lineHeight: 1,
        }}>
          SET
        </span>
      </button>

      {/* ── Popup panel ── */}
      {open && (
        <div style={{
          position: "fixed",
          left: 56,
          bottom: 80,
          width: 240,
          zIndex: 10000,
          fontFamily: "'Space Mono', monospace",
          filter: "drop-shadow(3px 3px 0 oklch(0.55 0.12 340 / 0.35))",
        }}>
          {/* Title bar */}
          <div style={{
            background: "#F9D6E8",
            borderRadius: "6px 6px 0 0",
            border: "1.5px solid oklch(0.82 0.08 340)",
            borderBottom: "1px solid oklch(0.82 0.08 340)",
            padding: "5px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <TitleDots />
              <span style={{ fontSize: "0.60rem", color: "oklch(0.38 0.10 340)", letterSpacing: "0.10em", textTransform: "lowercase" }}>
                settings.exe
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.50 0.10 340)", fontSize: "0.75rem", lineHeight: 1, padding: "0 2px" }}
            >×</button>
          </div>

          {/* Body */}
          <div style={{
            background: "oklch(0.98 0.015 340)",
            border: "1.5px solid oklch(0.82 0.08 340)",
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            padding: "12px 14px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}>

              <>
                {/* Film Grain section */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.55rem", color: "oklch(0.45 0.12 340)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      ▣ Film Grain
                    </span>
                    <button
                      onClick={() => setIntensity(grainOn ? 0 : 40)}
                      style={{
                        fontSize: "0.44rem",
                        fontFamily: "'Space Mono', monospace",
                        letterSpacing: "0.08em",
                        padding: "2px 6px",
                        borderRadius: 10,
                        border: `1px solid ${grainOn ? "oklch(0.55 0.18 340)" : "oklch(0.72 0.040 330)"}`,
                        background: grainOn ? "oklch(0.55 0.18 340)" : "transparent",
                        color: grainOn ? "white" : "oklch(0.60 0.040 330)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {grainOn ? "ON" : "OFF"}
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.48rem", color: "oklch(0.55 0.08 340)", letterSpacing: "0.06em" }}>INTENSITY</span>
                      <span style={{ fontSize: "0.48rem", color: "oklch(0.55 0.14 340)", letterSpacing: "0.06em" }}>{intensity === 0 ? "OFF" : `${intensity}%`}</span>
                    </div>
                    <HSlider value={intensity} onChange={setIntensity} accentColor="oklch(0.55 0.18 340)" />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.48rem", color: "oklch(0.55 0.08 340)", letterSpacing: "0.06em" }}>SPEED</span>
                      <span style={{ fontSize: "0.48rem", color: "oklch(0.50 0.14 295)", letterSpacing: "0.06em" }}>{speed === 0 ? "FROZEN" : `${speed}%`}</span>
                    </div>
                    <HSlider value={speed} onChange={setSpeed} accentColor="oklch(0.55 0.14 295)" disabled={!grainOn} />
                  </div>
                </div>

                 {/* Divider */}
                <div style={{ height: 1, background: "oklch(0.88 0.06 340)", margin: "0 -2px" }} />

                {/* ── Hue Shift section ── */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.55rem", color: "oklch(0.45 0.12 340)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      ◈ Theme Hue
                    </span>
                    <button
                      onClick={resetHue}
                      style={{
                        fontSize: "0.40rem",
                        fontFamily: "'Space Mono', monospace",
                        letterSpacing: "0.08em",
                        padding: "2px 6px",
                        borderRadius: 10,
                        border: "1px solid oklch(0.72 0.040 330)",
                        background: "transparent",
                        color: "oklch(0.60 0.040 330)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      RESET
                    </button>
                  </div>
                  {/* Preset swatches */}
                  <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                    {HUE_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        title={p.label}
                        onClick={() => setHue(p.hue)}
                        style={{
                          width: 18, height: 18,
                          borderRadius: "50%",
                          background: p.color,
                          border: Math.abs(hue - p.hue) < 10
                            ? "2.5px solid oklch(0.30 0 0)"
                            : "2px solid transparent",
                          cursor: "pointer",
                          flexShrink: 0,
                          transition: "border-color 0.15s, transform 0.15s",
                          transform: Math.abs(hue - p.hue) < 10 ? "scale(1.25)" : "scale(1)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.20)",
                          outline: "none",
                        }}
                      />
                    ))}
                  </div>
                  {/* Hue range slider */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.48rem", color: "oklch(0.55 0.08 340)", letterSpacing: "0.06em" }}>HUE</span>
                      <span style={{
                        fontSize: "0.48rem",
                        color: `hsl(${hue},60%,45%)`,
                        letterSpacing: "0.06em",
                        fontFamily: "'Space Mono', monospace",
                      }}>{hue}°</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={hue}
                      onChange={(e) => setHue(Number(e.target.value))}
                      style={{
                        width: "100%",
                        height: 6,
                        borderRadius: 3,
                        cursor: "pointer",
                        WebkitAppearance: "none",
                        appearance: "none",
                        background: `linear-gradient(to right,
                          hsl(0,65%,62%), hsl(45,65%,62%), hsl(90,65%,55%),
                          hsl(140,55%,52%), hsl(190,65%,55%), hsl(220,65%,62%),
                          hsl(270,60%,65%), hsl(310,65%,65%), hsl(330,65%,65%), hsl(360,65%,62%))`,
                        outline: "none",
                        border: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "oklch(0.88 0.06 340)", margin: "0 -2px" }} />
                {/* Work Mode section */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: "0.55rem", color: "oklch(0.45 0.12 340)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block" }}>
                        ▤ Work Mode
                      </span>
                      <span style={{ fontSize: "0.44rem", color: "oklch(0.62 0.060 330)", letterSpacing: "0.04em", marginTop: 2, display: "block" }}>
                        strips all colour → greyscale
                      </span>
                    </div>
                    <button
                      onClick={toggleWorkMode}
                      style={{
                        width: 36, height: 20,
                        borderRadius: 10,
                        border: `1.5px solid ${workMode ? "oklch(0.30 0 0)" : "oklch(0.72 0.040 330)"}`,
                        background: workMode ? "oklch(0.25 0 0)" : "oklch(0.92 0.015 330)",
                        cursor: "pointer",
                        position: "relative",
                        transition: "background 0.2s, border-color 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: "absolute",
                        top: 2, left: workMode ? 16 : 2,
                        width: 14, height: 14,
                        borderRadius: "50%",
                        background: workMode ? "white" : "oklch(0.72 0.040 330)",
                        transition: "left 0.2s, background 0.2s",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
                      }} />
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "oklch(0.88 0.06 340)", margin: "0 -2px" }} />

                {/* ── OpenAI API Key section ── */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.55rem", color: "oklch(0.45 0.12 340)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      ◉ OpenAI API Key
                    </span>
                    {/* Status indicator */}
                    <span style={{
                      fontSize: "0.42rem",
                      fontFamily: "'Space Mono', monospace",
                      letterSpacing: "0.06em",
                      padding: "2px 6px",
                      borderRadius: 10,
                      border: `1px solid ${hasKey ? "oklch(0.55 0.14 160)" : "oklch(0.72 0.040 330)"}`,
                      background: hasKey ? "oklch(0.55 0.14 160 / 0.10)" : "transparent",
                      color: hasKey ? "oklch(0.40 0.14 160)" : "oklch(0.58 0.040 330)",
                    }}>
                      {hasKey === null ? "…" : hasKey ? "✓ key saved" : "no key"}
                    </span>
                  </div>

                  {hasKey ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <p style={{ fontSize: "0.48rem", color: "oklch(0.55 0.040 330)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                        AI features enabled. Your key is stored encrypted.
                      </p>
                      <button
                        onClick={removeKey}
                        disabled={keyLoading}
                        style={{
                          fontSize: "0.48rem",
                          fontFamily: "'Space Mono', monospace",
                          letterSpacing: "0.08em",
                          padding: "3px 8px",
                          borderRadius: 4,
                          border: "1px solid oklch(0.72 0.10 25)",
                          background: "transparent",
                          color: "oklch(0.52 0.14 25)",
                          cursor: keyLoading ? "not-allowed" : "pointer",
                          alignSelf: "flex-start",
                        }}
                      >
                        {keyLoading ? "Removing…" : "Remove key"}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {/* Free tier usage bar */}
                      {usageCount !== null && (
                        <div style={{ marginBottom: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                            <span style={{ fontSize: "0.44rem", fontFamily: "'Space Mono', monospace", color: "oklch(0.45 0.040 330)", letterSpacing: "0.06em" }}>
                              FREE AI REQUESTS
                            </span>
                            <span style={{ fontSize: "0.48rem", fontFamily: "'Space Mono', monospace",
                              color: usageCount >= freeLimit ? "oklch(0.52 0.14 25)" : "oklch(0.45 0.040 330)" }}>
                              {usageCount}/{freeLimit} used
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div style={{ height: 4, background: "oklch(0.88 0.025 340)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{
                              height: "100%",
                              width: `${Math.min(100, (usageCount / freeLimit) * 100)}%`,
                              background: usageCount >= freeLimit
                                ? "oklch(0.52 0.14 25)"
                                : usageCount >= freeLimit - 1
                                ? "oklch(0.62 0.14 55)"
                                : "oklch(0.58 0.14 168)",
                              borderRadius: 2,
                              transition: "width 0.3s ease",
                            }} />
                          </div>
                          <p style={{ fontSize: "0.42rem", color: usageCount >= freeLimit ? "oklch(0.52 0.14 25)" : "oklch(0.58 0.040 330)",
                            fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4, marginTop: 3 }}>
                            {usageCount >= freeLimit
                              ? "Free requests used up — add your key below to continue."
                              : `${freeLimit - usageCount} free request${freeLimit - usageCount === 1 ? "" : "s"} left. Add your key for unlimited access.`}
                          </p>
                        </div>
                      )}
                      <p style={{ fontSize: "0.44rem", color: "oklch(0.58 0.040 330)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, marginBottom: 2 }}>
                        Add your OpenAI key for unlimited AI features (brain dump sorting, daily summaries, focus reflections…)
                      </p>
                      <p style={{ fontSize: "0.42rem", color: "oklch(0.52 0.14 25)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, marginBottom: 2 }}>
                        ⚠ Your OpenAI account must have billing set up — free accounts cannot make API calls from external apps. Add credits at <span style={{ fontFamily: "'Space Mono', monospace" }}>platform.openai.com/settings/billing</span>.
                      </p>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showKey ? "text" : "password"}
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveKey(); }}
                          placeholder="sk-..."
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "5px 28px 5px 8px",
                            fontSize: "0.55rem",
                            fontFamily: "'Space Mono', monospace",
                            border: "1px solid oklch(0.82 0.06 340)",
                            borderRadius: 4,
                            background: "oklch(0.975 0.010 355)",
                            color: "oklch(0.28 0.040 320)",
                            outline: "none",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey((v) => !v)}
                          style={{
                            position: "absolute",
                            right: 6,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.55rem",
                            color: "oklch(0.60 0.040 330)",
                            padding: 0,
                            lineHeight: 1,
                          }}
                          title={showKey ? "Hide" : "Show"}
                        >
                          {showKey ? "●" : "○"}
                        </button>
                      </div>
                      <button
                        onClick={saveKey}
                        disabled={keyLoading || !apiKeyInput.trim()}
                        style={{
                          fontSize: "0.48rem",
                          fontFamily: "'Space Mono', monospace",
                          letterSpacing: "0.08em",
                          padding: "4px 10px",
                          borderRadius: 4,
                          border: `1px solid ${!apiKeyInput.trim() ? "oklch(0.80 0.040 330)" : "oklch(0.55 0.18 340)"}`,
                          background: !apiKeyInput.trim() ? "transparent" : "oklch(0.55 0.18 340)",
                          color: !apiKeyInput.trim() ? "oklch(0.65 0.040 330)" : "white",
                          cursor: keyLoading || !apiKeyInput.trim() ? "not-allowed" : "pointer",
                          alignSelf: "flex-start",
                          transition: "all 0.15s",
                        }}
                      >
                        {keyLoading ? "Saving…" : "Save Key"}
                      </button>
                    </div>
                  )}
                </div>
              </>
          </div>
        </div>
      )}
    </div>
  );
}

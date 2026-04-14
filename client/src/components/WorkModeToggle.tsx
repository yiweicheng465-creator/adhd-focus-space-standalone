/* ============================================================
   ADHD FOCUS SPACE — Work Mode Toggle
   Switches the entire app to a clean black/white/grey palette
   by adding/removing .work-mode class on <html>.
   State persisted to localStorage under "adhd-work-mode".
   ============================================================ */

import { useEffect, useState, useCallback } from "react";

const LS_KEY = "adhd-work-mode";

/* ── Hook ── */
export function useWorkMode() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY) === "on";
    } catch {
      return false;
    }
  });

  // Apply/remove class on <html> whenever state changes
  useEffect(() => {
    const html = document.documentElement;
    if (enabled) {
      html.classList.add("work-mode");
    } else {
      html.classList.remove("work-mode");
    }
  }, [enabled]);

  // Initialise on mount
  useEffect(() => {
    try {
      if (localStorage.getItem(LS_KEY) === "on") {
        document.documentElement.classList.add("work-mode");
        setEnabled(true);
      }
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(LS_KEY, next ? "on" : "off"); } catch {}
      window.dispatchEvent(new CustomEvent("adhd-workmode-toggle", { detail: next }));
      return next;
    });
  }, []);

  // Listen for external toggles
  useEffect(() => {
    const handler = (e: Event) => {
      const val = (e as CustomEvent<boolean>).detail;
      setEnabled(val);
    };
    window.addEventListener("adhd-workmode-toggle", handler);
    return () => window.removeEventListener("adhd-workmode-toggle", handler);
  }, []);

  return { enabled, toggle };
}

/* ── Sidebar toggle button ── */
export function WorkModeToggle() {
  const { enabled, toggle } = useWorkMode();

  return (
    <button
      onClick={toggle}
      title={enabled ? "Work Mode ON — click to switch back to cosy mode" : "Work Mode OFF — click for professional grey palette"}
      style={{
        width:          "100%",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "6px 0 4px",
        gap:            2,
        background:     enabled ? "oklch(0.20 0 0 / 0.08)" : "none",
        border:         "none",
        cursor:         "pointer",
        transition:     "background 0.2s",
      }}
    >
      {/* Briefcase / work icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={enabled ? "oklch(0.20 0 0)" : "oklch(0.55 0.040 330)"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Briefcase body */}
        <rect x="2" y="8" width="20" height="13" rx="2" />
        {/* Handle */}
        <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        {/* Centre divider */}
        <line x1="2" y1="14" x2="22" y2="14" strokeOpacity="0.5" />
      </svg>
      <span
        style={{
          fontSize:      "0.42rem",
          fontFamily:    "'Space Mono', monospace",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color:         enabled ? "oklch(0.20 0 0)" : "oklch(0.55 0.040 330)",
          lineHeight:    1,
          fontWeight:    enabled ? 700 : 400,
        }}
      >
        {enabled ? "WORK" : "WORK"}
      </span>
    </button>
  );
}

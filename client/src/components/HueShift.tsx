/* ============================================================
   ADHD FOCUS SPACE — Global Hue Shift System
   Uses CSS filter: hue-rotate() on <html> — same "nuclear option"
   as work mode's grayscale(). Catches ALL colors including hardcoded
   inline styles, SVGs, and images.

   The offset is (hue - 330) degrees since 330 is the default pink.
   State persisted to localStorage under "adhd-base-hue".
   Presets persisted under "adhd-hue-presets".
   ============================================================ */
import { useCallback, useEffect, useState } from "react";

const LS_KEY = "adhd-base-hue";
const LS_PRESETS_KEY = "adhd-hue-presets";
export const DEFAULT_HUE = 330; // Pink (original theme)

export type HuePreset = { label: string; hue: number; color: string };

export const DEFAULT_PRESETS: HuePreset[] = [
  { label: "Pink",   hue: 330, color: "hsl(330,60%,65%)" },
  { label: "Purple", hue: 280, color: "hsl(280,55%,65%)" },
  { label: "Blue",   hue: 220, color: "hsl(220,60%,65%)" },
  { label: "Green",  hue: 155, color: "hsl(155,50%,55%)" },
  { label: "Sepia",  hue: 35,  color: "hsl(35,55%,60%)"  },
  { label: "Red",    hue: 5,   color: "hsl(5,60%,62%)"   },
];

// Backward-compat: static export still works for read-only consumers
export const HUE_PRESETS = DEFAULT_PRESETS;

function loadPresets(): HuePreset[] {
  try {
    const raw = localStorage.getItem(LS_PRESETS_KEY);
    if (!raw) return DEFAULT_PRESETS.map(p => ({ ...p }));
    const parsed = JSON.parse(raw) as HuePreset[];
    if (Array.isArray(parsed) && parsed.length === DEFAULT_PRESETS.length) return parsed;
    return DEFAULT_PRESETS.map(p => ({ ...p }));
  } catch { return DEFAULT_PRESETS.map(p => ({ ...p })); }
}

function savePresets(presets: HuePreset[]) {
  try { localStorage.setItem(LS_PRESETS_KEY, JSON.stringify(presets)); } catch {}
}

function readLS(): number {
  try {
    const v = parseFloat(localStorage.getItem(LS_KEY) ?? "");
    return isNaN(v) ? DEFAULT_HUE : Math.max(0, Math.min(360, v));
  } catch {
    return DEFAULT_HUE;
  }
}

function applyHue(hue: number) {
  const offset = hue - DEFAULT_HUE; // e.g. Blue 220 → -110deg
  const html = document.documentElement;
  if (offset === 0) {
    // No rotation needed — remove any existing hue-rotate to avoid
    // stacking with work-mode grayscale
    html.style.removeProperty("--hue-rotate-deg");
  } else {
    html.style.setProperty("--hue-rotate-deg", `${offset}deg`);
  }
  // Also keep --base-hue for any CSS variables that still reference it
  html.style.setProperty("--base-hue", String(hue));
}

/* ── Hook ── */
export function useHue() {
  const [hue, setHueState] = useState<number>(() => readLS());
  const [presets, setPresetsState] = useState<HuePreset[]>(() => loadPresets());

  // Apply on mount and whenever hue changes
  useEffect(() => {
    applyHue(hue);
  }, [hue]);

  // Restore on mount
  useEffect(() => {
    const stored = readLS();
    applyHue(stored);
    setHueState(stored);
    setPresetsState(loadPresets());
  }, []);

  const setHue = useCallback((val: number) => {
    const v = Math.max(0, Math.min(360, Math.round(val)));
    setHueState(v);
    applyHue(v);
    try { localStorage.setItem(LS_KEY, String(v)); } catch {}
    window.dispatchEvent(new CustomEvent("adhd-hue-change", { detail: v }));
  }, []);

  /** Replace the hue value of preset slot [index] with the current hue */
  const setPresetHue = useCallback((index: number, newHue: number) => {
    setPresetsState(prev => {
      const next = prev.map((p, i) => {
        if (i !== index) return p;
        const h = Math.max(0, Math.min(360, Math.round(newHue)));
        return { ...p, hue: h, color: `hsl(${h},60%,62%)` };
      });
      savePresets(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => setHue(DEFAULT_HUE), [setHue]);

  // Listen for external changes
  useEffect(() => {
    const handler = (e: Event) => {
      const val = (e as CustomEvent<number>).detail;
      setHueState(val);
    };
    window.addEventListener("adhd-hue-change", handler);
    return () => window.removeEventListener("adhd-hue-change", handler);
  }, []);

  return { hue, setHue, reset, defaultHue: DEFAULT_HUE, presets, setPresetHue };
}

/* ============================================================
   ADHD FOCUS SPACE — Film Grain Overlay v4.0
   Two independent controls:
     • Intensity  (opacity/density)  0–100, LS: "adhd-film-grain-intensity"
     • Speed      (flicker rate)     0–100, LS: "adhd-film-grain-speed"
       0 = frozen / very slow,  100 = full 60fps flicker
   ============================================================ */

import { useEffect, useRef, useState, useCallback } from "react";

const LS_INTENSITY = "adhd-film-grain-intensity";
const LS_SPEED     = "adhd-film-grain-speed";
const DEFAULT_INTENSITY = 15;
const DEFAULT_SPEED     = 88;

/* ─── helpers ─────────────────────────────────────────────── */
function readLS(key: string, def: number) {
  try {
    const v = parseInt(localStorage.getItem(key) ?? "", 10);
    return isNaN(v) ? def : Math.max(0, Math.min(100, v));
  } catch { return def; }
}
function writeLS(key: string, val: number) {
  try { localStorage.setItem(key, String(val)); } catch {}
}

/* ─── Shared hook ─────────────────────────────────────────── */
export function useFilmGrain() {
  const [intensity, setIntensityState] = useState(() => readLS(LS_INTENSITY, DEFAULT_INTENSITY));
  const [speed,     setSpeedState]     = useState(() => readLS(LS_SPEED,     DEFAULT_SPEED));

  const setIntensity = useCallback((val: number) => {
    const v = Math.max(0, Math.min(100, val));
    setIntensityState(v);
    writeLS(LS_INTENSITY, v);
    window.dispatchEvent(new CustomEvent("adhd-grain-intensity", { detail: v }));
  }, []);

  const setSpeed = useCallback((val: number) => {
    const v = Math.max(0, Math.min(100, val));
    setSpeedState(v);
    writeLS(LS_SPEED, v);
    window.dispatchEvent(new CustomEvent("adhd-grain-speed", { detail: v }));
  }, []);

  useEffect(() => {
    const hi = (e: Event) => setIntensityState((e as CustomEvent<number>).detail);
    const hs = (e: Event) => setSpeedState((e as CustomEvent<number>).detail);
    window.addEventListener("adhd-grain-intensity", hi);
    window.addEventListener("adhd-grain-speed",     hs);
    return () => {
      window.removeEventListener("adhd-grain-intensity", hi);
      window.removeEventListener("adhd-grain-speed",     hs);
    };
  }, []);

  return { intensity, setIntensity, speed, setSpeed, enabled: intensity > 0 };
}

/* ─── Canvas overlay ──────────────────────────────────────── */
export function FilmGrainOverlay() {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const rafRef         = useRef<number>(0);
  const intensityRef   = useRef(readLS(LS_INTENSITY, DEFAULT_INTENSITY));
  const speedRef       = useRef(readLS(LS_SPEED,     DEFAULT_SPEED));
  const lastDrawRef    = useRef(0);

  const [intensity, setIntensityState] = useState(() => readLS(LS_INTENSITY, DEFAULT_INTENSITY));

  useEffect(() => { intensityRef.current = intensity; }, [intensity]);

  // Sync both values from external events
  useEffect(() => {
    const hi = (e: Event) => {
      const v = (e as CustomEvent<number>).detail;
      intensityRef.current = v;
      setIntensityState(v);
    };
    const hs = (e: Event) => { speedRef.current = (e as CustomEvent<number>).detail; };
    window.addEventListener("adhd-grain-intensity", hi);
    window.addEventListener("adhd-grain-speed",     hs);
    return () => {
      window.removeEventListener("adhd-grain-intensity", hi);
      window.removeEventListener("adhd-grain-speed",     hs);
    };
  }, []);

  // Animation loop — runs once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    let imageData: ImageData | null = null;

    function resize() {
      if (!canvas) return;
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight;
      // Guard: createImageData throws if width or height is 0
      if (!w || !h || w <= 0 || h <= 0) return;
      // Recreate imageData after resize
      imageData = ctx!.createImageData(w, h);
    }
    resize();
    window.addEventListener("resize", resize);

    const GRAIN_SIZE = 5;

    function drawGrain(timestamp: number) {
      const lvl   = intensityRef.current;
      const spd   = speedRef.current;

      if (!ctx || !imageData) {
        rafRef.current = requestAnimationFrame(drawGrain);
        return;
      }

      if (lvl === 0) {
        ctx.clearRect(0, 0, w, h);
        rafRef.current = requestAnimationFrame(drawGrain);
        return;
      }

      // Speed 0 → redraw every ~2000ms  (frozen feel)
      // Speed 50 → redraw every ~66ms   (~15fps)
      // Speed 100 → redraw every 0ms    (full 60fps)
      const minInterval = 80; // cap at ~12fps max — avoids lag on slow devices
      const maxInterval = 2000;
      // Exponential mapping so low speeds feel very slow
      const t = 1 - spd / 100; // 0 at max speed, 1 at min speed
      const interval = minInterval + (maxInterval - minInterval) * (t * t);

      if (timestamp - lastDrawRef.current < interval) {
        rafRef.current = requestAnimationFrame(drawGrain);
        return;
      }
      lastDrawRef.current = timestamp;

      const maxA = ((lvl / 100) * 0.55 * 255) | 0;
      const minA = (maxA * 0.3) | 0;
      const data = imageData.data;

      const cols = Math.ceil(w / GRAIN_SIZE);
      const rows = Math.ceil(h / GRAIN_SIZE);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const v = (Math.random() * 256) | 0;
          const a = (minA + Math.random() * (maxA - minA)) | 0;
          for (let dy = 0; dy < GRAIN_SIZE; dy++) {
            const py = row * GRAIN_SIZE + dy;
            if (py >= h) break;
            for (let dx = 0; dx < GRAIN_SIZE; dx++) {
              const px = col * GRAIN_SIZE + dx;
              if (px >= w) break;
              const i = (py * w + px) * 4;
              data[i]     = v;
              data[i + 1] = v;
              data[i + 2] = v;
              data[i + 3] = a;
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      rafRef.current = requestAnimationFrame(drawGrain);
    }

    rafRef.current = requestAnimationFrame(drawGrain);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      "fixed",
        inset:         0,
        width:         "100vw",
        height:        "100vh",
        pointerEvents: "none",
        zIndex:        9999,
        mixBlendMode:  "soft-light",
        opacity:       intensity > 0 ? 1 : 0,
        transition:    "opacity 0.3s ease",
      }}
      aria-hidden="true"
    />
  );
}

/* ─── Reusable vertical slider ────────────────────────────── */
function VerticalSlider({
  value,
  onChange,
  enabled,
  activeColor,
  mutedColor,
}: {
  value: number;
  onChange: (v: number) => void;
  enabled: boolean;
  activeColor: string;
  mutedColor: string;
}) {
  const [dragging, setDragging] = useState(false);
  const trackColor = enabled ? "oklch(0.88 0.06 340)" : "oklch(0.88 0.015 330)";
  const fillColor  = enabled ? activeColor : mutedColor;

  function calcPct(clientY: number, rect: DOMRect) {
    return Math.max(0, Math.min(100, Math.round((1 - (clientY - rect.top) / rect.height) * 100)));
  }

  return (
    <div
      style={{
        position:     "relative",
        width:        10,
        height:       52,
        background:   trackColor,
        borderRadius: 5,
        border:       `1px solid ${enabled ? "oklch(0.80 0.06 340)" : "oklch(0.82 0.015 330)"}`,
        cursor:       "ns-resize",
        overflow:     "hidden",
        transition:   "background 0.2s, border-color 0.2s",
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        setDragging(true);
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        onChange(calcPct(e.clientY, rect));
        const onMove = (me: MouseEvent) => onChange(calcPct(me.clientY, rect));
        const onUp   = () => { setDragging(false); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup",   onUp);
      }}
      onTouchStart={(e) => {
        const rect  = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        onChange(calcPct(e.touches[0].clientY, rect));
        const onMove = (te: TouchEvent) => onChange(calcPct(te.touches[0].clientY, rect));
        const onEnd  = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
        window.addEventListener("touchmove", onMove, { passive: true });
        window.addEventListener("touchend",  onEnd);
      }}
    >
      {/* Fill bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${value}%`, background: fillColor, borderRadius: "0 0 5px 5px", transition: dragging ? "none" : "height 0.15s ease, background 0.2s", opacity: 0.75 }} />
      {/* Thumb line */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: `calc(${value}% - 1px)`, height: 2, background: fillColor, transition: dragging ? "none" : "bottom 0.15s ease, background 0.2s" }} />
    </div>
  );
}

/* ─── Sidebar control: two sliders side by side ───────────── */
export function FilmGrainToggle() {
  const { intensity, setIntensity, speed, setSpeed } = useFilmGrain();
  const enabled = intensity > 0;

  const activeColor = "oklch(0.55 0.18 340)";
  const mutedColor  = "oklch(0.65 0.040 330)";

  return (
    <div
      style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0 6px", userSelect: "none" }}
      title={`Film grain — intensity: ${intensity}%  speed: ${speed}%`}
    >
      {/* Film strip icon */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={enabled ? activeColor : mutedColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <rect x="2" y="6" width="20" height="12" rx="1" />
        <rect x="4"  y="9"  width="2" height="2" rx="0.3" fill={enabled ? activeColor : mutedColor} stroke="none" />
        <rect x="4"  y="13" width="2" height="2" rx="0.3" fill={enabled ? activeColor : mutedColor} stroke="none" />
        <rect x="18" y="9"  width="2" height="2" rx="0.3" fill={enabled ? activeColor : mutedColor} stroke="none" />
        <rect x="18" y="13" width="2" height="2" rx="0.3" fill={enabled ? activeColor : mutedColor} stroke="none" />
        <line x1="8"  y1="6"  x2="8"  y2="18" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="16" y1="6"  x2="16" y2="18" strokeWidth="1" strokeOpacity="0.4" />
      </svg>

      {/* Two sliders side by side */}
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
        {/* Intensity slider */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <VerticalSlider value={intensity} onChange={setIntensity} enabled={enabled} activeColor={activeColor} mutedColor={mutedColor} />
          <span style={{ fontSize: "0.38rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em", textTransform: "uppercase", color: enabled ? activeColor : mutedColor, lineHeight: 1 }}>
            {intensity === 0 ? "OFF" : `${intensity}%`}
          </span>
        </div>

        {/* Speed slider */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <VerticalSlider value={speed} onChange={setSpeed} enabled={enabled} activeColor="oklch(0.55 0.14 295)" mutedColor={mutedColor} />
          <span style={{ fontSize: "0.38rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em", textTransform: "uppercase", color: enabled ? "oklch(0.55 0.14 295)" : mutedColor, lineHeight: 1 }}>
            {speed === 0 ? "FRZ" : `${speed}%`}
          </span>
        </div>
      </div>

      {/* Row labels */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: "0.36rem", fontFamily: "'Space Mono', monospace", color: mutedColor, textTransform: "uppercase", letterSpacing: "0.04em", width: 10, textAlign: "center" }}>GRN</span>
        <span style={{ fontSize: "0.36rem", fontFamily: "'Space Mono', monospace", color: mutedColor, textTransform: "uppercase", letterSpacing: "0.04em", width: 10, textAlign: "center" }}>SPD</span>
      </div>
    </div>
  );
}

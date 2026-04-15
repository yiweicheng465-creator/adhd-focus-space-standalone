/*
  ADHD FOCUS SPACE — Timer Sound Hook
  Provides:
  1. Sound effects via Web Audio API (no files needed)
     - chime: soft sine wave bell when a phase ends / transition starts
     - rip: noise burst for strip tear
     - tick: subtle click for transition countdown
  2. Coffee shop ambient music toggle
     - Streams a royalty-free jazz cafe track from archive.org
     - Volume control persisted in localStorage
*/

import { useCallback, useEffect, useRef, useState } from "react";

const COFFEE_SHOP_URL =
  "https://archive.org/download/1-hour-relaxing-jazz-coffee-shop-music-the-best-melodies-that-will-warm-your-heart/1%20Hour%20Relaxing%20Jazz%20Coffee%20Shop%20Music%20%20The%20Best%20Melodies%20That%20Will%20Warm%20Your%20Heart.mp3";

// ── Web Audio helpers ─────────────────────────────────────────────────────────

function getCtx(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

/** Soft sine-wave chime — used when a phase completes */
function playChime(ctx: AudioContext, volume = 0.5) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);
  gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 1.2);
}

/** Short paper-rip noise burst — used when a strip tears */
function playRip(ctx: AudioContext, volume = 0.5) {
  const bufferSize = ctx.sampleRate * 0.12;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3200;
  filter.Q.value = 0.8;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

/** Soft tick — used for transition countdown */
function playTick(ctx: AudioContext, volume = 0.5) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(660, ctx.currentTime);
  gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
}

/** Block complete fanfare — ascending arpeggio */
function playFanfare(ctx: AudioContext, volume = 0.5) {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
    gain.gain.linearRampToValueAtTime(volume * 0.3, ctx.currentTime + i * 0.15 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
    osc.start(ctx.currentTime + i * 0.15);
    osc.stop(ctx.currentTime + i * 0.15 + 0.5);
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface TimerSoundControls {
  sfxEnabled: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  musicLoading: boolean;
  toggleSfx: () => void;
  toggleMusic: () => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  playChimeSfx: () => void;
  playRipSfx: () => void;
  playTickSfx: () => void;
  playFanfareSfx: () => void;
}

export function useTimerSound(): TimerSoundControls {
  const [sfxEnabled, setSfxEnabled] = useState(() => {
    try { return localStorage.getItem("adhd-sfx-enabled") !== "false"; } catch { return true; }
  });
  const [musicEnabled, setMusicEnabled] = useState(() => {
    try { return localStorage.getItem("adhd-music-enabled") === "true"; } catch { return false; }
  });
  const [musicVolume, setMusicVolumeState] = useState(() => {
    try { return parseFloat(localStorage.getItem("adhd-music-vol") ?? "0.25"); } catch { return 0.25; }
  });
  const [sfxVolume, setSfxVolumeState] = useState(() => {
    try { return parseFloat(localStorage.getItem("adhd-sfx-vol") ?? "0.6"); } catch { return 0.6; }
  });
  const [musicLoading, setMusicLoading] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Ensure AudioContext exists (created on first user gesture)
  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = getCtx();
    }
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // ── Music setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.loop = true;
      audio.preload = "none";
      audioRef.current = audio;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (musicEnabled) {
      setMusicLoading(true);
      if (!audio.src) {
        audio.src = COFFEE_SHOP_URL;
      }
      const ctx = ensureCtx();
      // Resume suspended AudioContext (required for Safari PWA)
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      // Safari standalone: skip Web Audio API routing (causes silence in PWA mode)
      const isSafariPWA = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
        && window.matchMedia("(display-mode: standalone)").matches;
      if (ctx && !gainRef.current && !isSafariPWA) {
        try {
          const source = ctx.createMediaElementSource(audio);
          const gain = ctx.createGain();
          gain.gain.value = musicVolume;
          source.connect(gain);
          gain.connect(ctx.destination);
          gainRef.current = gain;
        } catch {
          // Already connected — ignore
        }
      }
      audio.volume = musicVolume; // Always set volume directly for Safari compatibility
      audio.play()
        .then(() => { if (ctx?.state === "suspended") ctx.resume().catch(() => {}); setMusicLoading(false); })
        .catch(() => setMusicLoading(false));
    } else {
      audio.pause();
      setMusicLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicEnabled]);

  // Sync gain node volume
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = musicVolume;
    } else if (audioRef.current && musicEnabled) {
      audioRef.current.volume = musicVolume;
    }
    try { localStorage.setItem("adhd-music-vol", String(musicVolume)); } catch {}
  }, [musicVolume, musicEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // ── Controls ─────────────────────────────────────────────────────────────────
  const toggleSfx = useCallback(() => {
    setSfxEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem("adhd-sfx-enabled", String(next)); } catch {}
      return next;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    ensureCtx(); // must be called from user gesture
    setMusicEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem("adhd-music-enabled", String(next)); } catch {}
      return next;
    });
  }, [ensureCtx]);

  const setMusicVolume = useCallback((v: number) => {
    setMusicVolumeState(Math.max(0, Math.min(1, v)));
  }, []);

  const setSfxVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setSfxVolumeState(clamped);
    try { localStorage.setItem("adhd-sfx-vol", String(clamped)); } catch {}
  }, []);

  // ── SFX triggers ─────────────────────────────────────────────────────────────
  const playChimeSfx = useCallback(() => {
    if (!sfxEnabled) return;
    const ctx = ensureCtx();
    if (ctx) playChime(ctx, sfxVolume);
  }, [sfxEnabled, sfxVolume, ensureCtx]);

  const playRipSfx = useCallback(() => {
    if (!sfxEnabled) return;
    const ctx = ensureCtx();
    if (ctx) playRip(ctx, sfxVolume);
  }, [sfxEnabled, sfxVolume, ensureCtx]);

  const playTickSfx = useCallback(() => {
    if (!sfxEnabled) return;
    const ctx = ensureCtx();
    if (ctx) playTick(ctx, sfxVolume);
  }, [sfxEnabled, sfxVolume, ensureCtx]);

  const playFanfareSfx = useCallback(() => {
    if (!sfxEnabled) return;
    const ctx = ensureCtx();
    if (ctx) playFanfare(ctx, sfxVolume);
  }, [sfxEnabled, sfxVolume, ensureCtx]);

  return {
    sfxEnabled,
    musicEnabled,
    musicVolume,
    sfxVolume,
    musicLoading,
    toggleSfx,
    toggleMusic,
    setMusicVolume,
    setSfxVolume,
    playChimeSfx,
    playRipSfx,
    playTickSfx,
    playFanfareSfx,
  };
}

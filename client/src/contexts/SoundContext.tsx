/*
  ADHD FOCUS SPACE — Global Sound Context
  Owns the audio element so music persists across page navigation.
  FocusTimer reads from this context instead of creating its own audio.
  
  Behavior:
  - Music keeps playing when user navigates away from Focus page
  - Music pauses when timer is paused (phase === "paused")
  - Music resumes when timer resumes (phase === "running")
  - User can manually toggle music on/off at any time
  - User can pick from a catalog of ambient tracks
*/

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ── Music track catalog ───────────────────────────────────────────────────────

export interface MusicTrack {
  id: string;
  label: string;
  icon: string;
  url: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "lofi",
    label: "Lo-fi Jazz",
    icon: "cafe",
    url: "https://archive.org/download/1-hour-relaxing-jazz-coffee-shop-music-the-best-melodies-that-will-warm-your-heart/1%20Hour%20Relaxing%20Jazz%20Coffee%20Shop%20Music%20%20The%20Best%20Melodies%20That%20Will%20Warm%20Your%20Heart.mp3",
  },

];

// ── Web Audio helpers ─────────────────────────────────────────────────────────

function getCtx(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

// ── SFX helpers ─────────────────────────────────────────────────────────────

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

/** Short paper-rip noise burst */
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

/** Soft tick */
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

/** Block complete fanfare — soft 3-bell chime sequence */
function playFanfare(ctx: AudioContext, volume = 0.5) {
  // Three gentle bell tones: C5 → E5 → G5, soft and airy
  const notes = [523, 659, 784];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.22);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.22);
    gain.gain.linearRampToValueAtTime(volume * 0.18, ctx.currentTime + i * 0.22 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.22 + 0.9);
    osc.start(ctx.currentTime + i * 0.22);
    osc.stop(ctx.currentTime + i * 0.22 + 0.9);
  });
}

// ── Context shape ─────────────────────────────────────────────────────────────

export interface SoundContextValue {
  sfxEnabled: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  musicLoading: boolean;
  /** Whether music is currently playing (enabled AND not timer-paused) */
  musicPlaying: boolean;
  /** Currently selected track id */
  selectedTrackId: string;
  /** Select a different track */
  selectTrack: (id: string) => void;
  toggleSfx: () => void;
  toggleMusic: () => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  /** Called by FocusTimer when timer phase changes */
  onTimerPhaseChange: (phase: "running" | "paused" | "other") => void;
  /** Direct access to AudioContext for SFX */
  getAudioCtx: () => AudioContext | null;
  playChimeSfx: () => void;
  playRipSfx: () => void;
  playTickSfx: () => void;
  playFanfareSfx: () => void;
  /** Stop music when block completes (without changing musicEnabled state) */
  stopMusicForBlockComplete: () => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

export function useSoundContext(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSoundContext must be used inside SoundProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [sfxEnabled, setSfxEnabled] = useState(() => {
    try { return localStorage.getItem("adhd-sfx-enabled") !== "false"; } catch { return true; }
  });
  // Restore music enabled state from localStorage — auto-resume if user had it on.
  const [musicEnabled, setMusicEnabled] = useState(() => {
    try { return localStorage.getItem("adhd-music-enabled") === "true"; } catch { return false; }
  });
  // Track if we're waiting for a user gesture to satisfy autoplay policy
  const pendingAutoplayRef = useRef(false);
  const [musicVolume, setMusicVolumeState] = useState(() => {
    try { return parseFloat(localStorage.getItem("adhd-music-vol") ?? "0.25"); } catch { return 0.25; }
  });
  const [sfxVolume, setSfxVolumeState] = useState(() => {
    try { return parseFloat(localStorage.getItem("adhd-sfx-vol") ?? "0.6"); } catch { return 0.6; }
  });
  const [selectedTrackId, setSelectedTrackId] = useState(() => {
    try { return localStorage.getItem("adhd-music-track") ?? "lofi"; } catch { return "lofi"; }
  });
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);

  // Timer phase: "running" | "paused" | "other"
  const timerPhaseRef = useRef<"running" | "paused" | "other">("other");

  const ctxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // NOTE: We intentionally do NOT use createMediaElementSource / GainNode for the
  // ambient <audio> element because the Web Audio API only allows that call once
  // per element — reconnecting after a track switch is impossible and silently
  // breaks playback. We use audio.volume directly instead.
  // Track if we paused due to timer (so we can resume on timer resume)
  const timerPausedRef = useRef(false);

  // Ensure AudioContext exists
  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = getCtx();
    }
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const getAudioCtx = useCallback(() => {
    return ensureCtx();
  }, [ensureCtx]);

  // Create the audio element once, never destroy it
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.loop = true;
      audio.preload = "none";
      audioRef.current = audio;
    }
    // No cleanup — we intentionally keep the audio element alive
  }, []);

  // Internal helper: actually play the audio
  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = MUSIC_TRACKS.find(t => t.id === selectedTrackId) ?? MUSIC_TRACKS[0];
    // Always set src if it doesn't match the current track URL
    if (audio.src !== track.url) {
      audio.src = track.url;
      audio.load();
    }
    // Use audio.volume directly — no Web Audio graph on the ambient element
    audio.volume = Math.max(0, Math.min(1, musicVolume));
    // Ensure AudioContext is alive (needed for SFX, not for ambient audio)
    ensureCtx();
    setMusicLoading(true);
    audio.play()
      .then(() => { setMusicLoading(false); setMusicPlaying(true); pendingAutoplayRef.current = false; })
      .catch(() => {
        setMusicLoading(false);
        setMusicPlaying(false);
        // Autoplay blocked — mark as pending so we retry on first user gesture
        pendingAutoplayRef.current = true;
      });
  }, [ensureCtx, musicVolume, selectedTrackId]);

  // Internal helper: pause the audio
  const pauseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setMusicPlaying(false);
    setMusicLoading(false);
  }, []);

  // Retry autoplay on first user gesture (handles browser autoplay policy)
  useEffect(() => {
    const retry = () => {
      if (pendingAutoplayRef.current && musicEnabled) {
        pendingAutoplayRef.current = false;
        playAudio();
      }
    };
    window.addEventListener("click", retry, { once: true, capture: true });
    window.addEventListener("keydown", retry, { once: true, capture: true });
    return () => {
      window.removeEventListener("click", retry, true);
      window.removeEventListener("keydown", retry, true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicEnabled]);

  // React to musicEnabled changes
  useEffect(() => {
    if (musicEnabled) {
      // Only play if timer is not paused
      if (timerPhaseRef.current !== "paused") {
        playAudio();
      }
    } else {
      pauseAudio();
      timerPausedRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicEnabled]);

  // When selected track changes: swap the src and restart if music is enabled
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = MUSIC_TRACKS.find(t => t.id === selectedTrackId) ?? MUSIC_TRACKS[0];
    const wasPlaying = musicEnabled && !audio.paused;
    audio.pause();
    audio.src = track.url;
    audio.load();
    if (wasPlaying && timerPhaseRef.current !== "paused") {
      // Small delay to let the new src load before playing
      setTimeout(() => playAudio(), 50);
    }
    try { localStorage.setItem("adhd-music-track", selectedTrackId); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrackId]);

  // Sync volume directly on the audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, musicVolume));
    }
    try { localStorage.setItem("adhd-music-vol", String(musicVolume)); } catch {}
  }, [musicVolume]);

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

  const selectTrack = useCallback((id: string) => {
    setSelectedTrackId(id);
  }, []);

  // ── Timer phase integration ───────────────────────────────────────────────

  const onTimerPhaseChange = useCallback((phase: "running" | "paused" | "other") => {
    const prev = timerPhaseRef.current;
    timerPhaseRef.current = phase;

    if (!musicEnabled) return;

    if (phase === "paused" && prev === "running") {
      // Timer just paused — pause music and remember we did it
      timerPausedRef.current = true;
      pauseAudio();
    } else if (phase === "running" && prev === "paused") {
      // Timer just resumed — resume music if we paused it
      if (timerPausedRef.current) {
        timerPausedRef.current = false;
        playAudio();
      }
    }
    // "other" = idle, complete, block_complete, transition, quit
    // We do NOT pause music for these — let it keep playing
  }, [musicEnabled, pauseAudio, playAudio]);

  const value: SoundContextValue = {
    sfxEnabled,
    musicEnabled,
    musicVolume,
    sfxVolume,
    musicLoading,
    musicPlaying,
    selectedTrackId,
    selectTrack,
    toggleSfx,
    toggleMusic,
    setMusicVolume,
    setSfxVolume,
    onTimerPhaseChange,
    getAudioCtx,
    playChimeSfx: useCallback(() => {
      if (!sfxEnabled) return;
      const ctx = ensureCtx();
      if (ctx) playChime(ctx, sfxVolume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sfxEnabled, sfxVolume]),
    playRipSfx: useCallback(() => {
      if (!sfxEnabled) return;
      const ctx = ensureCtx();
      if (ctx) playRip(ctx, sfxVolume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sfxEnabled, sfxVolume]),
    playTickSfx: useCallback(() => {
      if (!sfxEnabled) return;
      const ctx = ensureCtx();
      if (ctx) playTick(ctx, sfxVolume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sfxEnabled, sfxVolume]),
    playFanfareSfx: useCallback(() => {
      if (!sfxEnabled) return;
      const ctx = ensureCtx();
      if (ctx) playFanfare(ctx, sfxVolume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sfxEnabled, sfxVolume]),
    stopMusicForBlockComplete: useCallback(() => {
      // Pause audio element without touching musicEnabled state
      // so music resumes automatically on next session start
      pauseAudio();
      timerPausedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pauseAudio]),
  };
  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}

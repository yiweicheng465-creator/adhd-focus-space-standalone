/**
 * modeConfig.ts
 * Daily Mode system — types, defaults, and localStorage helpers.
 *
 * Four modes:
 *   deep-work  — high energy, long focus blocks, push execution
 *   normal     — balanced day, standard Pomodoro, warm guidance
 *   survival   — low energy, short sessions, minimal expectations
 *   chaos      — overwhelmed, brain-dump first, no pressure
 */

export type DailyMode = "deep-work" | "normal" | "survival" | "chaos";

export interface ModeConfig {
  /** Display name shown in the UI */
  label: string;
  /** Emoji icon */
  icon: string;
  /** One-line tagline shown on the mode card */
  tagline: string;
  /** Short description shown on the mode card */
  description: string;
  /** Accent colour (CSS colour string) for the card */
  color: string;
  /** Timer focus duration in minutes */
  timerFocus: number;
  /** Timer short-break duration in minutes */
  timerShort: number;
  /** Timer long-break duration in minutes */
  timerLong: number;
  /** How routines are displayed in the Routine panel */
  routineFilter: "all" | "core-only" | "hidden";
  /**
   * Number of routines to surface as "core" when routineFilter === "core-only".
   * 0 means use the first N routines by order.
   */
  routineCoreCount: number;
  /** Opening line the AI uses at the start of every conversation */
  aiOpener: string;
  /** Tone instruction injected into the AI system prompt */
  aiTone: string;
  /** Hint shown inside the Brain Dump input */
  brainDumpHint: string;
  /** How tasks are filtered in the "Next Up" panel */
  taskFilter: "all" | "today-focus" | "focus-only";
}

// ── Default configs ────────────────────────────────────────────────────────────

export const MODE_DEFAULTS: Record<DailyMode, ModeConfig> = {
  "deep-work": {
    label: "Deep Work",
    icon: "🚀",
    tagline: "Lock in. Execute.",
    description: "High energy. Long focus blocks. Get the hard thing done.",
    color: "oklch(0.52 0.18 25)",
    timerFocus: 45,
    timerShort: 10,
    timerLong: 20,
    routineFilter: "all",
    routineCoreCount: 0,
    aiOpener: "Let's lock in. What's the one thing that moves the needle today?",
    aiTone: "Be direct, efficient, and action-oriented. Push the user to execute. Minimal small talk. Celebrate wins briefly and move on.",
    brainDumpHint: "Quick thought? Dump it and get back to focus.",
    taskFilter: "today-focus",
  },
  "normal": {
    label: "Normal Day",
    icon: "⚖️",
    tagline: "Steady and balanced.",
    description: "Standard day. Work through your list at a comfortable pace.",
    color: "oklch(0.52 0.14 270)",
    timerFocus: 25,
    timerShort: 5,
    timerLong: 15,
    routineFilter: "all",
    routineCoreCount: 0,
    aiOpener: "Good to see you. What's on your plate today?",
    aiTone: "Be warm, balanced, and encouraging. Gently guide the user through their tasks. Remind them to take breaks.",
    brainDumpHint: "Something on your mind? Dump it here.",
    taskFilter: "all",
  },
  "survival": {
    label: "Survival Mode",
    icon: "🔋",
    tagline: "Just the essentials.",
    description: "Low energy day. Do the bare minimum and be kind to yourself.",
    color: "oklch(0.52 0.14 160)",
    timerFocus: 15,
    timerShort: 10,
    timerLong: 15,
    routineFilter: "core-only",
    routineCoreCount: 2,
    aiOpener: "It's okay to take it slow today. Let's just focus on the essentials — what's the one thing you absolutely need to do?",
    aiTone: "Be extremely gentle, compassionate, and low-pressure. Reduce expectations. Celebrate tiny wins. Never push or pile on tasks. Remind the user that rest is productive.",
    brainDumpHint: "Anything on your mind? Let it out — no filter needed.",
    taskFilter: "focus-only",
  },
  "chaos": {
    label: "Chaos Mode",
    icon: "🧹",
    tagline: "Brain full? Let's dump.",
    description: "Overwhelmed and scattered. Clear your head first, then plan.",
    color: "oklch(0.52 0.10 55)",
    timerFocus: 25,
    timerShort: 5,
    timerLong: 15,
    routineFilter: "hidden",
    routineCoreCount: 0,
    aiOpener: "Brain full? Start typing — anything at all. Don't filter, don't organise. Just get it out and I'll help you sort it.",
    aiTone: "Be a calm, non-judgmental listener. Guide the user to do a brain dump first. Only suggest tasks or structure after they've vented. Never add to the overwhelm.",
    brainDumpHint: "Start typing. Anything. Don't filter.",
    taskFilter: "all",
  },
};

// ── localStorage keys ──────────────────────────────────────────────────────────

const MODE_KEY = "adhd-daily-mode";
const MODE_DATE_KEY = "adhd-daily-mode-date";
const CUSTOM_CONFIGS_KEY = "adhd-mode-configs";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Get today's date string (YYYY-MM-DD) */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Read the mode selected today. Returns null if not set yet today. */
export function getTodayMode(): DailyMode | null {
  try {
    const date = localStorage.getItem(MODE_DATE_KEY);
    if (date !== todayStr()) return null;
    const mode = localStorage.getItem(MODE_KEY) as DailyMode | null;
    if (!mode || !MODE_DEFAULTS[mode]) return null;
    return mode;
  } catch {
    return null;
  }
}

/** Persist today's mode selection. */
export function setTodayMode(mode: DailyMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
    localStorage.setItem(MODE_DATE_KEY, todayStr());
    window.dispatchEvent(new CustomEvent("adhd-mode-changed", { detail: mode }));
  } catch {}
}

/** Read user-customised configs (merged over defaults). */
export function getCustomConfigs(): Partial<Record<DailyMode, Partial<ModeConfig>>> {
  try {
    const raw = localStorage.getItem(CUSTOM_CONFIGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Save user-customised configs. */
export function saveCustomConfigs(configs: Partial<Record<DailyMode, Partial<ModeConfig>>>): void {
  try {
    localStorage.setItem(CUSTOM_CONFIGS_KEY, JSON.stringify(configs));
  } catch {}
}

/** Get the effective config for a mode (defaults merged with user overrides). */
export function getModeConfig(mode: DailyMode): ModeConfig {
  const defaults = MODE_DEFAULTS[mode];
  const customs = getCustomConfigs();
  const overrides = customs[mode] ?? {};
  return { ...defaults, ...overrides };
}

/** Get the effective config for today's selected mode (falls back to "normal"). */
export function getTodayModeConfig(): ModeConfig {
  const mode = getTodayMode() ?? "normal";
  return getModeConfig(mode);
}

/** Update a single field in a mode's custom config. */
export function updateModeConfig<K extends keyof ModeConfig>(
  mode: DailyMode,
  field: K,
  value: ModeConfig[K]
): void {
  const customs = getCustomConfigs();
  customs[mode] = { ...(customs[mode] ?? {}), [field]: value };
  saveCustomConfigs(customs);
}

/** Reset a mode's custom config back to defaults. */
export function resetModeConfig(mode: DailyMode): void {
  const customs = getCustomConfigs();
  delete customs[mode];
  saveCustomConfigs(customs);
}

export const ALL_MODES: DailyMode[] = ["deep-work", "normal", "survival", "chaos"];

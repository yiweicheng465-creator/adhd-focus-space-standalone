/* ============================================================
   useOpenDayStreak — tracks consecutive days the app was opened.

   On first run (no existing streak data), bootstraps from
   "adhd-daily-logs" (the calendar dot data) so the streak
   reflects real historical usage rather than starting at 1.

   Storage key: "adhd-open-day-streak"
   Shape: {
     streak: number;
     lastOpenDate: string | null;  // "YYYY-MM-DD"
     history: Record<string, true>; // dates the app was opened
   }
   ============================================================ */

import { useState, useCallback } from "react";

interface OpenDayData {
  streak: number;
  lastOpenDate: string | null;
  history: Record<string, true>;
}

const STORAGE_KEY = "adhd-open-day-streak";
const DAILY_LOGS_KEY = "adhd-daily-logs";

function toYMD(d: Date): string {
  // "YYYY-MM-DD" in local time (not UTC) to avoid timezone off-by-one
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayYMD(): string {
  return toYMD(new Date());
}

/** Convert "Mon Apr 07 2026" (Date.toDateString) → "2026-04-07" */
function dateStringToYMD(s: string): string | null {
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return toYMD(d);
  } catch {
    return null;
  }
}

/**
 * Compute the consecutive-day streak ending on `today` from a set of
 * visited date strings in "YYYY-MM-DD" format.
 */
function computeStreakFromHistory(history: Record<string, true>, today: string): number {
  let streak = 0;
  const d = new Date(today + "T12:00:00"); // noon local to avoid DST edge cases
  while (true) {
    const key = toYMD(d);
    if (!history[key]) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/**
 * Bootstrap history from adhd-daily-logs.
 * Any day that has any activity (wrapUpDone, dumpCount, winsCount,
 * tasksCompleted, focusSessions, routinesDone) counts as "opened".
 */
function bootstrapFromDailyLogs(): Record<string, true> {
  try {
    const raw = localStorage.getItem(DAILY_LOGS_KEY);
    if (!raw) return {};
    const logs = JSON.parse(raw) as Record<string, {
      wrapUpDone?: boolean;
      dumpCount?: number;
      winsCount?: number;
      tasksCompleted?: number;
      focusSessions?: number;
      routinesDone?: number;
    }>;
    const history: Record<string, true> = {};
    for (const [dateStr, log] of Object.entries(logs)) {
      if (!log) continue;
      const hasActivity =
        log.wrapUpDone ||
        (log.dumpCount ?? 0) > 0 ||
        (log.winsCount ?? 0) > 0 ||
        (log.tasksCompleted ?? 0) > 0 ||
        (log.focusSessions ?? 0) > 0 ||
        (log.routinesDone ?? 0) > 0;
      if (hasActivity) {
        const ymd = dateStringToYMD(dateStr);
        if (ymd) history[ymd] = true;
      }
    }
    return history;
  } catch {
    return {};
  }
}

function loadData(): OpenDayData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { streak: 0, lastOpenDate: null, history: {} };
    const parsed = JSON.parse(raw) as Partial<OpenDayData>;
    return {
      streak: parsed.streak ?? 0,
      lastOpenDate: parsed.lastOpenDate ?? null,
      history: parsed.history ?? {},
    };
  } catch {
    return { streak: 0, lastOpenDate: null, history: {} };
  }
}

function saveData(data: OpenDayData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useOpenDayStreak() {
  const [data, setData] = useState<OpenDayData>(() => {
    const existing = loadData();
    const t = todayYMD();

    // --- Bootstrap from adhd-daily-logs if this is the first time ---
    // Also re-bootstrap if the saved streak is suspiciously low (streak<=1 with
    // only today in history) — this catches the broken first-run case where the
    // old hook started fresh without reading historical data.
    const historyKeys = Object.keys(existing.history);
    const isFirstRun = existing.lastOpenDate === null && historyKeys.length === 0;
    const isBrokenFirstRun =
      existing.streak <= 1 &&
      historyKeys.length <= 1 &&
      (historyKeys.length === 0 || historyKeys[0] === existing.lastOpenDate);

    if (existing.lastOpenDate === t && !isFirstRun && !isBrokenFirstRun) {
      // Already recorded today with a valid streak — return as-is
      return existing;
    }

    let baseHistory = existing.history;
    if (isFirstRun || isBrokenFirstRun) {
      baseHistory = bootstrapFromDailyLogs();
    }

    // Mark today as visited
    const newHistory = { ...baseHistory, [t]: true as const };

    // Prune entries older than 90 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = toYMD(cutoff);
    for (const key of Object.keys(newHistory)) {
      if (key < cutoffStr) delete newHistory[key as keyof typeof newHistory];
    }

    // Compute streak from the full history (handles bootstrap correctly)
    const newStreak = computeStreakFromHistory(newHistory, t);

    const next: OpenDayData = {
      streak: newStreak,
      lastOpenDate: t,
      history: newHistory,
    };
    saveData(next);
    return next;
  });

  /** Manually record today's open (idempotent — safe to call multiple times) */
  const recordOpen = useCallback(() => {
    setData((prev) => {
      const t = todayYMD();
      if (prev.lastOpenDate === t) return prev; // already recorded today

      const newHistory = { ...prev.history, [t]: true as const };
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const cutoffStr = toYMD(cutoff);
      for (const key of Object.keys(newHistory)) {
        if (key < cutoffStr) delete newHistory[key as keyof typeof newHistory];
      }

      const newStreak = computeStreakFromHistory(newHistory, t);

      const next: OpenDayData = {
        streak: newStreak,
        lastOpenDate: t,
        history: newHistory,
      };
      saveData(next);
      return next;
    });
  }, []);

  return {
    streak: data.streak,
    history: data.history,
    recordOpen,
  };
}

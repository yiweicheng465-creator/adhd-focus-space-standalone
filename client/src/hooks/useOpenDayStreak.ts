/* ============================================================
   useOpenDayStreak — tracks consecutive days the app was opened.

   Call recordOpen() once on app mount. It records today's visit
   and updates the streak counter.

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

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function todayStr(): string {
  return toDateStr(new Date());
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
    // On first load, record today's open immediately
    const existing = loadData();
    const t = todayStr();

    if (existing.lastOpenDate === t) {
      // Already recorded today — return as-is
      return existing;
    }

    // Compute new streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = toDateStr(yesterday);

    let newStreak: number;
    if (existing.lastOpenDate === yStr) {
      // Opened yesterday → extend streak
      newStreak = existing.streak + 1;
    } else if (existing.lastOpenDate === null) {
      // First ever open
      newStreak = 1;
    } else {
      // Gap of 2+ days → reset
      newStreak = 1;
    }

    // Update history, prune entries older than 90 days
    const newHistory = { ...existing.history, [t]: true as const };
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = toDateStr(cutoff);
    for (const key of Object.keys(newHistory)) {
      if (key < cutoffStr) delete newHistory[key as keyof typeof newHistory];
    }

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
      const t = todayStr();
      if (prev.lastOpenDate === t) return prev; // already recorded today

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = toDateStr(yesterday);

      const newStreak =
        prev.lastOpenDate === yStr ? prev.streak + 1 : 1;

      const newHistory = { ...prev.history, [t]: true as const };
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const cutoffStr = toDateStr(cutoff);
      for (const key of Object.keys(newHistory)) {
        if (key < cutoffStr) delete newHistory[key as keyof typeof newHistory];
      }

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

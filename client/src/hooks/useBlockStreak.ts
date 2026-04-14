/* ============================================================
   useBlockStreak — tracks consecutive days with a completed
   2-hour (4-session) Pomodoro block, persisted in localStorage.

   Storage key: "adhd_block_streak"
   Shape: {
     streak: number;
     lastBlockDate: string | null;
     history: Record<string, number>; // "YYYY-MM-DD" → block count
   }
   ============================================================ */

import { useState, useCallback } from "react";

interface StreakData {
  streak: number;
  lastBlockDate: string | null;
  history: Record<string, number>; // date → count
}

const STORAGE_KEY = "adhd_block_streak";

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function today(): string {
  return toDateStr(new Date());
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { streak: 0, lastBlockDate: null, history: {} };
    const parsed = JSON.parse(raw) as Partial<StreakData>;
    return {
      streak: parsed.streak ?? 0,
      lastBlockDate: parsed.lastBlockDate ?? null,
      history: parsed.history ?? {},
    };
  } catch {
    return { streak: 0, lastBlockDate: null, history: {} };
  }
}

function saveStreak(data: StreakData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Returns the last N days as "YYYY-MM-DD" strings, oldest first */
export function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateStr(d));
  }
  return days;
}

export function useBlockStreak() {
  const [data, setData] = useState<StreakData>(loadStreak);

  /**
   * Call this when a full 4-session block completes.
   * - Increments history[today] by 1 (multiple blocks per day allowed)
   * - If last block date was yesterday → streak++
   * - If last block date was today already → streak unchanged
   * - If last block date was 2+ days ago → streak resets to 1
   */
  const recordBlock = useCallback(() => {
    setData((prev) => {
      const t = today();

      // Update history — always increment count for today
      const newHistory = { ...prev.history };
      newHistory[t] = (newHistory[t] ?? 0) + 1;

      // Prune history older than 60 days to keep storage lean
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 60);
      const cutoffStr = toDateStr(cutoff);
      for (const key of Object.keys(newHistory)) {
        if (key < cutoffStr) delete newHistory[key];
      }

      // Update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = toDateStr(yesterday);

      let newStreak: number;
      if (prev.lastBlockDate === t) {
        // Already recorded today — streak unchanged, just update history
        newStreak = prev.streak;
      } else if (prev.lastBlockDate === yStr) {
        newStreak = prev.streak + 1;
      } else {
        newStreak = 1;
      }

      const next: StreakData = {
        streak: newStreak,
        lastBlockDate: t,
        history: newHistory,
      };
      saveStreak(next);
      return next;
    });
  }, []);

  return {
    streak: data.streak,
    history: data.history,
    recordBlock,
  };
}

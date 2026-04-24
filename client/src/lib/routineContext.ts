/**
 * routineContext.ts
 * Builds a rich plain-text summary of the user's routine data for injection
 * into AI system prompts. Reads from localStorage — safe to call at any time.
 */
import { getTodayMode, getModeConfig } from "./modeConfig";

type Routine = { id: string; name: string; days: string[]; iconIdx: number };
type DailyLog = {
  dateKey: string;
  routinesDone?: number;
  routinesTotal?: number;
  wrapUpDone?: boolean;
};

const DAYS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function todayDayMon(): string {
  return DAYS_MON[(new Date().getDay() + 6) % 7];
}

function todayISOKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Parse a dateKey like "Mon Apr 07 2026" → ISO "2026-04-07" */
function dateKeyToISO(dk: string): string | null {
  try {
    const d = new Date(dk);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return null;
  }
}

/** Return the last N ISO date strings (today first) */
function lastNDays(n: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  return result;
}

export function buildRoutineContext(): string {
  try {
    // ── 1. Load raw data ──────────────────────────────────────────
    const routines: Routine[] = (() => {
      try { return JSON.parse(localStorage.getItem("adhd-routines") ?? "[]"); } catch { return []; }
    })();

    const doneData = (() => {
      try { return JSON.parse(localStorage.getItem("adhd-routine-done") ?? "{}"); } catch { return {}; }
    })();

    const dailyLogs: Record<string, DailyLog> = (() => {
      try { return JSON.parse(localStorage.getItem("adhd-daily-logs") ?? "{}"); } catch { return {}; }
    })();

    if (routines.length === 0) {
      return "Routines: No routines set up yet.";
    }

    // ── 2. Today's status ─────────────────────────────────────────
    const todayKey = todayISOKey();
    const todayDay = todayDayMon();
    const todayRoutines = routines.filter(r => r.days.includes(todayDay));
    const doneIds: string[] = doneData.date === todayKey ? (doneData.ids ?? []) : [];
    const doneSet = new Set<string>(doneIds);

    const todayLines = todayRoutines.map(r => {
      const status = doneSet.has(r.id) ? "✓ done" : "✗ not done yet";
      return `  - ${r.name} [${status}]`;
    });

    // ── 3. Build per-routine history from daily logs ──────────────
    // Map ISO date → log entry
    const logByISO: Record<string, DailyLog> = {};
    for (const log of Object.values(dailyLogs)) {
      const iso = dateKeyToISO(log.dateKey);
      if (iso) logByISO[iso] = log;
    }

    // For each routine, compute streak and last-14-day completion rate
    const past14 = lastNDays(14);

    // We don't have per-routine history (only aggregate routinesDone/routinesTotal),
    // so we compute aggregate stats and per-routine today status.
    // For streak: count consecutive days where routinesDone === routinesTotal (all done).
    let streak = 0;
    for (const iso of past14) {
      const log = logByISO[iso];
      if (!log) break; // no data for this day — streak broken
      const done = log.routinesDone ?? 0;
      const total = log.routinesTotal ?? 0;
      if (total > 0 && done === total) {
        streak++;
      } else {
        break;
      }
    }

    // 14-day completion rate
    let daysWithData = 0;
    let totalDone = 0;
    let totalScheduled = 0;
    for (const iso of past14) {
      const log = logByISO[iso];
      if (log && (log.routinesTotal ?? 0) > 0) {
        daysWithData++;
        totalDone += log.routinesDone ?? 0;
        totalScheduled += log.routinesTotal ?? 0;
      }
    }
    const completionRate = totalScheduled > 0
      ? Math.round((totalDone / totalScheduled) * 100)
      : null;

    // ── 4. Per-routine schedule summary ──────────────────────────
    const routineSchedules = routines.map(r => {
      const daysStr = r.days.length === 7 ? "every day" : r.days.join(", ");
      return `  - ${r.name} (${daysStr})`;
    });

    // ── 5. Assemble the context block ─────────────────────────────
    const lines: string[] = [];

    // ── 0. Daily mode context ─────────────────────────────────────
    const dailyMode = getTodayMode();
    if (dailyMode) {
      const modeCfg = getModeConfig(dailyMode);
      lines.push(`=== DAILY MODE: ${modeCfg.icon} ${modeCfg.label.toUpperCase()} ===`);
      lines.push(`Tone instruction: ${modeCfg.aiTone}`);
      lines.push(`Opening line to use: "${modeCfg.aiOpener}"`);
      lines.push(`Routine display: ${modeCfg.routineFilter}${modeCfg.routineFilter === "core-only" ? ` (show only first ${modeCfg.routineCoreCount} routines)` : ""}`);
      lines.push("");
    }

    lines.push("=== ROUTINE DATA ===");
    lines.push(`All routines (${routines.length} total):`);
    lines.push(...routineSchedules);
    lines.push("");
    lines.push(`Today (${todayDay}): ${todayRoutines.length} routines scheduled`);
    if (todayLines.length > 0) {
      lines.push(...todayLines);
    } else {
      lines.push("  (no routines scheduled today)");
    }
    lines.push("");
    lines.push(`Current streak (all routines done): ${streak} day${streak !== 1 ? "s" : ""}`);
    if (completionRate !== null) {
      lines.push(`14-day completion rate: ${completionRate}% (${totalDone}/${totalScheduled} across ${daysWithData} days with data)`);
    } else {
      lines.push("14-day completion rate: no history yet");
    }

    // Day-by-day last 7 days
    lines.push("");
    lines.push("Last 7 days:");
    const past7 = lastNDays(7);
    for (const iso of past7) {
      const log = logByISO[iso];
      const label = iso === todayKey ? "Today" : iso;
      if (!log || (log.routinesTotal ?? 0) === 0) {
        lines.push(`  ${label}: no data`);
      } else {
        const d = log.routinesDone ?? 0;
        const t = log.routinesTotal ?? 0;
        const pct = Math.round((d / t) * 100);
        const bar = d === t ? "✓ all done" : `${d}/${t} (${pct}%)`;
        lines.push(`  ${label}: ${bar}`);
      }
    }
    lines.push("===================");

    return lines.join("\n");
  } catch {
    return "Routines: (data unavailable)";
  }
}

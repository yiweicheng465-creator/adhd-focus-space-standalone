/**
 * appStorage.ts
 * Central utility for reading and writing ALL app data as a single JSON object.
 * Default storage: browser localStorage.
 * No server-side storage — this is purely client-side.
 */

/** All localStorage keys used by the app */
export const APP_STORAGE_KEYS = [
  // ── Core user data ──
  "adhd-tasks",
  "adhd-goals",
  "adhd-wins",
  "adhd-agents",
  "adhd-mood",
  "adhd-daily-logs",
  "adhd-care-log",
  "adhd-focus-session-list",
  "adhd_braindump_entries",

  // ── Routines ──
  "adhd-routines",
  "adhd-routine-done",          // today's completion state

  // ── Deletion tombstones ──
  "adhd-deleted-ids",           // { [id]: deletedAt ISO string }

  // ── AI / Coach ──
  "adhd-ai-chat-history",
  "adhd-life-coach-chat",
  "adhd-life-coach-insights",
  "adhd-life-dashboard",

  // ── Ordering & layout preferences ──
  "adhd-quadrant-map",
  "adhd-quadrant-task-order",
  "adhd-calendar-day-order",
  "adhd-goal-task-order",
  "adhd-deleted-categories",
  "adhd-dashboard-show-ai",     // AI panel open/closed preference

  // ── Streaks & scores ──
  "adhd-block-streak-data",
  "adhd-open-day-streak",
  "adhd-api-calls-total",       // total AI calls ever

  // ── Sound & music ──
  "adhd-sfx-enabled",
  "adhd-sfx-vol",
  "adhd-music-enabled",
  "adhd-music-vol",
  "adhd-music-track",

  // ── Theme & appearance ──
  "adhd-hue-rotate",
  "adhd-base-hue",
  "adhd-hue-presets",
  "adhd-film-grain-intensity",
  "adhd-film-grain-speed",

  // ── Personalisation ──
  "adhd-display-name",
  "adhd-work-mode",
  "adhd-quick-chips",
  "cyber-pet-deaths",
  "cyber-pet-total-sessions",
] as const;

/** UI-only keys excluded from backup (theme, sidebar width, skip flags) */
const EXCLUDE_FROM_BACKUP = new Set([
  "theme",
  "adhd-name-skipped",
  "adhd-sidebar-width",
]);

export interface AppBackup {
  version: number;
  exportedAt: string; // ISO timestamp
  appData: Record<string, unknown>;
}

/** Current schema version — bump when the data shape changes */
export const CURRENT_BACKUP_VERSION = 2;

/**
 * Export all app data from localStorage into a single JSON-serialisable object.
 */
export function exportAppData(): AppBackup {
  const appData: Record<string, unknown> = {};

  for (const key of APP_STORAGE_KEYS) {
    if (EXCLUDE_FROM_BACKUP.has(key)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          appData[key] = JSON.parse(raw);
        } catch {
          appData[key] = raw; // store as raw string if not JSON
        }
      }
    } catch {
      // ignore individual key errors
    }
  }

  // Also capture any dynamic daily-checkin-skip keys
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith("adhd-checkin-") || k.startsWith("adhd-block-streak") || k.startsWith("adhd-api-calls-"))) {
      try {
        const raw = localStorage.getItem(k)!;
        try { appData[k] = JSON.parse(raw); } catch { appData[k] = raw; }
      } catch { /* ignore */ }
    }
  }

  return {
    version: CURRENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appData,
  };
}

/**
 * Merge two backups together.
 *
 * Strategy per key type:
 *  - Arrays (tasks, goals, routines, chat history, etc.):
 *      Concatenate both sides, deduplicate by `id` field (keep the one with
 *      the later `updatedAt`/`createdAt`, or just keep both if no id).
 *  - Numbers (counters like cyber-pet-deaths, total-sessions, api-calls):
 *      Take the MAXIMUM of the two values (never lose progress).
 *  - Strings / booleans / objects:
 *      Take the value from whichever backup has the later `exportedAt`.
 *
 * The result is a new AppBackup with exportedAt = now.
 */
export function mergeAppData(local: AppBackup, remote: AppBackup): AppBackup {
  const localNewer = new Date(local.exportedAt) >= new Date(remote.exportedAt);
  const newerFirst = localNewer ? local : remote;
  const olderSecond = localNewer ? remote : local;

  const merged: Record<string, unknown> = {};

  // Collect all keys from both backups
  // Merge tombstone maps first so we can filter deleted items from arrays
  const tombstonesA: Record<string, string> = (() => {
    try { return (newerFirst.appData["adhd-deleted-ids"] as Record<string, string>) ?? {}; } catch { return {}; }
  })();
  const tombstonesB: Record<string, string> = (() => {
    try { return (olderSecond.appData["adhd-deleted-ids"] as Record<string, string>) ?? {}; } catch { return {}; }
  })();
  const mergedTombstones = mergeTombstones(tombstonesA, tombstonesB);

  const allKeys = new Set([
    ...Object.keys(newerFirst.appData),
    ...Object.keys(olderSecond.appData),
  ]);

  for (const key of allKeys) {
    // Tombstone map is handled separately above
    if (key === "adhd-deleted-ids") { merged[key] = mergedTombstones; continue; }

    const a = newerFirst.appData[key];   // value from newer backup
    const b = olderSecond.appData[key];  // value from older backup

    if (b === undefined) { merged[key] = a; continue; }
    if (a === undefined) { merged[key] = b; continue; }

    // Both sides have a value — apply merge strategy
    if (Array.isArray(a) && Array.isArray(b)) {
      // Merge arrays: deduplicate by `id`, prefer the item with the latest
      // `updatedAt` timestamp (falls back to `createdAt`, then the newer backup).
      const byId = new Map<string, unknown>();
      // Insert older-backup items first, then newer-backup items overwrite
      for (const item of [...(b as any[]), ...(a as any[])]) {
        if (item && typeof item === "object" && "id" in (item as object)) {
          const id = (item as any).id;
          // Skip items that have been tombstoned (deleted on either device)
          if (id in mergedTombstones) {
            const deletedAt = new Date(mergedTombstones[id]).getTime();
            const tsOf = (x: any): number => {
              const s = x.updatedAt ?? x.createdAt;
              if (!s) return 0;
              const t = new Date(s).getTime();
              return isNaN(t) ? 0 : t;
            };
            // Only resurrect if the item was updated AFTER it was deleted
            if (tsOf(item) <= deletedAt) continue;
          }
          const existing = byId.get(id) as any;
          if (existing) {
            // Pick whichever version was modified more recently
            const tsOf = (x: any): number => {
              const s = x.updatedAt ?? x.createdAt;
              if (!s) return 0;
              const t = new Date(s).getTime();
              return isNaN(t) ? 0 : t;
            };
            if (tsOf(item) >= tsOf(existing)) byId.set(id, item);
            // else keep existing (it's newer)
          } else {
            byId.set(id, item);
          }
        } else {
          // No id — just keep it (use JSON as dedup key)
          byId.set(JSON.stringify(item), item);
        }
      }
      merged[key] = Array.from(byId.values());
    } else if (typeof a === "number" && typeof b === "number") {
      // Counters: take the maximum so progress is never lost
      merged[key] = Math.max(a, b);
    } else {
      // Scalar / object: take value from the newer backup
      merged[key] = a;
    }
  }

  return {
    version: CURRENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appData: merged,
  };
}

/**
 * Migrate a backup from an older schema version to the current one.
 * Add migration steps here whenever CURRENT_BACKUP_VERSION is bumped.
 */
export function migrateBackup(backup: AppBackup): AppBackup {
  let b = { ...backup, appData: { ...backup.appData } };

  // v1 → v2: ensure every task has updatedAt (fill from createdAt or exportedAt)
  if (b.version < 2) {
    const tasks = b.appData["adhd-tasks"];
    if (Array.isArray(tasks)) {
      b.appData["adhd-tasks"] = (tasks as any[]).map((t: any) => {
        if (t && typeof t === "object" && !t.updatedAt) {
          return { ...t, updatedAt: t.createdAt ?? b.exportedAt };
        }
        return t;
      });
    }
    b.version = 2;
  }

  return b;
}

/**
 * Import app data from a backup object into localStorage.
 * Overwrites existing values for all keys present in the backup.
 */
export function importAppData(backup: AppBackup): void {
  if (!backup || typeof backup !== "object" || !backup.appData) {
    throw new Error("Invalid backup format: missing appData field.");
  }
  // Migrate old backups forward instead of rejecting them
  const migrated = migrateBackup(backup);

  for (const [key, value] of Object.entries(migrated.appData)) {
    try {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    } catch {
      // ignore write errors for individual keys
    }
  }
}

/**
 * Download a backup JSON file to the user's device.
 */
export function downloadBackupFile(backup: AppBackup): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `adhd-focus-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Read a backup JSON file from a File object (from <input type="file">).
 */
export function readBackupFile(file: File): Promise<AppBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as AppBackup;
        resolve(parsed);
      } catch {
        reject(new Error("Could not parse backup file. Make sure it's a valid JSON backup."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

/**
 * Get a human-readable summary of what's in the backup.
 */
export function getBackupSummary(backup: AppBackup): string {
  const keys = Object.keys(backup.appData);
  const date = new Date(backup.exportedAt).toLocaleString();
  return `Exported ${date} · ${keys.length} data categories`;
}

// ── Tombstone (soft-delete) helpers ──────────────────────────────────────────
// When an item is deleted, record its ID + deletion timestamp so the merge
// logic can prevent it from being resurrected from the other device's backup.

const DELETED_IDS_KEY = "adhd-deleted-ids";

/**
 * Record a deletion tombstone for the given ID.
 * Call this whenever a task, goal, win, routine, or agent is deleted.
 */
export function recordDeletion(id: string): void {
  try {
    const existing: Record<string, string> = JSON.parse(
      localStorage.getItem(DELETED_IDS_KEY) ?? "{}"
    );
    existing[id] = new Date().toISOString();
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(existing));
  } catch { /* ignore */ }
}

/**
 * Check if an ID has been tombstoned (deleted).
 */
export function isDeleted(id: string): boolean {
  try {
    const existing: Record<string, string> = JSON.parse(
      localStorage.getItem(DELETED_IDS_KEY) ?? "{}"
    );
    return id in existing;
  } catch { return false; }
}

/**
 * Merge two tombstone maps: keep the earliest deletion timestamp for each ID
 * (once deleted, always deleted — we never un-delete via merge).
 */
export function mergeTombstones(
  a: Record<string, string>,
  b: Record<string, string>
): Record<string, string> {
  const result = { ...a };
  for (const [id, ts] of Object.entries(b)) {
    if (!(id in result) || ts < result[id]) {
      result[id] = ts;
    }
  }
  return result;
}

/**
 * Prune tombstones older than `daysToKeep` days.
 * Call before exporting a backup to prevent the tombstone map growing unbounded.
 */
export function pruneTombstones(daysToKeep = 90): void {
  try {
    const existing: Record<string, string> = JSON.parse(
      localStorage.getItem(DELETED_IDS_KEY) ?? "{}"
    );
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
    const pruned: Record<string, string> = {};
    for (const [id, ts] of Object.entries(existing)) {
      if (ts >= cutoff) pruned[id] = ts;
    }
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(pruned));
  } catch { /* ignore */ }
}

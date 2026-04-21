/**
 * useAutoBackup — always-on debounced Google Drive backup hook.
 *
 * Must be called at the top-level of the app (Home.tsx) so it is active
 * on EVERY page, not just the Storage page.
 *
 * Strategy (Notion / Google Docs style):
 *   • Listen for any app-data change via the "adhd-storage-update" event
 *   • After the LAST change, wait DEBOUNCE_MS (30 s) before uploading
 *   • If the user keeps editing, the timer resets — no wasted API calls
 *   • A 1-hour fallback interval ensures a backup even if edits never stop
 *   • All logic runs in the browser — completely independent of Manus
 *   • Uses read-merge-write so two devices never overwrite each other
 */

import { useEffect } from "react";
import {
  exportAppData,
  importAppData,
  mergeAppData,
  pruneTombstones,
  type AppBackup,
} from "@/lib/appStorage";
import {
  getServerDriveToken,
  isGDriveConnected,
  uploadToDrive,
  downloadFromDrive,
} from "@/lib/driveApi";

const AUTO_BACKUP_KEY = "adhd-gdrive-auto-backup-ts";
const DEBOUNCE_MS = 30 * 1000;       // 30 seconds after last change
const FALLBACK_MS = 60 * 60 * 1000;  // 1 hour max gap

// Only back up keys that are meaningful data (ignore UI-only keys)
const BACKUP_KEY_SET = new Set([
  "adhd-tasks", "adhd-goals", "adhd-wins", "adhd-agents", "adhd-mood",
  "adhd-daily-logs", "adhd-care-log", "adhd-focus-session-list",
  "adhd_braindump_entries", "adhd-routines", "adhd-routine-done",
  "adhd-quadrant-map", "adhd-goal-task-order", "adhd-deleted-categories",
  "adhd-deleted-ids", "adhd-life-dashboard", "adhd-block-streak-data",
]);

export function useAutoBackup() {
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let isBacking = false;

    const runAutoBackup = async () => {
      if (isBacking || !isGDriveConnected()) return;
      isBacking = true;
      try {
        const token = await getServerDriveToken().catch(() => null);
        if (!token) return;

        // Prune old tombstones before exporting (keep last 90 days)
        pruneTombstones(90);

        const localBackup = exportAppData();
        let toUpload = localBackup;
        try {
          const remoteBackup = await downloadFromDrive(token);
          toUpload = mergeAppData(localBackup, remoteBackup);
          // Apply merged data back to local so this device is up to date
          importAppData(toUpload);
        } catch {
          // No remote file yet — first backup, just upload local
        }
        await uploadToDrive(token, toUpload);

        const now = Date.now();
        localStorage.setItem(AUTO_BACKUP_KEY, String(now));
        localStorage.setItem("adhd-last-backup", String(now));
        const info = `Auto-backed up ${new Date(now).toLocaleString()} · ${Object.keys(toUpload.appData).length} data categories`;
        localStorage.setItem("adhd-last-backup-info", info);

        // Notify the Storage page UI to refresh its timestamp display
        window.dispatchEvent(new CustomEvent("adhd-backup-complete", { detail: { ts: now, info } }));
      } catch {
        // Silent fail — will retry on next change or fallback interval
      } finally {
        isBacking = false;
      }
    };

    const onStorageChange = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      if (!BACKUP_KEY_SET.has(key)) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runAutoBackup, DEBOUNCE_MS);
    };

    window.addEventListener("adhd-storage-update", onStorageChange);

    // 1-hour fallback: run even if the user never stops editing
    const fallbackId = setInterval(() => {
      const last = Number(localStorage.getItem(AUTO_BACKUP_KEY) ?? 0);
      if (Date.now() - last >= FALLBACK_MS) runAutoBackup();
    }, FALLBACK_MS);

    // Run once on mount in case a backup is overdue
    const last = Number(localStorage.getItem(AUTO_BACKUP_KEY) ?? 0);
    if (Date.now() - last >= FALLBACK_MS) runAutoBackup();

    return () => {
      window.removeEventListener("adhd-storage-update", onStorageChange);
      clearInterval(fallbackId);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);
}

/**
 * Dispatch a storage-update event for a key that was written directly
 * to localStorage (not via useLocalStorage hook).
 * Call this after any direct localStorage.setItem() for backup-relevant keys.
 */
export function dispatchStorageUpdate(key: string): void {
  window.dispatchEvent(new CustomEvent("adhd-storage-update", { detail: key }));
}

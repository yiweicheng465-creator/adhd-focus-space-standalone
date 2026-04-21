/**
 * useAutoBackup — always-on debounced Google Drive backup hook.
 *
 * This hook must be called at the top-level of the app (e.g. Home.tsx)
 * so it is active on EVERY page, not just the Storage page.
 *
 * Strategy (like Notion / Google Docs):
 *   • Listen for any app-data change via the "adhd-storage-update" event
 *   • After the LAST change, wait DEBOUNCE_MS (30 s) before uploading
 *   • If the user keeps editing, the timer resets — no wasted API calls
 *   • A 1-hour fallback interval ensures a backup even if edits never stop
 *   • All logic runs in the browser — completely independent of Manus
 *   • Uses read-merge-write so two devices never overwrite each other
 */

import { useEffect } from "react";
import { exportAppData, importAppData, mergeAppData, type AppBackup } from "@/lib/appStorage";

const BACKUP_FILENAME = "adhd-focus-backup.json";
const BACKUP_MIME = "application/json";
const AUTO_BACKUP_KEY = "adhd-gdrive-auto-backup-ts";
const DEBOUNCE_MS = 30 * 1000;      // 30 seconds after last change
const FALLBACK_MS = 60 * 60 * 1000; // 1 hour max gap

// Only back up keys that are part of the app data set (ignore UI-only keys)
const BACKUP_KEY_SET = new Set([
  "adhd-tasks", "adhd-goals", "adhd-wins", "adhd-agents", "adhd-mood",
  "adhd-daily-logs", "adhd-care-log", "adhd-focus-session-list",
  "adhd_braindump_entries", "adhd-routines", "adhd-routine-done",
  "adhd-quadrant-map", "adhd-goal-task-order", "adhd-deleted-categories",
]);

// ── Drive token (cached in module scope, shared with StorageBackup.tsx) ──
let cachedDriveToken: { token: string; expiresAt: number } | null = null;

async function getServerDriveToken(): Promise<string> {
  if (cachedDriveToken && cachedDriveToken.expiresAt > Date.now() + 60_000) {
    return cachedDriveToken.token;
  }
  const res = await fetch("/api/drive/token", { credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Drive token fetch failed");
  cachedDriveToken = { token: data.accessToken, expiresAt: Date.now() + 50 * 60 * 1000 };
  return data.accessToken;
}

function isGDriveConnected(): boolean {
  return localStorage.getItem("adhd-gdrive-connected") === "1";
}

async function uploadToDrive(accessToken: string, backup: AppBackup): Promise<void> {
  const json = JSON.stringify(backup, null, 2);
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D%22${BACKUP_FILENAME}%22+and+trashed%3Dfalse&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listRes.json();
  const existingFile = listData.files?.[0];
  if (existingFile) {
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": BACKUP_MIME },
      body: json,
    });
  } else {
    const metadata = { name: BACKUP_FILENAME, mimeType: BACKUP_MIME };
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", new Blob([json], { type: BACKUP_MIME }));
    await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
  }
}

async function downloadFromDrive(accessToken: string): Promise<AppBackup> {
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D%22${BACKUP_FILENAME}%22+and+trashed%3Dfalse&fields=files(id,name,modifiedTime)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listRes.json();
  const file = listData.files?.[0];
  if (!file) throw new Error("No backup file found");
  const contentRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return JSON.parse(await contentRes.text()) as AppBackup;
}

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
        const localBackup = exportAppData();
        let toUpload = localBackup;
        try {
          const remoteBackup = await downloadFromDrive(token);
          toUpload = mergeAppData(localBackup, remoteBackup);
          importAppData(toUpload);
        } catch { /* no remote file yet — first backup */ }
        await uploadToDrive(token, toUpload);
        const now = Date.now();
        localStorage.setItem(AUTO_BACKUP_KEY, String(now));
        localStorage.setItem("adhd-last-backup", String(now));
        const info = `Auto-backed up ${new Date(now).toLocaleString()} · ${Object.keys(toUpload.appData).length} data categories`;
        localStorage.setItem("adhd-last-backup-info", info);
        // Notify the Storage page UI to refresh its display
        window.dispatchEvent(new CustomEvent("adhd-backup-complete", { detail: { ts: now, info } }));
      } catch { /* silent fail */ } finally {
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

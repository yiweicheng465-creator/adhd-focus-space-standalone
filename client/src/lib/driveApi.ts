/**
 * driveApi.ts
 * Shared Google Drive API helpers used by both useAutoBackup and StorageBackup.
 * Single shared token cache — no duplicate fetches.
 */

import { type AppBackup } from "./appStorage";

const BACKUP_FILENAME = "adhd-focus-backup.json";
const BACKUP_MIME = "application/json";

// ── Token cache (module-level singleton) ─────────────────────────────────────
let cachedDriveToken: { token: string; expiresAt: number } | null = null;

export async function getServerDriveToken(): Promise<string> {
  if (cachedDriveToken && cachedDriveToken.expiresAt > Date.now() + 60_000) {
    return cachedDriveToken.token;
  }
  const res = await fetch("/api/drive/token", { credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Drive token fetch failed");
  cachedDriveToken = { token: data.accessToken, expiresAt: Date.now() + 50 * 60 * 1000 };
  return data.accessToken;
}

export function setCachedDriveToken(token: string): void {
  cachedDriveToken = { token, expiresAt: Date.now() + 50 * 60 * 1000 };
}

export function clearCachedDriveToken(): void {
  cachedDriveToken = null;
}

export function isGDriveConnected(): boolean {
  return localStorage.getItem("adhd-gdrive-connected") === "1";
}

// ── Drive file operations ─────────────────────────────────────────────────────

/** Upload a backup JSON to Google Drive (creates or updates the backup file) */
export async function uploadToDrive(accessToken: string, backup: AppBackup): Promise<void> {
  const json = JSON.stringify(backup, null, 2);

  // Find existing file
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D%22${BACKUP_FILENAME}%22+and+trashed%3Dfalse&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listRes.json();
  const existingFile = listData.files?.[0];

  if (existingFile) {
    // Update existing file
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": BACKUP_MIME },
        body: json,
      }
    );
    if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
  } else {
    // Create new file
    const metadata = { name: BACKUP_FILENAME, mimeType: BACKUP_MIME };
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", new Blob([json], { type: BACKUP_MIME }));
    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    );
    if (!res.ok) throw new Error(`Drive create failed: ${res.status}`);
  }
}

/** Download the backup file from Google Drive */
export async function downloadFromDrive(accessToken: string): Promise<AppBackup> {
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D%22${BACKUP_FILENAME}%22+and+trashed%3Dfalse&fields=files(id,name,modifiedTime)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listRes.json();
  const file = listData.files?.[0];
  if (!file) throw new Error(`No backup file found in Google Drive. Backup first to create one.`);

  const contentRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const text = await contentRes.text();
  try {
    return JSON.parse(text) as AppBackup;
  } catch {
    throw new Error("Backup file in Google Drive is corrupted or not a valid JSON.");
  }
}

// ── OAuth helpers ─────────────────────────────────────────────────────────────

export function loadGapiScripts(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).google?.accounts?.oauth2) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

/** Connect Google Drive via authorization code flow — one time setup */
export function connectGoogleDrive(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (fn: () => void) => { if (!settled) { settled = true; fn(); } };

    const redirectUri = window.location.origin;
    const codeClient = (window as any).google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.file",
      ux_mode: "popup",
      access_type: "offline",
      prompt: "consent",
      callback: async (response: any) => {
        if (response.error) {
          const cancelled = ["popup_closed_by_user", "access_denied", "popup_failed_to_open", "user_cancel"];
          settle(() => reject(new Error(cancelled.includes(response.error) ? "CANCELLED" : response.error)));
          return;
        }
        try {
          const res = await fetch("/api/drive/connect", {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: response.code, redirectUri }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Connect failed");
          localStorage.setItem("adhd-gdrive-connected", "1");
          setCachedDriveToken(data.accessToken);
          settle(() => resolve(data.accessToken));
        } catch (err: any) { settle(() => reject(err)); }
      },
    });

    let popupRef: Window | null = null;
    const _origWindowOpen = window.open;
    window.open = (url?: string | URL, target?: string, features?: string) => {
      const w = _origWindowOpen.call(window, url, target, features);
      if (url && String(url).includes("accounts.google.com")) popupRef = w;
      return w;
    };

    codeClient.requestCode();

    const poll = setInterval(() => {
      if (settled) { clearInterval(poll); window.open = _origWindowOpen; return; }
      if (popupRef && popupRef.closed) {
        clearInterval(poll);
        window.open = _origWindowOpen;
        settle(() => reject(new Error("CANCELLED")));
      }
    }, 500);

    setTimeout(() => {
      clearInterval(poll);
      window.open = _origWindowOpen;
      settle(() => reject(new Error("CANCELLED")));
    }, 5 * 60 * 1000);
  });
}

/** Get Drive access token — from server (uses stored refresh token, no popup after first time) */
export async function getGoogleAccessToken(clientId: string): Promise<string> {
  if (isGDriveConnected()) {
    try { return await getServerDriveToken(); } catch {}
  }
  await loadGapiScripts();
  return connectGoogleDrive(clientId);
}

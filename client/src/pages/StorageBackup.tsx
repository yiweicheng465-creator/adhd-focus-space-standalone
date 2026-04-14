/* ============================================================
   ADHD FOCUS SPACE — Storage & Backup Page
   - Default: browser localStorage
   - Optional: Google Drive manual backup/restore
   - Optional: Local file download/upload (no login needed)
   ============================================================ */

import { useRef, useState } from "react";
import {
  exportAppData,
  importAppData,
  downloadBackupFile,
  readBackupFile,
  getBackupSummary,
  type AppBackup,
} from "@/lib/appStorage";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, CloudDownload, CloudUpload, Download, HardDrive, RefreshCw, Upload } from "lucide-react";

/* ── Design tokens ── */
const M = {
  ink:    "oklch(0.28 0.040 320)",
  muted:  "oklch(0.52 0.040 330)",
  border: "oklch(0.82 0.050 340)",
  card:   "oklch(0.975 0.018 355)",
  coral:  "oklch(0.58 0.18 340)",
  sage:   "oklch(0.50 0.16 340)",
  warn:   "oklch(0.60 0.15 60)",
  warnBg: "oklch(0.97 0.025 60)",
  warnBdr:"oklch(0.82 0.07 60)",
};

/* ── Google Drive OAuth helpers (client-side only) ── */
const GDRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const GDRIVE_DISCOVERY = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const BACKUP_FILENAME = "adhd-focus-backup.json";
const BACKUP_MIME = "application/json";

/** Load Google API scripts lazily */
function loadGapiScripts(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).gapi && (window as any).google?.accounts) {
      resolve();
      return;
    }
    const gapiScript = document.createElement("script");
    gapiScript.src = "https://apis.google.com/js/api.js";
    gapiScript.onload = () => {
      (window as any).gapi.load("client", async () => {
        try {
          await (window as any).gapi.client.init({
            discoveryDocs: [GDRIVE_DISCOVERY],
          });
          resolve();
        } catch (e) { reject(e); }
      });
    };
    gapiScript.onerror = reject;
    document.head.appendChild(gapiScript);

    const gisScript = document.createElement("script");
    gisScript.src = "https://accounts.google.com/gsi/client";
    document.head.appendChild(gisScript);
  });
}

/** Get an access token via Google Identity Services popup */
function getGoogleAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GDRIVE_SCOPE,
      callback: (response: any) => {
        if (response.error) {
          // access_denied or popup_closed_by_user both mean the user cancelled
          if (response.error === "access_denied" || response.error === "popup_closed_by_user") {
            reject(new Error("CANCELLED"));
          } else {
            reject(new Error(response.error));
          }
        } else {
          resolve(response.access_token as string);
        }
      },
      error_callback: (err: any) => {
        // GIS fires error_callback when the popup is closed without completing
        if (err?.type === "popup_closed" || err?.type === "popup_failed_to_open") {
          reject(new Error("CANCELLED"));
        } else {
          reject(new Error(err?.type ?? "auth_error"));
        }
      },
    });
    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

/** Upload JSON to Google Drive (creates or updates the backup file) */
async function uploadToDrive(accessToken: string, backup: AppBackup): Promise<void> {
  const json = JSON.stringify(backup, null, 2);

  // Check if file already exists
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D%22${BACKUP_FILENAME}%22+and+trashed%3Dfalse&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listRes.json();
  const existingFile = listData.files?.[0];

  if (existingFile) {
    // Update existing file
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": BACKUP_MIME },
      body: json,
    });
  } else {
    // Create new file
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

/** Download the backup file from Google Drive */
async function downloadFromDrive(accessToken: string): Promise<AppBackup> {
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

/* ── Component ── */
export default function StorageBackup() {
  const [gdClientId, setGdClientId] = useState(() => localStorage.getItem("adhd-gdrive-client-id") ?? "");
  const [showClientIdInput, setShowClientIdInput] = useState(false);
  const [gdStatus, setGdStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [gdMessage, setGdMessage] = useState("");
  const [lastBackupInfo, setLastBackupInfo] = useState<string | null>(() => localStorage.getItem("adhd-last-backup-info"));
  const [lastBackupTs, setLastBackupTs] = useState<number | null>(() => {
    const ts = localStorage.getItem("adhd-last-backup");
    if (ts) return parseInt(ts, 10);
    // Fallback: if we have an info string (e.g. "Exported 4/12/2026, 8:46:57 PM · 18 data categories")
    // but no explicit timestamp key, parse the date from the info string so the badge shows correctly.
    const info = localStorage.getItem("adhd-last-backup-info");
    if (info) {
      // info starts with "Exported MM/DD/YYYY, HH:MM:SS AM/PM" or "Backed up MM/DD/YYYY..."
      const match = info.match(/(\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2}:\d{2}\s*[AP]M)/);
      if (match) {
        const parsed = new Date(match[1]).getTime();
        if (!isNaN(parsed)) {
          // Persist so future mounts don't need to re-parse
          localStorage.setItem("adhd-last-backup", String(parsed));
          return parsed;
        }
      }
      // If we can't parse a date, at least treat it as "backed up at some point" using now as a floor
      // so the badge doesn't say "Never backed up" when info clearly exists.
      const fallback = Date.now();
      localStorage.setItem("adhd-last-backup", String(fallback));
      return fallback;
    }
    return null;
  });

  // Compute relative time from the last backup timestamp
  const lastBackupRelative = (() => {
    if (!lastBackupTs) return null;
    const ms = Date.now() - lastBackupTs;
    const mins = Math.floor(ms / 60_000);
    const hours = Math.floor(ms / 3_600_000);
    const days = Math.floor(ms / 86_400_000);
    if (mins < 2) return "just now";
    if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    if (days === 1) return "yesterday";
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  })();

  /** Helper: record a successful backup timestamp */
  const recordBackupTime = () => {
    const now = Date.now();
    localStorage.setItem("adhd-last-backup", String(now));
    setLastBackupTs(now);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveClientId = (id: string) => {
    setGdClientId(id);
    localStorage.setItem("adhd-gdrive-client-id", id);
  };

  /* ── Local backup ── */
  const handleLocalBackup = () => {
    try {
      const backup = exportAppData();
      downloadBackupFile(backup);
      const info = getBackupSummary(backup);
      localStorage.setItem("adhd-last-backup-info", info);
      setLastBackupInfo(info);
      recordBackupTime();
          } catch (e) {
      toast.error("Backup failed: " + (e as Error).message, { duration: 4000 });
    }
  };

  /* ── Local restore ── */
  const handleLocalRestoreClick = () => fileInputRef.current?.click();

  const handleLocalRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const backup = await readBackupFile(file);
      importAppData(backup);
      const info = getBackupSummary(backup);
      localStorage.setItem("adhd-last-backup-info", info);
      setLastBackupInfo(info);
            setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast.error("Restore failed: " + (e as Error).message, { duration: 5000 });
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  /* ── Google Drive backup ── */
  const handleDriveBackup = async () => {
    if (!gdClientId.trim()) {
      setShowClientIdInput(true);
      toast.info("Enter your Google OAuth Client ID first.", { duration: 3000 });
      return;
    }
    setGdStatus("loading");
    setGdMessage("Connecting to Google…");
    try {
      await loadGapiScripts();
      const token = await getGoogleAccessToken(gdClientId.trim());
      setGdMessage("Uploading backup…");
      const backup = exportAppData();
      await uploadToDrive(token, backup);
      const info = getBackupSummary(backup);
      localStorage.setItem("adhd-last-backup-info", info);
      setLastBackupInfo(info);
      recordBackupTime();
      setGdStatus("success");
      setGdMessage(`Backed up to Google Drive · ${info}`);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "CANCELLED") {
        setGdStatus("idle");
        setGdMessage("Backup cancelled.");
      } else {
        setGdStatus("error");
        setGdMessage(msg ?? "Unknown error");
        toast.error("Google Drive backup failed.", { duration: 4000 });
      }
    }
  };

  /* ── Google Drive restore ── */
  const handleDriveRestore = async () => {
    if (!gdClientId.trim()) {
      setShowClientIdInput(true);
      toast.info("Enter your Google OAuth Client ID first.", { duration: 3000 });
      return;
    }
    setGdStatus("loading");
    setGdMessage("Connecting to Google…");
    try {
      await loadGapiScripts();
      const token = await getGoogleAccessToken(gdClientId.trim());
      setGdMessage("Downloading backup from Drive…");
      const backup = await downloadFromDrive(token);
      importAppData(backup);
      const info = getBackupSummary(backup);
      localStorage.setItem("adhd-last-backup-info", info);
      setLastBackupInfo(info);
      setGdStatus("success");
      setGdMessage(`Restored · ${info}`);
            setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "CANCELLED") {
        setGdStatus("idle");
        setGdMessage("Restore cancelled.");
      } else {
        setGdStatus("error");
        setGdMessage(msg ?? "Unknown error");
        toast.error("Google Drive restore failed.", { duration: 5000 });
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto py-6 px-4">

      {/* Page title */}
      <div>
        <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: M.ink, letterSpacing: "0.05em" }}>
          STORAGE &amp; BACKUP
        </h1>
        <p style={{ fontSize: 12, color: M.muted, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
          Manage how your data is stored and backed up.
        </p>
      </div>

      {/* Current mode card */}
      <Section title="Current Mode">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HardDrive size={16} style={{ color: M.coral, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
              Local Storage (default)
            </p>
            <p style={{ fontSize: 11, color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
              All data is stored in your browser. No account required.
            </p>
          </div>
        </div>

        {/* Warning */}
        <div style={{
          display: "flex", gap: 8, alignItems: "flex-start",
          background: M.warnBg, border: `1px solid ${M.warnBdr}`,
          padding: "10px 12px", marginTop: 12,
        }}>
          <AlertTriangle size={14} style={{ color: M.warn, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: M.warn, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
            Your data is stored locally. If you clear browser data, it will be lost unless backed up.
          </p>
        </div>

        {/* Last backed up badge — always visible */}
        <div style={{
          display: "flex", gap: 8, alignItems: "center",
          background: lastBackupRelative ? "oklch(0.97 0.018 340)" : "oklch(0.97 0.025 60)",
          border: `1px solid ${lastBackupRelative ? "oklch(0.82 0.08 340)" : M.warnBdr}`,
          padding: "10px 14px", marginTop: 12, borderRadius: 2,
        }}>
          {lastBackupRelative
            ? <CheckCircle2 size={14} style={{ color: M.sage, flexShrink: 0 }} />
            : <AlertTriangle size={14} style={{ color: M.warn, flexShrink: 0 }} />}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: lastBackupRelative ? M.sage : M.warn, fontFamily: "'DM Sans', sans-serif" }}>
              {lastBackupRelative ? `Last backed up: ${lastBackupRelative}` : "Never backed up"}
            </p>
            {lastBackupInfo && (
              <p style={{ fontSize: 10, color: M.muted, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
                {lastBackupInfo}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* Local file backup */}
      <Section title="Local File Backup" subtitle="No login required — saves a JSON file to your device.">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <ActionButton icon={<Download size={13} />} label="Download Backup" onClick={handleLocalBackup} primary />
          <ActionButton icon={<Upload size={13} />} label="Restore from File" onClick={handleLocalRestoreClick} />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleLocalRestoreFile}
        />
        <p style={{ fontSize: 10, color: M.muted, fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>
          Backup file: <code style={{ background: "oklch(0.93 0.015 340)", padding: "1px 5px" }}>adhd-focus-backup-YYYY-MM-DD.json</code>
        </p>
      </Section>

      {/* Google Drive backup */}
      <Section title="Google Drive Backup" subtitle="Manually save or restore your data from Google Drive.">

        {/* OAuth Client ID setup */}
        <div style={{ marginBottom: 16 }}>
          {/* Status badge + toggle */}
          <button
            onClick={() => setShowClientIdInput(!showClientIdInput)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11, background: "none", border: `1px solid ${gdClientId ? "oklch(0.65 0.14 168)" : M.border}`,
              borderRadius: 4, padding: "4px 10px",
              color: gdClientId ? "oklch(0.40 0.14 168)" : M.muted,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <span>{gdClientId ? "✓" : "⚙"}</span>
            {gdClientId ? "Google OAuth configured — click to change" : "Set up Google OAuth Client ID"}
          </button>

          {showClientIdInput && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10,
              padding: "14px 16px", background: "oklch(0.97 0.015 340)", border: `1px solid ${M.border}`, borderRadius: 6 }}>

              {/* Step-by-step guide */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: M.ink, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
                  How to get your Google OAuth Client ID:
                </p>
                <ol style={{ paddingLeft: 16, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    <>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: M.coral, fontWeight: 600 }}>console.cloud.google.com/apis/credentials</a></>,
                    <>Click <strong>Create credentials</strong> → <strong>OAuth client ID</strong></>,
                    <>Set Application type to <strong>"Web application"</strong></>,
                    <><strong>Authorized JavaScript origins</strong> — add your site URL:<br />
                      <code style={{ background: "oklch(0.92 0.025 340)", padding: "2px 6px", borderRadius: 3, fontSize: 10, fontFamily: "'DM Mono', monospace" }}>
                        {window.location.origin}
                      </code>
                      <button onClick={() => { navigator.clipboard.writeText(window.location.origin); toast.success("URL copied!"); }}
                        style={{ marginLeft: 6, fontSize: 9, color: M.coral, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                        Copy
                      </button>
                    </>,
                    <>Leave <strong>Authorized redirect URIs</strong> empty</>,
                    <>Click <strong>Create</strong>, then copy the <strong>Client ID</strong> (ends in .apps.googleusercontent.com)</>,
                  ].map((step, i) => (
                    <li key={i} style={{ fontSize: 11, color: M.ink, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                      {step}
                    </li>
                  ))}
                </ol>
                <p style={{ marginTop: 8, fontSize: 10, color: M.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                  ⚠ If you see <strong>Error 400: redirect_uri_mismatch</strong>, it means your site URL is not in
                  "Authorized JavaScript origins". Copy the URL above and add it in Google Cloud Console.
                </p>
              </div>

              {/* Input */}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={gdClientId}
                  onChange={(e) => setGdClientId(e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                  style={{
                    flex: 1, padding: "7px 10px", fontSize: 11, fontFamily: "'DM Mono', monospace",
                    border: `1px solid ${M.border}`, background: M.card, color: M.ink, outline: "none", borderRadius: 4,
                  }}
                />
                <button
                  onClick={() => { saveClientId(gdClientId); setShowClientIdInput(false); toast.success("Client ID saved."); }}
                  style={{
                    padding: "7px 16px", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                    background: M.coral, color: "white", border: "none", cursor: "pointer", borderRadius: 4,
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drive action buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <ActionButton
            icon={gdStatus === "loading" ? <RefreshCw size={13} className="animate-spin" /> : <CloudUpload size={13} />}
            label="Backup to Google Drive"
            onClick={handleDriveBackup}
            disabled={gdStatus === "loading"}
            primary
          />
          <ActionButton
            icon={gdStatus === "loading" ? <RefreshCw size={13} className="animate-spin" /> : <CloudDownload size={13} />}
            label="Restore from Google Drive"
            onClick={handleDriveRestore}
            disabled={gdStatus === "loading"}
          />
        </div>

        {/* Status message */}
        {gdMessage && (
          <div style={{
            marginTop: 10, padding: "8px 12px",
            background: gdStatus === "error" ? "oklch(0.97 0.025 355)" : gdStatus === "success" ? "oklch(0.97 0.018 340)" : "oklch(0.96 0.015 340)",
            border: `1px solid ${gdStatus === "error" ? "oklch(0.80 0.08 355)" : gdStatus === "success" ? "oklch(0.82 0.08 340)" : M.border}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {gdStatus === "success" && <CheckCircle2 size={12} style={{ color: M.sage, flexShrink: 0 }} />}
            {gdStatus === "error" && <AlertTriangle size={12} style={{ color: "oklch(0.55 0.18 355)", flexShrink: 0 }} />}
            <p style={{
              fontSize: 10, fontFamily: "'DM Mono', monospace",
              color: gdStatus === "error" ? "oklch(0.45 0.18 355)" : gdStatus === "success" ? M.sage : M.muted,
            }}>
              {gdMessage}
            </p>
          </div>
        )}

        <p style={{ fontSize: 10, color: M.muted, fontFamily: "'DM Sans', sans-serif", marginTop: 10, lineHeight: 1.6 }}>
          Google Drive access is only requested when you click Backup or Restore. No automatic syncing occurs.
          The backup file is named <code style={{ background: "oklch(0.93 0.015 340)", padding: "1px 5px" }}>{BACKUP_FILENAME}</code> in your Drive root.
        </p>
      </Section>

      {/* What's backed up */}
      <Section title="What Gets Backed Up">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {[
            "Tasks", "Goals", "Wins", "Agents",
            "Brain Dump entries", "Daily logs", "Focus sessions",
            "Mood history", "Care log", "Work mode",
            "Display name", "Pet deaths",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 9, color: M.sage }}>✓</span>
              <span style={{ fontSize: 11, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>{item}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, color: M.muted, fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>
          Theme and UI preferences are not included in backups.
        </p>
      </Section>
    </div>
  );
}

/* ── Sub-components ── */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: `1px solid ${M.border}`,
      background: M.card,
      padding: "16px 18px",
    }}>
      <p style={{
        fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
        fontFamily: "'JetBrains Mono', monospace", color: M.muted, marginBottom: subtitle ? 2 : 12, fontWeight: 700,
      }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ fontSize: 11, color: M.muted, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

function ActionButton({
  icon, label, onClick, primary, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px",
        background: primary ? M.coral : "transparent",
        border: `1px solid ${primary ? M.coral : M.border}`,
        color: primary ? "white" : M.ink,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, letterSpacing: "0.08em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: primary ? `2px 2px 0 oklch(0.40 0.15 340)` : `1px 1px 0 ${M.border}`,
        transition: "opacity 0.15s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

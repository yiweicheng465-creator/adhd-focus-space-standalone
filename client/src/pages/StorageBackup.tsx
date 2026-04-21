/* ============================================================
   ADHD FOCUS SPACE — Storage & Backup Page
   - Default: browser localStorage
   - Optional: Google Drive manual backup/restore
   - Optional: Local file download/upload (no login needed)
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  exportAppData,
  importAppData,
  mergeAppData,
  downloadBackupFile,
  readBackupFile,
  getBackupSummary,
  pruneTombstones,
  type AppBackup,
} from "@/lib/appStorage";
import {
  getServerDriveToken,
  isGDriveConnected,
  uploadToDrive,
  downloadFromDrive,
  loadGapiScripts,
  connectGoogleDrive,
} from "@/lib/driveApi";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, CloudDownload, CloudUpload, Download, HardDrive, RefreshCw, Upload } from "lucide-react";

function getPersistedToken(): boolean {
  return isGDriveConnected();
}

async function getGoogleAccessToken(clientId: string): Promise<string> {
  if (getPersistedToken()) {
    try { return await getServerDriveToken(); } catch {}
  }
  await loadGapiScripts();
  return connectGoogleDrive(clientId);
}

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

/* ── Component ── */
export default function StorageBackup() {
  const { user } = useAuth();

  // All state declared first to avoid TDZ errors with useEffects below
  const [gdStatus, setGdStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [gdMessage, setGdMessage] = useState("");
  const [lastBackupInfo, setLastBackupInfo] = useState<string | null>(() => localStorage.getItem("adhd-last-backup-info"));
  const [lastBackupTs, setLastBackupTs] = useState<number | null>(() => {
    const ts = localStorage.getItem("adhd-last-backup");
    if (ts) return parseInt(ts, 10);
    const info = localStorage.getItem("adhd-last-backup-info");
    if (info) {
      const match = info.match(/(\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2}:\d{2}\s*[AP]M)/);
      if (match) {
        const parsed = new Date(match[1]).getTime();
        if (!isNaN(parsed)) { localStorage.setItem("adhd-last-backup", String(parsed)); return parsed; }
      }
      const fallback = Date.now();
      localStorage.setItem("adhd-last-backup", String(fallback));
      return fallback;
    }
    return null;
  });

  const [gdClientId, setGdClientId] = useState("");
  // Fetch Google Client ID from server on mount
  useEffect(() => { fetch("/api/config").then(r=>r.json()).then(d=>{ if(d.googleClientId) setGdClientId(d.googleClientId); }).catch(()=>{}); }, []);
  // ── Auto-backup UI refresh ────────────────────────────────────────────────
  // The actual backup logic lives in useAutoBackup() (called in Home.tsx),
  // which is always active on every page. Here we just listen for the
  // "adhd-backup-complete" event it dispatches and update the UI timestamp.
  useEffect(() => {
    const onBackupComplete = (e: Event) => {
      const { ts, info } = (e as CustomEvent<{ ts: number; info: string }>).detail;
      setLastBackupTs(ts);
      setLastBackupInfo(info);
    };
    window.addEventListener("adhd-backup-complete", onBackupComplete);
    return () => window.removeEventListener("adhd-backup-complete", onBackupComplete);
  }, []);


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


  /* ── Local backup ── */
  const handleLocalBackup = () => {
    try {
      pruneTombstones(90);
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
      const token = await getGoogleAccessToken(gdClientId.trim());
      setGdMessage("Uploading backup…");
      pruneTombstones(90);
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
        setGdMessage(msg || "Unknown error");
        toast.error("Google Drive backup failed.", { duration: 4000 });
      }
    } finally {
      // Safety net: always clear loading state
      setGdStatus((s) => s === "loading" ? "idle" : s);
    }
  };

  /* ── Google Drive restore (merge-restore) ── */
  // Instead of overwriting local data with the Drive file, we merge both sides
  // so that two browsers sharing the same Drive account never lose each other's work.
  const handleDriveRestore = async () => {
    if (!gdClientId.trim()) {
      setShowClientIdInput(true);
      toast.info("Enter your Google OAuth Client ID first.", { duration: 3000 });
      return;
    }
    setGdStatus("loading");
    setGdMessage("Connecting to Google…");
    try {
      const token = await getGoogleAccessToken(gdClientId.trim());
      setGdMessage("Downloading & merging backup from Drive…");
      const remoteBackup = await downloadFromDrive(token);
      const localBackup = exportAppData();
      const merged = mergeAppData(localBackup, remoteBackup);
      importAppData(merged);
      // Upload the merged result back to Drive so both browsers converge
      await uploadToDrive(token, merged);
      const info = getBackupSummary(merged);
      localStorage.setItem("adhd-last-backup-info", info);
      setLastBackupInfo(info);
      recordBackupTime();
      setGdStatus("success");
      setGdMessage(`Merged & restored · ${info}`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "CANCELLED") {
        setGdStatus("idle");
        setGdMessage("Restore cancelled.");
      } else {
        setGdStatus("error");
        setGdMessage(msg || "Unknown error");
        toast.error("Google Drive restore failed.", { duration: 5000 });
      }
    } finally {
      setGdStatus((s) => s === "loading" ? "idle" : s);
    }
  };

  return (
    <div data-tour-id="tour-storage" className="flex flex-col gap-6 max-w-xl mx-auto py-6 px-4">

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
        {getPersistedToken() && gdClientId ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: M.sage }}>
              <path d="M22 16.74V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3.26A2 2 0 0 1 3.26 15H20.74A2 2 0 0 1 22 16.74z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.36 15a6 6 0 0 1 11.28 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: M.sage, fontFamily: "'DM Sans', sans-serif" }}>
                Google Drive Backup Active
              </p>
              <p style={{ fontSize: 11, color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                Data is backed up to your Google Drive automatically every hour.
              </p>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}

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
      <Section title='Google Drive Backup' subtitle="">

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <ActionButton
            icon={gdStatus === "loading" ? <RefreshCw size={13} className="animate-spin" /> : <CloudUpload size={13} />}
            label="Backup to Google Drive"
            onClick={handleDriveBackup}
            disabled={gdStatus === "loading" || !gdClientId}
            primary
          />
          <ActionButton
            icon={gdStatus === "loading" ? <RefreshCw size={13} className="animate-spin" /> : <CloudDownload size={13} />}
            label="Restore from Google Drive"
            onClick={handleDriveRestore}
            disabled={gdStatus === "loading" || !gdClientId}
          />
        </div>

        {/* Status */}
        {gdMessage && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: gdStatus === "error" ? "oklch(0.97 0.025 355)" : "oklch(0.97 0.018 340)", border: `1px solid ${gdStatus === "error" ? "oklch(0.80 0.08 355)" : "oklch(0.82 0.08 340)"}`, display: "flex", alignItems: "center", gap: 8, borderRadius: 4 }}>
            {gdStatus === "success" && <CheckCircle2 size={12} style={{ color: M.sage, flexShrink: 0 }} />}
            {gdStatus === "error" && <AlertTriangle size={12} style={{ color: "oklch(0.55 0.18 355)", flexShrink: 0 }} />}
            <p style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: gdStatus === "error" ? "oklch(0.45 0.18 355)" : M.sage }}>{gdMessage}</p>
          </div>
        )}

        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Auto-backup notice — shown once user has a valid token */}
          {getPersistedToken() && gdClientId && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", flexWrap: "wrap" }}>
              <CheckCircle2 size={11} style={{ color: M.coral, flexShrink: 0 }} />
              <p style={{ fontSize: 10, color: M.coral, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                <strong>Google Drive connected</strong> — auto-backup 30s after changes.
              </p>
              <button
                onClick={async () => {
                  await fetch("/api/drive/disconnect", { method: "DELETE", credentials: "include" });
                  localStorage.removeItem("adhd-gdrive-connected");
                  cachedDriveToken = null;
                  toast.success("Google Drive disconnected.");
                  window.location.reload();
                }}
                style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", background: "none", border: "none", padding: 0, color: M.coral, cursor: "pointer", textDecoration: "underline", opacity: 0.7 }}
              >
                Disconnect
              </button>
            </div>
          )}
          <p style={{ fontSize: 10, color: M.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, margin: 0 }}>
            Access is only requested when you click Backup or Restore.
            File saved as <code style={{ fontFamily: "'DM Mono', monospace" }}>{BACKUP_FILENAME}</code> in your Drive root.
          </p>
        </div>
      </Section>

      {/* What's backed up */}
      <Section title="What Gets Backed Up">
        {[
          { label: "Core data", items: ["Tasks (due dates, goal links, tags)", "Goals (progress, archive)", "Wins", "Agents + prompts", "Brain Dump entries", "Daily logs", "Care log", "Focus sessions (daily list)", "Mood history"] },
          { label: "Routines", items: ["Daily routines (name, days, category)", "Today's routine completion state"] },
          { label: "AI & Coach", items: ["AI chat history", "Life Coach conversation", "Life Coach insights", "Life Dashboard (direction & goals)"] },
          { label: "Layout & order", items: ["Calendar day order", "Priority matrix (quadrant map + task order)", "Goal task order", "Deleted custom tags", "AI panel preference"] },
          { label: "Streaks & stats", items: ["Block streak data", "Open-day streak", "Total AI calls", "Daily check-in history"] },
          { label: "Sound & music", items: ["Sound effects on/off", "SFX volume", "Music on/off", "Music volume", "Music track"] },
          { label: "Appearance", items: ["Display name", "Theme hue", "Theme hue presets (6 slots)", "Film grain intensity/speed", "Work mode", "Custom quick chips", "Pixel pet deaths", "All-time focus session count"] },
        ].map(({ label, items }) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", letterSpacing: "0.10em", textTransform: "uppercase", color: M.coral, marginBottom: 4 }}>{label}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
              {items.map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 9, color: M.sage }}>✓</span>
                  <span style={{ fontSize: 11, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p style={{ fontSize: 10, color: M.muted, fontFamily: "'DM Sans', sans-serif", marginTop: 6, borderTop: `1px solid ${M.border}`, paddingTop: 8 }}>
          Not backed up: today's focus session count (resets daily), backup timestamps.
        </p>
      </Section>
    </div>
  );
}

/* ── Sub-components ── */
function Section({ title, subtitle, badge, children }: { title: string; subtitle?: string; badge?: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${M.border}`, background: M.card, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: subtitle ? 2 : 12 }}>
        <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: M.muted, fontWeight: 700, margin: 0 }}>
          {title}
        </p>
        {badge && (
          <span style={{ fontSize: 8, fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em", padding: "1px 5px", borderRadius: 3, background: "oklch(0.58 0.18 340 / 0.12)", color: M.coral, border: "1px solid oklch(0.58 0.18 340 / 0.30)", fontWeight: 700 }}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p style={{ fontSize: 11, color: M.muted, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>{subtitle}</p>}
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
        background: primary ? M.coral : "white",
        border: primary ? `1px solid ${M.coral}` : `1px solid oklch(0.82 0.06 340)`,
        color: primary ? "white" : M.ink,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, letterSpacing: "0.08em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: primary ? `2px 2px 0 oklch(0.40 0.15 340)` : `2px 2px 0 oklch(0.88 0.04 340)`,
        fontWeight: primary ? 700 : 400,
        transition: "opacity 0.15s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

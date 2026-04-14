import React from 'react';
/* ============================================================
   ADHD FOCUS SPACE — Guide Page
   Comprehensive feature reference + AI feature documentation
   Accessible via the tiny ? button at the bottom of the sidebar
   ============================================================ */

import { useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { toast } from "sonner";

const M = {
  bg:       "oklch(0.975 0.012 355)",
  card:     "oklch(0.970 0.018 355)",
  border:   "oklch(0.82 0.050 340)",
  ink:      "oklch(0.22 0.040 320)",
  muted:    "oklch(0.52 0.040 330)",
  accent:   "oklch(0.58 0.18 340)",
  accentBg: "oklch(0.58 0.18 340 / 0.08)",
  accentBdr:"oklch(0.58 0.18 340 / 0.22)",
  sage:     "oklch(0.52 0.07 145)",
  sageBg:   "oklch(0.52 0.07 145 / 0.08)",
  sageBdr:  "oklch(0.52 0.07 145 / 0.25)",
  coral:    "oklch(0.55 0.09 35)",
  coralBg:  "oklch(0.55 0.09 35 / 0.08)",
  coralBdr: "oklch(0.55 0.09 35 / 0.25)",
  gold:     "oklch(0.65 0.10 75)",
  goldBg:   "oklch(0.65 0.10 75 / 0.08)",
  goldBdr:  "oklch(0.65 0.10 75 / 0.25)",
};

/* ── Section accordion ── */
function Section({
  title,
  badge,
  badgeColor,
  badgeBg,
  badgeBdr,
  children,
  defaultOpen = false,
}: {
  title: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  badgeBdr: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        border: `1px solid ${M.border}`,
        borderRadius: 4,
        overflow: "hidden",
        background: M.card,
        boxShadow: "2px 2px 0 oklch(0.82 0.040 340 / 0.5)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors"
        style={{
          background: open ? M.accentBg : "transparent",
          borderBottom: open ? `1px solid ${M.accentBdr}` : "none",
          cursor: "pointer",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            style={{
              fontSize: "0.55rem",
              fontFamily: "'Space Mono', monospace",
              letterSpacing: "0.10em",
              color: badgeColor,
              background: badgeBg,
              border: `1px solid ${badgeBdr}`,
              padding: "1px 6px",
              borderRadius: 2,
            }}
          >
            {badge}
          </span>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.70rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: M.ink,
            }}
          >
            {title}
          </span>
        </div>
        <span style={{ fontSize: "0.65rem", color: M.muted, fontFamily: "'Space Mono', monospace" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 py-4 flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Feature row ── */
function Row({ label, desc, where }: { label: string; desc: string; where?: string }) {
  return (
    <div
      style={{
        borderLeft: `2px solid ${M.border}`,
        paddingLeft: 12,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", fontWeight: 700, color: M.ink, letterSpacing: "0.04em" }}>
        {label}
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: M.muted, lineHeight: 1.6 }}>
        {desc}
      </p>
      {where && (
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.52rem", color: M.accent, letterSpacing: "0.04em", marginTop: 2 }}>
          → {where}
        </p>
      )}
    </div>
  );
}

/* ── Tip box ── */
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: M.goldBg,
        border: `1px solid ${M.goldBdr}`,
        padding: "8px 12px",
        borderRadius: 3,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.75rem",
        color: M.gold,
        lineHeight: 1.6,
      }}
    >
      💡 {children}
    </div>
  );
}

/* ── Bug / Feature Request modal ── */
function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<"bug" | "feature">("bug");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [sending, setSending] = React.useState(false);

  const handleSend = async () => {
    if (!title.trim()) { toast.error("Please enter a title."); return; }
    setSending(true);
    try {
      const subject = encodeURIComponent(`[ADHD Focus Space] ${type === "bug" ? "Bug Report" : "Feature Request"}: ${title.trim()}`);
      const bodyText = encodeURIComponent(
        `Type: ${type === "bug" ? "Bug Report" : "Feature Request"}\n\nTitle: ${title.trim()}\n\nDetails:\n${body.trim() || "(none provided)"}\n\n---\nSent from ADHD Focus Space feedback form`
      );
      window.open(`mailto:yiweicheng465@gmail.com?subject=${subject}&body=${bodyText}`, "_blank");
      toast.success("Opening your email client — thanks for the feedback!");
      setTitle("");
      setBody("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "oklch(0.20 0.04 320 / 0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: M.card,
          border: `1.5px solid ${M.border}`,
          borderRadius: 4,
          boxShadow: "4px 4px 0 oklch(0.82 0.040 340 / 0.5)",
          width: "min(480px, 92vw)",
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", color: M.ink }}>SEND FEEDBACK</span>
          <button onClick={onClose} style={{ fontSize: "0.75rem", color: M.muted, background: "transparent", border: "none", cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        {/* Type toggle */}
        <div className="flex gap-2">
          {(["bug", "feature"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                flex: 1,
                padding: "6px 0",
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: type === t ? 700 : 400,
                background: type === t ? M.accentBg : "transparent",
                border: `1px solid ${type === t ? M.accentBdr : M.border}`,
                color: type === t ? M.accent : M.muted,
                cursor: "pointer",
                borderRadius: 2,
              }}
            >
              {t === "bug" ? "Bug Report" : "Feature Request"}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.10em", color: M.muted }}>TITLE</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "bug" ? "e.g. Timer doesn't pause music" : "e.g. Add dark mode toggle"}
            autoFocus
            style={{
              background: "transparent",
              border: `1px solid ${M.border}`,
              padding: "8px 10px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.82rem",
              color: M.ink,
              outline: "none",
              borderRadius: 2,
            }}
          />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.10em", color: M.muted }}>DETAILS <span style={{ opacity: 0.5 }}>(optional)</span></label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={type === "bug" ? "Steps to reproduce, what you expected vs what happened…" : "Describe the feature and why it would help…"}
            rows={4}
            style={{
              background: "transparent",
              border: `1px solid ${M.border}`,
              padding: "8px 10px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.80rem",
              color: M.ink,
              outline: "none",
              resize: "vertical",
              borderRadius: 2,
              lineHeight: 1.55,
            }}
          />
        </div>

        {/* Send */}
        <div className="flex items-center justify-between">
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.52rem", color: M.muted, opacity: 0.7 }}>Opens your email client with the report pre-filled</p>
          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              background: M.accent,
              color: "white",
              border: "none",
              padding: "8px 20px",
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.60rem",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              fontWeight: 700,
              cursor: sending ? "default" : "pointer",
              opacity: sending ? 0.6 : 1,
              borderRadius: 2,
            }}
          >
            {sending ? "Sending…" : "Send →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Guide() {
  const [, navigate] = useLocation();
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSectionChange = (section: string) => {
    // Navigate to home first, then dispatch the section event after a tick
    // so Home.tsx's navigateTo listener is mounted and ready
    navigate("/");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("navigateTo", { detail: section }));
    }, 80);
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ background: M.bg, fontFamily: "'DM Sans', sans-serif" }}
    >
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      <Sidebar activeSection="" onSectionChange={handleSectionChange} />

      <main className="flex-1 ml-14 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">

          {/* Header */}
          <div>
            <h1
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "1.1rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: M.ink,
                marginBottom: 6,
              }}
            >
              APP GUIDE
            </h1>
            <p style={{ fontSize: "0.82rem", color: M.muted, lineHeight: 1.65, maxWidth: 480 }}>
              Everything in this workspace, explained. Use the sections below to explore each feature and learn how the AI tools work.
            </p>
          </div>

          {/* ── KEYBOARD SHORTCUTS ── */}
          <div
            style={{
              background: M.card,
              border: `1px solid ${M.border}`,
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: "2px 2px 0 oklch(0.82 0.040 340 / 0.5)",
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                borderBottom: `1px solid ${M.border}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: "0.55rem",
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: "0.10em",
                  color: M.gold,
                  background: M.goldBg,
                  border: `1px solid ${M.goldBdr}`,
                  padding: "1px 6px",
                  borderRadius: 2,
                }}
              >
                SHORTCUTS
              </span>
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "0.70rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: M.ink,
                }}
              >
                KEYBOARD SHORTCUTS
              </span>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.10em", color: M.muted, textAlign: "left", paddingBottom: 8, fontWeight: 600, textTransform: "uppercase", borderBottom: `1px solid ${M.border}` }}>Key</th>
                    <th style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.10em", color: M.muted, textAlign: "left", paddingBottom: 8, fontWeight: 600, textTransform: "uppercase", borderBottom: `1px solid ${M.border}` }}>Action</th>
                    <th style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.10em", color: M.muted, textAlign: "left", paddingBottom: 8, fontWeight: 600, textTransform: "uppercase", borderBottom: `1px solid ${M.border}` }}>Where</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "D",       action: "Focus the \"What's on your mind?\" input", where: "Dashboard" },
                    { key: "/",       action: "Focus the AI chat input",                  where: "Dashboard" },
                    { key: "+",       action: "Open Quick Capture modal",                 where: "Anywhere" },
                    { key: "Space",   action: "Start or pause the Focus Timer",           where: "Focus page" },
                    { key: "↵ Enter", action: "Submit Quick Capture / Brain Dump",        where: "Modal / Dump" },
                    { key: "Esc",     action: "Close Quick Capture or SET panel",         where: "Anywhere" },
                  ].map(({ key, action, where }, i, arr) => (
                    <tr key={key} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${M.border}` : "none" }}>
                      <td style={{ padding: "7px 0" }}>
                        <kbd style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: M.coral,
                          background: M.coralBg,
                          border: `1px solid ${M.coralBdr}`,
                          borderRadius: 3,
                          padding: "2px 7px",
                          display: "inline-block",
                          whiteSpace: "nowrap",
                        }}>
                          {key}
                        </kbd>
                      </td>
                      <td style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: M.ink, padding: "7px 12px 7px 8px", lineHeight: 1.5 }}>{action}</td>
                      <td style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", color: M.muted, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{where}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.70rem", color: M.muted, marginTop: 10, lineHeight: 1.5 }}>
                Shortcuts are disabled when you are typing in an input or textarea.
              </p>
            </div>
          </div>

          {/* ── CORE FEATURES ── */}

          <Section
            title="DAILY CHECK-IN CARD"
            badge="OPENING"
            badgeColor={M.coral}
            badgeBg={M.coralBg}
            badgeBdr={M.coralBdr}
            defaultOpen
          >
            <Row
              label="What it is"
              desc="Every day when you first open the app, a step-by-step card appears. It lets you set up your whole day in one place — mood, goals, tasks, AI agents, and wins — without jumping between pages. Designed for ADHD: one focused flow instead of scattered navigation."
            />
            <Row
              label="Steps in order"
              desc="Greeting → Mood check (1–5) → Goals (add today's goals) → Tasks (add tasks, link to goals) → Agents (launch AI agents for tasks) → Wins (log anything you already did) → Done."
            />
            <Row
              label="Skipping"
              desc="Hit 'skip for today' at any step and the card won't appear again until tomorrow. You can also press Esc to dismiss it temporarily — it will reappear next time you reload until you complete or skip it."
            />
            <Row
              label="Why it helps"
              desc="ADHD brains struggle with task-switching and getting started. The check-in removes the 'where do I even begin?' friction by walking you through a short ritual before the day starts. Even if you only fill in mood + one task, that's enough."
            />
          </Section>

          <Section
            title="DASHBOARD"
            badge="HOME"
            badgeColor={M.coral}
            badgeBg={M.coralBg}
            badgeBdr={M.coralBdr}
            defaultOpen
          >
            <Row
              label="Hero bar"
              desc="Shows your name, current date, mood score from today's check-in, and a quick-capture input. Type any thought and press Enter — it goes straight to Brain Dump and creates a task."
            />
            <Row
              label="Focus Timer panel"
              desc="A compact Pomodoro timer with a virtual pet (CYBER_PET.EXE). The pet grows as you complete focus sessions. Care log shows the last few actions."
              where="Dashboard → left column"
            />
            <Row
              label="Next Up panel"
              desc="Your tasks sorted by priority (urgent → focus → normal → someday). Check the box to complete a task — it auto-logs a Win and triggers confetti."
              where="Dashboard → middle column"
            />
            <Row
              label="AI Command Center"
              desc="Chat with your AI assistant to manage your whole workspace in natural language. You can create tasks, set goals, launch agents, log wins, and ask for prioritisation advice — all without leaving the dashboard."
              where="Dashboard → right column"
            />
            <Tip>Press / anywhere on the dashboard to jump straight to the AI chat input.</Tip>
          </Section>

          <Section
            title="FOCUS TIMER"
            badge="FOCUS"
            badgeColor={M.accent}
            badgeBg={M.accentBg}
            badgeBdr={M.accentBdr}
          >
            <Row
              label="Pomodoro blocks"
              desc="25-minute focus blocks followed by 5-minute short breaks. After 4 blocks, a 15-minute long break is suggested. Each completed block is recorded in your Monthly calendar."
            />
            <Row
              label="CYBER_PET.EXE"
              desc="A virtual pet that grows based on your cumulative focus sessions. Feed it by completing focus blocks. The care log shows a rolling history of your pet interactions."
            />
            <Row
              label="Keyboard shortcut"
              desc="Press Space bar anywhere on the Focus page to start or pause the timer without clicking."
            />
            <Row
              label="Session tracking"
              desc="Each completed session is saved to your Monthly calendar. You can see your focus history per day in the Monthly page's day detail panel."
            />
            <Row
              label="Focus music"
              desc="The Focus page has a built-in ambient music player. Choose from lo-fi beats, rain sounds, white noise, or cafe ambience. Press the play button in the music player to start. Music runs independently of the timer."
            />
            <Row
              label="Music + timer sync"
              desc="When you pause the Pomodoro timer, the music pauses automatically. When you resume the timer, the music resumes from where it left off. Navigating to another page (Tasks, Wins, etc.) does not stop the music — it keeps playing in the background."
            />
            <Row
              label="Volume and track controls"
              desc="Use the volume slider in the music player to adjust loudness. Click the track name or arrow buttons to switch between ambient tracks. Your last-used track and volume are remembered across sessions."
            />
            <Tip>Start a focus session, pick a lo-fi track, then navigate freely between pages — the music stays on until you manually stop it or close the tab.</Tip>
          </Section>

          <Section
            title="MY TASKS"
            badge="TASKS"
            badgeColor={M.sage}
            badgeBg={M.sageBg}
            badgeBdr={M.sageBdr}
          >
            <Row
              label="Priority levels"
              desc="Three levels: Urgent (coral), Focus (purple), Normal (pink). Tasks are colour-coded by priority and sorted accordingly on the Dashboard."
            />
            <Row
              label="Priority Matrix (Eisenhower)"
              desc="Scroll down on the Tasks page to see the 4-quadrant Eisenhower Matrix. Drag any task between quadrants to instantly update its priority — Q1 Do Now sets Urgent, Q2 Schedule sets Focus, Q3 Delegate and Q4 Eliminate set Normal. The matrix shows only active (not completed) tasks."
              where="Tasks page → scroll down → Priority Matrix"
            />
            <Row
              label="Context tags"
              desc="Tag tasks with any category using #hashtag syntax (e.g. #yoga, #reading). Custom tags appear as filter tabs at the top. Built-in tags: Work, Personal."
            />
            <Row
              label="Goal linking"
              desc="Link a task to a weekly goal. When you complete the task, the linked goal's progress bar auto-advances."
            />
            <Row
              label="Quick capture"
              desc="Press + anywhere in the app to open the quick-capture popup. Type one sentence — no formatting needed."
            />
            <Tip>Drag a task from Q4 (Eliminate) to Q1 (Do Now) to instantly mark it Urgent — no need to edit the task manually.</Tip>
          </Section>

          <Section
            title="DAILY WINS"
            badge="WINS"
            badgeColor={M.gold}
            badgeBg={M.goldBg}
            badgeBdr={M.goldBdr}
          >
            <Row
              label="Logging wins"
              desc="Add any positive moment — big or small. Wins are categorised with icons (work, personal, health, learning, social, creative, focus). Completing a task auto-logs a win."
            />
            <Row
              label="Daily Wrap-Up"
              desc="At the end of your day, open the Wrap-Up panel to review your wins, tasks, and mood. AI can generate a warm personal summary of your day."
              where="Sidebar → bottom area → Wrap-Up button (appears in the evening)"
            />
          </Section>

          <Section
            title="BRAIN DUMP"
            badge="DUMP"
            badgeColor={M.muted}
            badgeBg="oklch(0.52 0.040 330 / 0.08)"
            badgeBdr="oklch(0.52 0.040 330 / 0.22)"
          >
            <Row
              label="Free-form capture"
              desc="Type anything — worries, ideas, tasks, random thoughts. No formatting required. Each entry is timestamped and tagged automatically."
            />
            <Row
              label="AI Sort"
              desc="Click '✦ AI Sort' to have AI categorise all your entries into tasks, goals, worries, ideas, and reminders. You can then promote entries directly to your task list or goals."
              where="Brain Dump page → '✦ AI Sort' button"
            />
            <Row
              label="→ Task / → Agent"
              desc="Each entry has quick-action buttons to promote it to a task or create an AI agent brief from it."
            />
          </Section>

          <Section
            title="WEEKLY GOALS"
            badge="GOALS"
            badgeColor={M.coral}
            badgeBg={M.coralBg}
            badgeBdr={M.coralBdr}
          >
            <Row
              label="Goal tracking"
              desc="Set weekly goals with a progress bar (0–100%). Link tasks to goals — completing linked tasks auto-advances the progress bar."
            />
            <Row
              label="Context filter"
              desc="Goals are tagged Work or Personal. Filter by context to focus on one area at a time."
            />
          </Section>

          <Section
            title="AI AGENTS"
            badge="AGENTS"
            badgeColor={M.accent}
            badgeBg={M.accentBg}
            badgeBdr={M.accentBdr}
          >
            <Row
              label="What is an agent?"
              desc="An agent is a focused AI task — a name, a brief, and a status (active / done). Think of it as a mini project you hand off to an AI assistant."
            />
            <Row
              label="Agent Brief Generator"
              desc="Turn any task into a ready-to-paste AI agent prompt. AI generates a focused agent name and a detailed brief you can drop directly into any AI assistant (ChatGPT, Claude, etc.)."
              where="Agents page → any task card → 'Create Agent' button"
            />
            <Row
              label="Status tracking"
              desc="Mark agents as Active or Done. Done agents are archived but visible in the history view."
            />
          </Section>

          <Section
            title="MONTHLY CALENDAR"
            badge="MTH"
            badgeColor={M.sage}
            badgeBg={M.sageBg}
            badgeBdr={M.sageBdr}
          >
            <Row
              label="Day overview"
              desc="Click any day to see a detail panel: mood score, focus sessions, tasks completed, wins logged, and brain dump entries for that day."
            />
            <Row
              label="Monthly AI Review"
              desc="AI reads your full month's data and writes a personalised review: what went well, one pattern it noticed, and one thing to try next month."
              where="Monthly page → '✦ Generate AI Review' button"
            />
            <Row
              label="Focus Tracker"
              desc="Each completed focus session is recorded here. The day detail panel shows each session's number, duration, and time."
            />
          </Section>

          <Section
            title="STORAGE & BACKUP"
            badge="STORE"
            badgeColor={M.muted}
            badgeBg="oklch(0.52 0.040 330 / 0.08)"
            badgeBdr="oklch(0.52 0.040 330 / 0.22)"
          >
            <Row
              label="Local file backup"
              desc="Download a full JSON backup of all your data to your device. No login required. The file is named adhd-focus-backup-YYYY-MM-DD.json."
            />
            <Row
              label="Google Drive backup"
              desc="Manually save or restore your data to/from Google Drive. Requires a Google OAuth Client ID (one-time setup). The backup file is named adhd-focus-backup.json in your Drive root."
            />
            <Row
              label="Restore from file"
              desc="Upload a previously downloaded JSON backup to restore all your data. This overwrites your current data — use with care."
            />
            <Tip>Back up at least once a week. The app reminds you after 7 days without a backup.</Tip>
          </Section>

          {/* ── AI FEATURES ── */}

          <div
            style={{
              borderTop: `2px solid ${M.accentBdr}`,
              paddingTop: 20,
              marginTop: 4,
            }}
          >
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.60rem",
                letterSpacing: "0.12em",
                color: M.accent,
                marginBottom: 12,
              }}
            >
              ✦ AI FEATURES
            </p>

            <Section
              title="AI COMMAND CENTER"
              badge="DASHBOARD"
              badgeColor={M.accent}
              badgeBg={M.accentBg}
              badgeBdr={M.accentBdr}
              defaultOpen
            >
              <Row
                label="What it does"
                desc="A persistent chat panel on the Dashboard. Your AI assistant understands your full workspace context — tasks, goals, agents, wins — and can take actions on your behalf."
                where="Dashboard → right column"
              />
              <Row
                label="Commands you can use"
                desc={[
                  "Create a task: 'Add task: reply to Alice's email, urgent'",
                  "Set a goal: 'Add goal: finish the report by Friday'",
                  "Log a win: 'Log win: I finished the presentation'",
                  "Launch an agent: 'Create agent for writing the blog post'",
                  "Prioritise: 'What should I focus on today?'",
                  "Complete a task: 'Mark the email task as done'",
                ].join(" · ")}
              />
              <Row
                label="Chat history"
                desc="The last 10 messages are saved to your database so the conversation persists across page reloads."
              />
              <Tip>Press / on the Dashboard to focus the chat input instantly.</Tip>
            </Section>

            <div className="mt-3">
              <Section
                title="BRAIN DUMP AI SORT"
                badge="BRAIN DUMP"
                badgeColor={M.muted}
                badgeBg="oklch(0.52 0.040 330 / 0.08)"
                badgeBdr="oklch(0.52 0.040 330 / 0.22)"
              >
                <Row
                  label="What it does"
                  desc="Reads all your Brain Dump entries and categorises each one as a task, goal, worry, idea, or reminder. Suggests which ones to promote to your task list or goals."
                  where="Brain Dump page → '✦ AI Sort' button"
                />
                <Row
                  label="How to use it"
                  desc="Dump anything into the Brain Dump page, then click '✦ AI Sort'. Review the suggestions and click '→ Task' or '→ Goal' on the ones you want to act on."
                />
              </Section>
            </div>

            <div className="mt-3">
              <Section
                title="MIT — MOST IMPORTANT THING"
                badge="CHECK-IN"
                badgeColor={M.gold}
                badgeBg={M.goldBg}
                badgeBdr={M.goldBdr}
              >
                <Row
                  label="What it does"
                  desc="Every morning during your Daily Check-In, AI looks at your tasks, goals, and mood score to pick the single most important thing to focus on today. Reduces decision paralysis."
                  where="Daily Check-In → final step (auto-generates)"
                />
                <Row
                  label="Why it helps"
                  desc="ADHD brains struggle with prioritisation under pressure. Having one clear focus for the day — chosen by AI from your own data — removes the anxiety of choosing."
                />
              </Section>
            </div>

            <div className="mt-3">
              <Section
                title="DAILY SUMMARY"
                badge="WRAP-UP"
                badgeColor={M.sage}
                badgeBg={M.sageBg}
                badgeBdr={M.sageBdr}
              >
                <Row
                  label="What it does"
                  desc="At the end of your day, AI reads your wins, completed tasks, focus sessions, and mood score to write a warm, personal summary — not a generic template."
                  where="Daily Wrap-Up panel → '✦ Generate AI summary' button"
                />
                <Row
                  label="What it includes"
                  desc="A personalised opening based on your mood, a summary of what you accomplished, focus time logged, and an encouraging closing note."
                />
              </Section>
            </div>

            <div className="mt-3">
              <Section
                title="MONTHLY AI REVIEW"
                badge="MONTHLY"
                badgeColor={M.coral}
                badgeBg={M.coralBg}
                badgeBdr={M.coralBdr}
              >
                <Row
                  label="What it does"
                  desc="AI reads your full month's data — every day's mood, wins, tasks, and focus sessions — and writes a personalised monthly review."
                  where="Monthly page → '✦ Generate AI Review' button"
                />
                <Row
                  label="What it includes"
                  desc="What went well this month, one pattern it noticed in your behaviour or mood, and one concrete thing to try next month."
                />
              </Section>
            </div>

            <div className="mt-3">
              <Section
                title="AGENT BRIEF GENERATOR"
                badge="AGENTS"
                badgeColor={M.accent}
                badgeBg={M.accentBg}
                badgeBdr={M.accentBdr}
              >
                <Row
                  label="What it does"
                  desc="Turn any task into a ready-to-paste AI agent prompt. AI generates a focused agent name and a detailed brief you can drop directly into ChatGPT, Claude, or any other AI assistant."
                  where="Agents page → any task card → 'Create Agent' button"
                />
                <Row
                  label="How to use it"
                  desc="Go to the Agents page, find a task you want to delegate to AI, click 'Create Agent', and copy the generated brief. Paste it into your preferred AI assistant to get started immediately."
                />
              </Section>
            </div>
          </div>

          {/* ── AI SETUP ── */}
          <div
            style={{
              background: M.accentBg,
              border: `1px solid ${M.accentBdr}`,
              borderRadius: 4,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.60rem", letterSpacing: "0.10em", color: M.accent, fontWeight: 700 }}>
              ✦ AI SETUP
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.80rem", color: M.ink, lineHeight: 1.65 }}>
              All AI features use the <strong>built-in AI credits</strong> by default — no setup needed. If the built-in credits run out, you can add your own <strong>OpenAI API key</strong> as a fallback.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: M.muted, lineHeight: 1.65 }}>
              To add your OpenAI key: open the <strong>SET panel</strong> (gear icon at the bottom of the sidebar) → API KEY tab → paste your key → SAVE. Your OpenAI account must have a paid plan or credits — free-tier keys won't work.
            </p>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.52rem", color: M.accent, letterSpacing: "0.04em" }}>
              → platform.openai.com/api-keys to create a key
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 mb-10 flex items-center justify-between gap-4">
            <button
              onClick={() => navigate("/")}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.62rem",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: M.muted,
                background: "transparent",
                border: `1px solid ${M.border}`,
                padding: "7px 18px",
                cursor: "pointer",
                borderRadius: 3,
              }}
            >
              ← back to workspace
            </button>
            <button
              onClick={() => setShowFeedback(true)}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.62rem",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: M.accent,
                background: M.accentBg,
                border: `1px solid ${M.accentBdr}`,
                padding: "7px 18px",
                cursor: "pointer",
                borderRadius: 3,
              }}
            >
              report a bug / request a feature
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

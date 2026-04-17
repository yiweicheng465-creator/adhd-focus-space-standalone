/* ============================================================
   ADHD FOCUS SPACE — Home Page v3.0
   Design: Warm Editorial Minimalism + LocalStorage Persistence
   - All state persisted to localStorage
   - Focus page simplified with atmospheric sunset background
   - Less text, more geometric shapes
   ============================================================ */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar, TimerPill } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { FocusTimer } from "@/components/FocusTimer";
import { TaskManager, type Task } from "@/components/TaskManager";
import { DailyWins, type Win } from "@/components/DailyWins";
import { BrainDump } from "@/components/BrainDump";
import { Goals, type Goal } from "@/components/Goals";
import { AgentTracker, type Agent } from "@/components/AgentTracker";
import { RetroPageWrapper } from "@/components/RetroPageWrapper";
import { GlobalQuickAdd } from "@/components/GlobalQuickAdd";
import { GlobalRightPanel } from "@/components/GlobalRightPanel";
import { ConfettiCelebration } from "@/components/ConfettiCelebration";
import { DailyWrapUp } from "@/components/DailyWrapUp";
import { recordWrapUp, recordDumpEntry, recordFocusSession, recordBlockComplete, recordMood } from "@/components/MonthlyProgress";
import { DailyCheckIn, useDailyCheckIn, type CheckInResult } from "@/components/DailyCheckIn";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useBlockStreak } from "@/hooks/useBlockStreak";
import { useTimer } from "@/contexts/TimerContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { LoginScreen } from "@/components/LoginScreen";
import { nanoid } from "nanoid";
import {
  DashboardDecor,
  FocusDecor,
  TasksDecor,
  WinsDecor,
  BrainDumpDecor,
  GoalsDecor,
  AgentsDecor,
} from "@/components/PageDecor";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Bot, Brain, Clock, LayoutDashboard, Moon, Sparkles, Star } from "lucide-react";
import { PixelDump } from "@/components/PixelIcons";
import { NamePrompt } from "@/components/NamePrompt";
import StorageBackup from "@/pages/StorageBackup";


/* ── Compact mood pill SVG faces (same as MoodCheckIn) ── */
/* ── Korean aesthetic blob mood faces ── */
function PillFaceDrained({ active }: { active: boolean }) {
  const bg = active ? "#8BBDD9" : "#B5D4E8";
  return (
    <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%">
      <path d="M40 14C52 12 66 18 70 30C74 42 70 60 58 68C46 76 26 76 16 64C6 52 8 30 18 20C24 14 32 16 40 14Z" fill={bg}/>
      <ellipse cx="30" cy="38" rx="4" ry="5" fill="#2A5A7A" opacity="0.7"/>
      <ellipse cx="50" cy="38" rx="4" ry="5" fill="#2A5A7A" opacity="0.7"/>
      <ellipse cx="31" cy="36" rx="1.5" ry="2" fill="white" opacity="0.6"/>
      <ellipse cx="51" cy="36" rx="1.5" ry="2" fill="white" opacity="0.6"/>
      <path d="M33 52 Q40 48 47 52" stroke="#2A5A7A" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M53 43 Q56 48 54 52" stroke="#7AADD4" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8"/>
      <ellipse cx="54.5" cy="53" rx="2" ry="3" fill="#A8D4F0" opacity="0.7"/>
    </svg>
  );
}
function PillFaceLow({ active }: { active: boolean }) {
  const bg = active ? "#B5A8D0" : "#CFC4E4";
  return (
    <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%">
      <path d="M38 13C50 10 66 17 70 30C74 43 68 62 56 69C44 76 24 75 14 63C4 51 6 28 18 19C24 14 30 16 38 13Z" fill={bg}/>
      <path d="M26 32 Q29 28 33 30" stroke="#4A3A7A" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M47 30 Q51 28 54 32" stroke="#4A3A7A" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <ellipse cx="30" cy="38" rx="3.5" ry="4" fill="#4A3A7A" opacity="0.65"/>
      <ellipse cx="50" cy="38" rx="3.5" ry="4" fill="#4A3A7A" opacity="0.65"/>
      <ellipse cx="31" cy="36.5" rx="1.2" ry="1.5" fill="white" opacity="0.55"/>
      <ellipse cx="51" cy="36.5" rx="1.2" ry="1.5" fill="white" opacity="0.55"/>
      <path d="M31 52 Q40 48 49 52" stroke="#4A3A7A" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
function PillFaceOkay({ active }: { active: boolean }) {
  const bg = active ? "#C4B8CC" : "#D8CEDC";
  return (
    <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%">
      <path d="M40 13C53 11 67 19 70 32C73 45 67 63 54 70C41 77 22 75 13 62C4 49 8 28 20 19C27 14 33 15 40 13Z" fill={bg}/>
      <ellipse cx="30" cy="37" rx="3.5" ry="4" fill="#4A3A5A" opacity="0.65"/>
      <ellipse cx="50" cy="37" rx="3.5" ry="4" fill="#4A3A5A" opacity="0.65"/>
      <ellipse cx="31" cy="35.5" rx="1.2" ry="1.5" fill="white" opacity="0.55"/>
      <ellipse cx="51" cy="35.5" rx="1.2" ry="1.5" fill="white" opacity="0.55"/>
      <line x1="32" y1="51" x2="48" y2="51" stroke="#4A3A5A" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="23" cy="46" rx="5" ry="3.5" fill="#E8B0C8" opacity="0.3"/>
      <ellipse cx="57" cy="46" rx="5" ry="3.5" fill="#E8B0C8" opacity="0.3"/>
    </svg>
  );
}
function PillFaceGood({ active }: { active: boolean }) {
  // 기쁨 style: big round dot eyes, wide open smile
  const bg = active ? "#F0A8C0" : "#F8C4D4";
  return (
    <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%">
      <path d="M40 12C54 10 68 19 71 33C74 47 67 65 53 71C39 77 20 74 11 61C2 48 6 26 19 18C26 13 33 14 40 12Z" fill={bg}/>
      <circle cx="29" cy="36" r="5" fill="#7A2050"/>
      <circle cx="51" cy="36" r="5" fill="#7A2050"/>
      <circle cx="30.5" cy="34.5" r="2" fill="white"/>
      <circle cx="52.5" cy="34.5" r="2" fill="white"/>
      <path d="M27 50 Q40 62 53 50" stroke="#7A2050" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M27 50 Q40 60 53 50 Q40 53 27 50Z" fill="#7A2050" opacity="0.1"/>
      <ellipse cx="21" cy="47" rx="6" ry="4" fill="#F07090" opacity="0.35"/>
      <ellipse cx="59" cy="47" rx="6" ry="4" fill="#F07090" opacity="0.35"/>
    </svg>
  );
}

function PillFaceGlowing({ active }: { active: boolean }) {
  // 상쾌 style: crescent squinting happy eyes, gentle smile
  const bg = active ? "#F4A0B0" : "#FAC0CC";
  return (
    <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%">
      <path d="M40 11C55 9 70 20 72 35C74 50 66 67 51 73C36 79 17 74 9 59C1 44 6 22 20 15C27 11 33 13 40 11Z" fill={bg}/>
      <path d="M24 38 Q29 31 34 38" stroke="#7A1840" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
      <path d="M46 38 Q51 31 56 38" stroke="#7A1840" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
      <path d="M28 51 Q40 60 52 51" stroke="#7A1840" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <ellipse cx="22" cy="48" rx="6" ry="4" fill="#F07090" opacity="0.3"/>
      <ellipse cx="58" cy="48" rx="6" ry="4" fill="#F07090" opacity="0.3"/>
    </svg>
  );
}

const PILL_FACES = [PillFaceDrained, PillFaceLow, PillFaceOkay, PillFaceGood, PillFaceGlowing];
const MOOD_DATA = [
  { value: 1, label: "Drained", color: "oklch(0.52 0.08 240)", label_kr: "피곤해" },
  { value: 2, label: "Low",     color: "oklch(0.52 0.08 290)", label_kr: "별로야" },
  { value: 3, label: "Okay",    color: "oklch(0.50 0.05 320)", label_kr: "괜찮아" },
  { value: 4, label: "Good",    color: "oklch(0.55 0.14 350)", label_kr: "좋아!" },
  { value: 5, label: "Glowing", color: "oklch(0.58 0.18 355)", label_kr: "최고!" },
];

function MoodPill({ mood, onMoodChange }: { mood: number | null; onMoodChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = MOOD_DATA.find((m) => m.value === mood);
  const CurrentFace = mood ? PILL_FACES[mood - 1] : null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o: boolean) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1 transition-all"
        style={{
          border: "1px solid oklch(0.87 0.025 340)",
          background: open ? "oklch(0.965 0.015 355)" : "transparent",
          borderRadius: 20,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.72rem",
          color: current ? current.color : "oklch(0.52 0.040 330)",
        }}
        title="How are you feeling?"
      >
        <span style={{ width: 18, height: 18, display: "inline-flex", flexShrink: 0 }}>
          {CurrentFace ? <CurrentFace active={true} /> : (
            <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%"><circle cx="40" cy="40" r="32" fill="#F0B8D8" /><path d="M24 36 Q28 31 32 36" stroke="#9A3880" strokeWidth="2.5" strokeLinecap="round" fill="none" /><path d="M48 36 Q52 31 56 36" stroke="#9A3880" strokeWidth="2.5" strokeLinecap="round" fill="none" /><path d="M30 50 Q40 57 50 50" stroke="#9A3880" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>
          )}
        </span>
        <span className="hidden sm:inline">{current ? current.label : "Mood"}</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 flex gap-1.5 p-2"
          style={{
            background: "oklch(0.990 0.006 355)",
            border: "1px solid oklch(0.87 0.025 340)",
            borderRadius: 12,
            boxShadow: "0 4px 16px oklch(0.18 0.04 320 / 0.10)",
          }}
        >
          {MOOD_DATA.map((m, i) => {
            const FaceComp = PILL_FACES[i];
            return (
              <button
                key={m.value}
                onClick={() => { onMoodChange(m.value); setOpen(false); }}
                title={m.label}
                className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 transition-all"
                style={{
                  borderRadius: 8,
                  background: mood === m.value ? "oklch(0.965 0.015 355)" : "transparent",
                  border: mood === m.value ? `1px solid ${m.color}60` : "1px solid transparent",
                  minWidth: 44,
                }}
              >
                <span style={{ width: 36, height: 36, display: "inline-flex" }}>
                  <FaceComp active={mood === m.value} />
                </span>
                <span style={{ fontSize: "0.58rem", color: m.color, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, textAlign: "center", lineHeight: 1.1 }}>{m.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Simple flag icon for Goals — replaces complex flower
function GoalFlagIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} style={style}>
      <line x1="5" y1="2" x2="5" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 2 L15 5.5 L5 9 Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

type Section = "dashboard" | "focus" | "tasks" | "wins" | "dump" | "goals" | "agents" | "storage";

const SECTION_META: Record<Section, { title: string; icon: React.ElementType }> = {
  dashboard:  { title: "Dashboard",    icon: LayoutDashboard },
  focus:      { title: "Focus Timer",  icon: Clock           },
  tasks:      { title: "My Tasks",     icon: Star     },
  wins:       { title: "Daily Wins",   icon: Sparkles        },
  dump:       { title: "Brain Dump",   icon: Brain           },
  goals:      { title: "Goals", icon: GoalFlagIcon      },
  agents:     { title: "AI Agents",    icon: Bot             },
  storage:    { title: "Storage & Backup", icon: Star            },
};

const INITIAL_TASKS: Task[] = [
  { id: "1", text: "Review project proposal",   priority: "urgent", context: "work",     done: false, createdAt: new Date() },
  { id: "2", text: "Reply to important emails", priority: "focus",  context: "work",     done: false, createdAt: new Date() },
  { id: "3", text: "Take a 10-minute walk",     priority: "normal", context: "personal", done: false, createdAt: new Date() },
];

const INITIAL_GOALS: Goal[] = [
  { id: "g1", text: "Complete the project proposal", progress: 30, context: "work",     createdAt: new Date() },
  { id: "g2", text: "Exercise 3 times this week",    progress: 0,  context: "personal", createdAt: new Date() },
];

const SUNSET_WIDE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-sunset-wide_e4204b59.png";

export default function Home() {
  // URL-hash based section state — persists across refresh
  const [activeSection, setActiveSectionState] = useState<Section>(() => {
    const hash = window.location.hash.slice(1) as Section;
    const VALID = ["dashboard","focus","tasks","wins","dump","goals","agents","storage"] as const;
    return (VALID as readonly string[]).includes(hash) ? hash as Section : "dashboard";
  });
  const setActiveSection = (s: Section) => {
    setActiveSectionState(s);
    window.location.hash = s === "dashboard" ? "" : s;
  };
  const { durations } = useTimer();
  const { user, loading: authLoading, setUser } = useAuth();
  const today = new Date().toDateString();

  // ── Name / personalisation (localStorage + auth user) ──
  const [displayName, setDisplayName] = React.useState<string>(() => localStorage.getItem("adhd-display-name") ?? "");
  const [showNamePrompt, setShowNamePrompt] = React.useState(false);

  // Sync display name from auth user
  React.useEffect(() => {
    if (user?.name && !localStorage.getItem("adhd-display-name")) {
      setDisplayName(user.name);
      localStorage.setItem("adhd-display-name", user.name);
    }
  }, [user]);

  // Show name prompt on first visit (no name saved anywhere)
  React.useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem("adhd-display-name");
    const skipped = localStorage.getItem("adhd-name-skipped");
    if (!stored && !skipped) {
      const t = setTimeout(() => setShowNamePrompt(true), 1200);
      return () => clearTimeout(t);
    }
  }, [user]);
  // Listen for navigateTo events (e.g. from backup reminder toast)
  React.useEffect(() => {
    function onNavigateTo(e: Event) {
      const section = (e as CustomEvent).detail as Section;
      if (section) setActiveSection(section);
    }
    window.addEventListener("navigateTo", onNavigateTo);
    return () => window.removeEventListener("navigateTo", onNavigateTo);
  }, [])  // ── 7-day backup reminder ───────────────────────────────────────────
  React.useEffect(() => {
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    // Track first visit separately — never touch adhd-last-backup (that's only set on real backups)
    if (!localStorage.getItem("adhd-first-visit")) {
      localStorage.setItem("adhd-first-visit", String(now));
    }
    const firstVisit = Number(localStorage.getItem("adhd-first-visit"));
    const lastBackup = Number(localStorage.getItem("adhd-last-backup") ?? 0);
    const lastReminder = Number(localStorage.getItem("adhd-backup-reminder-shown") ?? 0);
    // Only nudge after 7 days since first visit (or 7 days since last backup if they've backed up)
    const daysSinceReference = lastBackup > 0 ? now - lastBackup : now - firstVisit;
    const needsReminder = daysSinceReference > SEVEN_DAYS;
    const shownRecently = (now - lastReminder) < 24 * 60 * 60 * 1000;
    if (needsReminder && !shownRecently) {
      const delay = 4000;
      const msg = `⏰ Last backup was ${Math.floor((now - lastBackup) / 86_400_000)} days ago — time for a fresh one?`;
      const t = setTimeout(() => {
        localStorage.setItem("adhd-backup-reminder-shown", String(now));
        toast(msg, {
          duration: 14000,
          action: {
            label: "Backup now →",
            onClick: () => {
              window.dispatchEvent(new CustomEvent("navigateTo", { detail: "storage" }));
            },
          },
        });
      }, delay);
      return () => clearTimeout(t);
    }
  }, []);
  const handleNameSave = (name: string) => {
    setDisplayName(name);
    localStorage.setItem("adhd-display-name", name);
    setShowNamePrompt(false);
  };
  const handleNameSkip = () => {
    localStorage.setItem("adhd-name-skipped", "1");
    setShowNamePrompt(false);
  };

  // Seed today's mood to Good if never set
  React.useEffect(() => {
    if (mood === null) {
      setMood(4); // Default to Good
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── All data in localStorage ───────────────────────────────────────────────
  const [tasks,  setTasks]  = useLocalStorage<Task[]>("adhd-tasks",  INITIAL_TASKS);
  const [wins,   setWins]   = useLocalStorage<Win[]>("adhd-wins",   []);
  const [goals,  setGoals]  = useLocalStorage<Goal[]>("adhd-goals",  INITIAL_GOALS);
  const [agents, setAgents] = useLocalStorage<Agent[]>("adhd-agents", []);
  const [mood,   setLocalMood]   = useLocalStorage<number | null>("adhd-mood", null);

  const setMood = useCallback((v: number | null | ((prev: number | null) => number | null)) => {
    setLocalMood(v);
    // Also write mood to daily-logs for monthly tracking
    const val = typeof v === "function" ? v(null) : v;
    if (val !== null) recordMood(val);
  }, [setLocalMood]);

  const focusSessionsToday = (() => {
    try {
      const r = localStorage.getItem("adhd-focus-session-list");
      if (r) { const l = JSON.parse(r) as Record<string, unknown[]>; return (l[today] ?? []).length; }
      return 0;
    } catch { return 0; }
  })();

  // Manually deleted custom tags
  const [deletedCategories, setDeletedCategories] = useLocalStorage<string[]>("adhd-deleted-categories", []);

  // ── Transient state ──
  const [focusSessions, setFocusSessions] = useState(focusSessionsToday);
  useEffect(() => { setFocusSessions(focusSessionsToday); }, [focusSessionsToday]);

  const { streak: blockStreak, history: blockHistory, recordBlock } = useBlockStreak();
  const [timerQuitCount, setTimerQuitCount] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [wrapUpOpen, setWrapUpOpen] = useState(false);
  const [pendingDump, setPendingDump] = useState<string | null>(null);
  const [pendingAgentTask, setPendingAgentTask] = useState<string | null>(null);
  const [dashboardKey, setDashboardKey] = useState(0);

  // Daily check-in
  const { show: showCheckIn, dismiss: dismissCheckIn } = useDailyCheckIn();

  const handleCheckInComplete = (data: CheckInResult) => {
    // If user set a mood in check-in, use it; otherwise default to Good (4)
    const moodVal = data.mood ?? 4;
    setMood(moodVal);
    if (data.newGoals?.length) setGoals((p) => [...data.newGoals, ...p]);
    if (data.newTasks.length) setTasks((p) => [...data.newTasks, ...p]);
    if (data.newWins.length) setWins((p) => [...data.newWins, ...p]);
    if (data.newAgents.length) setAgents((p) => [...data.newAgents, ...p]);
    dismissCheckIn(true);
  };

  /* ── Task completion with confetti + goal auto-nudge ── */
  const handleTasksChange = (newTasks: Task[]) => {
    const newlyDone = newTasks.filter(
      (t) => t.done && !tasks.find((old) => old.id === t.id)?.done
    );
    if (newlyDone.length > 0) {
      setConfettiTrigger(true);
      const win: Win = {
        id: `task-${Date.now()}`,
        text: newlyDone[0].text.length > 40 ? newlyDone[0].text.slice(0, 40) + "…" : newlyDone[0].text,
        iconIdx: (() => {
          const ctx = newlyDone[0]?.context ?? "work";
          const map: Record<string, number> = {
            work: 2, personal: 5, health: 0, fitness: 6,
            study: 1, creative: 4, social: 3, nutrition: 7,
          };
          return map[ctx] ?? 2; // default to work
        })(),
        createdAt: new Date(),
      };
      setWins((prev) => [win, ...prev]);

      // Auto-nudge linked goals
      const goalNudges: Record<string, number> = {};
      newlyDone.forEach((t) => {
        if (t.goalId) {
          const totalLinked = newTasks.filter((task) => task.goalId === t.goalId).length;
          const increment = totalLinked > 0 ? Math.round(100 / totalLinked) : 10;
          goalNudges[t.goalId] = (goalNudges[t.goalId] ?? 0) + increment;
        }
      });
      if (Object.keys(goalNudges).length > 0) {
        setGoals((prev) =>
          prev.map((g) => {
            if (!goalNudges[g.id]) return g;
            const newProgress = Math.min(100, g.progress + goalNudges[g.id]);
            if (newProgress >= 100 && g.progress < 100) {
              setTimeout(() => setConfettiTrigger(true), 300);
            }
            return { ...g, progress: newProgress };
          })
        );
      }
    }
    setTasks(newTasks);
  };

  const handleSessionComplete = () => {
    recordFocusSession(durations.focus);
    setConfettiTrigger(true);
    setFocusSessions((s) => s + 1);
    // Add focus session win to total count (special iconIdx 97)
    setWins((prev: any) => [{ id: `fs-${Date.now()}`, text: `${durations.focus}min focus session`, iconIdx: 97, createdAt: new Date() }, ...prev]);
  };

  const handleBlockComplete = () => {
    recordBlockComplete();
    const totalMins = durations.focus * 4;
    const focusLabel = totalMins >= 60
      ? `${Math.floor(totalMins / 60)}h${totalMins % 60 > 0 ? ` ${totalMins % 60}min` : ""}`
      : `${totalMins}min`;
    const blockWin: Win = {
      id: `block-${Date.now()}`,
      text: `${focusLabel} deep focus block complete`,
      iconIdx: 99,
      createdAt: new Date(),
    };
    setWins((prev) => [blockWin, ...prev]);
    setFocusSessions(0);
    recordBlock();
  };

  const handleConvertToTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const handleDumpEntry = (task: Task) => {
    recordDumpEntry();
    handleConvertToTask(task);
  };

  // Guard: if activeSection is a stale value (e.g. 'ai' removed from nav), reset to dashboard
  const VALID_SECTIONS = Object.keys(SECTION_META) as Section[];
  const safeSection: Section = VALID_SECTIONS.includes(activeSection) ? activeSection : "dashboard";
  useEffect(() => {
    if (!VALID_SECTIONS.includes(activeSection)) setActiveSection("dashboard");
  }, [activeSection]);
  const meta = SECTION_META[safeSection];
  const Icon = meta.icon;
  const runningAgents = agents.filter((a) => a.status === "running").length;

  // ── Unified category system: aggregate all contexts from tasks, goals, agents ──
  // Custom tags (non-builtin) are only shown if at least 1 item uses them
  const allItemContexts = new Set([
    ...tasks.map((t) => t.context),
    ...goals.map((g) => g.context),
    ...agents.map((a) => a.context),
  ]);
  const allCategories = Array.from(new Set([
    "work", "personal",
    ...Array.from(allItemContexts),
  ])).filter(Boolean).filter((c) => {
    if (deletedCategories.includes(c)) return false;
    // Always keep builtins; auto-remove custom tags with no items
    if (c === "work" || c === "personal") return true;
    return allItemContexts.has(c);
  });

  /** Clear all test data — wipes tasks, wins, goals, agents but keeps settings */
  const handleClearTestData = () => {
    if (!confirm("Clear all tasks, wins, goals, and agents? This cannot be undone.")) return;
    setTasks([]);
    setWins([]);
    setGoals([]);
    setAgents([]);
    setLocalMood(null);
    setDeletedCategories([]);
    localStorage.removeItem(`adhd-checkin-skip-${today}`);
    localStorage.removeItem(`adhd-checkin-x-${today}`);
    dismissCheckIn(false);
    setTimeout(() => { window.location.reload(); }, 300);
  };

  /** Delete a custom category: reassign all its items to "personal", then hide the tag */
  const handleDeleteCategory = (ctx: string) => {
    if (ctx === "work" || ctx === "personal") return;
    setTasks((prev) => prev.map((t) => t.context === ctx ? { ...t, context: "personal" } : t));
    setGoals((prev) => prev.map((g) => g.context === ctx ? { ...g, context: "personal" } : g));
    setAgents((prev) => prev.map((a) => a.context === ctx ? { ...a, context: "personal" } : a));
    setDeletedCategories((prev) => [...prev, ctx]);
  };

  // ── Show login screen until auth check completes ─────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "oklch(0.96 0.025 355)" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: "oklch(0.62 0.060 330)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
          Loading…
        </span>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={(s) => setActiveSection(s as Section)} onClearData={handleClearTestData} />



      {/* Main content */}
      <main className="flex-1 ml-14 min-h-screen flex flex-col">
        {/* Top header bar — retro lo-fi light style */}
        <header
          className="sticky top-0 z-30 flex items-center gap-0"
          style={{
            background: "#F9D6E8",
            borderBottom: "3px solid #D45898",
            boxShadow: "0 3px 0 #E8A0C8, 0 5px 12px rgba(212,88,152,0.12)",
            minHeight: 48,
          }}
        >
          {/* Left: logo + page icon + title */}
          <div
            className="flex items-center gap-3 px-6 py-3 flex-1 min-w-0"
            style={{ borderRight: "1.5px solid #E8B8D0" }}
          >


            {/* Page section icon */}
            <div
              className="flex items-center justify-center w-6 h-6 shrink-0"
                style={{ opacity: 0.75 }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: "#B03878" }} />
            </div>
            <h1
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#6A1840",
                margin: 0,
                lineHeight: 1,
              }}
            >
              {meta.title}
            </h1>
          </div>

          {/* Right: stats + mood + wrap-up */}
          <div className="flex items-center shrink-0" style={{ gap: 0 }}>
            {/* Quick-stats — visible on all sections */}
            <div className="hidden sm:flex items-center" style={{ borderRight: "1.5px solid #E8B8D0" }}>                {[
                  { label: "tasks", value: tasks.filter((t) => !t.done).length, section: "tasks" as Section },
                  { label: "wins",  value: wins.filter((w) => new Date(w.createdAt).toDateString() === new Date().toDateString()).length, section: "wins" as Section },
                  { label: "agents live", value: agents.filter((a) => a.status === "running").length, section: "agents" as Section },
                ].map(({ label, value, section }, i, arr) => (
                  <React.Fragment key={label}>
                    <button
                      onClick={() => setActiveSection(section)}
                      className="flex items-baseline gap-1.5 transition-all cursor-pointer px-4 py-3"
                      style={{ background: "transparent", border: "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,88,152,0.10)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#6A1840", letterSpacing: "0.02em" }}>{value}</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 400, fontFamily: "'Space Mono', monospace", color: "#C070A0", letterSpacing: "0.10em", textTransform: "uppercase" }}>{label}</span>
                    </button>
                    {i < arr.length - 1 && (
                      <div style={{ width: 1, height: 20, background: "#E8B8D0" }} />
                    )}
                  </React.Fragment>
                ))}
            </div>

            {/* Mood pill */}
            <div className="px-4 py-3" style={{ borderRight: "1.5px solid #E8B8D0" }}>
              <MoodPill mood={mood} onMoodChange={setMood} />
            </div>


            {/* Wrap-up */}
            <button
              onClick={() => setWrapUpOpen(true)}
              className="flex items-center gap-2 transition-all px-5 py-3"
              style={{
                color: "#C070A0",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,88,152,0.10)"; (e.currentTarget as HTMLButtonElement).style.color = "#6A1840"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#C070A0"; }}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wrap up</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 px-8 py-8 overflow-y-auto">
          <div className={cn("mx-auto", activeSection === "dashboard" ? "max-w-7xl" : "max-w-3xl")}>

            {activeSection === "dashboard" && (
              <div className="relative">
                <DashboardDecor />
              <Dashboard
                tasks={tasks}
                wins={wins}
                goals={goals}
                agents={agents}
                mood={mood}
                displayName={displayName || undefined}
                blockStreak={blockStreak}
                blockHistory={blockHistory}
                onNavigate={(s) => setActiveSection(s as Section)}
                onSessionComplete={handleSessionComplete}
                onBlockComplete={handleBlockComplete}
                focusSessions={focusSessions}
                allCategories={allCategories}
                onQuickDump={(text) => setPendingDump(text)}
                onTasksChange={handleTasksChange}
                onTaskToggle={(id) => {
                  const updated = tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t);
                  handleTasksChange(updated);
                }}
                onTaskCreate={(task) => setTasks((prev) => [task, ...prev])}
                onGoalCreate={(goal) => setGoals((prev) => [goal, ...prev])}
                onAgentCreate={(agent) => setAgents((prev) => [agent, ...prev])}
                onWinCreate={(win) => setWins((prev) => [win, ...prev])}
                onDumpCreate={(text) => {
                  try {
                    const entries = JSON.parse(localStorage.getItem("adhd_braindump_entries") ?? "[]");
                    entries.unshift({ id: `dump-${Date.now()}`, text, tags: [], createdAt: new Date().toISOString(), converted: false });
                    localStorage.setItem("adhd_braindump_entries", JSON.stringify(entries));
                  } catch {}
                }}
              />
              </div>
            )}

            {activeSection === "focus" && (
              <div className="relative py-8 px-4" style={{ minHeight: 700, overflow: "visible" }}>
                <FocusDecor />

                {/* ── Speech bubble — top-left decorative ── */}
                <div style={{
                  position: "absolute",
                  top: 18,
                  left: 12,
                  zIndex: 10,
                  transform: "rotate(-2deg)",
                  pointerEvents: "none",
                  userSelect: "none",
                }}>
                  {/* Stars */}
                  <div style={{ position: "absolute", top: -14, left: 8, fontSize: 11, color: "oklch(0.62 0.18 355)" }}>✦</div>
                  <div style={{ position: "absolute", top: -6, left: 28, fontSize: 8, color: "oklch(0.62 0.18 355)" }}>✦</div>
                  <div style={{ position: "absolute", bottom: -8, left: 4, fontSize: 14, color: "oklch(0.58 0.18 340)" }}>★</div>
                  {/* Bubble */}
                  <div style={{
                    background: "oklch(0.985 0.010 355)",
                    border: "1.5px solid oklch(0.72 0.14 340)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    maxWidth: 148,
                    position: "relative",
                    boxShadow: "2px 2px 0 oklch(0.72 0.14 340 / 0.30)",
                  }}>
                    <p style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      lineHeight: 1.55,
                      color: "oklch(0.38 0.18 340)",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                      margin: 0,
                    }}>let it go,<br />so you can<br />grow.</p>
                    {/* Tail pointing right-down */}
                    <div style={{
                      position: "absolute",
                      bottom: -10,
                      right: 18,
                      width: 0,
                      height: 0,
                      borderLeft: "8px solid transparent",
                      borderRight: "0px solid transparent",
                      borderTop: "10px solid oklch(0.72 0.14 340)",
                    }} />
                    <div style={{
                      position: "absolute",
                      bottom: -8,
                      right: 19,
                      width: 0,
                      height: 0,
                      borderLeft: "7px solid transparent",
                      borderRight: "0px solid transparent",
                      borderTop: "9px solid oklch(0.985 0.010 355)",
                    }} />
                  </div>
                </div>

                {/* ── Main focus_timer.exe window — slight tilt left ── */}
                <div style={{
                  position: "relative",
                  zIndex: 2,
                  transform: "rotate(-1deg)",
                  transformOrigin: "top center",
                  marginLeft: "auto",
                  marginRight: "auto",
                  maxWidth: 660,
                }}>
                  <FocusTimer onSessionComplete={handleSessionComplete} onBlockComplete={handleBlockComplete} onQuit={() => setTimerQuitCount(q => q + 1)} />
                </div>

                {/* ── session_tips.txt window — bottom-right corner, peeking outside timer ── */}
                <div style={{
                  position: "relative",
                  zIndex: 1,
                  width: 210,
                  marginTop: -36,
                  marginLeft: "auto",
                  marginRight: -48,
                  transform: "rotate(2deg)",
                  transformOrigin: "top right",
                  boxShadow: "4px 4px 0 rgba(180,60,120,0.15)",
                }}>
                  <RetroPageWrapper title="session_tips.txt" sticker="leaf">
                    <div style={{ padding: "10px 14px 12px" }}>
                      <p className="editorial-label mb-3">Session tips</p>
                      <div className="space-y-2">
                        {[
                          "Phone face-down or in another room",
                          "Close all unneeded browser tabs",
                          "Use Brain Dump for distracting thoughts",
                        ].map((tip, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div
                              className="w-1 h-1 mt-1.5 shrink-0"
                              style={{ background: "oklch(0.58 0.18 340)", transform: "rotate(45deg)" }}
                            />
                            <p className="text-xs" style={{ color: "oklch(0.45 0.04 330)" }}>{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </RetroPageWrapper>
                </div>
              </div>
            )}

            {activeSection === "tasks" && (
              <RetroPageWrapper title="tasks.txt" sticker="star">
                <div className="p-8 min-h-[600px] flex flex-col relative overflow-hidden">
                <TasksDecor />
                <div className="relative z-10">
                  <TaskManager tasks={tasks} onTasksChange={handleTasksChange} allCategories={allCategories} onDeleteCategory={handleDeleteCategory} goals={goals} />
                </div>
                </div>
              </RetroPageWrapper>
            )}

            {activeSection === "wins" && (
              <RetroPageWrapper title="wins.log" sticker="sparkle">
              <div className="p-8 min-h-[600px] flex flex-col relative overflow-hidden">
                <WinsDecor />
                <div className="relative z-10">
                  <DailyWins wins={wins} onWinsChange={setWins} />
                </div>
              </div>
              </RetroPageWrapper>
            )}


            {activeSection === "dump" && (
              <RetroPageWrapper title="dump.txt" sticker="star">
              <div className="p-8 min-h-[600px] flex flex-col relative overflow-hidden">
                <BrainDumpDecor />
                <div className="relative z-10">
                  <BrainDump
                    onConvertToTask={handleConvertToTask}
                    onCreateAgent={(taskText) => { toast("Agent created from dump!"); }}
                    onAddGoal={(text) => {
                      const id = nanoid();
                      setGoals((p) => [{ id, text, progress: 0, context: "personal", createdAt: new Date() }, ...p]);
                    }}
                    onDump={() => recordDumpEntry()}
                    initialText={pendingDump ?? undefined}
                    onInitialTextConsumed={() => setPendingDump(null)}
                  />
                </div>
              </div>
              </RetroPageWrapper>
            )}

            {activeSection === "goals" && (
              <>
                {/* 🧭 Life Dashboard — above goals.md widget */}
                {dashboardKey >= 0 && (() => {
                  try {
                    const data = JSON.parse(localStorage.getItem("adhd-life-dashboard") ?? "null");
                    if (!data || (!data.life && !data.career)) return null;
                    return (
                      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid oklch(0.82 0.040 285)", background: "oklch(0.975 0.010 285)", marginBottom: 12 }}>
                        <div style={{ padding: "8px 14px", background: "oklch(0.58 0.12 285 / 0.10)", borderBottom: "1px solid oklch(0.82 0.040 285)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.85rem", fontWeight: 700, fontStyle: "italic", color: "oklch(0.35 0.10 285)" }}>🧭 Life Dashboard</span>
                          <button onClick={() => document.querySelector<HTMLButtonElement>("[data-life-coach-trigger]")?.click()} style={{ fontSize: "0.48rem", fontFamily: "'Space Mono', monospace", color: "oklch(0.55 0.12 285)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0, letterSpacing: "0.06em" }}>
                            Update with Coach →
                          </button>
                        </div>
                        <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: data.life && data.career ? "1fr 1fr" : "1fr", gap: 12 }}>
                          {data.life && (
                            <div>
                              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.44rem", letterSpacing: "0.10em", color: "oklch(0.55 0.12 285)", textTransform: "uppercase", marginBottom: 5 }}>🌱 Life Direction</p>
                              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", fontWeight: 600, color: "oklch(0.28 0.040 320)", margin: "0 0 5px", lineHeight: 1.4 }}>{data.life.direction}</p>
                              {data.life.insights?.map((ins: string, i: number) => (
                                <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", color: "oklch(0.40 0.040 320)", margin: "2px 0", lineHeight: 1.4 }}>• {ins}</p>
                              ))}
                              {data.life.nextStep && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.70rem", color: "oklch(0.55 0.12 285)", marginTop: 5, fontStyle: "italic" }}>→ {data.life.nextStep}</p>}
                            </div>
                          )}
                          {data.career && (
                            <div>
                              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.44rem", letterSpacing: "0.10em", color: "oklch(0.55 0.12 285)", textTransform: "uppercase", marginBottom: 5 }}>🚀 Career Direction</p>
                              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", fontWeight: 600, color: "oklch(0.28 0.040 320)", margin: "0 0 5px", lineHeight: 1.4 }}>{data.career.direction}</p>
                              {data.career.insights?.map((ins: string, i: number) => (
                                <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", color: "oklch(0.40 0.040 320)", margin: "2px 0", lineHeight: 1.4 }}>• {ins}</p>
                              ))}
                              {data.career.nextStep && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.70rem", color: "oklch(0.55 0.12 285)", marginTop: 5, fontStyle: "italic" }}>→ {data.career.nextStep}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } catch { return null; }
                })()}
                <RetroPageWrapper title="goals.md" sticker="leaf">
                <div className="p-8 min-h-[600px] flex flex-col relative overflow-hidden">
                  <GoalsDecor />
                  <div className="relative z-10">
                    <Goals goals={goals} onGoalsChange={setGoals} allCategories={allCategories} onDeleteCategory={handleDeleteCategory} tasks={tasks} onTasksChange={handleTasksChange} onDashboardUpdate={() => setDashboardKey(k => k + 1)} />
                  </div>
                </div>
                </RetroPageWrapper>
              </>
            )}

            {activeSection === "agents" && (
              <RetroPageWrapper title="agents.app" sticker="star">
              <div className="p-8 relative">
                <AgentsDecor />
                <AgentTracker
                  agents={agents}
                  onAgentsChange={setAgents}
                  tasks={tasks}
                  allCategories={allCategories}
                  pendingTaskText={pendingAgentTask ?? undefined}
                  onPendingTaskConsumed={() => setPendingAgentTask(null)}
                />
              </div>
              </RetroPageWrapper>
            )}

            {activeSection === "storage" && (
              <RetroPageWrapper title="storage.exe" sticker="star">
                <StorageBackup />
              </RetroPageWrapper>
            )}
          </div>
        </div>
      </main>

      {/* ── Global overlays ── */}
      <GlobalRightPanel goals={goals} onLogWin={(text, iconIdx) => setWins((prev: any) => [{ id: `routine-${Date.now()}`, text, iconIdx, createdAt: new Date() }, ...prev])} />
      <GlobalQuickAdd
        onAddTask={(t) => setTasks((p) => [t, ...p])}
        onAddGoal={(text, context) => {
          setGoals((prev: any) => [{ id: `g-${Date.now()}`, text, progress: 0, context: context ?? "personal", createdAt: new Date() }, ...prev]);
        }}
        onAddWin={(text, iconIdx) => {
          setWins((prev: any) => [{ id: `w-${Date.now()}`, text, iconIdx: iconIdx ?? 4, createdAt: new Date() }, ...prev]);
        }}
        onAddDump={(text) => {
          setPendingDump(text);
          setActiveSection("dump");
        }}
      />
      <ConfettiCelebration trigger={confettiTrigger} onComplete={() => setConfettiTrigger(false)} />

      {wrapUpOpen && (
        <DailyWrapUp
          tasks={tasks}
          wins={wins}
          agents={agents}
          quitCount={timerQuitCount}
          onClose={() => {
            const todayWins = wins.filter(w => new Date(w.createdAt).toDateString() === new Date().toDateString());
            const todayDone = tasks.filter(t => t.done && new Date(t.createdAt).toDateString() === new Date().toDateString());
            const score = Math.min(100, todayDone.length * 15 + todayWins.length * 10 + 20);
            recordWrapUp(mood, score);
            setWrapUpOpen(false);
          }}
        />
      )}

      {showCheckIn && (
        <DailyCheckIn
          onComplete={handleCheckInComplete}
          onSkip={() => dismissCheckIn(true)}
          onClose={() => dismissCheckIn(false)}
          displayName={displayName || undefined}
          existingTasks={tasks}
        />
      )}
      {showNamePrompt && (
        <NamePrompt
          onSave={handleNameSave}
          onSkip={handleNameSkip}
        />
      )}
    </div>
  );
}

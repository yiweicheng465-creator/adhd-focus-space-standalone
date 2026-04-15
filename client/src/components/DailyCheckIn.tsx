import { toast } from "sonner";
import { callAIStream } from "@/lib/ai";
/* ============================================================
   ADHD FOCUS SPACE — Daily Check-In v3.0
   Fixes:
   - X = dismiss temporarily (re-shows same day on reload)
   - Skip for today / Finish = suppress all day (localStorage)
   - Back button to navigate to previous steps
   - Wins include category selector (8 categories)
   - Wins tagged as yesterday's date
   - Agent creation: separate name + task fields
   - Mood faces match the geometric design (same as MoodCheckIn)
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Flame, SkipForward, Star, X, Zap } from "lucide-react";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";
import type { Win } from "./DailyWins";
import type { Agent } from "./AgentTracker";
import type { Goal } from "./Goals";

/* ── localStorage keys ── */
function getTodayKey() {
  return `adhd-checkin-skip-${new Date().toDateString()}`;
}
function getXKey() {
  return `adhd-checkin-x-${new Date().toDateString()}`;
}

export function useDailyCheckIn() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show unless user clicked Skip/Finish today
    const skipped = localStorage.getItem(getTodayKey());
    if (!skipped) {
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = (permanent: boolean) => {
    if (permanent) {
      localStorage.setItem(getTodayKey(), "1");
    }
    setShow(false);
  };

  return { show, dismiss };
}

/* ── Types ── */
interface DailyCheckInProps {
  onComplete: (data: CheckInResult) => void;
  onSkip: () => void;
  onClose: () => void; // X button — temporary dismiss
  displayName?: string;
  existingTasks?: import("./TaskManager").Task[];
}

export interface CheckInResult {
  mood: number | null;
  newTasks: Task[];
  newWins: Win[];
  newAgents: Agent[];
  newGoals: Goal[];
  goalUpdates: { id: string; progress: number }[];
  focusNote: string;
}

type Step = "greeting" | "brief" | "mood" | "goals" | "tasks" | "agents" | "wins" | "done";
const STEP_ORDER: Step[] = ["greeting", "brief", "mood", "goals", "tasks", "agents", "wins", "done"];

/* ── Win categories (matches DailyWins) ── */
const WIN_CATS = [
  { idx: 0, label: "Health",    color: "oklch(0.60 0.10 15)",  emoji: "❤️" },
  { idx: 1, label: "Study",     color: "oklch(0.52 0.08 230)", emoji: "📚" },
  { idx: 2, label: "Work",      color: "oklch(0.50 0.07 145)", emoji: "💼" },
  { idx: 3, label: "Social",    color: "oklch(0.58 0.09 55)",  emoji: "👥" },
  { idx: 4, label: "Creative",  color: "oklch(0.55 0.10 300)", emoji: "✨" },
  { idx: 5, label: "Mindful",   color: "oklch(0.55 0.07 185)", emoji: "🌿" },
  { idx: 6, label: "Fitness",   color: "oklch(0.53 0.09 35)",  emoji: "⚡" },
  { idx: 7, label: "Nutrition", color: "oklch(0.52 0.10 130)", emoji: "🍎" },
];

/* ── Korean aesthetic blob mood faces (matching Home.tsx) ── */
const MOODS = [
  { value: 1, label: "Drained", labelKr: "피곤해", fill: "#8BBDD9", stroke: "#2A5A7A", shadow: "rgba(139,189,217,0.4)" },
  { value: 2, label: "Low",     labelKr: "별로야", fill: "#B5A8D0", stroke: "#4A3A7A", shadow: "rgba(181,168,208,0.4)" },
  { value: 3, label: "Okay",    labelKr: "괜찮아", fill: "#C4B8CC", stroke: "#4A3A5A", shadow: "rgba(196,184,204,0.4)" },
  { value: 4, label: "Good",    labelKr: "좋아!",  fill: "#F0A8C0", stroke: "#7A2050", shadow: "rgba(240,168,192,0.4)" },
  { value: 5, label: "Glowing", labelKr: "최고!",  fill: "#F4A0B0", stroke: "#7A1840", shadow: "rgba(244,160,176,0.4)" },
];
function FaceDrained({ active }: { active: boolean }) {
  const bg = active ? "#8BBDD9" : "#B5D4E8";
  return <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%"><path d="M40 14C52 12 66 18 70 30C74 42 70 60 58 68C46 76 26 76 16 64C6 52 8 30 18 20C24 14 32 16 40 14Z" fill={bg}/><ellipse cx="30" cy="38" rx="4" ry="5" fill="#2A5A7A" opacity="0.7"/><ellipse cx="50" cy="38" rx="4" ry="5" fill="#2A5A7A" opacity="0.7"/><ellipse cx="31" cy="36" rx="1.5" ry="2" fill="white" opacity="0.6"/><ellipse cx="51" cy="36" rx="1.5" ry="2" fill="white" opacity="0.6"/><path d="M33 52 Q40 48 47 52" stroke="#2A5A7A" strokeWidth="2" strokeLinecap="round" fill="none"/><ellipse cx="54.5" cy="52" rx="2" ry="3" fill="#A8D4F0" opacity="0.7"/></svg>;
}
function FaceLow({ active }: { active: boolean }) {
  const bg = active ? "#B5A8D0" : "#CFC4E4";
  return <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%"><path d="M38 13C50 10 66 17 70 30C74 43 68 62 56 69C44 76 24 75 14 63C4 51 6 28 18 19C24 14 30 16 38 13Z" fill={bg}/><path d="M26 32 Q29 28 33 30" stroke="#4A3A7A" strokeWidth="1.8" strokeLinecap="round" fill="none"/><path d="M47 30 Q51 28 54 32" stroke="#4A3A7A" strokeWidth="1.8" strokeLinecap="round" fill="none"/><ellipse cx="30" cy="38" rx="3.5" ry="4" fill="#4A3A7A" opacity="0.65"/><ellipse cx="50" cy="38" rx="3.5" ry="4" fill="#4A3A7A" opacity="0.65"/><ellipse cx="31" cy="36.5" rx="1.2" ry="1.5" fill="white" opacity="0.55"/><ellipse cx="51" cy="36.5" rx="1.2" ry="1.5" fill="white" opacity="0.55"/><path d="M31 52 Q40 48 49 52" stroke="#4A3A7A" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>;
}
function FaceOkay({ active }: { active: boolean }) {
  const bg = active ? "#C4B8CC" : "#D8CEDC";
  return <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%"><path d="M40 13C53 11 67 19 70 32C73 45 67 63 54 70C41 77 22 75 13 62C4 49 8 28 20 19C27 14 33 15 40 13Z" fill={bg}/><ellipse cx="30" cy="37" rx="3.5" ry="4" fill="#4A3A5A" opacity="0.65"/><ellipse cx="50" cy="37" rx="3.5" ry="4" fill="#4A3A5A" opacity="0.65"/><ellipse cx="31" cy="35.5" rx="1.2" ry="1.5" fill="white" opacity="0.55"/><ellipse cx="51" cy="35.5" rx="1.2" ry="1.5" fill="white" opacity="0.55"/><line x1="32" y1="51" x2="48" y2="51" stroke="#4A3A5A" strokeWidth="2" strokeLinecap="round"/><ellipse cx="23" cy="46" rx="5" ry="3.5" fill="#E8B0C8" opacity="0.3"/><ellipse cx="57" cy="46" rx="5" ry="3.5" fill="#E8B0C8" opacity="0.3"/></svg>;
}
function FaceGood({ active }: { active: boolean }) {
  const bg = active ? "#F0A8C0" : "#F8C4D4";
  return <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%"><path d="M40 12C54 10 68 19 71 33C74 47 67 65 53 71C39 77 20 74 11 61C2 48 6 26 19 18C26 13 33 14 40 12Z" fill={bg}/><circle cx="29" cy="36" r="5" fill="#7A2050"/><circle cx="51" cy="36" r="5" fill="#7A2050"/><circle cx="30.5" cy="34.5" r="2" fill="white"/><circle cx="52.5" cy="34.5" r="2" fill="white"/><path d="M27 50 Q40 62 53 50" stroke="#7A2050" strokeWidth="2.5" strokeLinecap="round" fill="none"/><path d="M27 50 Q40 60 53 50 Q40 53 27 50Z" fill="#7A2050" opacity="0.1"/><ellipse cx="21" cy="47" rx="6" ry="4" fill="#F07090" opacity="0.35"/><ellipse cx="59" cy="47" rx="6" ry="4" fill="#F07090" opacity="0.35"/></svg>;
}

function FaceGlowing({ active }: { active: boolean }) {
  const bg = active ? "#F4A0B0" : "#FAC0CC";
  return <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%"><path d="M40 11C55 9 70 20 72 35C74 50 66 67 51 73C36 79 17 74 9 59C1 44 6 22 20 15C27 11 33 13 40 11Z" fill={bg}/><path d="M24 38 Q29 31 34 38" stroke="#7A1840" strokeWidth="2.8" strokeLinecap="round" fill="none"/><path d="M46 38 Q51 31 56 38" stroke="#7A1840" strokeWidth="2.8" strokeLinecap="round" fill="none"/><path d="M28 51 Q40 60 52 51" stroke="#7A1840" strokeWidth="2.5" strokeLinecap="round" fill="none"/><ellipse cx="22" cy="48" rx="6" ry="4" fill="#F07090" opacity="0.3"/><ellipse cx="58" cy="48" rx="6" ry="4" fill="#F07090" opacity="0.3"/></svg>;
}

const FACE_COMPONENTS = [FaceDrained, FaceLow, FaceOkay, FaceGood, FaceGlowing];

/* ── Main component ── */
export function DailyCheckIn({ onComplete, onSkip, onClose, displayName, existingTasks = [] }: DailyCheckInProps) {
  const [step, setStep] = useState<Step>("greeting");
  const [briefText, setBriefText] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [topTaskIds, setTopTaskIds] = useState<string[]>([]);
  const [mood, setMood] = useState<number | null>(null);

  // Goals
  const [goalInput, setGoalInput] = useState("");
  const [goalContext, setGoalContext] = useState<string>("work");
  const [newGoals, setNewGoals] = useState<{ text: string; context: string }[]>([]);

  // Tasks
  const [taskInput, setTaskInput] = useState("");
  const [taskContext, setTaskContext] = useState<"work" | "personal">("work");
  const [taskCustomTag, setTaskCustomTag] = useState("");
  const [taskGoalIdx, setTaskGoalIdx] = useState<number | null>(null); // index into newGoals
  const [taskPriority, setTaskPriority] = useState<"urgent" | "focus" | "normal">("focus");
  const [tasks, setTasks] = useState<{ text: string; context: string; goalIdx: number | null; priority: "urgent" | "focus" | "normal" }[]>([]);

  // Agents
  const [agentName, setAgentName] = useState("");
  const [agentLinkedTaskIdx, setAgentLinkedTaskIdx] = useState<number | null>(null); // index into tasks
  const [agents, setAgents] = useState<{ name: string; task: string; linkedTaskIdx: number | null }[]>([]);

  // Wins (with category)
  const [winInput, setWinInput] = useState("");
  const [winCatIdx, setWinCatIdx] = useState(0);
  const [wins, setWins] = useState<{ text: string; catIdx: number }[]>([]);

  const focusNote = "";
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const stepIndex = STEP_ORDER.indexOf(step);
  const progress = Math.round((stepIndex / (STEP_ORDER.length - 1)) * 100);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [step]);

  const parseHashtag = (raw: string): { cleanText: string; tag: string | null } => {
    const match = raw.match(/(^|\s)#([\w-]+)(\s|$)/);
    if (!match) return { cleanText: raw.trim(), tag: null };
    const cleanText = raw.replace(/(^|\s)#[\w-]+(\s|$)/g, " ").replace(/\s{2,}/g, " ").trim();
    return { cleanText, tag: match[2].toLowerCase() };
  };

  const addGoal = () => {
    if (!goalInput.trim()) return;
    const { cleanText, tag } = parseHashtag(goalInput);
    // Allow any custom hashtag as context (not just work/personal)
    const context = (tag ?? goalContext ?? "personal") as string;
    setNewGoals((p) => [...p, { text: cleanText || goalInput.trim(), context }]);
    setGoalInput("");
  };

  const addTask = () => {
    if (!taskInput.trim()) return;
    // Custom tag overrides the toggle; hashtag in text overrides custom tag
    const { cleanText, tag: hashTag } = parseHashtag(taskInput);
    const effectiveContext = hashTag ?? (taskCustomTag.trim() ? taskCustomTag.trim().replace(/^#/, "") : taskContext);
    setTasks((p) => [...p, { text: cleanText || taskInput.trim(), context: effectiveContext, goalIdx: taskGoalIdx, priority: taskPriority }]);
    setTaskInput("");
    setTaskCustomTag("");
  };

  const addAgent = () => {
    if (agentName.trim()) {
      let linkedTask = "General task";
      if (agentLinkedTaskIdx !== null) {
        if (agentLinkedTaskIdx >= 0) {
          linkedTask = tasks[agentLinkedTaskIdx]?.text || "General task";
        } else {
          // negative sentinel: -(index+1) into existingTasks
          const idx = -(agentLinkedTaskIdx + 1);
          linkedTask = existingTasks[idx]?.text || "General task";
        }
      }
      setAgents((p) => [...p, { name: agentName.trim(), task: linkedTask, linkedTaskIdx: agentLinkedTaskIdx }]);
      setAgentName("");
      setAgentLinkedTaskIdx(null);
    }
  };

  const addWin = () => {
    if (winInput.trim()) {
      setWins((p) => [...p, { text: winInput.trim(), catIdx: winCatIdx }]);
      setWinInput("");
    }
  };

  // Read existing goals from localStorage
  const existingGoals = (() => {
    try {
      const raw = localStorage.getItem("adhd-goals");
      if (!raw) return [] as { id: string; text: string; context: string; progress: number }[];
      return JSON.parse(raw) as { id: string; text: string; context: string; progress: number }[];
    } catch { return [] as { id: string; text: string; context: string; progress: number }[]; }
  })();

  const generateBrief = async () => {
    setBriefLoading(true);
    setBriefText("");
    try {
      // Gather context from localStorage
      const todayStr = new Date().toDateString();
      const allTasks: Task[] = (() => { try { return JSON.parse(localStorage.getItem("adhd-tasks") ?? "[]"); } catch { return []; } })();
      const allGoals: Goal[] = (() => { try { return JSON.parse(localStorage.getItem("adhd-goals") ?? "[]"); } catch { return []; } })();
      const logs = (() => { try { return JSON.parse(localStorage.getItem("adhd-daily-logs") ?? "{}"); } catch { return {}; } })();
      const yesterdayLog = logs[new Date(Date.now() - 86400000).toDateString()];
      const pending = allTasks.filter(t => !t.done).slice(0, 10);
      const topGoals = allGoals.filter(g => g.progress < 100).slice(0, 3);
      
      // Pick top 3 tasks to pre-suggest
      const top3 = pending
        .sort((a, b) => { const o = ["urgent","focus","normal","someday"]; return o.indexOf(a.priority) - o.indexOf(b.priority); })
        .slice(0, 3);
      setTopTaskIds(top3.map(t => t.id));

      const todayYMD = new Date().toISOString().slice(0,10);
      const todayTasks = pending.filter(t => !t.dueDate || t.dueDate === todayYMD);
      const urgentToday = todayTasks.filter(t => t.priority === "urgent");
      const isBusy = todayTasks.length >= 6 || urgentToday.length >= 2;

      const ctx = [
        `Today's tasks: ${todayTasks.length} total, ${urgentToday.length} urgent`,
        urgentToday.length ? `Urgent: ${urgentToday.slice(0,3).map(t => `"${t.text}"`).join(", ")}` : "",
        `All pending: ${pending.length} tasks`,
        topGoals.length ? `Active goals: ${topGoals.map(g => `"${g.text}" (${g.progress}%)`).join(", ")}` : "",
        yesterdayLog ? `Yesterday: mood ${yesterdayLog.mood ?? "?"}/5, ${yesterdayLog.tasksCompleted ?? 0} tasks done` : "",
      ].filter(Boolean).join("\n");

      await callAIStream(
        `You are a warm ADHD morning coach. Write 2-3 sentences max.
${isBusy ? "The user has a busy day ahead. Acknowledge the load, name 1-2 urgent tasks to tackle first, give one short focus tip." : "The user has a lighter day. Encourage them to use free time to dump ideas or plan future tasks. Suggest one thing to create or explore."}
Be direct, warm, specific to their tasks. No generic platitudes. No bullet points.`,
        ctx,
        (delta) => setBriefText(prev => prev + delta),
        () => setBriefLoading(false)
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg !== "no-key" && msg !== "invalid-key") {
        setBriefText("Let's make today count. Start with your top priority and build momentum from there. You've got this!");
      }
      setBriefLoading(false);
    }
  };

  const goNext = async () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[idx + 1];
      if (nextStep === "brief") {
        // Check if AI is available before showing brief
        const keyStatus = await fetch("/api/key", { credentials: "include" }).then(r => r.json()).catch(() => ({ hasKey: false, remaining: 0 }));
        const hasAI = keyStatus.hasKey || (keyStatus.remaining ?? 0) > 0;
        if (!hasAI) {
          // Skip brief step entirely
          const briefIdx = STEP_ORDER.indexOf("brief");
          const afterBrief = STEP_ORDER[briefIdx + 1];
          setStep(afterBrief);
          return;
        }
        generateBrief();
      }
      setStep(nextStep);

    }
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  const finish = () => {
    // Yesterday's date for wins (since we ask "wins from yesterday")
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 0, 0);

    // Pre-assign IDs to goals so tasks can reference them
    const goalIds = newGoals.map(() => nanoid());

    const result: CheckInResult = {
      mood,
      newGoals: newGoals.map((g, i) => ({
        id: goalIds[i],
        text: g.text,
        progress: 0,
        context: g.context,
        createdAt: new Date(),
      })),
      newTasks: tasks.map((t) => ({
        id: nanoid(),
        text: t.text,
        priority: t.priority,
        context: (t.context === "work" || t.context === "personal" ? t.context : "personal") as "work" | "personal",
        done: false,
        createdAt: new Date(),
        goalId: t.goalIdx !== null
          ? (t.goalIdx >= 0
            ? (goalIds[t.goalIdx] ?? undefined)  // new goal added this session
            : (existingGoals[-(t.goalIdx + 1)]?.id ?? undefined))  // existing DB goal
          : undefined,
      })),
      newWins: wins.map((w) => ({
        id: nanoid(),
        text: w.text,
        iconIdx: w.catIdx,
        createdAt: yesterday, // tag as yesterday
      })),
      newAgents: agents.map((a) => ({
        id: nanoid(),
        name: a.name,
        task: a.task,
        status: "running" as const,
        context: "work" as const,
        startedAt: new Date(),
        notes: "",
      })),
      goalUpdates: [],
      focusNote: "",
    };
    onComplete(result);
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const greeting = (() => {
    const h = new Date().getHours();
    const suffix = displayName ? ` ${displayName}` : "";
    if (h < 12) return `Good morning${suffix},`;
    if (h < 17) return `Good afternoon${suffix},`;
    if (h < 21) return `Good evening${suffix},`;
    return `Good night${suffix},`;
  })();

  const M = {
    ink: "#4A1030",
    muted: "#C070A0",
    border: "#E8B8D0",
    accent: "#D45898",
    bg: "#FDF0F6",
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(180,60,120,0.25)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-lg animate-scale-in overflow-hidden"
        style={{
          background: "oklch(0.982 0.008 355)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "0 32px 64px rgba(140,40,90,0.22), 0 12px 32px rgba(180,60,120,0.14), 0 4px 12px rgba(0,0,0,0.08)",
          position: "relative",
        }}
      >

        {/* Close (X) button — top right */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 14, right: 14, zIndex: 20, width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.07)", border: "none", cursor: "pointer", color: "oklch(0.45 0.04 320)", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
        >×</button>

        {/* Progress bar */}
        <div className="relative z-10 h-[2px] w-full" style={{ background: "#E8C8DC" }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, background: M.accent }}
          />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between px-8 pt-6 pb-0">
          <div>
            <p className="text-[10px] tracking-widest uppercase font-medium"          style={{ color: "#C070A0", fontFamily: "'DM Sans', sans-serif" }}>{today}</p>    <h2
              className="text-2xl mt-1 font-bold italic"
              style={{ fontFamily: "'Playfair Display', serif", color: M.ink }}
            >
              {step === "greeting" && greeting}
              {step === "brief"     && "Your Morning Brief"}
              {step === "mood"     && "How are you feeling?"}
              {step === "goals"    && "Set a goal for today?"}
              {step === "tasks"    && "What's on your plate?"}
              {step === "agents"   && "Any AI agents running?"}
              {step === "wins"     && "Wins from yesterday?"}
              {step === "done"     && "You're all set."}
            </h2>
          </div>
        </div>

        {/* Step content */}
        <div className="relative z-10 px-8 py-6 min-h-[220px]">

          {/* GREETING */}
          {step === "greeting" && (
            <div className="flex gap-6 items-start">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/vinyl-flowers_13b4a410.jpg"
                alt="vinyl flowers illustration"
                className="w-36 shrink-0" style={{ borderRadius: 0, display: "block" }}
              />
              <div className="pt-2">
                <p className="text-base leading-relaxed" style={{ color: "oklch(0.28 0.04 320)" }}>
                  Let's set up your day in just a few quick questions. No pressure — answer what you can, skip anything you don't have yet.
                </p>
                <p className="text-sm mt-3 italic" style={{ color: M.muted }}>
                  "Your brain is not broken — it just works differently."
                </p>
              </div>
            </div>
          )}

          {/* BRIEF — AI Morning Guide */}
          {step === "brief" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* AI message */}
              <div style={{
                background: "oklch(0.97 0.012 355)",
                border: `1px solid ${M.border}`,
                borderLeft: `4px solid ${M.accent}`,
                borderRadius: 8, padding: "16px 18px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.92rem", color: "oklch(0.28 0.04 320)",
                lineHeight: 1.7, minHeight: 80,
                whiteSpace: "pre-wrap",
              }}>
                {briefLoading && !briefText && (
                  <span style={{ color: M.muted, fontStyle: "italic", fontSize: "0.82rem" }}>
                    Your AI coach is reviewing your day…
                  </span>
                )}
                {briefText || (!briefLoading && "Let's make today count. Start with your top priority and build momentum from there.")}
                {briefLoading && briefText && <span style={{ opacity: 0.5 }}>▊</span>}
              </div>

              {/* Top suggested tasks */}
              {topTaskIds.length > 0 && (() => {
                const allTasks: Task[] = (() => { try { return JSON.parse(localStorage.getItem("adhd-tasks") ?? "[]"); } catch { return []; } })();
                const suggestedTasks = topTaskIds.map(id => allTasks.find(t => t.id === id)).filter(Boolean) as Task[];
                if (!suggestedTasks.length) return null;
                return (
                  <div>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.10em", color: M.muted, textTransform: "uppercase", marginBottom: 8 }}>
                      ✦ Suggested focus today
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {suggestedTasks.map(task => (
                        <div key={task.id} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 12px", borderRadius: 6,
                          background: "oklch(0.98 0.010 355)",
                          border: `1px solid ${M.border}`,
                        }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: M.accent, flexShrink: 0 }} />
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "oklch(0.28 0.04 320)" }}>{task.text}</span>
                          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.50rem", color: M.muted, letterSpacing: "0.06em", marginLeft: "auto", textTransform: "uppercase" }}>{task.priority}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* MOOD */}
          {step === "mood" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-2" style={{ marginTop: 16 }}>
                {MOODS.map((m, i) => {
                  const FaceIcon = FACE_COMPONENTS[i];
                  const isSelected = mood === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMood(m.value)}
                      className="flex flex-col items-center gap-1 flex-1 focus:outline-none"
                      style={{ transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)", transform: "scale(1)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.18)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      style={{
                        transform: isSelected ? "scale(1.18) translateY(-4px)" : "scale(1)",
                        filter: isSelected ? `drop-shadow(0 6px 12px ${m.shadow})` : "none",
                        opacity: mood !== null && !isSelected ? 0.55 : 1,
                      }}
                    >
                      <div className="w-12 h-12">
                        <FaceIcon active={isSelected} />
                      </div>
                      <span
                        className="text-[9px] font-medium tracking-wide"
                        style={{ color: isSelected ? M.ink : M.muted, fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {m.label}
                      </span>
                      <span
                        style={{ fontSize: "0.58rem", color: isSelected ? M.accent : M.muted, fontFamily: "'Space Mono', monospace", letterSpacing: "0.02em", opacity: isSelected ? 1 : 0.65 }}
                      >
                        {m.labelKr}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-1">
                {MOODS.map((m) => (
                  <div
                    key={m.value}
                    className="flex-1 h-0.5 transition-all duration-300"
                    style={{ background: mood !== null && m.value <= mood ? m.fill : "oklch(0.92 0.018 355)" }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* GOALS */}
          {step === "goals" && (
            <div>
              <p className="text-sm mb-3" style={{ color: M.muted }}>
                Add goals for today. Use #work or #personal to tag, then press Enter.
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGoal()}
                  placeholder="e.g. Launch the new feature by Friday…"
                  className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none"
                  style={{ border: `1px solid ${M.border}`, color: M.ink }}
                />
                <button onClick={addGoal} className="px-3 py-2 text-sm font-bold" style={{ background: M.accent, color: "white" }}>+</button>
              </div>
              {newGoals.length > 0 && (
                <ul className="space-y-1.5 mt-3">
                  {newGoals.map((g, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.28 0.04 320)" }}>
                      🎯 <span>{g.text}</span>
                      {g.context && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "oklch(0.92 0.018 355)", color: "oklch(0.48 0.12 340)" }}>
                          #{g.context}
                        </span>
                      )}
                      <button onClick={() => setNewGoals((p) => p.filter((_, j) => j !== i))} className="ml-auto text-xs text-muted-foreground hover:text-destructive">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* TASKS */}
          {step === "tasks" && (
            <div>
              {/* AI suggested tasks from Morning Brief */}
              {topTaskIds.length > 0 && (() => {
                const allTasks: Task[] = (() => { try { return JSON.parse(localStorage.getItem("adhd-tasks") ?? "[]"); } catch { return []; } })();
                const suggested = topTaskIds.map(id => allTasks.find(t => t.id === id)).filter(Boolean) as Task[];
                if (!suggested.length) return null;
                const PRIORITY_COLOR: Record<string, string> = { urgent: "oklch(0.52 0.10 32)", focus: "oklch(0.52 0.14 290)", normal: "oklch(0.55 0.10 330)", someday: "oklch(0.62 0.04 330)" };
                return (
                  <div style={{ marginBottom: 14, padding: "10px 12px", background: `${M.accent}08`, border: `1px solid ${M.accent}30`, borderRadius: 8 }}>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.52rem", letterSpacing: "0.10em", color: M.accent, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                      <span>✦</span> AI suggested focus today
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {suggested.map((task, i) => (
                        <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.50rem", color: M.muted, minWidth: 12 }}>{i + 1}.</span>
                          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: "white", borderRadius: 5, border: `1px solid ${M.border}`, borderLeft: `3px solid ${PRIORITY_COLOR[task.priority] ?? M.accent}` }}>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: M.ink, flex: 1 }}>{task.text}</span>
                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.46rem", color: PRIORITY_COLOR[task.priority] ?? M.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{task.priority}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <p className="text-sm mb-3" style={{ color: M.muted }}>
                Add tasks for today. Press Enter to add each one.
              </p>
              {/* Goal link dropdown — always visible, shows both new goals and existing DB goals */}
              {(newGoals.length > 0 || existingGoals.length > 0) && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px]" style={{ color: M.muted }}>↳ Goal:</span>
                  <select
                    value={taskGoalIdx ?? ""}
                    onChange={(e) => setTaskGoalIdx(e.target.value === "" ? null : Number(e.target.value))}
                    className="flex-1 px-2 py-1 text-xs bg-transparent focus:outline-none"
                    style={{ border: `1px solid ${M.border}`, color: taskGoalIdx !== null ? M.ink : M.muted }}
                  >
                    <option value="">None</option>
                    {newGoals.length > 0 && (
                      <optgroup label="Added this session">
                        {newGoals.map((g, i) => (
                          <option key={`new-${i}`} value={i}>
                            {g.text.length > 40 ? g.text.slice(0, 40) + "…" : g.text}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {existingGoals.length > 0 && (
                      <optgroup label="Existing goals">
                        {existingGoals.map((g, i) => (
                          <option key={`existing-${g.id}`} value={-(i + 1)}>
                            {g.text.length > 40 ? g.text.slice(0, 40) + "…" : g.text}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}
              {/* Priority selector — icon-based, matching TaskManager */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px]" style={{ color: M.muted }}>Priority:</span>
                {(["urgent", "focus", "normal"] as const).map((p) => {
                  const cfg = {
                    urgent: { label: "Urgent", Icon: Flame, color: "oklch(0.55 0.09 35)",  bg: "oklch(0.55 0.09 35 / 0.08)",  border: "oklch(0.55 0.09 35 / 0.28)" },
                    focus:  { label: "Focus",  Icon: Zap,   color: "oklch(0.52 0.14 290)", bg: "oklch(0.52 0.14 290 / 0.08)", border: "oklch(0.52 0.14 290 / 0.28)" },
                    normal: { label: "Normal", Icon: Star,  color: "oklch(0.55 0.10 330)", bg: "oklch(0.72 0.10 330 / 0.10)", border: "oklch(0.72 0.10 330 / 0.30)" },
                  }[p];
                  const active = taskPriority === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setTaskPriority(p)}
                      className="flex items-center gap-1.5 px-3 py-1 transition-all"
                      style={{
                        background:    active ? cfg.bg : "transparent",
                        color:         active ? cfg.color : M.muted,
                        border:        `1px solid ${active ? cfg.border : M.border}`,
                        fontFamily:    "'DM Sans', sans-serif",
                        fontSize:      "0.62rem",
                        fontWeight:    active ? 600 : 400,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        borderRadius:  0,
                      }}
                    >
                      <cfg.Icon className="w-3 h-3" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              {/* Row 3: Input + add */}
              <div className="flex gap-2 mb-1">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="e.g. Reply to messages, finish report…"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none"
                  style={{ border: `1px solid ${M.border}`, color: M.ink }}
                />
                <button onClick={addTask} className="px-3 py-2 text-sm font-bold" style={{ background: M.accent, color: "white" }}>+</button>
              </div>
              <p className="text-[10px] mb-2" style={{ color: M.muted, fontFamily: "'Space Mono', monospace", opacity: 0.7 }}>
                tip: add <span style={{ color: M.accent }}>#tag</span> to categorise — e.g. <span style={{ color: M.accent }}>#work</span>, <span style={{ color: M.accent }}>#personal</span>
              </p>
              {tasks.length > 0 && (
                <ul className="space-y-1.5 mt-3 max-h-28 overflow-y-auto">
                  {tasks.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.28 0.04 320)" }}>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "oklch(0.58 0.10 290 / 0.12)", color: M.muted }}>
                        #{t.context}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
                        background: t.priority === "urgent" ? "oklch(0.50 0.18 20 / 0.12)" : t.priority === "focus" ? "oklch(0.52 0.14 80 / 0.12)" : "oklch(0.50 0.08 240 / 0.12)",
                        color: t.priority === "urgent" ? "oklch(0.50 0.18 20)" : t.priority === "focus" ? "oklch(0.52 0.14 80)" : "oklch(0.50 0.08 240)",
                        fontFamily: "'Space Mono', monospace",
                      }}>
                        {t.priority === "urgent" ? <Flame className="w-3 h-3 inline mr-0.5" /> : t.priority === "focus" ? <Zap className="w-3 h-3 inline mr-0.5" /> : <Star className="w-3 h-3 inline mr-0.5" />}{t.priority}
                      </span>
                      {t.goalIdx !== null && newGoals[t.goalIdx] && (
                        <span className="text-[9px]" style={{ color: M.accent }}>↳ {newGoals[t.goalIdx].text.length > 20 ? newGoals[t.goalIdx].text.slice(0, 20) + "…" : newGoals[t.goalIdx].text}</span>
                      )}
                      <span className="truncate">{t.text}</span>
                      <button onClick={() => setTasks((p) => p.filter((_, j) => j !== i))} className="ml-auto shrink-0 text-xs text-muted-foreground hover:text-destructive">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* AGENTS */}
          {step === "agents" && (
            <div>
              <p className="text-sm mb-3" style={{ color: M.muted }}>
                Log any AI agents you have running. Optionally link to a task.
              </p>
              {/* Task link dropdown — always visible, merges new + existing tasks */}
              {(() => {
                const newTaskOptions = tasks.map((t, i) => ({ label: t.text, value: `new:${i}` }));
                const existingOptions = existingTasks
                  .filter((t) => !t.done)
                  .map((t) => ({ label: t.text, value: `existing:${t.id}` }));
                const allOptions = [...newTaskOptions, ...existingOptions];
                return (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] shrink-0" style={{ color: M.muted }}>↳ Link task:</span>
                    <select
                      value={agentLinkedTaskIdx === null
                        ? ""
                        : agentLinkedTaskIdx >= 0
                          ? `new:${agentLinkedTaskIdx}`
                          : `existing:${existingTasks[-(agentLinkedTaskIdx + 1)]?.id ?? ""}`
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") { setAgentLinkedTaskIdx(null); return; }
                        if (v.startsWith("new:")) { setAgentLinkedTaskIdx(Number(v.slice(4))); return; }
                        // existing task — store as negative sentinel so addAgent can read the id
                        setAgentLinkedTaskIdx(-(existingTasks.findIndex((t) => t.id === v.slice(9)) + 1));
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-transparent focus:outline-none"
                      style={{ border: `1px solid ${M.border}`, color: agentLinkedTaskIdx !== null ? M.ink : M.muted }}
                    >
                      <option value="">No linked task</option>
                      {newTaskOptions.length > 0 && (
                        <optgroup label="Added today">
                          {newTaskOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label.length > 45 ? o.label.slice(0, 45) + "…" : o.label}</option>
                          ))}
                        </optgroup>
                      )}
                      {existingOptions.length > 0 && (
                        <optgroup label="Existing tasks">
                          {existingOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label.length > 45 ? o.label.slice(0, 45) + "…" : o.label}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                );
              })()}
              <div className="flex gap-2 mb-2">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAgent()}
                  placeholder="Agent name (e.g. Manus, Claude…)"
                  autoComplete="off"
                  className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none"
                  style={{ border: `1px solid ${M.border}`, color: M.ink }}
                />
                <button onClick={addAgent} className="px-3 py-2 text-sm font-bold" style={{ background: M.accent, color: "white" }}>+</button>
              </div>
              {agents.length > 0 && (
                <ul className="space-y-1.5 mt-3">
                  {agents.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.28 0.04 320)" }}>
                      <span style={{ color: M.accent }}>⚡</span>
                      <span className="font-medium">{a.name}</span>
                      {a.task !== "General task" && (
                        <span className="text-[9px] truncate max-w-[140px]" style={{ color: M.muted }}>— {a.task}</span>
                      )}
                      <button onClick={() => setAgents((p) => p.filter((_, j) => j !== i))} className="ml-auto shrink-0 text-xs text-muted-foreground hover:text-destructive">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* WINS */}
          {step === "wins" && (
            <div>
              <p className="text-sm mb-3" style={{ color: M.muted }}>
                What did you accomplish yesterday? Pick a category and describe it.
              </p>
              {/* Category selector */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {WIN_CATS.map((cat) => (
                  <button
                    key={cat.idx}
                    onClick={() => setWinCatIdx(cat.idx)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-full transition-all"
                    style={{
                      background: winCatIdx === cat.idx ? `${cat.color}22` : "transparent",
                      border: `1.5px solid ${winCatIdx === cat.idx ? cat.color : "oklch(0.88 0.012 75)"}`,
                      color: winCatIdx === cat.idx ? cat.color : M.muted,
                    }}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={winInput}
                  onChange={(e) => setWinInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWin()}
                  placeholder={`e.g. ${WIN_CATS[winCatIdx].label === "Health" ? "Went for a 30-min walk" : WIN_CATS[winCatIdx].label === "Work" ? "Finished the project proposal" : "Completed something meaningful"}…`}
                  className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none"
                  style={{ border: `1px solid ${M.border}`, color: M.ink }}
                />
                <button
                  onClick={addWin}
                  className="px-3 py-2 text-sm font-bold"
                  style={{ background: M.accent, color: "white" }}
                >
                  +
                </button>
              </div>
              {wins.length > 0 && (
                <ul className="space-y-1.5 mt-3">
                  {wins.map((w, i) => {
                    const cat = WIN_CATS[w.catIdx];
                    return (
                      <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.28 0.04 320)" }}>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${cat.color}18`, color: cat.color, border: `1px solid ${cat.color}44` }}>
                          {cat.emoji} {cat.label}
                        </span>
                        {w.text}
                        <button onClick={() => setWins((p) => p.filter((_, j) => j !== i))} className="ml-auto text-xs text-muted-foreground hover:text-destructive">✕</button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <>
              <div className="flex gap-6 items-start">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/heartbeat-planet-v2_ffb8e7f5.png"
                  alt="heartbeat planet"
                  className="w-32 shrink-0" style={{ borderRadius: 0, display: "block" }}
                />
                <div className="pt-1 space-y-2 text-sm" style={{ color: "oklch(0.28 0.04 320)" }}>
                  {mood && (
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 14 }}>{["😶","😔","😐","🌸","✨"][MOODS.findIndex((m) => m.value === mood)] ?? "💭"}</span>
                      <span>Mood: <span className="font-semibold" style={{ color: "oklch(0.55 0.18 340)" }}>{MOODS.find((m) => m.value === mood)?.label}</span></span>
                    </div>
                  )}
                  {newGoals.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 13 }}>🎯</span>
                      <span><span className="font-semibold" style={{ color: "oklch(0.55 0.14 310)" }}>{newGoals.length}</span> goal{newGoals.length > 1 ? "s" : ""} added</span>
                    </div>
                  )}
                  {tasks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 13 }}>✅</span>
                      <span><span className="font-semibold" style={{ color: "oklch(0.55 0.14 290)" }}>{tasks.length}</span> task{tasks.length > 1 ? "s" : ""} added</span>
                    </div>
                  )}
                  {agents.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 13 }}>🤖</span>
                      <span><span className="font-semibold" style={{ color: "oklch(0.52 0.08 250)" }}>{agents.length}</span> agent{agents.length > 1 ? "s" : ""} logged</span>
                    </div>
                  )}
                  {wins.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 13 }}>⭐</span>
                      <span><span className="font-semibold" style={{ color: "oklch(0.62 0.18 355)" }}>{wins.length}</span> win{wins.length > 1 ? "s" : ""} from yesterday recorded</span>
                    </div>
                  )}
                  {!mood && !newGoals.length && !tasks.length && !agents.length && !wins.length && (
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 13 }}>🌙</span>
                      <span className="italic" style={{ color: "oklch(0.52 0.040 330)" }}>Nothing added — that's okay. Your space is ready.</span>
                    </div>
                  )}
                </div>
              </div>

            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="relative z-10 flex items-center justify-between px-8 py-5"
          style={{ borderTop: `1px solid ${M.border}` }}
        >
          {/* Left: Back (if not on greeting) or Skip */}
          <div className="flex items-center gap-3">
            {stepIndex > 0 && step !== "done" && (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            {/* Skip for today = permanent suppress */}
            <button
              onClick={onSkip}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip for today
            </button>
          </div>

          {/* Right: Next / Finish */}
          {step !== "done" ? (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95"
              style={{ background: M.accent, color: "white" }}
            >
              {step === "greeting" ? "Start my day ✦" : step === "brief" ? "Looks good" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95"
              style={{ background: M.accent, color: "white" }}
            >
              Open my workspace
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

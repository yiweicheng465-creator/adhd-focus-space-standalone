import { toast } from "sonner";
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
import { ArrowLeft, ArrowRight, Flame, Loader2, SkipForward, Sparkles, Star, X, Zap } from "lucide-react";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";
import type { Win } from "./DailyWins";
import type { Agent } from "./AgentTracker";
import type { Goal } from "./Goals";
import { trpc } from "@/lib/trpc";
import { handleAiError } from "@/lib/aiErrorHandler";

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

type Step = "greeting" | "mood" | "goals" | "tasks" | "agents" | "wins" | "done";
const STEP_ORDER: Step[] = ["greeting", "mood", "goals", "tasks", "agents", "wins", "done"];

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

/* ── Geometric mood faces (matching MoodCheckIn) ── */
const MOODS = [
  { value: 1, label: "Drained", fill: "#C8B8D8", stroke: "#6A4880", shadow: "rgba(180,160,210,0.4)" },
  { value: 2, label: "Low",     fill: "#D4B8E0", stroke: "#7A4890", shadow: "rgba(190,165,215,0.4)" },
  { value: 3, label: "Okay",    fill: "#E8A8C8", stroke: "#8A3870", shadow: "rgba(220,155,190,0.4)" },
  { value: 4, label: "Good",    fill: "#F0B8D8", stroke: "#9A3880", shadow: "rgba(235,170,205,0.4)" },
  { value: 5, label: "Glowing", fill: "#F8C8E8", stroke: "#A84888", shadow: "rgba(245,185,220,0.4)" },
];

function FaceDrained({ active }: { active: boolean }) {
  const fill = active ? "#C8B8D8" : "#DDD0E8"; const c = "#6A4880";
  return <svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="32" fill={fill}/><circle cx="28" cy="37" r="3" fill={c}/><circle cx="52" cy="37" r="3" fill={c}/><line x1="30" y1="52" x2="50" y2="52" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>;
}
function FaceLow({ active }: { active: boolean }) {
  const fill = active ? "#D4B8E0" : "#E4CCF0"; const c = "#7A4890";
  return <svg viewBox="0 0 80 80" fill="none"><rect x="8" y="8" width="64" height="64" rx="22" fill={fill}/><circle cx="28" cy="37" r="3" fill={c}/><circle cx="52" cy="37" r="3" fill={c}/><path d="M30 52 Q40 47 50 52" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>;
}
function FaceOkay({ active }: { active: boolean }) {
  const fill = active ? "#E8A8C8" : "#F0C0D8"; const c = "#8A3870";
  return <svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="32" fill={fill}/><circle cx="28" cy="37" r="3" fill={c}/><circle cx="52" cy="37" r="3" fill={c}/><line x1="30" y1="52" x2="50" y2="52" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>;
}
function FaceGood({ active }: { active: boolean }) {
  const fill = active ? "#F0B8D8" : "#F8CCE8"; const c = "#9A3880";
  return <svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="32" fill={fill}/><path d="M24 36 Q28 31 32 36" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/><path d="M48 36 Q52 31 56 36" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/><path d="M30 50 Q40 57 50 50" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>;
}
function FaceGlowing({ active }: { active: boolean }) {
  const fill = active ? "#F8C8E8" : "#FDD8F0"; const c = "#A84888";
  const numRays = 10; const outerR = 38, innerR = 28;
  const points = Array.from({ length: numRays * 2 }, (_, i) => {
    const angle = (i * Math.PI) / numRays - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    return `${40 + r * Math.cos(angle)},${40 + r * Math.sin(angle)}`;
  }).join(" ");
  return <svg viewBox="0 0 80 80" fill="none"><polygon points={points} fill={fill}/><path d="M26 37 Q30 32 34 37" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/><path d="M46 37 Q50 32 54 37" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/><path d="M28 50 Q40 60 52 50" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>;
}
const FACE_COMPONENTS = [FaceDrained, FaceLow, FaceOkay, FaceGood, FaceGlowing];

/* ── Main component ── */
export function DailyCheckIn({ onComplete, onSkip, onClose, displayName, existingTasks = [] }: DailyCheckInProps) {
  const [step, setStep] = useState<Step>("greeting");
  const [mitSuggestion, setMitSuggestion] = useState<string | null>(null);
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

  // Fetch existing goals from DB so user can link tasks to them
  const { data: existingGoals = [] } = trpc.goals.list.useQuery(undefined, { staleTime: 60_000 });

  const mitMutation = trpc.ai.mitSuggestion.useMutation({
    onSuccess: (data) => {
      setMitSuggestion(data.mit ?? "");
    },
    onError: (err) => {
      const wasNoKey = handleAiError(err, "Couldn't load AI suggestion right now.");
      if (!wasNoKey) setMitSuggestion("Couldn't load AI suggestion right now.");
    },
  });

  const goNext = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[idx + 1];
      setStep(nextStep);
      // When entering done step, auto-generate MIT suggestion
      if (nextStep === "done" && tasks.length > 0) {
        mitMutation.mutate({
          pendingTasks: tasks.map((t) => ({
            text: t.text,
            priority: "focus",
            context: t.context,
            createdAt: new Date().toISOString(),
          })),
          goals: newGoals.map((g) => ({ text: g.text, progress: 0, context: g.context })),
          mood: mood,
          focusSessionsToday: 0,
        });
      }
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
          background: M.bg,
          border: `1.5px solid ${M.border}`,
          boxShadow: "0 8px 32px rgba(180,130,160,0.18), 4px 6px 20px rgba(212,88,152,0.18), 0 0 0 1px rgba(232,184,208,0.60)",
          position: "relative",
        }}
      >


        {/* Retro title bar */}
        <div className="relative z-10" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "5px 10px",
          background: "#F9D6E8",
          borderBottom: `1.5px solid ${M.border}`,
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          color: "#8A3060",
        }}>
          <span>daily_checkin.exe</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Progress dots */}
            {STEP_ORDER.slice(0, -1).map((s, i) => (
              <div key={s} style={{
                width: 8, height: 8, borderRadius: "50%",
                background: i <= STEP_ORDER.indexOf(step) ? M.accent : "#E8C8DC",
                boxShadow: i <= STEP_ORDER.indexOf(step)
                  ? `0 1px 0 oklch(0.40 0.18 340), inset 0 1px 1px rgba(255,255,255,0.55)`
                  : `0 1px 0 rgba(180,120,160,0.3), inset 0 1px 1px rgba(255,255,255,0.40)`,
                transition: "background 0.3s, box-shadow 0.3s",
              }} />
            ))}
            <div style={{ width: 1, height: 10, background: M.border, margin: "0 4px" }} />
            <button
              onClick={onClose}
              title="Close (will show again today)"
              style={{ fontSize: 9, padding: "1px 5px", cursor: "pointer",
                background: "#F0D0E4", border: `1px solid ${M.border}`,
                color: "#8A3060", fontFamily: "'Space Mono', monospace",
                lineHeight: 1.4,
              }}
            >✕</button>
          </div>
        </div>

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

          {/* MOOD */}
          {step === "mood" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-2">
                {MOODS.map((m, i) => {
                  const FaceIcon = FACE_COMPONENTS[i];
                  const isSelected = mood === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMood(m.value)}
                      className="flex flex-col items-center gap-1.5 flex-1 transition-all duration-200 focus:outline-none"
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
                        style={{ color: isSelected ? M.ink : "transparent", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {m.label}
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
                  placeholder="e.g. Reply to Alice's email…"
                  autoComplete="off"
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

              {/* MIT Suggestion */}
              {(tasks.length > 0 || newGoals.length > 0) && (
                <div
                  className="mt-4 p-3 rounded-lg"
                  style={{ background: "oklch(0.58 0.18 340 / 0.07)", border: "1px solid oklch(0.58 0.18 340 / 0.22)" }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: M.accent }} />
                    <span className="text-xs font-semibold" style={{ color: M.accent, fontFamily: "'DM Sans', sans-serif" }}>Most Important Thing today</span>
                  </div>
                  {mitMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" style={{ color: M.muted }} />
                      <span className="text-xs italic" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>AI is thinking…</span>
                    </div>
                  ) : mitSuggestion ? (
                    <p className="text-sm leading-relaxed" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
                      {mitSuggestion}
                    </p>
                  ) : (
                    <p className="text-xs italic" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Add tasks to get your MIT suggestion.</p>
                  )}
                </div>
              )}
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
              {step === "greeting" ? "Start my day ✦" : "Next"}
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

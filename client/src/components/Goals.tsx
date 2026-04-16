/* ============================================================
   ADHD FOCUS SPACE — Goals Tracker v3.0 (Morandi)
   Progress: coral bar, sage completed, slumber neutral
   ============================================================ */

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus, Sparkles, Trash2, TrendingUp, CheckCircle2, Circle } from "lucide-react";
import { callAIStream } from "@/lib/ai";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import {
  ContextSwitcher, ContextBadge, ClickableContextBadge, getContextConfig,
  type ItemContext, type ActiveContext,
} from "./ContextSwitcher";
import type { Task } from "./TaskManager";

/* Parse hashtag from goal input — same logic as TaskManager */
function parseHashtag(raw: string): { cleanText: string; tag: string | null } {
  const match = raw.match(/(^|\s)#([\w-]+)(\s|$)/);
  if (!match) return { cleanText: raw.trim(), tag: null };
  const cleanText = raw.replace(/(^|\s)#[\w-]+(\s|$)/g, " ").replace(/\s{2,}/g, " ").trim();
  return { cleanText, tag: match[2].toLowerCase() };
}

export interface Goal {
  id: string;
  text: string;
  progress: number;
  context: ItemContext;
  createdAt: Date;
  archived?: boolean;
  archivedAt?: string; // ISO string
}

const M = {
  coral:    "oklch(0.58 0.12 285)",   // purple-blue accent
  coralBg:  "oklch(0.55 0.12 270 / 0.08)",
  coralBdr: "oklch(0.55 0.12 270 / 0.28)",
  sage:     "oklch(0.55 0.10 290)",   // purple-sage for done
  sageBg:   "oklch(0.55 0.10 290 / 0.08)",
  sageBdr:  "oklch(0.55 0.10 290 / 0.28)",
  ink:      "oklch(0.28 0.040 320)",
  muted:    "oklch(0.52 0.040 330)",
  border:   "oklch(0.86 0.030 300)",
  card:     "oklch(0.980 0.008 300)",
  slumber:  "oklch(0.62 0.06 280)",
  slumBg:   "oklch(0.62 0.06 280 / 0.08)",
  slumBdr:  "oklch(0.62 0.06 280 / 0.22)",
};
// Progress gradient: blue → purple
const PROGRESS_GRADIENT = (done: boolean) => done
  ? "linear-gradient(90deg, oklch(0.60 0.08 285), oklch(0.58 0.10 245))"
  : "linear-gradient(90deg, oklch(0.60 0.12 290), oklch(0.62 0.10 260), oklch(0.65 0.08 240))";

const LABEL: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.65rem",
  fontWeight: 500,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: M.muted,
};

interface GoalsProps {
  goals: Goal[];
  onGoalsChange: (goals: Goal[]) => void;
  defaultContext?: ActiveContext;
  /** Shared category list from Home — includes all contexts across tasks/goals/agents */
  allCategories?: string[];
  /** Called when user wants to delete a custom tag */
  onDeleteCategory?: (ctx: string) => void;
  /** All tasks — used to show linked tasks under each goal */
  tasks?: Task[];
  /** Called when a task is toggled from the goal card */
  onTasksChange?: (tasks: Task[]) => void;
}

export function Goals({ goals, onGoalsChange, defaultContext = "all", allCategories, onDeleteCategory, tasks = [], onTasksChange }: GoalsProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [goalTaskOrder, setGoalTaskOrder] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem("adhd-goal-task-order") ?? "{}"); } catch { return {}; }
  });
  const saveGoalTaskOrder = (o: Record<string, string[]>) => {
    setGoalTaskOrder(o);
    try { localStorage.setItem("adhd-goal-task-order", JSON.stringify(o)); } catch {}
  };
  const [showArchived, setShowArchived] = useState(false);
  const activeGoals = goals.filter(g => !g.archived);
  const archivedGoals = goals.filter(g => g.archived);
  const [showLifeCoach, setShowLifeCoach] = useState(false);
  const [insightKey, setInsightKey] = useState(0); // bumped to force insights re-read
  const [dragOverGoalId, setDragOverGoalId] = useState<string | null>(null);
  const [newGoal,       setNewGoal]       = useState("");
  const [newGoalCtx,    setNewGoalCtx]    = useState<ItemContext>("work");
  const [activeContext, setActiveContext] = useState<ActiveContext>(defaultContext);

  // Unified categories: use shared list if provided, else derive from own goals
  const knownCategories = allCategories ?? Array.from(new Set(["work", "personal", ...goals.map((g) => g.context)]));

  // Detect hashtag in current input for live preview
  const { tag: liveTag } = parseHashtag(newGoal);

  const visibleGoals = (showArchived ? archivedGoals : activeGoals).filter((g) => activeContext === "all" ? true : g.context === activeContext);

  const addGoal = () => {
    if (!newGoal.trim()) return;
    const { cleanText, tag } = parseHashtag(newGoal);
    // If a hashtag is typed, use it; otherwise use the currently active tab category
    // (fall back to "work" only when on the "all" tab with no hashtag)
    const contextFromTab = activeContext !== "all" ? activeContext : newGoalCtx;
    const context = tag ?? contextFromTab;
    if (goals.filter((g) => g.context === context).length >= 5) {
      toast.error(`Max 5 goals per category. Focus is power!`, { duration: 3000 });
      return;
    }
    onGoalsChange([...goals, { id: nanoid(), text: cleanText || newGoal.trim(), progress: 0, context, createdAt: new Date() }]);
    setNewGoal("");
  };

  const updateProgress = (id: string, delta: number) => {
    onGoalsChange(goals.map((g) => {
      if (g.id !== id) return g;
      const next = Math.min(100, Math.max(0, g.progress + delta));
      return { ...g, progress: next };
    }));
  };

  const deleteGoal = (id: string) => onGoalsChange(goals.filter((g) => g.id !== id));
  const archiveGoal = (id: string) => onGoalsChange(goals.map(g =>
    g.id === id ? { ...g, archived: true, archivedAt: new Date().toISOString() } : g
  ));

  const avgProgress = visibleGoals.length > 0
    ? Math.round(visibleGoals.reduce((sum, g) => sum + g.progress, 0) / visibleGoals.length) : 0;

  // Build dynamic counts for all known categories
  const counts: Record<string, number> = { all: goals.length };
  knownCategories.forEach((ctx) => { counts[ctx] = goals.filter((g) => g.context === ctx).length; });

  const CAT_SALMON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/cat4_salmon_sitting_2fe20a45.png";
  return (
    <div className="flex flex-col gap-4 h-full" style={{ position: "relative" }}>
      {/* Hidden trigger for external Life Coach button */}
      <button data-life-coach-trigger onClick={() => setShowLifeCoach(true)} style={{ display: "none" }} />
      {/* Cat sticker: salmon sitting cat — bottom-right corner */}
      <img src={CAT_SALMON} alt="" aria-hidden="true" style={{ position: "absolute", bottom: 0, right: 0, width: 70, opacity: 0.38, pointerEvents: "none", zIndex: 5 }} />
      {showLifeCoach && <LifeCoachModal onClose={() => setShowLifeCoach(false)} onClear={() => setInsightKey(k => k + 1)} goals={goals} />}


      {/* Life Coach insights — top of page */}
      {insightKey >= 0 && (() => {
        try {
          const data = JSON.parse(localStorage.getItem("adhd-life-coach-insights") ?? "null");
          if (!data) return null;
          return (
            <div style={{ padding: "10px 14px", background: "oklch(0.58 0.12 285 / 0.06)", border: "1px solid oklch(0.58 0.12 285 / 0.20)", borderRadius: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: "1rem", flexShrink: 0 }}>🧭</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.48rem", letterSpacing: "0.08em", color: "oklch(0.55 0.12 285)", textTransform: "uppercase", marginBottom: 3 }}>
                  Life Coach · {data.coachType === "career" ? "Career" : "Life Planning"}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "oklch(0.35 0.040 320)", lineHeight: 1.5, margin: 0, wordBreak: "break-word" }}>
                  {data.summary?.slice(0, 200)}{data.summary?.length > 200 ? "…" : ""}
                </p>
                <button onClick={() => setShowLifeCoach(true)} style={{ marginTop: 4, fontSize: "0.55rem", fontFamily: "'Space Mono', monospace", color: "oklch(0.55 0.12 285)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                  Continue conversation →
                </button>
              </div>
            </div>
          );
        } catch { return null; }
      })()}

      {/* Add goal */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGoal()}
            placeholder="goal... #health #learning"
            className="flex-1"
            style={{
              background: "oklch(0.97 0.018 355)",
              border: `1px solid ${liveTag ? "oklch(0.58 0.18 340)" : "oklch(0.82 0.070 340)"}`,
              fontFamily: "'DM Sans', sans-serif",
              transition: "border-color 0.2s",
              fontSize: "0.8rem",
              fontWeight: 300,
              letterSpacing: "0.01em",
              paddingTop: "0.55rem",
              paddingBottom: "0.55rem",
              color: "oklch(0.35 0.02 70)",
            }}
          />
          <button
            onClick={addGoal}
            className="m-btn-primary shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live hashtag preview */}
        {liveTag && (
          <div className="flex items-center gap-1.5" style={{ fontSize: "0.7rem", color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: M.coral }}>◆</span>
            Will be added to category{" "}
            <span className="px-2 py-0.5 font-medium" style={{ background: M.coral + "15", color: M.coral, border: `1px solid ${M.coral}30`, fontSize: "0.68rem", letterSpacing: "0.06em" }}>
              #{liveTag}
            </span>
          </div>
        )}

        {/* Category is set via #hashtag in the input */}
      </div>

      <ContextSwitcher active={activeContext} onChange={setActiveContext} counts={counts} contexts={knownCategories} onDeleteContext={onDeleteCategory} label="FILTER BY TAG" />

      {/* Archive toggle + stats */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.52rem", color: M.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {showArchived ? `Archived (${archivedGoals.length})` : `Active (${activeGoals.length})`}
          {archivedGoals.length > 0 && !showArchived && <span> · {archivedGoals.length} archived</span>}
        </span>
        {archivedGoals.length > 0 && (
          <button className="m-btn-link" style={{ fontSize: "0.55rem" }} onClick={() => setShowArchived(v => !v)}>
            {showArchived ? "← Back" : `Archived (${archivedGoals.length})`}
          </button>
        )}
      </div>
      {/* Goals list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {visibleGoals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ opacity: 0.18 }}>
              <circle cx="20" cy="20" r="17" fill="none" stroke={M.muted} strokeWidth="1" />
              <circle cx="20" cy="20" r="10" fill="none" stroke={M.muted} strokeWidth="0.8" />
              <circle cx="20" cy="20" r="3" fill={M.muted} />
              <line x1="20" y1="3" x2="20" y2="10" stroke={M.muted} strokeWidth="1" />
              <line x1="20" y1="30" x2="20" y2="37" stroke={M.muted} strokeWidth="1" />
            </svg>
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>No goals yet. Up to 5 per context.</p>
          </div>
        )}

        {visibleGoals.map((goal) => {
          const done = goal.progress === 100;
          return (
            <div
              key={goal.id}
              className="group p-4 transition-all relative overflow-hidden"
              style={{
                background: done
                  ? "oklch(0.955 0.035 340)"
                  : `oklch(${0.968 - goal.progress * 0.00013} ${0.018 + goal.progress * 0.00017} ${340 - goal.progress * 0.4})`,
                border: dragOverGoalId === goal.id ? `2px dashed oklch(0.58 0.18 340)` : `1px solid ${done ? "oklch(0.82 0.08 340)" : M.border}`,
                borderRadius: 14,
                boxShadow: done
                  ? "0 2px 12px oklch(0.58 0.18 340 / 0.12), 0 1px 3px oklch(0.28 0.04 320 / 0.06)"
                  : "0 2px 12px oklch(0.55 0.12 285 / 0.06), 0 1px 3px oklch(0.28 0.04 320 / 0.04)",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOverGoalId(goal.id); }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverGoalId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverGoalId(null);
                const taskId = draggingTaskId ?? e.dataTransfer.getData("taskId");
                if (!taskId || !onTasksChange) return;
                const task = tasks.find(t => t.id === taskId);
                if (!task || task.goalId === goal.id) return;
                onTasksChange(tasks.map(t => t.id === taskId ? { ...t, goalId: goal.id } : t));
                setDraggingTaskId(null);
              }}
              onMouseEnter={(e) => {
                if (!done && dragOverGoalId !== goal.id) (e.currentTarget as HTMLDivElement).style.borderColor = M.coralBdr;
              }}
              onMouseLeave={(e) => {
                if (dragOverGoalId !== goal.id) (e.currentTarget as HTMLDivElement).style.borderColor = done ? M.sageBdr : M.border;
              }}
            >


              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {/* Simple flag icon */}
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="mt-0.5 shrink-0">
                    <line x1="5" y1="2" x2="5" y2="18" stroke={done ? M.sage : M.coral} strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M5 2 L15 5.5 L5 9 Z" fill={done ? M.sage : M.coral} opacity="0.85" />
                  </svg>
                  <p
                    className={cn("text-sm font-medium leading-snug", done && "line-through")}
                    style={{ color: done ? M.muted : M.ink, fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {goal.text}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
<ClickableContextBadge
                    context={goal.context}
                    allContexts={knownCategories}
                    onChange={(ctx) => onGoalsChange(goals.map(g => g.id === goal.id ? { ...g, context: ctx as import("./ContextSwitcher").ItemContext } : g))}
                  />
                  {!goal.archived ? (
                    <button
                      onClick={() => archiveGoal(goal.id)}
                      title="Archive goal"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: M.muted }}
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 8h16M7 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => { onGoalsChange(goals.map(g => g.id === goal.id ? { ...g, archived: false, archivedAt: undefined } : g)); setShowArchived(false); }}
                      title="Unarchive"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: M.sage, fontSize: "0.55rem", fontFamily: "'Space Mono', monospace" }}
                    >
                      Restore
                    </button>
                  )}
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: M.muted }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar — thick pill with gradient */}
              <div className="flex items-center gap-3 mt-2 mb-1">
                <div className="flex-1" style={{ height: 8, borderRadius: 99, background: "oklch(0.90 0.015 300)", overflow: "hidden" }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${goal.progress}%`, background: PROGRESS_GRADIENT(done), borderRadius: 99 }}
                  />
                </div>
                {/* Right side: show ACHIEVED stamp when done, otherwise show % */}
                {done ? (
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 shrink-0"
                    style={{
                      background: M.sageBg,
                      border: `1px solid ${M.sageBdr}`,
                      borderRadius: 0,
                      transform: "rotate(-1deg)",
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke={M.sage} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: M.sage, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>Achieved</span>
                  </div>
                ) : (
                  <span className="text-xs font-medium w-8 text-right shrink-0" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                    {goal.progress}%
                  </span>
                )}
              </div>

              {/* Progress buttons */}
              <div className="flex items-center gap-2 mt-2">
                {[10, 25, 50].map((delta) => (
                  <button
                    key={delta}
                    onClick={() => updateProgress(goal.id, delta)}
                    disabled={done}
                    className="m-chip disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +{delta}%
                  </button>
                ))}
                <button
                  onClick={() => updateProgress(goal.id, -10)}
                  disabled={goal.progress <= 0}
                  className="m-chip disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −10%
                </button>
              </div>


              {/* Linked tasks */}
              {(() => {
                const linkedRaw = tasks.filter((t) => t.goalId === goal.id);
                if (linkedRaw.length === 0) return null;
                // Apply saved order
                const order = goalTaskOrder[goal.id];
                const linked = order
                  ? [...order.map(id => linkedRaw.find(t => t.id === id)).filter(Boolean) as typeof linkedRaw, ...linkedRaw.filter(t => !order.includes(t.id))]
                  : linkedRaw;
                return (
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${M.border}` }}>
                    <p style={{ fontSize: "0.58rem", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.10em", textTransform: "uppercase", color: M.muted, marginBottom: 6 }}>Contributing tasks</p>
                    <div className="flex flex-col gap-1">
                      {linked.map((t) => (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggingTaskId(t.id);
                            e.dataTransfer.setData("taskId", t.id);
                            e.dataTransfer.setData("sourceGoalId", goal.id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => { setDraggingTaskId(null); setDragOverGoalId(null); }}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDrop={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            const sourceGoalId = e.dataTransfer.getData("sourceGoalId");
                            const taskId = e.dataTransfer.getData("taskId");
                            if (!taskId || taskId === t.id || !onTasksChange) return;
                            if (sourceGoalId === goal.id) {
                              // Reorder within same goal
                              const linkedIds = tasks.filter(tk => tk.goalId === goal.id).map(tk => tk.id);
                              const ordered = goalTaskOrder[goal.id] ?? linkedIds;
                              const newOrder = [...ordered.filter(id => id !== taskId)];
                              const targetIdx = newOrder.indexOf(t.id);
                              newOrder.splice(targetIdx, 0, taskId);
                              saveGoalTaskOrder({ ...goalTaskOrder, [goal.id]: newOrder });
                            } else {
                              onTasksChange(tasks.map(tk => tk.id === taskId ? { ...tk, goalId: goal.id } : tk));
                              setDraggingTaskId(null);
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 transition-all"
                          style={{
                            background: t.done ? "oklch(0.96 0.010 290 / 0.4)" : "white",
                            border: `1px solid ${t.done ? M.sageBdr : M.border}`,
                            borderRadius: 8,
                            opacity: 1,
                            cursor: "grab",
                            marginBottom: 4,
                          }}
                        >
                          {/* Drag handle */}
                          <span style={{ color: "oklch(0.75 0.020 300)", fontSize: "0.60rem", cursor: "grab", flexShrink: 0, letterSpacing: "-2px", opacity: 0.5 }}>⋮⋮</span>
                          <button
                            onClick={() => {
                              if (!onTasksChange) return;
                              const updated = tasks.map((task) =>
                                task.id === t.id ? { ...task, done: !task.done } : task
                              );
                              onTasksChange(updated);
                            }}
                            className="shrink-0 transition-all hover:scale-110"
                            style={{ color: t.done ? M.sage : "oklch(0.80 0.012 75)" }}
                          >
                            {t.done
                              ? <CheckCircle2 className="w-3.5 h-3.5" />
                              : <Circle className="w-3.5 h-3.5" />}
                          </button>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontFamily: "'DM Sans', sans-serif",
                              color: t.done ? M.muted : M.ink,
                              textDecoration: t.done ? "line-through" : "none",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {t.text}
                          </span>
                          {t.done && (() => {
                            const totalLinked = tasks.filter((task) => task.goalId === goal.id).length;
                            const pct = totalLinked > 0 ? Math.round(100 / totalLinked) : 10;
                            return <span style={{ fontSize: "0.58rem", color: M.sage, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em" }}>+{pct}%</span>;
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Life Coach AI Modal ──────────────────────────────────────────────────── */
function LifeCoachModal({ onClose, onClear, goals }: { onClose: () => void; onClear?: () => void; goals: Goal[] }) {
  const STORAGE_KEY = "adhd-life-coach-chat";
  const [mode, setMode] = useState<"pick" | "chat">(() => {
    try { const s = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); return s.messages?.length ? "chat" : "pick"; } catch { return "pick"; }
  });
  const [coachType, setCoachType] = useState<"life" | "career">(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").coachType ?? "life"; } catch { return "life"; }
  });
  const [messages, setMessages] = useState<{ role: "user" | "coach"; text: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").messages ?? []; } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist chat to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ coachType, messages }));
    }
  }, [messages, coachType]);

  const clearChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("adhd-life-coach-insights");
    setMessages([]); setMode("pick"); setInput("");
    onClear?.();
  };

  // Save insights to localStorage for Goals page to read
  useEffect(() => {
    if (messages.length > 2) {
      const coachMsgs = messages.filter(m => m.role === "coach").map(m => m.text);
      localStorage.setItem("adhd-life-coach-insights", JSON.stringify({ coachType, summary: coachMsgs[coachMsgs.length - 1], updatedAt: new Date().toISOString() }));
    }
  }, [messages]);

  const goalSummary = goals.filter(g => !g.archived).map(g => `"${g.text}" (${g.progress}%)`).join(", ") || "none yet";

  const SYSTEM_PROMPTS = {
    life: `You are a warm, wise life coach helping with personal growth and life planning. 
The user's current goals: ${goalSummary}.
Guide them through: understanding their values, identifying what matters most, and building a 1/3/10 year vision.
Ask one question at a time. Be thoughtful, specific, and encouraging. Keep responses concise (2-3 sentences + question).`,
    career: `You are an expert career coach helping with professional growth and planning.
The user's current goals: ${goalSummary}.
Guide them to clarify career direction, identify skill gaps, and create an actionable roadmap.
Ask one question at a time. Be direct, practical, and encouraging. Keep responses concise (2-3 sentences + question).`,
  };

  const STARTERS = {
    life: "Let's explore what matters most to you. What area of your life feels most out of alignment with where you want to be — relationships, health, purpose, or something else?",
    career: "Let's map out your career direction. What does success look like to you in 3 years — are you looking to go deeper in your current field, pivot to something new, or build something of your own?",
  };

  const startChat = async (type: "life" | "career") => {
    setCoachType(type);
    setMode("chat");
    const starter = STARTERS[type];
    setMessages([{ role: "coach", text: starter }]);
  };

  const send = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user" as const, text: userMsg }];
    setMessages(newMsgs);
    setStreaming(true);

    const history = newMsgs.map(m => `${m.role === "user" ? "User" : "Coach"}: ${m.text}`).join("\n");
    setMessages(prev => [...prev, { role: "coach", text: "" }]);

    try {
      await callAIStream(
        SYSTEM_PROMPTS[coachType],
        `Conversation so far:\n${history}\n\nContinue as the coach.`,
        (delta) => setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "coach", text: updated[updated.length - 1].text + delta };
          return updated;
        }),
        () => setStreaming(false)
      );
    } catch { setStreaming(false); }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(140,40,90,0.2)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ background: "#fdf4f8", borderRadius: 16, width: "min(480px, 94vw)", height: "min(560px, 90vh)", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(140,40,90,0.25)", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid oklch(0.82 0.050 340 / 0.5)", background: "rgba(249,214,232,0.5)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "1.1rem" }}>🧭</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 700, color: "oklch(0.28 0.040 320)", fontStyle: "italic" }}>
              {mode === "pick" ? "Life Coach AI" : coachType === "life" ? "Life Planning" : "Career Coaching"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {messages.length > 0 && (
              <button onClick={clearChat} style={{ fontSize: "0.50rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em", padding: "2px 8px", border: "1px solid oklch(0.72 0.050 330)", borderRadius: 3, background: "transparent", color: "oklch(0.55 0.050 330)", cursor: "pointer" }}>Clear</button>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "oklch(0.52 0.040 330)" }}>×</button>
          </div>
        </div>

        {mode === "pick" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.90rem", color: "oklch(0.45 0.040 330)", textAlign: "center", lineHeight: 1.6, maxWidth: 340 }}>
              AI will guide you through building your life framework — values, vision, and an actionable roadmap.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
              <button onClick={() => startChat("life")} style={{ padding: "14px 20px", borderRadius: 10, background: "oklch(0.58 0.18 340 / 0.08)", border: "1.5px solid oklch(0.58 0.18 340 / 0.30)", cursor: "pointer", textAlign: "left", display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: "1.4rem" }}>🌱</span>
                <div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "oklch(0.28 0.040 320)", margin: 0, fontSize: "0.90rem" }}>Life Planning</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "oklch(0.52 0.040 330)", margin: 0 }}>Values, purpose, 1/3/10 year vision</p>
                </div>
              </button>
              <button onClick={() => startChat("career")} style={{ padding: "14px 20px", borderRadius: 10, background: "oklch(0.52 0.10 168 / 0.08)", border: "1.5px solid oklch(0.52 0.10 168 / 0.30)", cursor: "pointer", textAlign: "left", display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: "1.4rem" }}>🚀</span>
                <div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "oklch(0.28 0.040 320)", margin: 0, fontSize: "0.90rem" }}>Career Coaching</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "oklch(0.52 0.040 330)", margin: 0 }}>Direction, roadmap, skill gaps</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "85%", padding: "8px 12px", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    background: m.role === "user" ? "oklch(0.58 0.18 340)" : "white",
                    color: m.role === "user" ? "white" : "oklch(0.28 0.040 320)",
                    fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", lineHeight: 1.6,
                    border: m.role === "coach" ? "1px solid oklch(0.82 0.050 340 / 0.5)" : "none",
                  }}>
                    {m.text || (streaming && i === messages.length - 1 ? "▊" : "")}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            {/* Input */}
            <div style={{ padding: "10px 14px", borderTop: "1px solid oklch(0.82 0.050 340 / 0.5)", display: "flex", gap: 8 }}>
              <input
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Share your thoughts…"
                autoComplete="off"
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid oklch(0.82 0.050 340)", background: "white", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", outline: "none" }}
              />
              <button onClick={send} disabled={streaming || !input.trim()} style={{ padding: "8px 14px", borderRadius: 8, background: input.trim() ? "oklch(0.58 0.18 340)" : "transparent", border: `1px solid ${input.trim() ? "oklch(0.58 0.18 340)" : "oklch(0.82 0.050 340)"}`, color: input.trim() ? "white" : "oklch(0.52 0.040 330)", cursor: "pointer" }}>
                →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

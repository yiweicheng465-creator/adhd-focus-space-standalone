/* ============================================================
   ADHD FOCUS SPACE — Goals Tracker v3.0 (Morandi)
   Progress: coral bar, sage completed, slumber neutral
   ============================================================ */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus, Trash2, TrendingUp, CheckCircle2, Circle } from "lucide-react";
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
}

const M = {
  coral:    "oklch(0.58 0.18 340)",
  coralBg:  "oklch(0.58 0.18 340 / 0.08)",
  coralBdr: "oklch(0.58 0.18 340 / 0.28)",
  sage:     "oklch(0.52 0.10 168)",
  sageBg:   "oklch(0.52 0.10 168 / 0.08)",
  sageBdr:  "oklch(0.52 0.10 168 / 0.28)",
  ink:      "oklch(0.28 0.040 320)",
  muted:    "oklch(0.52 0.040 330)",
  border:   "oklch(0.82 0.050 340)",
  card:     "oklch(0.975 0.018 355)",
};

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
  const [dragOverGoalId, setDragOverGoalId] = useState<string | null>(null);
  const [newGoal,       setNewGoal]       = useState("");
  const [newGoalCtx,    setNewGoalCtx]    = useState<ItemContext>("work");
  const [activeContext, setActiveContext] = useState<ActiveContext>(defaultContext);

  // Unified categories: use shared list if provided, else derive from own goals
  const knownCategories = allCategories ?? Array.from(new Set(["work", "personal", ...goals.map((g) => g.context)]));

  // Detect hashtag in current input for live preview
  const { tag: liveTag } = parseHashtag(newGoal);

  const visibleGoals = goals.filter((g) => activeContext === "all" ? true : g.context === activeContext);

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

  const avgProgress = visibleGoals.length > 0
    ? Math.round(visibleGoals.reduce((sum, g) => sum + g.progress, 0) / visibleGoals.length) : 0;

  // Build dynamic counts for all known categories
  const counts: Record<string, number> = { all: goals.length };
  knownCategories.forEach((ctx) => { counts[ctx] = goals.filter((g) => g.context === ctx).length; });

  const CAT_SALMON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/cat4_salmon_sitting_2fe20a45.png";
  return (
    <div className="flex flex-col gap-4 h-full" style={{ position: "relative" }}>
      {/* Cat sticker: salmon sitting cat — bottom-right corner */}
      <img src={CAT_SALMON} alt="" aria-hidden="true" style={{ position: "absolute", bottom: 0, right: 0, width: 70, opacity: 0.38, pointerEvents: "none", zIndex: 5 }} />
      {/* Overall progress */}
      {visibleGoals.length > 0 && (
        <div className="p-4" style={{ background: M.coralBg, border: `1px solid ${M.coralBdr}` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: M.coral }} />
              <span className="text-sm font-medium" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
                {activeContext === "all" ? "Overall" : getContextConfig(activeContext).label} Progress
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: M.coral, fontFamily: "'Playfair Display', serif" }}>
              {avgProgress}%
            </span>
          </div>
          {/* Custom progress bar */}
          <div className="h-1.5 w-full" style={{ background: "oklch(0.88 0.014 75)" }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${avgProgress}%`, background: M.coral }}
            />
          </div>
        </div>
      )}

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
              background: M.card,
              border: `1px solid ${liveTag ? M.coral : M.border}`,
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
                background: done ? M.sageBg : M.card,
                border: dragOverGoalId === goal.id ? `2px dashed ${M.coral}` : `1px solid ${done ? M.sageBdr : M.border}`,
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
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: M.muted }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5" style={{ background: "oklch(0.88 0.014 75)" }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${goal.progress}%`, background: done ? M.sage : M.coral }}
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
                const linked = tasks.filter((t) => t.goalId === goal.id);
                if (linked.length === 0) return null;
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
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => { setDraggingTaskId(null); setDragOverGoalId(null); }}
                          className="flex items-center gap-2 px-2 py-1.5 transition-all"
                          style={{
                            background: t.done ? "oklch(0.97 0.006 78)" : "oklch(0.975 0.010 78)",
                            border: `1px solid ${t.done ? M.sageBdr : M.border}`,
                            opacity: t.done ? 0.7 : 1,
                            cursor: "grab",
                          }}
                        >
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

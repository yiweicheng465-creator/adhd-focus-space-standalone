/* ============================================================
   ADHD FOCUS SPACE — Task Manager v3.0 (Morandi)
   Priority: Urgent=coral, Focus=sage, Normal=slumber
   Context: Work=sage-green, Personal=dusty-mauve
   ============================================================ */

import { useState, useRef, useEffect } from "react";
import { EisenhowerMatrix, priorityToQuadrant, type QuadrantId } from "./EisenhowerMatrix";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Flame, Loader2, Plus, Sparkles, Star, Trash2, Zap, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";
import { callAI } from "@/lib/ai";
import { nanoid } from "nanoid";
import {
  ContextSwitcher, ContextBadge, getContextConfig,
  type ItemContext, type ActiveContext,
} from "./ContextSwitcher";
import type { Goal } from "./Goals";

export type TaskPriority = "focus" | "urgent" | "normal";

export interface Task {
  id: string;
  text: string;
  priority: TaskPriority;
  context: ItemContext;
  done: boolean;
  createdAt: Date;
  /** Optional: ID of a Goal this task contributes to */
  goalId?: string;
}

/* Morandi priority palette */
const PRIORITY_CONFIG: Record<TaskPriority, {
  label: string; icon: React.ElementType;
  color: string; bg: string; border: string;
}> = {
  urgent: {
    label: "Urgent", icon: Flame,
    color:  "oklch(0.55 0.09 35)",
    bg:     "oklch(0.55 0.09 35 / 0.08)",
    border: "oklch(0.55 0.09 35 / 0.28)",
  },
  focus: {
    label: "Focus", icon: Zap,
    color:  "oklch(0.52 0.14 290)",
    bg:     "oklch(0.52 0.14 290 / 0.08)",
    border: "oklch(0.52 0.14 290 / 0.28)",
  },
  normal: {
    label: "Normal", icon: Star,
    color:  "oklch(0.55 0.10 330)",
    bg:     "oklch(0.72 0.10 330 / 0.10)",
    border: "oklch(0.72 0.10 330 / 0.30)",
  },
};

const M = {
  ink:    "oklch(0.28 0.040 320)",
  muted:  "oklch(0.52 0.040 330)",
  border: "oklch(0.82 0.050 340)",
  card:   "oklch(0.975 0.018 355)",
  bg:     "oklch(0.960 0.030 355)",
  coral:  "oklch(0.58 0.18 340)",
};

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.65rem",
  fontWeight: 500,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: M.muted,
};

interface TaskManagerProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  defaultContext?: ActiveContext;
  /** Shared category list from Home */
  allCategories?: string[];
  /** Called when user wants to delete a custom tag */
  onDeleteCategory?: (ctx: string) => void;
  /** All goals — used for 'Contributes to goal' dropdown */
  goals?: Goal[];
}

/* Parse hashtags from input text — returns { cleanText, tag }
 * Only the #tag token is stripped; the rest of the text is preserved exactly.
 * Example: "work out #workout" → { cleanText: "work out", tag: "workout" }
 */
function parseHashtag(raw: string): { cleanText: string; tag: string | null } {
  const match = raw.match(/(^|\s)#([\w-]+)(\s|$)/);
  if (!match) return { cleanText: raw.trim(), tag: null };
  // Remove only the matched #tag token (with surrounding spaces collapsed)
  const cleanText = raw.replace(/(^|\s)#[\w-]+(\s|$)/g, " ").replace(/\s{2,}/g, " ").trim();
  return { cleanText, tag: match[2].toLowerCase() };
}

export function TaskManager({ tasks, onTasksChange, defaultContext = "all", allCategories, onDeleteCategory, goals = [] }: TaskManagerProps) {
  const [newTaskText,     setNewTaskText]     = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("focus");
  const [newTaskContext,  setNewTaskContext]  = useState<ItemContext>("work");
  const [newTaskGoalId,   setNewTaskGoalId]   = useState<string | null>(null);
  const [completingId,    setCompletingId]    = useState<string | null>(null);
  const [activeContext,   setActiveContext]   = useState<ActiveContext>(defaultContext);
  const [filter,          setFilter]          = useState<"all" | "active" | "done">("active");
  // Inline editing state
  const [editingTaskId,   setEditingTaskId]   = useState<string | null>(null);
  const [editPopoverPos,  setEditPopoverPos]  = useState<{ top: number; left: number; width?: number } | null>(null);
  const [aiEditInput,    setAiEditInput]    = useState("");
  const [aiEditing,      setAiEditing]      = useState(false);
  const [editContext,     setEditContext]      = useState<ItemContext>("work");
  const [editGoalId,      setEditGoalId]       = useState<string | null>(null);
  const [editPriority,    setEditPriority]     = useState<TaskPriority>("focus");
  const editPopoverRef = useRef<HTMLDivElement>(null);
  // Quadrant map: taskId → quadrantId (persisted in component state)
  const [quadrantMap, setQuadrantMap]         = useState<Record<string, QuadrantId>>(() => {
    try {
      const saved = localStorage.getItem("adhd-quadrant-map");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  function handleQuadrantMapChange(map: Record<string, QuadrantId>) {
    setQuadrantMap(map);
    try { localStorage.setItem("adhd-quadrant-map", JSON.stringify(map)); } catch {}
  }

  // Collect all unique contexts — prefer shared list from Home, fall back to deriving from tasks
  const allContexts = allCategories ?? Array.from(new Set(["work", "personal", ...tasks.map((t) => t.context)]));

  // Detect hashtag in current input for live preview
  const { tag: liveTag } = parseHashtag(newTaskText);

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const { cleanText, tag } = parseHashtag(newTaskText);
    // If a hashtag was typed, use it. Otherwise use the currently active tab
    // (unless it's "all", in which case fall back to the manual context selector).
    const context = tag ?? (activeContext !== "all" ? (activeContext as ItemContext) : newTaskContext);
    const task: Task = {
      id: nanoid(), text: cleanText || newTaskText.trim(),
      priority: newTaskPriority, context,
      done: false, createdAt: new Date(),
      ...(newTaskGoalId ? { goalId: newTaskGoalId } : {}),
    };
    onTasksChange([task, ...tasks]);
    setNewTaskText("");
    setNewTaskGoalId(null);
  };

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (!task.done) {
      setCompletingId(id);
      setTimeout(() => {
        onTasksChange(tasks.map((t) => t.id === id ? { ...t, done: true } : t));
        setCompletingId(null);
              }, 400);
    } else {
      onTasksChange(tasks.map((t) => t.id === id ? { ...t, done: false } : t));
    }
  };

  const deleteTask = (id: string) => onTasksChange(tasks.filter((t) => t.id !== id));

  // Open inline edit popover for a task
  const openEdit = (task: Task, e?: React.MouseEvent) => {
    setEditingTaskId(task.id);
    setEditContext(task.context);
    setEditGoalId(task.goalId ?? null);
    setEditPriority(task.priority);
    setEditPopoverPos(null); // reset first to avoid flash at 0,0
    if (e) {
      // Use rAF so the popover only renders after position is known
      requestAnimationFrame(() => {
        const row = (e.currentTarget as HTMLElement).closest('.retro-task-row');
        const rect = row?.getBoundingClientRect() ?? (e.currentTarget as HTMLElement).getBoundingClientRect();
        setEditPopoverPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      });
    }
  };

  // Save inline edits
  const saveEdit = (taskId: string) => {
    onTasksChange(tasks.map((t) =>
      t.id === taskId
        ? { ...t, context: editContext, goalId: editGoalId ?? undefined, priority: editPriority }
        : t
    ));
    setEditingTaskId(null);
    toast("Task updated.", { duration: 1500 });
  };

  // AI-powered edit
  const handleAiEdit = async (taskId: string) => {
    if (!aiEditInput.trim()) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setAiEditing(true);
    try {
      const result = await callAI(
        `You update task fields based on a user instruction. Return ONLY valid JSON with changed fields:
{"text":"...","priority":"urgent|focus|normal|someday","context":"work|personal"}
Only include fields that should change. Valid priorities: urgent, focus, normal, someday.`,
        `Task: "${task.text}" (current priority: ${task.priority}, context: ${task.context})
Instruction: ${aiEditInput.trim()}`
      );
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        const changes = JSON.parse(match[0]) as Partial<Task>;
        onTasksChange(tasks.map((t) =>
          t.id === taskId ? { ...t, ...changes } : t
        ));
        toast("Task updated by AI.", { duration: 1500 });
        setEditingTaskId(null);
        setAiEditInput("");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI edit failed";
      if (msg !== "no-key" && msg !== "invalid-key") toast.error(msg);
    } finally {
      setAiEditing(false);
    }
  };

  // Close without saving
  const closeEdit = () => { setEditingTaskId(null); setAiEditInput(""); };

  // Close popover when clicking outside
  useEffect(() => {
    if (!editingTaskId) return;
    const handler = (e: MouseEvent) => {
      if (editPopoverRef.current && !editPopoverRef.current.contains(e.target as Node)) {
        setEditingTaskId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editingTaskId]);

  // Build counts for all known contexts
  const counts: Record<string, number> = { all: tasks.filter((t) => !t.done).length };
  allContexts.forEach((ctx) => {
    counts[ctx] = tasks.filter((t) => !t.done && t.context === ctx).length;
  });

  const contextFiltered = tasks.filter((t) => activeContext === "all" ? true : t.context === activeContext);
  const sorted = [...contextFiltered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const order: TaskPriority[] = ["urgent", "focus", "normal"];
    return order.indexOf(a.priority) - order.indexOf(b.priority);
  });
  const filtered = sorted.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done")   return t.done;
    return true;
  });

  const activeCount = contextFiltered.filter((t) => !t.done).length;
  const doneCount   = contextFiltered.filter((t) => t.done).length;

  const CAT_PURPLE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/cat3_purple_sitting_e38dc6af.png";
  return (
    <div className="flex flex-col gap-4 h-full" style={{ position: "relative" }}>
      {/* Cat sticker: purple sitting cat — top-right corner */}
      <img src={CAT_PURPLE} alt="" aria-hidden="true" style={{ position: "absolute", top: 0, right: 0, width: 64, opacity: 0.40, pointerEvents: "none", zIndex: 5 }} />
      {/* Context switcher — shows all known categories */}
      <ContextSwitcher active={activeContext} onChange={setActiveContext} counts={counts} contexts={allContexts} onDeleteContext={onDeleteCategory} label="FILTER TASKS BY TAG" />

      {/* Add task */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="task name... #yoga #reading"
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
            onClick={addTask}
            className="m-btn-primary shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {/* Live hashtag preview */}
        {liveTag && (
          <div className="flex items-center gap-1.5" style={{ fontSize: "0.7rem", color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: M.coral }}>◆</span>
            Will be added to category{" "}
            <span
              className="px-2 py-0.5 font-medium"
              style={{ background: M.coral + "15", color: M.coral, border: `1px solid ${M.coral}30`, fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", letterSpacing: "0.06em" }}
            >
              #{liveTag}
            </span>
          </div>
        )}

        {/* Priority + context row */}
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => {
            const { label, icon: Icon, color, bg, border } = PRIORITY_CONFIG[p];
            const isActive = newTaskPriority === p;
            return (
              <button
                key={p}
                onClick={() => setNewTaskPriority(p)}
                className="flex items-center gap-1.5 px-3 py-1 transition-all"
                style={{
                  background:  isActive ? bg : "transparent",
                  color:       isActive ? color : M.muted,
                  border:      `1px solid ${isActive ? border : M.border}`,
                  fontFamily:  "'DM Sans', sans-serif",
                  fontSize:    "0.62rem",
                  fontWeight:  isActive ? 600 : 400,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  borderRadius: 0,
                }}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}

          {/* Contributes to goal — only shown when goals exist */}
          {goals.length > 0 && (
            <select
              value={newTaskGoalId ?? ""}
              onChange={(e) => setNewTaskGoalId(e.target.value || null)}
              style={{
                background: newTaskGoalId ? "oklch(0.52 0.14 290 / 0.10)" : "transparent",
                color: newTaskGoalId ? "oklch(0.40 0.14 290)" : M.muted,
                border: `1px solid ${newTaskGoalId ? "oklch(0.52 0.14 290 / 0.40)" : M.border}`,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.62rem",
                fontWeight: newTaskGoalId ? 600 : 400,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                borderRadius: 0,
                padding: "3px 8px",
                cursor: "pointer",
                outline: "none",
                maxWidth: 180,
              }}
            >
              <option value="">↳ Goal (optional)</option>
              {goals.filter((g) => g.progress < 100).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.text.length > 28 ? g.text.slice(0, 28) + "…" : g.text}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 text-xs" style={{ borderBottom: `1px solid ${M.border}` }}>
        {[
          { id: "active", label: `Active (${activeCount})` },
          { id: "done",   label: `Done (${doneCount})` },
          { id: "all",    label: "All" },
        ].map(({ id, label }) => {
          const isAct = filter === id;
          return (
            <button
              key={id}
              onClick={() => setFilter(id as typeof filter)}
              className="px-4 py-2 transition-all"
              style={{
                color:        isAct ? M.coral : M.muted,
                borderBottom: isAct ? `2px solid ${M.coral}` : "2px solid transparent",
                fontFamily:   "'DM Sans', sans-serif",
                fontWeight:   isAct ? 600 : 400,
                fontSize:     "0.68rem",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Task list — retro dashed-border rows with icon box + dotted connectors */}
      <div className="flex-1 overflow-y-auto pr-1 retro-task-list">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ opacity: 0.18 }}>
              <rect x="8" y="8" width="24" height="24" rx="2" fill="none" stroke={M.muted} strokeWidth="1.5" />
              <line x1="14" y1="20" x2="26" y2="20" stroke={M.muted} strokeWidth="1" />
              <line x1="20" y1="14" x2="20" y2="26" stroke={M.muted} strokeWidth="1" />
            </svg>
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
              {filter === "active" ? "All clear." : "Nothing here."}
            </p>
          </div>
        )}

        {filtered.map((task) => {
          const pcfg        = PRIORITY_CONFIG[task.priority];
          const PIcon       = pcfg.icon;
          const isCompleting = completingId === task.id;
          const isEditing    = editingTaskId === task.id;
          const cleanText = task.text.replace(/(?:^|\s)#[a-zA-Z0-9\u4e00-\u9fa5_-]+/g, " ").replace(/\s{2,}/g, " ").trim() || task.text;

          return (
            <div
              key={task.id}
              className={cn("retro-task-row group", task.priority, task.done ? "done" : "")}
              style={{
                opacity: isCompleting ? 0.5 : 1,
                transform: isCompleting ? "scale(0.98)" : undefined,
                transition: "all 0.3s ease",
                alignItems: "flex-start",
                position: "relative",
              }}
            >
              {/* Left: priority icon box */}
              <div style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                border: `1.5px solid ${pcfg.border}`,
                borderRadius: 4,
                background: pcfg.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}>
                <PIcon size={12} style={{ color: pcfg.color }} />
              </div>

              {/* Text + goal link */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(task.done && "line-through")}
                  style={{
                    color:      task.done ? M.muted : M.ink,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize:   "0.82rem",
                    fontWeight: task.done ? 300 : 500,
                    letterSpacing: "0.01em",
                    lineHeight: 1.4,
                  }}
                >
                  {cleanText}
                </p>
                {task.goalId && (() => {
                  const linkedGoal = goals.find((g) => g.id === task.goalId);
                  return linkedGoal ? (
                    <span style={{
                      display: "block",
                      fontSize: "0.62rem",
                      color: task.done ? M.muted : "oklch(0.40 0.09 145)",
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "0.06em",
                      marginTop: 1,
                    }}>
                      ↳ {linkedGoal.text.length > 30 ? linkedGoal.text.slice(0, 30) + "…" : linkedGoal.text}
                    </span>
                  ) : null;
                })()}

                {/* Inline edit popover */}
                {isEditing && editPopoverPos && (
                  <div
                    ref={editPopoverRef}
                    style={{
                      position: "fixed",
                      top: editPopoverPos.top,
                      left: editPopoverPos.left,
                      width: editPopoverPos.width ?? 280,
                      zIndex: 9999,
                      background: "#fdf4f8",
                      border: "1.5px solid #d4a0c0",
                      borderRadius: 6,
                      padding: "10px 12px",
                      boxShadow: "0 8px 24px rgba(180,60,120,0.22), 0 2px 0 #d4a0c0",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {/* Task text (read-only) */}
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: M.ink, fontWeight: 500, marginBottom: 2 }}>{task.text}</p>

                    {/* AI edit input */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        autoFocus
                        value={aiEditInput}
                        onChange={(e) => setAiEditInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiEdit(task.id); } if (e.key === "Escape") closeEdit(); }}
                        placeholder='e.g. "make urgent" · "change to personal" · "link to goal X"'
                        autoComplete="off"
                        style={{
                          flex: 1, padding: "5px 9px",
                          border: `1.5px solid #d4a0c0`,
                          borderRadius: 4, background: "white",
                          fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem",
                          color: M.ink, outline: "none",
                        }}
                      />
                      <button
                        onClick={() => handleAiEdit(task.id)}
                        disabled={aiEditing || !aiEditInput.trim()}
                        style={{
                          flexShrink: 0, padding: "5px 10px", borderRadius: 4,
                          background: aiEditInput.trim() ? M.coral : "transparent",
                          border: `1.5px solid ${aiEditInput.trim() ? M.coral : "#d4a0c0"}`,
                          color: aiEditInput.trim() ? "white" : M.muted,
                          cursor: aiEditing || !aiEditInput.trim() ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", gap: 4,
                          fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.08em",
                        }}
                      >
                        {aiEditing ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={10} />}
                        {aiEditing ? "…" : "Apply"}
                      </button>
                      <button
                        onClick={closeEdit}
                        style={{
                          flexShrink: 0, padding: "5px 7px", borderRadius: 4,
                          background: "transparent", border: `1px solid #d4a0c0`,
                          color: M.muted, cursor: "pointer",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.50rem", color: M.muted, opacity: 0.7 }}>Press Enter to apply · Esc to cancel</p>
                  </div>
                )}
              </div>

              {/* Right side: context badge + edit button + checkbox + delete */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginTop: 2 }}>
                {/* Context badge */}
                <ContextBadge context={task.context} />
                {/* Edit button — appears on hover */}
                {!task.done && (
                  <button
                    onClick={() => isEditing ? closeEdit() : openEdit(task)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit task details"
                    style={{ color: isEditing ? M.coral : M.muted }}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                {/* Checkbox */}
                <button
                  onClick={() => toggleTask(task.id)}
                  className="flex-shrink-0 transition-all hover:scale-110"
                  style={{ color: task.done ? pcfg.color : "oklch(0.82 0.012 72)" }}
                >
                  {task.done
                    ? <CheckCircle2 className="w-4 h-4" />
                    : <Circle       className="w-4 h-4" />
                  }
                </button>
                {/* Delete */}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: M.muted }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Eisenhower Matrix ── */}
      <EisenhowerMatrix
        tasks={tasks}
        onTasksChange={onTasksChange}
        quadrantMap={quadrantMap}
        onQuadrantMapChange={handleQuadrantMapChange}
      />
    </div>
  );
}

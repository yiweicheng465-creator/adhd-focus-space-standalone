/* ============================================================
   ADHD FOCUS SPACE — Calendar Task View
   Views: Week (7 days, scrollable columns) | Month (grid)
   - No due date → today
   - Drag task to date → updates dueDate
   - Week: ← → navigation, infinite forward
   - Month: shows full month grid
   ============================================================ */

import React, { useState } from "react";
import type { Task } from "./TaskManager";
import { ChevronLeft, ChevronRight, List, CalendarDays } from "lucide-react";

const M = {
  ink:     "oklch(0.28 0.040 320)",
  muted:   "oklch(0.52 0.040 330)",
  border:  "oklch(0.82 0.050 340)",
  card:    "oklch(0.975 0.018 355)",
  coral:   "oklch(0.58 0.18 340)",
  coralBg: "oklch(0.58 0.18 340 / 0.08)",
  coralBdr:"oklch(0.58 0.18 340 / 0.28)",
  bg:      "oklch(0.965 0.025 355)",
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "oklch(0.52 0.10 32)",
  focus:  "oklch(0.52 0.14 290)",
  normal: "oklch(0.55 0.10 330)",
  someday:"oklch(0.62 0.04 330)",
};

const WEEKDAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function toYMD(d: Date): string { return d.toISOString().slice(0,10); }
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const r = new Date(d); r.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); r.setHours(0,0,0,0); return r;
}
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }

interface Props {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onTaskToggle: (id: string) => void;
}

export function CalendarView({ tasks, onTasksChange, onTaskToggle }: Props) {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayYMD = toYMD(today);

  const [calView, setCalView] = useState<"week" | "month">("week");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [monthStart, setMonthStart] = useState(() => startOfMonth(today));
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // dragOverTask: when hovering over a specific task (for within-day reorder)
  const [dragOverTask, setDragOverTask] = useState<{ id: string; pos: "before" | "after" } | null>(null);
  const dragOverTaskRef = React.useRef<{ id: string; pos: "before" | "after" } | null>(null);
  // dayOrder: persisted per-day task ordering (date → ordered task IDs)
  const [dayOrder, setDayOrder] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem("adhd-calendar-day-order") ?? "{}"); } catch { return {}; }
  });

  function saveDayOrder(newOrder: Record<string, string[]>) {
    setDayOrder(newOrder);
    try { localStorage.setItem("adhd-calendar-day-order", JSON.stringify(newOrder)); } catch {}
  }

  function getTasksForDay(ymd: string): Task[] {
    const base = tasks
      .filter(t => !t.done)
      .filter(t => (t.dueDate ?? todayYMD) === ymd);
    const order = dayOrder[ymd];
    if (!order || !order.length) {
      return base.sort((a, b) => {
        const o = ["urgent","focus","normal","someday"];
        return o.indexOf(a.priority) - o.indexOf(b.priority);
      });
    }
    // Apply saved order, append any new tasks not yet in order
    const ordered = order.map(id => base.find(t => t.id === id)).filter(Boolean) as Task[];
    const unordered = base.filter(t => !order.includes(t.id));
    return [...ordered, ...unordered];
  }

  function handleDrop(targetYMD: string, targetTaskId?: string) {
    if (!dragId) return;
    const task = tasks.find(t => t.id === dragId);
    if (!task) return;

    const sourceYMD = task.dueDate ?? todayYMD;

    if (targetTaskId && targetTaskId !== dragId) {
      // Within-day or cross-day reorder onto a specific task
      const finalYMD = targetYMD;
      // Move task to targetYMD if different
      if (sourceYMD !== finalYMD) {
        const newDue = (finalYMD === todayYMD && !task.dueDate) ? undefined : finalYMD;
        onTasksChange(tasks.map(t => t.id === dragId ? { ...t, dueDate: newDue } : t));
      }
      // Reorder within that day
      const dayTasks = getTasksForDay(finalYMD).map(t => t.id).filter(id => id !== dragId);
      const targetIdx = dayTasks.indexOf(targetTaskId);
      const insertIdx = dragOverTask?.pos === "before" ? targetIdx : targetIdx + 1;
      dayTasks.splice(Math.max(0, insertIdx), 0, dragId);
      saveDayOrder({ ...dayOrder, [finalYMD]: dayTasks });
    } else if (!targetTaskId) {
      // Dropped on empty column area — just move to that day, append at end
      const newDue = (targetYMD === todayYMD && !task.dueDate) ? undefined : targetYMD;
      onTasksChange(tasks.map(t => t.id === dragId ? { ...t, dueDate: newDue } : t));
    }

    setDragId(null); setDragOverDate(null); setDragOverTask(null);
  }

  // ── Compact task chip ───────────────────────────────────────────────────────
  function TaskChip({ task, dayYMD }: { task: Task; dayYMD: string }) {
    const isOver = dragOverTask?.id === task.id;
    return (
      <div style={{ position: "relative" }}>
        {isOver && dragOverTask?.pos === "before" && (
          <div style={{ height: 2, background: M.coral, borderRadius: 1, marginBottom: 2 }} />
        )}
        <div
          draggable
          onDragStart={(e) => { e.stopPropagation(); setDragId(task.id); }}
          onDragEnd={() => { setDragId(null); setDragOverDate(null); setDragOverTask(null); }}
          onDragOver={(e) => {
            e.preventDefault(); e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const pos = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
            setDragOverTask({ id: task.id, pos });
            setDragOverDate(dayYMD);
          }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(dayYMD, task.id); }}
          title={task.text}
          style={{
            background: "#fff",
            border: `1px solid ${isOver ? M.coral : M.border}`,
            borderLeft: `3px solid ${PRIORITY_COLOR[task.priority] ?? M.coral}`,
            borderRadius: 3, padding: "2px 5px",
            cursor: "grab", opacity: dragId === task.id ? 0.4 : 1,
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <button
            onClick={() => onTaskToggle(task.id)}
            style={{
              flexShrink: 0, width: 10, height: 10, borderRadius: "50%",
              border: `1.5px solid ${PRIORITY_COLOR[task.priority] ?? M.muted}`,
              background: "transparent", cursor: "pointer", padding: 0,
            }}
          />
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.60rem",
            color: M.ink, lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            flex: 1,
          }}>
            {task.text}
          </span>
        </div>
        {isOver && dragOverTask?.pos === "after" && (
          <div style={{ height: 2, background: M.coral, borderRadius: 1, marginTop: 2 }} />
        )}
      </div>
    );
  }

  // ── Day column (week view) ──────────────────────────────────────────────────
  function DayColumn({ day }: { day: Date }) {
    const ymd = toYMD(day);
    const isToday = ymd === todayYMD;
    const isPast = day < today;
    const isOver = dragOverDate === ymd;
    const dayTasks = getTasksForDay(ymd);

    return (
      <div
        onDragOver={e => { e.preventDefault(); setDragOverDate(ymd); }}
        onDragLeave={() => setDragOverDate(null)}
        onDrop={() => handleDrop(ymd)}
        style={{
          flex: 1, display: "flex", flexDirection: "column",
          background: isToday ? M.coralBg : isOver ? "oklch(0.97 0.018 340)" : "transparent",
          border: isToday ? `1.5px solid ${M.coralBdr}` : isOver ? `1.5px dashed ${M.coral}` : `1px solid ${M.border}`,
          borderRadius: 6, minWidth: 0,
          transition: "background 0.1s",
        }}
      >
        {/* Header — click to open day detail */}
        <div
          onClick={() => setSelectedDay(ymd)}
          style={{ padding: "5px 6px 4px", borderBottom: `1px solid ${M.border}`, flexShrink: 0, cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.44rem", letterSpacing: "0.06em", textTransform: "uppercase", color: isToday ? M.coral : isPast ? M.muted : M.ink, margin: 0 }}>
              {WEEKDAYS_SHORT[(day.getDay() + 6) % 7]}
            </p>
            {dayTasks.length > 0 && (
              <span style={{ fontSize: "0.42rem", fontFamily: "'Space Mono', monospace", color: isToday ? M.coral : M.muted, background: isToday ? `${M.coral}15` : `${M.muted}18`, borderRadius: 8, padding: "0 4px", lineHeight: "14px" }}>
                {dayTasks.length}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.90rem", fontWeight: 700, margin: 0, color: isToday ? M.coral : isPast ? M.muted : M.ink }}>
              {day.getDate()}
            </p>
            {isToday && <div style={{ width: 4, height: 4, borderRadius: "50%", background: M.coral, flexShrink: 0 }} />}
          </div>
        </div>

        {/* Tasks — scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "5px 4px", minHeight: 60, maxHeight: 280 }}>
          {dayTasks.map(t => <TaskChip key={t.id} task={t} dayYMD={ymd} />)}
          {isOver && dragId && (
            <div style={{ textAlign: "center", fontSize: "0.48rem", fontFamily: "'Space Mono', monospace", color: M.coral, opacity: 0.8 }}>
              drop here
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Week view ───────────────────────────────────────────────────────────────
  function WeekView() {
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => setWeekStart(d => addDays(d, -7))} style={{ background: "none", border: "none", cursor: "pointer", color: M.muted, display: "flex" }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.08em", color: M.muted, textTransform: "uppercase" }}>
            {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {addDays(weekStart, 6).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <button onClick={() => setWeekStart(d => addDays(d, 7))} style={{ background: "none", border: "none", cursor: "pointer", color: M.muted, display: "flex" }}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 4, flex: 1, minHeight: 0 }}>
          {days.map(d => <DayColumn key={toYMD(d)} day={d} />)}
        </div>
      </div>
    );
  }

  // ── Month view ──────────────────────────────────────────────────────────────
  function MonthView() {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
    const totalCells = startOffset + lastDay.getDate();
    const rows = Math.ceil(totalCells / 7);
    const cells = Array.from({ length: rows * 7 }, (_, i) => {
      const dayNum = i - startOffset + 1;
      if (dayNum < 1 || dayNum > lastDay.getDate()) return null;
      return new Date(year, month, dayNum);
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => setMonthStart(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} style={{ background: "none", border: "none", cursor: "pointer", color: M.muted, display: "flex" }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", fontWeight: 700, color: M.ink }}>
            {MONTHS[month]} {year}
          </span>
          <button onClick={() => setMonthStart(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} style={{ background: "none", border: "none", cursor: "pointer", color: M.muted, display: "flex" }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {WEEKDAYS_SHORT.map(d => (
            <div key={d} style={{ textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: "0.48rem", letterSpacing: "0.08em", color: M.muted, textTransform: "uppercase", padding: "2px 0" }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, flex: 1, minHeight: 0, overflowY: "auto" }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const ymd = toYMD(day);
            const isToday = ymd === todayYMD;
            const isPast = day < today;
            const isOver = dragOverDate === ymd;
            const dayTasks = getTasksForDay(ymd);

            return (
              <div
                key={ymd}
                onDragOver={e => { e.preventDefault(); setDragOverDate(ymd); }}
                onDragLeave={() => setDragOverDate(null)}
                onDrop={() => handleDrop(ymd)}
                style={{
                  border: isToday ? `1.5px solid ${M.coralBdr}` : isOver ? `1.5px dashed ${M.coral}` : `1px solid ${M.border}`,
                  borderRadius: 4, padding: "3px 3px 4px",
                  background: isToday ? M.coralBg : isOver ? "oklch(0.97 0.018 340)" : "transparent",
                  minHeight: 52, overflow: "hidden",
                }}
              >
                <div style={{ textAlign: "right", fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", fontWeight: isToday ? 700 : 400, color: isToday ? M.coral : isPast ? M.muted : M.ink, marginBottom: 2 }}>
                  {day.getDate()}
                </div>
                {dayTasks.slice(0, 3).map(t => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => { setDragId(null); setDragOverDate(null); }}
                    title={t.text}
                    style={{
                      background: PRIORITY_COLOR[t.priority] + "22",
                      borderLeft: `2px solid ${PRIORITY_COLOR[t.priority] ?? M.coral}`,
                      borderRadius: 2, padding: "1px 3px",
                      fontFamily: "'DM Sans', sans-serif", fontSize: "0.52rem",
                      color: M.ink, overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap", cursor: "grab", marginBottom: 1,
                      opacity: dragId === t.id ? 0.4 : 1,
                    }}
                  >
                    {t.text}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.42rem", color: M.muted }}>
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
      {/* View toggle */}
      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
        {(["week","month"] as const).map(v => (
          <button
            key={v}
            onClick={() => setCalView(v)}
            style={{
              padding: "2px 10px", borderRadius: 3, fontSize: "0.58rem",
              fontFamily: "'Space Mono', monospace", letterSpacing: "0.06em",
              border: `1px solid ${calView === v ? M.coral : M.border}`,
              background: calView === v ? M.coralBg : "transparent",
              color: calView === v ? M.coral : M.muted,
              cursor: "pointer", textTransform: "uppercase" as const,
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {calView === "week" ? <WeekView /> : <MonthView />}

      {/* Day Detail Modal */}
      {selectedDay && (
        <DayDetailModal
          selectedDay={selectedDay}
          onClose={() => setSelectedDay(null)}
          getTasksForDay={getTasksForDay}
          dayOrder={dayOrder}
          saveDayOrder={saveDayOrder}
          dragId={dragId}
          setDragId={setDragId}
          dragOverTask={dragOverTask}
          setDragOverTask={setDragOverTask}
          onTaskToggle={onTaskToggle}
          PRIORITY_COLOR={PRIORITY_COLOR}
          M={M}
        />
      )}
    </div>
  );
}
// ── Day Detail Modal — proper component so useState is valid ─────────────────
function DayDetailModal({ selectedDay, onClose, getTasksForDay, dayOrder, saveDayOrder, dragId, setDragId, dragOverTask, setDragOverTask, onTaskToggle, PRIORITY_COLOR, M }: {
  selectedDay: string; onClose: () => void;
  getTasksForDay: (ymd: string) => Task[];
  dayOrder: Record<string, string[]>;
  saveDayOrder: (o: Record<string, string[]>) => void;
  dragId: string | null; setDragId: (id: string | null) => void;
  dragOverTask: { id: string; pos: "before" | "after" } | null;
  setDragOverTask: (v: { id: string; pos: "before" | "after" } | null) => void;
  onTaskToggle: (id: string) => void;
  PRIORITY_COLOR: Record<string, string>;
  M: Record<string, string>;
}) {
  const [filterCtx, setFilterCtx] = useState<string>("all");
  const dayTasks = getTasksForDay(selectedDay);
  const dayDate = new Date(selectedDay + "T00:00:00");
  const allContexts = Array.from(new Set(dayTasks.map(t => t.context)));
  const filtered = filterCtx === "all" ? dayTasks : dayTasks.filter(t => t.context === filterCtx);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(140,40,90,0.18)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ background: "#fdf4f8", borderRadius: 16, width: "min(480px, 94vw)", maxHeight: "75vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(140,40,90,0.28), 0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid oklch(0.82 0.050 340)", background: "#F9D6E8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 700, color: "oklch(0.28 0.040 320)", fontStyle: "italic" }}>
            {dayDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "oklch(0.52 0.040 330)" }}>×</button>
        </div>
        {allContexts.length > 1 && (
          <div style={{ padding: "8px 14px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["all", ...allContexts].map(ctx => (
              <button key={ctx} onClick={() => setFilterCtx(ctx)}
                style={{ fontSize: "0.58rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.06em", padding: "2px 8px", borderRadius: 10, border: `1px solid ${filterCtx === ctx ? M.coral : M.border}`, background: filterCtx === ctx ? M.coralBg : "transparent", color: filterCtx === ctx ? M.coral : M.muted, cursor: "pointer", textTransform: "uppercase" as const }}>
                {ctx}
              </button>
            ))}
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
          {filtered.length === 0
            ? <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: M.muted, fontStyle: "italic" }}>No tasks for this day.</p>
            : filtered.map((task, i) => (
              <div key={task.id} draggable
                onDragStart={() => setDragId(task.id)}
                onDragEnd={() => { setDragId(null); setDragOverTask(null); }}
                onDragOver={(e) => {
                  e.preventDefault();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setDragOverTask({ id: task.id, pos: e.clientY < rect.top + rect.height / 2 ? "before" : "after" });
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!dragId || dragId === task.id) return;
                  const curOrder = getTasksForDay(selectedDay).map(t => t.id).filter(id => id !== dragId);
                  const targetIdx = curOrder.indexOf(task.id);
                  const insertIdx = dragOverTask?.pos === "before" ? targetIdx : targetIdx + 1;
                  curOrder.splice(Math.max(0, insertIdx), 0, dragId);
                  saveDayOrder({ ...dayOrder, [selectedDay]: curOrder });
                  setDragId(null); setDragOverTask(null);
                }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", cursor: "grab",
                  borderBottom: i < filtered.length - 1 ? `1px solid oklch(0.82 0.050 340)` : "none",
                  borderTop: dragOverTask?.id === task.id && dragOverTask.pos === "before" ? `2px solid oklch(0.58 0.18 340)` : "none",
                }}>
                <button onClick={() => onTaskToggle(task.id)} style={{ flexShrink: 0, width: 14, height: 14, borderRadius: "50%", border: `1.5px solid ${PRIORITY_COLOR[task.priority] ?? "oklch(0.58 0.18 340)"}`, background: "transparent", cursor: "pointer", padding: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: M.ink }}>{task.text}</span>
                  {(() => {
                    const totalSlots = Math.max(filtered.length, 1);
                    const minPerSlot = ((18 - 9) * 60) / totalSlots;
                    const slotMin = Math.round(9 * 60 + i * minPerSlot);
                    const h = Math.floor(slotMin / 60);
                    const m = slotMin % 60;
                    const timeStr = `${h > 12 ? h - 12 : h}:${m.toString().padStart(2,"0")}${h >= 12 ? "pm" : "am"}`;
                    return <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.48rem", color: M.muted, opacity: 0.65 }}>{timeStr}</span>;
                  })()}
                </div>
                <span style={{ fontSize: "0.48rem", fontFamily: "'Space Mono', monospace", color: M.muted, textTransform: "uppercase" as const }}>{task.context}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

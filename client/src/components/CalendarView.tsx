/* ============================================================
   ADHD FOCUS SPACE — Calendar Task View
   - 7-day week view, today highlighted
   - Tasks without dueDate → today column
   - Drag task to another day → updates dueDate
   - Nav arrows to prev/next week
   ============================================================ */

import { useState, useRef } from "react";
import type { Task } from "./TaskManager";
import { ChevronLeft, ChevronRight } from "lucide-react";

const M = {
  ink:    "oklch(0.28 0.040 320)",
  muted:  "oklch(0.52 0.040 330)",
  border: "oklch(0.82 0.050 340)",
  card:   "oklch(0.975 0.018 355)",
  coral:  "oklch(0.58 0.18 340)",
  coralBg:"oklch(0.58 0.18 340 / 0.08)",
  coralBdr:"oklch(0.58 0.18 340 / 0.28)",
};

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day); // Monday start
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0,0,0,0);
  return mon;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toYMD(d: Date): string {
  return d.toISOString().slice(0,10);
}

interface Props {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onTaskToggle: (id: string) => void;
}

export function CalendarView({ tasks, onTasksChange, onTaskToggle }: Props) {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayYMD = toYMD(today);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group tasks by date: no dueDate → today
  function getTasksForDay(ymd: string): Task[] {
    return tasks
      .filter((t) => !t.done)
      .filter((t) => {
        const due = t.dueDate ?? todayYMD;
        return due === ymd;
      })
      .sort((a, b) => {
        const order = ["urgent","focus","normal","someday"];
        return order.indexOf(a.priority) - order.indexOf(b.priority);
      });
  }

  function handleDrop(targetYMD: string) {
    if (!dragId) return;
    const task = tasks.find(t => t.id === dragId);
    if (!task) return;
    // If dropped on today and task had no dueDate, just clear it
    const newDue = targetYMD === todayYMD && !task.dueDate ? undefined : targetYMD;
    onTasksChange(tasks.map(t =>
      t.id === dragId ? { ...t, dueDate: newDue } : t
    ));
    setDragId(null);
    setDragOverDate(null);
  }

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: "oklch(0.52 0.10 32)",
    focus:  "oklch(0.52 0.14 290)",
    normal: "oklch(0.55 0.10 330)",
    someday:"oklch(0.62 0.04 330)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      {/* Week navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0 10px" }}>
        <button
          onClick={() => setWeekStart(d => addDays(d, -7))}
          style={{ background: "none", border: "none", cursor: "pointer", color: M.muted, display: "flex", alignItems: "center" }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.60rem", letterSpacing: "0.10em", color: M.muted, textTransform: "uppercase" }}>
          {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          {" – "}
          {addDays(weekStart, 6).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <button
          onClick={() => setWeekStart(d => addDays(d, 7))}
          style={{ background: "none", border: "none", cursor: "pointer", color: M.muted, display: "flex", alignItems: "center" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, flex: 1, minHeight: 0 }}>
        {days.map((day, i) => {
          const ymd = toYMD(day);
          const isToday = ymd === todayYMD;
          const isPast = day < today;
          const isOver = dragOverDate === ymd;
          const dayTasks = getTasksForDay(ymd);

          return (
            <div
              key={ymd}
              onDragOver={(e) => { e.preventDefault(); setDragOverDate(ymd); }}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={() => handleDrop(ymd)}
              style={{
                display: "flex", flexDirection: "column", gap: 4,
                background: isToday ? M.coralBg : isOver ? "oklch(0.96 0.018 340)" : "transparent",
                border: isToday ? `1.5px solid ${M.coralBdr}` : isOver ? `1.5px dashed ${M.coral}` : `1px solid ${M.border}`,
                borderRadius: 6,
                padding: "6px 5px",
                minHeight: 120,
                transition: "background 0.1s",
              }}
            >
              {/* Day header */}
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <p style={{
                  fontFamily: "'Space Mono', monospace", fontSize: "0.50rem",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  color: isToday ? M.coral : isPast ? M.muted : M.ink,
                  margin: 0,
                }}>
                  {DAYS[i]}
                </p>
                <p style={{
                  fontFamily: "'Playfair Display', serif", fontSize: "0.85rem",
                  fontWeight: 700, margin: 0,
                  color: isToday ? M.coral : isPast ? M.muted : M.ink,
                }}>
                  {day.getDate()}
                </p>
                {isToday && (
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: M.coral, margin: "2px auto 0" }} />
                )}
              </div>

              {/* Task chips */}
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragId(task.id)}
                  onDragEnd={() => { setDragId(null); setDragOverDate(null); }}
                  title={task.text}
                  style={{
                    background: "oklch(0.99 0.005 355)",
                    border: `1.5px solid ${M.border}`,
                    borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] ?? M.coral}`,
                    borderRadius: 3,
                    padding: "3px 5px",
                    cursor: "grab",
                    opacity: dragId === task.id ? 0.4 : 1,
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => onTaskToggle(task.id)}
                    style={{
                      flexShrink: 0, width: 12, height: 12, borderRadius: "50%",
                      border: `1.5px solid ${PRIORITY_COLORS[task.priority] ?? M.muted}`,
                      background: "transparent", cursor: "pointer", padding: 0,
                    }}
                  />
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: "0.62rem",
                    color: M.ink, lineHeight: 1.3, overflow: "hidden",
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as any,
                  }}>
                    {task.text}
                  </span>
                </div>
              ))}

              {/* Drop hint */}
              {isOver && dragId && (
                <div style={{
                  textAlign: "center", fontSize: "0.50rem",
                  fontFamily: "'Space Mono', monospace", color: M.coral,
                  letterSpacing: "0.06em", marginTop: 4,
                }}>
                  drop here
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

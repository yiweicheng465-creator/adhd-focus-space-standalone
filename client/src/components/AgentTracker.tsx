/* ============================================================
   ADHD FOCUS SPACE — AI Agent Tracker v3.0 (Morandi)
   Palette: coral primary, sage done, slumber paused, dusty rose failed
   No teal, no bright green, no vivid red
   ============================================================ */

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Clock, Copy, Flame,
  Link2, Pause, Play, Plus, RefreshCw, Sparkles, Trash2, X, XCircle,
} from "lucide-react";
import { PixelAgents } from "@/components/PixelIcons";
import { toast } from "sonner";
import { callAI } from "@/lib/ai";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";

function parseHashtag(raw: string): { cleanText: string; tag: string | null } {
  const match = raw.match(/(^|\s)#([\w-]+)(\s|$)/);
  if (!match) return { cleanText: raw.trim(), tag: null };
  const cleanText = raw.replace(/(^|\s)#[\w-]+(\s|$)/g, " ").replace(/\s{2,}/g, " ").trim();
  return { cleanText, tag: match[2].toLowerCase() };
}
import {
  ContextSwitcher, ContextBadge, getContextConfig,
  type ItemContext, type ActiveContext,
} from "./ContextSwitcher";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

/* ── URL-aware task text renderer ── */
const URL_RE = /(https?:\/\/[^\s]+)/g;
function renderTaskText(text: string) {
  const parts = text.split(URL_RE);
  return parts.map((part, i) => {
    if (URL_RE.test(part)) {
      URL_RE.lastIndex = 0; // reset after test
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="underline hover:opacity-70"
          style={{ color: "oklch(0.58 0.18 340)", wordBreak: "break-all" }}
        >
          {part.length > 40 ? part.slice(0, 40) + "…" : part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ── Morandi tokens ── */
const M = {
  coral:    "oklch(0.58 0.18 340)",
  coralBg:  "oklch(0.58 0.18 340 / 0.08)",
  coralBdr: "oklch(0.58 0.18 340 / 0.25)",
  sage:     "oklch(0.52 0.10 168)",
  sageBg:   "oklch(0.52 0.10 168 / 0.08)",
  sageBdr:  "oklch(0.52 0.10 168 / 0.25)",
  slumber:  "oklch(0.52 0.040 330)",
  slumBg:   "oklch(0.72 0.040 290 / 0.15)",
  slumBdr:  "oklch(0.72 0.040 290 / 0.40)",
  rose:     "oklch(0.72 0.08 290)",
  roseBg:   "oklch(0.72 0.08 290 / 0.08)",
  roseBdr:  "oklch(0.72 0.08 290 / 0.25)",
  ink:      "oklch(0.28 0.040 320)",
  muted:    "oklch(0.52 0.040 330)",
  border:   "oklch(0.82 0.050 340)",
  card:     "oklch(0.975 0.018 355 / 0.85)",
  surface:  "oklch(0.960 0.025 355 / 0.60)",
};

/* ── Types ── */
export type AgentStatus = "running" | "paused" | "done" | "failed";

export interface Agent {
  id: string;
  name: string;
  task: string;
  status: AgentStatus;
  context: ItemContext;
  linkedTaskId?: string;
  startedAt: Date;
  endedAt?: Date;
  notes?: string;
}

const STATUS_CONFIG: Record<AgentStatus, {
  label: string; icon: React.ElementType;
  color: string; bg: string; border: string;
}> = {
  running: { label: "Running", icon: Play,         color: M.coral,   bg: M.coralBg,  border: M.coralBdr },
  paused:  { label: "Paused",  icon: Pause,        color: M.slumber, bg: M.slumBg,   border: M.slumBdr  },
  done:    { label: "Done",    icon: CheckCircle2, color: M.sage,    bg: M.sageBg,   border: M.sageBdr  },
  failed:  { label: "Failed",  icon: XCircle,      color: M.rose,    bg: M.roseBg,   border: M.roseBdr  },
};

function elapsed(start: Date, end?: Date): string {
  const ms   = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  const hrs  = Math.floor(mins / 60);
  if (hrs > 0)  return `${hrs}h ${mins % 60}m`;
  if (mins > 0) return `${mins}m`;
  return "< 1m";
}

interface AgentTrackerProps {
  agents: Agent[];
  onAgentsChange: (agents: Agent[]) => void;
  tasks: Task[];
  defaultContext?: ActiveContext;
  /** Shared category list from Home — all contexts across tasks/goals/agents */
  allCategories?: string[];
  /** Pre-fill task text from Brain Dump or external source */
  pendingTaskText?: string;
  onPendingTaskConsumed?: () => void;
}

export function AgentTracker({ agents, onAgentsChange, tasks, defaultContext = "all", allCategories, pendingTaskText, onPendingTaskConsumed }: AgentTrackerProps) {
  const [name,           setName]           = useState("");
  const [taskDesc,       setTaskDesc]       = useState("");
  const [linkedTaskId,   setLinkedTaskId]   = useState<string>("");
  const [newCtx,         setNewCtx]         = useState<ItemContext>("work");
  const [activeContext,  setActiveContext]  = useState<ActiveContext>(defaultContext);
  const [filterStatus,   setFilterStatus]  = useState<AgentStatus | "all">("all");
  const [expandedId,     setExpandedId]    = useState<string | null>(null);
  const [noteEditing,    setNoteEditing]   = useState<{ id: string; value: string } | null>(null);
  const [taskEditing,    setTaskEditing]   = useState<string | null>(null); // agent id being task-edited

  // AI Create Agent popup
  const [popupTask,      setPopupTask]     = useState<Task | null>(null);
  const [popupName,      setPopupName]     = useState("");
  const [popupBrief,     setPopupBrief]    = useState("");
  const [popupFirstStep, setPopupFirstStep] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const openCreatePopup = (task: Task) => {
    setPopupTask(task);
    setPopupName(task.text.slice(0, 40));
    setPopupBrief("");
    setPopupFirstStep("");
  };

  const handleGenerate = async () => {
    if (!popupTask) return;
    setGenerating(true);
    try {
      const result = await callAI(
        `You generate AI agent briefs. Given a task, output ONLY valid JSON:
{"name":"short punchy agent name (3-5 words)","brief":"detailed 2-3 paragraph prompt to paste into ChatGPT or Claude. Include: what to do, how to approach it, what format to return results in. Be specific and actionable."}`,
        `Task: ${popupTask.text}`
      );
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as { name?: string; brief?: string };
        if (parsed.name) setPopupName(parsed.name);
        if (parsed.brief) { setPopupBrief(parsed.brief); setPopupFirstStep(""); }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      if (msg !== "no-key" && msg !== "invalid-key") toast.error(msg, { duration: 5000 });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyBrief = () => {
    const text = popupBrief + (popupFirstStep ? `\n\nFirst step: ${popupFirstStep}` : "");
    if (!text.trim()) { toast.info("Nothing to copy yet."); return; }
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Brief copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const confirmCreateAgent = () => {
    if (!popupTask) return;
    const agent: Agent = {
      id: nanoid(),
      name: popupName || popupTask.text.slice(0, 40),
      task: popupTask.text,
      status: "running",
      context: (popupTask.context as ItemContext) ?? "work",
      linkedTaskId: popupTask.id,
      startedAt: new Date(),
      notes: popupBrief || (popupFirstStep ? `First step: ${popupFirstStep}` : undefined),
    };
    onAgentsChange([agent, ...agents]);
        setPopupTask(null);
  };

  const today        = new Date().toDateString();
  const todayAgents  = agents.filter((a) => new Date(a.startedAt).toDateString() === today);
  const runningCount = todayAgents.filter((a) => a.status === "running").length;
  const doneCount    = todayAgents.filter((a) => a.status === "done").length;

  const activeTasks    = tasks.filter((t) => !t.done);
  const contextTasks   = activeTasks.filter((t) => activeContext === "all" ? true : t.context === activeContext);
  const uncoveredTasks = contextTasks.filter(
    (t) => !agents.some((a) => a.linkedTaskId === t.id && (a.status === "running" || a.status === "paused"))
  );

  // Always include agent-created contexts even if no tasks have them
  const agentContexts = Array.from(new Set(agents.map((a) => a.context)));
  const knownCategories = Array.from(new Set([
    ...((allCategories ?? ["work", "personal"])),
    ...agentContexts,
  ]));

  // Count agents by context (so agent-created tags appear even with 0 tasks)
  const counts: Record<string, number> = { all: agents.length };
  knownCategories.forEach((ctx) => {
    const agentCount = agents.filter((a) => a.context === ctx).length;
    const taskCount = activeTasks.filter((t) => t.context === ctx).length;
    counts[ctx] = agentCount + taskCount; // show if either has entries
  });

  // Consume pendingTaskText from Brain Dump
  useEffect(() => {
    if (pendingTaskText && pendingTaskText.trim()) {
      setName(pendingTaskText.trim().slice(0, 40));
      setTaskDesc(pendingTaskText.trim());
      onPendingTaskConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTaskText]);

  const addAgent = () => {
    if (!name.trim()) {
      toast.error("Give the agent a name.");
      return;
    }
    const { cleanText, tag } = parseHashtag(name);
    const context = (tag ?? newCtx) as ItemContext;
    const agent: Agent = {
      id: nanoid(), name: cleanText || name.trim(), task: taskDesc.trim() || cleanText || name.trim(),
      status: "running", context,
      linkedTaskId: linkedTaskId || undefined, startedAt: new Date(),
    };
    onAgentsChange([agent, ...agents]);
    setName(""); setTaskDesc(""); setLinkedTaskId("");
  };

  const createAgentFromTask = (task: Task) => {
    const agent: Agent = {
      id: nanoid(),
      name: task.text.slice(0, 40),
      task: task.text,
      status: "running",
      context: (task.context as ItemContext) ?? "work",
      linkedTaskId: task.id,
      startedAt: new Date(),
    };
    onAgentsChange([agent, ...agents]);
      };

  const cycleStatus = (id: string) => {
    const cycle: AgentStatus[] = ["running", "paused", "done", "failed"];
    onAgentsChange(agents.map((a) => {
      if (a.id !== id) return a;
      const next = cycle[(cycle.indexOf(a.status) + 1) % cycle.length];
      return { ...a, status: next, endedAt: next === "done" || next === "failed" ? new Date() : undefined };
    }));
  };

  const deleteAgent = (id: string) => onAgentsChange(agents.filter((a) => a.id !== id));

  const saveNote = () => {
    if (!noteEditing) return;
    onAgentsChange(agents.map((a) => a.id === noteEditing.id ? { ...a, notes: noteEditing.value } : a));
    setNoteEditing(null);
      };

  const updateLinkedTask = (agentId: string, taskId: string) => {
    const linked = activeTasks.find((t) => t.id === taskId);
    onAgentsChange(agents.map((a) =>
      a.id === agentId
        ? { ...a, linkedTaskId: taskId || undefined, context: (linked?.context as ItemContext) ?? a.context }
        : a
    ));
    setTaskEditing(null);
      };

  const filtered = agents
    .filter((a) => activeContext === "all" ? true : a.context === activeContext)
    .filter((a) => filterStatus === "all" || a.status === filterStatus);

  const linkableTasks = activeTasks.filter((t) => activeContext === "all" ? true : t.context === newCtx);

  const LABEL: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.65rem",
    fontWeight: 500,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: M.muted,
  };

  return (
    <div className="flex flex-col" style={{ gap: 24 }}>

      {/* Context switcher — dynamic categories */}
      <ContextSwitcher active={activeContext} onChange={setActiveContext} counts={counts} contexts={knownCategories} label="FILTER BY TAG" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 10 }}>
        {[
          { icon: PixelAgents,  label: "Running",     value: runningCount,       color: M.coral,   bg: M.coralBg,  border: M.coralBdr },
          { icon: CheckCircle2, label: "Done Today",  value: doneCount,          color: M.sage,    bg: M.sageBg,   border: M.sageBdr  },
          { icon: PixelAgents,  label: "Total Today", value: todayAgents.length, color: M.slumber, bg: M.slumBg,   border: M.slumBdr  },
          {
            icon: Flame,
            label: "Uncovered",
            value: uncoveredTasks.length,
            color:  uncoveredTasks.length > 0 ? M.rose    : M.sage,
            bg:     uncoveredTasks.length > 0 ? M.roseBg  : M.sageBg,
            border: uncoveredTasks.length > 0 ? M.roseBdr : M.sageBdr,
          },
        ].map(({ icon: Icon, label, value, color, bg, border }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 16px", backdropFilter: "blur(6px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              {Icon === PixelAgents
                ? <PixelAgents size={12} active={false} color={color} />
                : <Icon style={{ width: 12, height: 12, color }} />
              }
              <span style={{ ...LABEL, color: M.muted }}>{label}</span>
            </div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.65rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Coverage alert */}
      {uncoveredTasks.length > 0 && (
        <div style={{ padding: "12px 16px", borderRadius: 4, border: `2px solid ${M.roseBdr}`, background: M.roseBg, boxShadow: `3px 3px 0px ${M.roseBdr}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Flame style={{ width: 12, height: 12, color: M.rose, flexShrink: 0 }} />
            <p style={{ color: M.ink, fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
              {uncoveredTasks.length} task{uncoveredTasks.length > 1 ? "s" : ""} not yet delegated
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 5 }}>
            {uncoveredTasks.map((t) => {
              const clean = t.text
                .replace(/(?:^|\s)#[a-zA-Z0-9_-]+/g, "")
                .replace(/https?:\/\/\S+/g, "[link]")
                .replace(/\s{2,}/g, " ")
                .trim() || t.text;
              const label = clean.length > 26 ? clean.slice(0, 26) + "…" : clean;
              return (
                <button
                  key={t.id}
                  onClick={() => openCreatePopup(t)}
                  title={t.text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 5,
                    padding: "4px 9px",
                    height: 30,
                    background: M.card,
                    border: `2px solid ${M.roseBdr}`,
                    borderRadius: 3,
                    boxShadow: `2px 2px 0px ${M.roseBdr}`,
                    color: M.ink,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.62rem",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    transition: "box-shadow 0.08s, transform 0.08s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLElement).style.transform = "translate(2px,2px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `2px 2px 0px ${M.roseBdr}`;
                    (e.currentTarget as HTMLElement).style.transform = "";
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>{label}</span>
                  <Plus style={{ width: 9, height: 9, flexShrink: 0, color: M.coral }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {uncoveredTasks.length === 0 && contextTasks.length > 0 && (
        <div style={{ padding: "12px 18px", borderRadius: 10, border: `1px solid ${M.sageBdr}`, background: M.sageBg, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 className="w-4 h-4" style={{ color: M.sage }} />
          <p className="text-sm font-medium" style={{ color: M.sage, fontFamily: "'DM Sans', sans-serif" }}>
            All active tasks are covered. You're fully delegated!
          </p>
        </div>
      )}

      {/* Add agent form */}
      <div style={{ padding: "22px 22px 18px", borderRadius: 16, background: M.card, border: `1px solid ${M.border}`, backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ width: 3, height: 16, background: M.coral, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.92rem", fontWeight: 700, fontStyle: "italic", color: M.ink }}>Log a new agent</span>
        </div>

        {/* Name + task-link inline row */}
        <div className="flex gap-2 items-center">
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <Input
              value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAgent()}
              placeholder="Agent name... #tag"
              style={{ background: "oklch(0.997 0.003 355)", border: `1px solid ${parseHashtag(name).tag ? M.coral : M.border}`, borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: M.ink, height: 42, transition: "border-color 0.2s" }}
            />
            {parseHashtag(name).tag && (
              <div style={{ fontSize: "0.62rem", fontFamily: "'DM Sans', sans-serif", color: M.muted, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: M.coral }}>◆</span> Tag:{" "}
                <span style={{ background: M.coral + "15", color: M.coral, border: `1px solid ${M.coral}30`, padding: "0 6px", borderRadius: 3, fontSize: "0.60rem", letterSpacing: "0.06em" }}>
                  #{parseHashtag(name).tag}
                </span>
              </div>
            )}
          </div>
          <select
            value={linkedTaskId}
            onChange={(e) => {
              const tid = e.target.value;
              setLinkedTaskId(tid);
              // Auto-inherit category from linked task
              if (tid) {
                const linked = activeTasks.find((t) => t.id === tid);
                if (linked) setNewCtx(linked.context as ItemContext);
              }
            }}
            style={{ minWidth: 160, maxWidth: 220, fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", padding: "0 10px", borderRadius: 8, border: `1px solid ${M.border}`, background: "oklch(0.997 0.003 355)", color: linkedTaskId ? M.ink : M.muted, outline: "none", height: 42, cursor: "pointer" }}
          >
            <option value="">Link to task…</option>
            {activeTasks.map((t) => (
              <option key={t.id} value={t.id}>{t.text.length > 30 ? t.text.slice(0, 30) + "…" : t.text}</option>
            ))}
          </select>
        </div>

        <button
          onClick={addAgent}
          className="m-btn-primary self-start"
        >
          <Plus className="w-3.5 h-3.5" />
          Start Agent
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 text-xs" style={{ borderBottom: `1px solid ${M.border}` }}>
        {(["all", "running", "paused", "done", "failed"] as const).map((s) => {
          const count  = s === "all" ? filtered.length : filtered.filter((a) => a.status === s).length;
          const isAct  = filterStatus === s;
          const cfg    = s !== "all" ? STATUS_CONFIG[s] : null;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-4 py-2 transition-all"
              style={{
                color:        isAct ? (cfg ? cfg.color : M.ink) : M.muted,
                borderBottom: isAct ? `2px solid ${cfg ? cfg.color : M.coral}` : "2px solid transparent",
                fontFamily:   "'DM Sans', sans-serif",
                fontWeight:   isAct ? 600 : 400,
                fontSize:     "0.68rem",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
              }}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Agent list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ opacity: 0.18 }}>
              <rect x="8" y="14" width="24" height="20" fill="none" stroke={M.muted} strokeWidth="1" />
              <circle cx="15" cy="24" r="3" fill="none" stroke={M.muted} strokeWidth="0.8" />
              <circle cx="25" cy="24" r="3" fill="none" stroke={M.muted} strokeWidth="0.8" />
              <line x1="20" y1="14" x2="20" y2="8" stroke={M.muted} strokeWidth="1" />
              <circle cx="20" cy="6" r="2" fill="none" stroke={M.muted} strokeWidth="0.8" />
              <line x1="8" y1="30" x2="4" y2="34" stroke={M.muted} strokeWidth="0.8" />
              <line x1="32" y1="30" x2="36" y2="34" stroke={M.muted} strokeWidth="0.8" />
            </svg>
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>No agents yet.</p>
          </div>
        )}

        {filtered.map((agent) => {
          const cfg        = STATUS_CONFIG[agent.status];
          const StatusIcon = cfg.icon;
          const isExpanded = expandedId === agent.id;
          const linkedTask = tasks.find((t) => t.id === agent.linkedTaskId);

          return (
            <div key={agent.id} style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${M.border}`, background: M.card, backdropFilter: "blur(6px)", transition: "box-shadow 0.15s" }}>
              {/* Status accent bar */}
              <div style={{ height: 3, background: cfg.color, opacity: 0.45 }} />
              {/* Main row */}
              <div className="flex items-start gap-3 cursor-pointer" style={{ padding: "15px 18px" }} onClick={() => setExpandedId(isExpanded ? null : agent.id)}>
                {/* Status icon */}
                <div
                  style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}
                >
                  <StatusIcon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", fontWeight: 700, color: M.ink }}>{agent.name}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.60rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase" as const, padding: "2px 8px", borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                    <ContextBadge context={agent.context} />
                    {linkedTask ? (
                      <span className="text-xs flex items-center gap-1" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                        <Link2 className="w-3 h-3" />
                        {linkedTask.text.length > 28 ? linkedTask.text.slice(0, 28) + "…" : linkedTask.text}
                      </span>
                    ) : (
                      <span className="text-xs italic" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif", opacity: 0.6 }}>no task linked</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{elapsed(agent.startedAt, agent.endedAt)}</span>
                    <span>Started {new Date(agent.startedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                    {agent.endedAt && <span>Ended {new Date(agent.endedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => cycleStatus(agent.id)} title="Cycle status" className="p-1.5 transition-colors" style={{ color: M.muted }}>
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteAgent(agent.id)} className="p-1.5 transition-colors" style={{ color: M.muted }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded notes + task link editor */}
              {isExpanded && (
                <div style={{ padding: "0 18px 18px", paddingTop: 16, borderTop: `1px solid ${M.border}` }} onClick={(e) => e.stopPropagation()}>

                  {/* Task link row */}
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: M.muted }}>Linked task</span>
                    {taskEditing === agent.id ? (
                      <>
                        <select
                          defaultValue={agent.linkedTaskId ?? ""}
                          onChange={(e) => updateLinkedTask(agent.id, e.target.value)}
                          autoFocus
                          style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", padding: "5px 10px", borderRadius: 8, border: `1px solid ${M.coralBdr}`, background: "oklch(0.997 0.003 355)", color: M.ink, outline: "none", cursor: "pointer" }}
                        >
                          <option value="">— none —</option>
                          {activeTasks.map((t) => (
                            <option key={t.id} value={t.id}>{t.text.length > 40 ? t.text.slice(0, 40) + "…" : t.text}</option>
                          ))}
                        </select>
                        <button onClick={() => setTaskEditing(null)} className="p-1" style={{ color: M.muted }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: linkedTask ? M.ink : M.muted, fontStyle: linkedTask ? "normal" : "italic" }}>
                          {linkedTask ? (linkedTask.text.length > 40 ? linkedTask.text.slice(0, 40) + "…" : linkedTask.text) : "none"}
                        </span>
                        <button
                          onClick={() => setTaskEditing(agent.id)}
                          className="p-1 transition-colors"
                          style={{ color: M.muted }}
                          title="Edit linked task"
                        >
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M9 2L11 4L4 11H2V9L9 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-xs font-medium mt-3 mb-1.5" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Prompts / Summary
                  </p>
                  {noteEditing?.id === agent.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={noteEditing.value}
                        onChange={(e) => setNoteEditing({ id: agent.id, value: e.target.value })}
                        style={{ width: "100%", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", padding: "10px 12px", borderRadius: 8, border: `1px solid ${M.border}`, background: "oklch(0.997 0.003 355)", color: M.ink, resize: "vertical" as const, minHeight: 80, outline: "none" }}
                        placeholder="What did this agent produce? Any key outputs?"
                      />
                      <div className="flex gap-2">
                        <button onClick={saveNote} className="m-btn-primary">Save</button>
                        <button onClick={() => setNoteEditing(null)} className="m-btn-ghost">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setNoteEditing({ id: agent.id, value: agent.notes ?? "" })}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: agent.notes ? M.ink : M.muted, fontStyle: agent.notes ? "normal" : "italic", padding: "10px 12px", borderRadius: 8, border: `1px dashed ${M.border}`, background: "oklch(0.990 0.005 355 / 0.60)", cursor: "pointer", minHeight: 40, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    >
                      {agent.notes ? agent.notes : <span className="italic opacity-60">Agent brief, prompt, or output summary…</span>}
                    </div>
                  )}

                  {/* Quick status buttons */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {(["running", "paused", "done", "failed"] as AgentStatus[]).map((s) => {
                      const c  = STATUS_CONFIG[s];
                      const SI = c.icon;
                      return (
                        <button
                          key={s}
                          onClick={() => onAgentsChange(agents.map((a) => a.id === agent.id ? { ...a, status: s, endedAt: s === "done" || s === "failed" ? new Date() : undefined } : a))}
                          className={cn("m-chip", agent.status === s && "active")}
                        >
                          <SI className="w-3 h-3" />
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── AI Create Agent Popup ── */}
      <Dialog open={!!popupTask} onOpenChange={(open) => { if (!open) setPopupTask(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "oklch(0.22 0.040 320)" }}>
              Create Agent
            </DialogTitle>
          </DialogHeader>

          {/* Task source */}
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "oklch(0.58 0.18 340 / 0.07)", border: "1px solid oklch(0.58 0.18 340 / 0.2)", color: "oklch(0.48 0.18 340)", fontFamily: "'DM Sans', sans-serif" }}>
            <span className="font-semibold">Task: </span>{popupTask?.text}
          </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "oklch(0.52 0.040 330)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>Agent Name</label>
                <Input
                  value={popupName}
                  onChange={(e) => setPopupName(e.target.value)}
                  placeholder="e.g. API Review Checker"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <label className="text-xs font-semibold" style={{ color: "oklch(0.52 0.040 330)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>Agent Brief</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="m-btn-link flex items-center gap-1"
                      style={{ fontSize: "0.65rem" }}
                    >
                      <Sparkles className="w-3 h-3" />
                      {generating ? "Generating…" : "AI Generate"}
                    </button>
                    <span style={{ color: "oklch(0.75 0.040 330)", fontSize: "0.65rem", lineHeight: 1 }}>|</span>
                    <button
                      onClick={handleCopyBrief}
                      className="m-btn-link flex items-center gap-1"
                      style={{ fontSize: "0.65rem" }}
                    >
                      <Copy className="w-3 h-3" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <Textarea
                  value={popupBrief + (popupFirstStep ? `\n\nFirst step: ${popupFirstStep}` : "")}
                  onChange={(e) => { setPopupBrief(e.target.value); setPopupFirstStep(""); }}
                  placeholder="Describe what this agent should do — or click AI Generate above."
                  rows={5}
                  style={{ fontFamily: "'DM Sans', sans-serif", resize: "none" }}
                />
              </div>
            </div>

          <DialogFooter>
            <button
              onClick={() => setPopupTask(null)}
              className="m-btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={confirmCreateAgent}
              className="m-btn-primary"
            >
              <Plus className="w-3.5 h-3.5" /> Create Agent
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

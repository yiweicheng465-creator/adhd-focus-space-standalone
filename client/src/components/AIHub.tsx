/* ============================================================
   ADHD FOCUS SPACE — AI Hub Page
   7 AI features, each with a description card + live demo
   ============================================================ */

import { useState } from "react";
import { Loader2, Sparkles, Brain, Clock, CalendarDays, Target, Bot, Wand2, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { handleAiError, isNoApiKeyError, isQuotaError } from "@/lib/aiErrorHandler";

/* ── Retro lo-fi button style ── */
const retroBtn: React.CSSProperties = {
  background: "oklch(0.58 0.18 340)",
  color: "white",
  border: "1.5px solid oklch(0.30 0.10 320)",
  boxShadow: "2px 2px 0px oklch(0.30 0.10 320)",
  fontFamily: "'Space Mono', monospace",
  fontSize: "0.70rem",
  letterSpacing: "0.04em",
  padding: "5px 12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  transition: "box-shadow 0.1s, transform 0.1s",
  userSelect: "none" as const,
  alignSelf: "flex-start",
};

/* Inactive toggle variant — light cream background, deep pink text */
const retroBtnInactive: React.CSSProperties = {
  ...retroBtn,
  background: "oklch(0.975 0.018 355)",
  color: "oklch(0.48 0.16 340)",
  border: "1.5px solid oklch(0.82 0.050 340)",
  boxShadow: "2px 2px 0px oklch(0.82 0.050 340)",
};

const retroBtnActive: React.CSSProperties = {
  ...retroBtn,
  background: "oklch(0.58 0.18 340)",
  color: "white",
  border: "1.5px solid oklch(0.22 0.040 320)",
  boxShadow: "2px 2px 0px oklch(0.22 0.040 320)",
};

const retroBtnDisabled: React.CSSProperties = {
  ...retroBtn,
  opacity: 0.45,
  cursor: "not-allowed",
};

const M = {
  ink:     "oklch(0.22 0.040 320)",
  muted:   "oklch(0.52 0.040 330)",
  border:  "oklch(0.82 0.050 340)",
  accent:  "oklch(0.58 0.18 340)",
  accentBg:"oklch(0.58 0.18 340 / 0.10)",
  accentBdr:"oklch(0.58 0.18 340 / 0.25)",
  bg:      "oklch(0.985 0.012 355)",
  card:    "oklch(0.975 0.018 355)",
  demoBg:  "oklch(0.96 0.015 355)",
};

/* ── Feature card shell ── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-6 flex flex-col gap-4"
      style={{ background: M.bg, border: `1px solid ${M.border}` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 flex items-center justify-center shrink-0"
          style={{ background: M.accentBg, border: `1px solid ${M.accentBdr}` }}
        >
          <Icon className="w-4 h-4" style={{ color: M.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold" style={{ color: M.ink, fontFamily: "'Playfair Display', serif" }}>
              {title}
            </h3>
            <span
              className="text-[9px] font-bold tracking-widest px-1.5 py-0.5"
              style={{
                background: M.accentBg,
                color: M.accent,
                fontFamily: "'JetBrains Mono', monospace",
                border: `1px solid ${M.accentBdr}`,
              }}
            >
              {badge}
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            {description}
          </p>
        </div>
      </div>
      <div
        className="p-4"
        style={{ background: M.demoBg, border: `1px solid ${M.border}` }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── 1. Brain Dump Categoriser demo ── */
function BrainDumpDemo() {
  const [input, setInput] = useState("Need to call dentist\nWorried about the presentation tomorrow\nIdea: build a habit tracker\nPick up groceries");
  const [result, setResult] = useState<Array<{ original: string; category: string; action: string; rewritten: string; emoji: string }> | null>(null);
  const mutation = trpc.ai.categorizeDump.useMutation({
    onSuccess: (data) => setResult(data.items),
    onError: (err) => { handleAiError(err, "AI categorisation failed. Try again."); },
  });

  const CATEGORY_COLORS: Record<string, string> = {
    task:     "oklch(0.40 0.10 168)",
    worry:    "oklch(0.50 0.10 355)",
    idea:     "oklch(0.50 0.12 290)",
    reminder: "oklch(0.45 0.10 220)",
    goal:     "oklch(0.45 0.10 270)",
    other:    M.muted,
  };

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 text-xs bg-transparent resize-none focus:outline-none"
        style={{ border: `1px solid ${M.border}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
        placeholder="Paste your brain dump entries, one per line…"
      />
      <button
        onClick={() => {
          const entries = input.split("\n").map((l) => l.trim()).filter(Boolean);
          if (entries.length) mutation.mutate({ entries });
        }}
        disabled={mutation.isPending}
        style={mutation.isPending ? retroBtnDisabled : retroBtn}
        onMouseDown={e => { if (!mutation.isPending) { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0px 0px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = "translate(2px,2px)"; } }}
        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
      >
        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        ✦ Categorise with AI
      </button>
      {result && (
        <div className="flex flex-col gap-2 mt-1">
          {result.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <span>{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <span style={{ color: CATEGORY_COLORS[item.category] ?? M.muted, fontWeight: 600, textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.05em" }}>
                  {item.category}
                </span>
                <span style={{ color: M.muted }}> · </span>
                <span style={{ color: M.ink }}>{item.rewritten || item.original}</span>
              </div>
              <span
                className="shrink-0 text-[9px] px-1.5 py-0.5"
                style={{
                  background: item.action === "add_to_tasks" ? "oklch(0.40 0.10 168 / 0.12)" : item.action === "add_to_goals" ? "oklch(0.40 0.10 290 / 0.12)" : M.accentBg,
                  color: item.action === "add_to_tasks" ? "oklch(0.40 0.10 168)" : item.action === "add_to_goals" ? "oklch(0.40 0.10 290)" : M.muted,
                  fontFamily: "'JetBrains Mono', monospace",
                  border: `1px solid ${M.border}`,
                }}
              >
                {item.action.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 2. Daily Summary demo ── */
function DailySummaryDemo() {
  const [result, setResult] = useState<string | null>(null);
  const mutation = trpc.ai.dailySummary.useMutation({
    onSuccess: (data) => setResult(typeof data.summary === "string" ? data.summary : ""),
    onError: (err) => { if (isNoApiKeyError(err)) { window.dispatchEvent(new CustomEvent("openApiKeyDialog")); setResult("No API key set — add your Manus key to unlock AI features."); } else if (isQuotaError(err)) { window.dispatchEvent(new CustomEvent("openFxPanel")); setResult("API quota exceeded — opening Settings so you can switch to a Manus key."); } else { setResult("AI error. Try again."); } },
  });

  const runDemo = () => {
    mutation.mutate({
      date: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
      mood: 3,
      focusSessions: 2,
      blocksCompleted: 1,
      quitCount: 1,
      wins: ["Finished the report", "Replied to all emails"],
      tasksCompleted: ["Review proposal", "Team standup"],
      tasksPending: ["Update docs", "Fix bug"],
      dumpEntries: ["Worried about deadline", "Idea: automate testing"],
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
        Generates a personalised end-of-day summary from your actual data. Appears in the Wrap-up panel.
      </p>
      <button
        onClick={runDemo}
        disabled={mutation.isPending}
        style={mutation.isPending ? retroBtnDisabled : retroBtn}
        onMouseDown={e => { if (!mutation.isPending) { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0px 0px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = "translate(2px,2px)"; } }}
        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
      >
        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        ✦ Generate sample summary
      </button>
      {result && (
        <p className="text-sm leading-relaxed italic" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
          "{result}"
        </p>
      )}
    </div>
  );
}

/* ── 3. Focus Reflection demo ── */
function FocusReflectionDemo() {
  const [phase, setPhase] = useState<"before" | "after">("before");
  const [intention, setIntention] = useState("");
  const [outcome, setOutcome] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const mutation = trpc.ai.focusReflection.useMutation({
    onSuccess: (data) => setResult(typeof data.message === "string" ? data.message : ""),
    onError: (err) => { if (isNoApiKeyError(err)) { window.dispatchEvent(new CustomEvent("openApiKeyDialog")); setResult("No API key set — add your Manus key to unlock AI features."); } else if (isQuotaError(err)) { window.dispatchEvent(new CustomEvent("openFxPanel")); setResult("API quota exceeded — opening Settings so you can switch to a Manus key."); } else { setResult("AI error. Try again."); } },
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(["before", "after"] as const).map((p) => (
          <button
            key={p}
            onClick={() => { setPhase(p); setResult(null); }}
            style={phase === p ? retroBtnActive : retroBtnInactive}
          >
            {p === "before" ? "Before session" : "After session"}
          </button>
        ))}
      </div>
      {phase === "after" && (
        <div className="flex flex-col gap-2">
          <input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="What was your intention?"
            className="px-3 py-2 text-xs bg-transparent focus:outline-none"
            style={{ border: `1px solid ${M.border}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
          />
          <input
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="What actually happened?"
            className="px-3 py-2 text-xs bg-transparent focus:outline-none"
            style={{ border: `1px solid ${M.border}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>
      )}
      <button
        onClick={() => mutation.mutate({ phase, sessionNumber: 1, intention, outcome, blocksCompleted: 0 })}
        disabled={mutation.isPending}
        style={mutation.isPending ? retroBtnDisabled : retroBtn}
        onMouseDown={e => { if (!mutation.isPending) { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0px 0px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = "translate(2px,2px)"; } }}
        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
      >
        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        ✦ Get AI reflection
      </button>
      {result && (
        <p className="text-sm leading-relaxed" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
          {result}
        </p>
      )}
    </div>
  );
}

/* ── 4. Monthly Review demo ── */
function MonthlyReviewDemo() {
  const [result, setResult] = useState<string | null>(null);
  const mutation = trpc.ai.monthlyReview.useMutation({
    onSuccess: (data) => setResult(typeof data.review === "string" ? data.review : ""),
    onError: (err) => { handleAiError(err, "AI review failed. Try again."); },
  });

  const runDemo = () => {
    const now = new Date();
    mutation.mutate({
      month: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      activeDays: 18,
      totalDays: now.getDate(),
      wrapUpDays: 12,
      totalWins: 34,
      totalFocusSessions: 27,
      totalBlocks: 8,
      totalTasks: 45,
      avgMood: 3.4,
      streakMax: 5,
      topWins: ["Shipped the new feature", "Ran 3 times", "Finished the book"],
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
        Reads your full month of data and writes a personalised review. Available on the Monthly page.
      </p>
      <button
        onClick={runDemo}
        disabled={mutation.isPending}
        style={mutation.isPending ? retroBtnDisabled : retroBtn}
        onMouseDown={e => { if (!mutation.isPending) { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0px 0px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = "translate(2px,2px)"; } }}
        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
      >
        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        ✦ Generate sample review
      </button>
      {result && (
        <p className="text-sm leading-relaxed" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
          {result}
        </p>
      )}
    </div>
  );
}

/* ── 5. MIT Suggestion demo ── */
function MITDemo() {
  const [result, setResult] = useState<{ mit: string; reason: string; warmup: string; encouragement: string } | null>(null);
  const mutation = trpc.ai.mitSuggestion.useMutation({
    onSuccess: (data) => setResult(data),
    onError: (err) => { if (isNoApiKeyError(err)) { window.dispatchEvent(new CustomEvent("openApiKeyDialog")); setResult({ mit: "No API key set — add your Manus key to unlock AI features.", reason: "", warmup: "", encouragement: "" }); } else if (isQuotaError(err)) { window.dispatchEvent(new CustomEvent("openFxPanel")); setResult({ mit: "API quota exceeded — opening Settings so you can switch to a Manus key.", reason: "", warmup: "", encouragement: "" }); } else { handleAiError(err, "AI suggestion failed. Try again."); } },
  });

  const runDemo = () => {
    mutation.mutate({
      pendingTasks: [
        { text: "Fix critical bug in production", priority: "urgent", context: "work", createdAt: new Date().toISOString() },
        { text: "Reply to client emails", priority: "focus", context: "work", createdAt: new Date().toISOString() },
        { text: "Go for a 20-minute walk", priority: "normal", context: "personal", createdAt: new Date().toISOString() },
        { text: "Update project documentation", priority: "normal", context: "work", createdAt: new Date().toISOString() },
      ],
      goals: [
        { text: "Ship v2 of the app", progress: 60, context: "work" },
        { text: "Exercise 3x per week", progress: 33, context: "personal" },
      ],
      mood: 3,
      focusSessionsToday: 0,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
        Picks the single most important task based on your tasks, goals, and mood. Shown at the end of morning check-in.
      </p>
      <button
        onClick={runDemo}
        disabled={mutation.isPending}
        style={mutation.isPending ? retroBtnDisabled : retroBtn}
        onMouseDown={e => { if (!mutation.isPending) { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0px 0px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = "translate(2px,2px)"; } }}
        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
      >
        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        ✦ Pick my MIT
      </button>
      {result && (
        <div className="flex flex-col gap-2">
          <div
            className="p-3"
            style={{ background: M.accentBg, border: `1px solid ${M.accentBdr}` }}
          >
            <p className="text-xs font-bold mb-1" style={{ color: M.accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>
              MOST IMPORTANT THING
            </p>
            <p className="text-sm font-medium" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
              {result.mit}
            </p>
          </div>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: M.ink, fontWeight: 600 }}>Why:</span> {result.reason}
          </p>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: M.ink, fontWeight: 600 }}>Warm-up:</span> {result.warmup}
          </p>
          <p className="text-xs italic" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            {result.encouragement}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── 6. AI Command Center demo ── */
function AICommandDemo() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const mutation = trpc.ai.command.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    },
    onError: (err) => {
      const isNoKey = isNoApiKeyError(err);
      const isQuota = isQuotaError(err);
      if (isNoKey) window.dispatchEvent(new CustomEvent("openApiKeyDialog"));
      else if (isQuota) window.dispatchEvent(new CustomEvent("openFxPanel"));
      const errMsg = isNoKey ? "No API key set — add your Manus key to unlock AI features." : isQuota ? "API quota exceeded — opening Settings so you can switch to a Manus key." : "AI error. Try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
    },
  });

  const send = () => {
    const text = input.trim();
    if (!text || mutation.isPending) return;
    const newMsgs = [...messages, { role: "user" as const, content: text }];
    setMessages(newMsgs);
    setInput("");
    mutation.mutate({ messages: newMsgs });
  };

  const EXAMPLES = [
    "Add task: review the PR — urgent, work",
    "Set a goal: ship the redesign by end of month",
    "Log a win: finished the design system",
    "What should I focus on first today?",
  ];

  return (
    <div className="flex flex-col gap-3">

      {messages.length === 0 && (
        <div className="flex flex-col gap-1.5">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              onClick={() => { setInput(e); }}
              className="text-left text-xs px-3 py-2 transition-all hover:opacity-80"
              style={{ background: M.accentBg, border: `1px solid ${M.accentBdr}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
            >
              {e}
            </button>
          ))}
        </div>
      )}
      {messages.length > 0 && (
        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`text-xs px-3 py-2 ${m.role === "user" ? "self-end" : "self-start"}`}
              style={{
                background: m.role === "user" ? M.accent : M.accentBg,
                color: m.role === "user" ? "white" : M.ink,
                border: m.role === "user" ? "none" : `1px solid ${M.border}`,
                maxWidth: "90%",
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.5,
              }}
            >
              {m.content}
            </div>
          ))}
          {mutation.isPending && (
            <div className="flex items-center gap-2 text-xs" style={{ color: M.muted }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Working on it…
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Type a command…"
          className="flex-1 px-3 py-2 text-xs bg-transparent focus:outline-none"
          style={{ border: `1px solid ${M.border}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || mutation.isPending}
          style={!input.trim() || mutation.isPending ? retroBtnDisabled : retroBtn}
          onMouseDown={e => { if (input.trim() && !mutation.isPending) { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0px 0px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = "translate(2px,2px)"; } }}
          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        >
          Send
        </button>
      </div>
      {messages.length > 0 && (
        <button onClick={() => setMessages([])} className="text-xs self-start" style={{ color: M.muted, background: "none", border: "none", cursor: "pointer" }}>
          Clear chat
        </button>
      )}
    </div>
  );
}

/* ── 7. Agent Brief Generator demo ── */
function AgentBriefDemo() {
  const [taskText, setTaskText] = useState("Research competitor pricing pages and summarise key differences");
  const [result, setResult] = useState<{ name: string; brief: string } | null>(null);
  const mutation = trpc.ai.createAgentBrief.useMutation({
    onSuccess: (data) => setResult(data),
    onError: (err) => { handleAiError(err, "AI brief generation failed. Try again."); },
  });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
        From any task in the Agents page, click "Create Agent" to auto-generate a ready-to-paste AI agent prompt and a suggested agent name.
      </p>
      <input
        value={taskText}
        onChange={(e) => setTaskText(e.target.value)}
        placeholder="Describe the task for the agent…"
        className="px-3 py-2 text-xs bg-transparent focus:outline-none"
        style={{ border: `1px solid ${M.border}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
      />
      <button
        onClick={() => mutation.mutate({ taskText, context: "work" })}
        disabled={mutation.isPending || !taskText.trim()}
        style={mutation.isPending || !taskText.trim() ? retroBtnDisabled : retroBtn}
        onMouseDown={e => { if (!mutation.isPending && taskText.trim()) { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0px 0px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = "translate(2px,2px)"; } }}
        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px oklch(0.22 0.040 320)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
      >
        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
        ✦ Generate agent brief
      </button>
      {result && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Bot className="w-3.5 h-3.5" style={{ color: M.accent }} />
            <span className="text-xs font-bold" style={{ color: M.ink, fontFamily: "'JetBrains Mono', monospace" }}>{result.name}</span>
          </div>
          <div className="p-3 text-xs leading-relaxed" style={{ background: M.accentBg, border: `1px solid ${M.accentBdr}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
            {result.brief}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main AI Hub ── */
export function AIHub() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 flex items-center justify-center"
          style={{ background: M.accentBg, border: `1px solid ${M.accentBdr}` }}
        >
          <Sparkles className="w-4 h-4" style={{ color: M.accent }} />
        </div>
        <div>
          <h2
            className="text-base font-bold italic"
            style={{ fontFamily: "'Playfair Display', serif", color: M.ink }}
          >
            AI Features
          </h2>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            7 AI tools built into your workspace — try them live or find them in context
          </p>
        </div>
      </div>

      {/* Where to find each feature */}
      <div
        className="p-4 flex flex-col gap-2"
        style={{ background: M.accentBg, border: `1px solid ${M.accentBdr}` }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color: M.accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>
          WHERE TO FIND EACH FEATURE
        </p>
        {[
          { label: "Brain Dump → AI Categorise", where: "Brain Dump page → \"✦ AI Sort\" button above your entries" },
          { label: "Daily Summary", where: "Wrap-up panel → \"✦ Generate AI summary\" button" },
          { label: "Focus Micro-Reflection", where: "Focus Timer → session start & complete screen" },
          { label: "Monthly AI Review", where: "Monthly page → \"✦ Generate AI Review\" button" },
          { label: "MIT — Most Important Thing", where: "Daily Check-in → final step (auto-generates from your tasks & goals)" },
          { label: "AI Command Center", where: "Dashboard → right panel (chat with AI to manage tasks, goals, agents & wins)" },
          { label: "Agent Brief Generator", where: "Agents page → any task card → \"Create Agent\" button" },
        ].map(({ label, where }, i) => (
          <div key={i} className="flex items-start gap-2 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: M.accent }} />
            <span>
              <span style={{ color: M.ink, fontWeight: 600 }}>{label}</span>
              <span style={{ color: M.muted }}> — {where}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <FeatureCard
        icon={Brain}
        title="Brain Dump Categoriser"
        description="Paste your brain dump entries and AI will sort them into tasks, goals, worries, ideas, and reminders — and suggest which ones to add to your task list or goals."
        badge="BRAIN DUMP"
      >
        <BrainDumpDemo />
      </FeatureCard>

      <FeatureCard
        icon={Bot}
        title="AI Command Center"
        description="Chat with your AI assistant directly from the Dashboard. Create tasks, set goals, launch agents, log wins, complete tasks, or ask for prioritisation advice — all in natural language."
        badge="DASHBOARD"
      >
        <AICommandDemo />
      </FeatureCard>

      <FeatureCard
        icon={Target}
        title="MIT — Most Important Thing"
        description="Every morning during check-in, AI looks at your tasks, goals, and mood to pick the single most important thing to focus on today. Reduces decision paralysis."
        badge="CHECK-IN"
      >
        <MITDemo />
      </FeatureCard>

      <FeatureCard
        icon={Sparkles}
        title="Daily Summary"
        description="At the end of your day, AI reads your wins, tasks, focus sessions, and mood to write a warm, personal summary — not a generic template."
        badge="WRAP-UP"
      >
        <DailySummaryDemo />
      </FeatureCard>

      <FeatureCard
        icon={CalendarDays}
        title="Monthly AI Review"
        description="At any point in the month, AI reads your full data and writes a personalised review: what went well, one pattern it noticed, and one thing to try next month."
        badge="MONTHLY"
      >
        <MonthlyReviewDemo />
      </FeatureCard>

      <FeatureCard
        icon={Wand2}
        title="Agent Brief Generator"
        description="Turn any task into a ready-to-paste AI agent prompt. AI generates a focused agent name and a detailed brief you can drop directly into any AI assistant."
        badge="AGENTS"
      >
        <AgentBriefDemo />
      </FeatureCard>
    </div>
  );
}

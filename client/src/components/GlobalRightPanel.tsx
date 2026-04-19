/* ============================================================
   Global Right Panel — 3 aligned buttons on right edge
   AI Chat | Life Coach | Timer
   All pages, same style, AI chat syncs with Dashboard
   ============================================================ */

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Bot, Loader2 } from "lucide-react";
import { callAIStream, callAI } from "@/lib/ai";
import { buildRoutineContext } from "@/lib/routineContext";
import { useTimer } from "@/contexts/TimerContext";
import { useSoundContext } from "@/contexts/SoundContext";
import { Streamdown } from "streamdown";
import type { Goal } from "./Goals";
import { WIN_ICONS } from "./DailyWins";

const CHAT_KEY = "adhd-ai-chat-history"; // same key as Dashboard
const MAX = 10;

interface ChatMessage { role: "user" | "assistant"; content: string; }

interface Props {
  goals?: Goal[];
  onGoToSection?: (s: string) => void;
  onLogWin?: (text: string, iconIdx: number) => void;
}

// Dusty pastel gradient — retro lo-fi washed-out feel
const BTN_COLORS = [
  { active: "oklch(0.82 0.06 355)", idle: "oklch(0.93 0.025 355)", text: "oklch(0.50 0.08 355)" }, // AI: dusty rose
  { active: "oklch(0.80 0.06 315)", idle: "oklch(0.92 0.022 315)", text: "oklch(0.48 0.07 315)" }, // Coach: dusty mauve
  { active: "oklch(0.78 0.06 275)", idle: "oklch(0.91 0.020 275)", text: "oklch(0.46 0.07 275)" }, // Timer: dusty lavender
  { active: "oklch(0.76 0.05 245)", idle: "oklch(0.90 0.018 245)", text: "oklch(0.44 0.06 245)" }, // Routine: dusty periwinkle
];

const BTN_STYLE = (active: boolean, idx: number = 0, hovered = false): React.CSSProperties => {
  const c = BTN_COLORS[idx] ?? BTN_COLORS[0];
  return {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    // Half-width buttons; hover grows left via paddingLeft so right edge stays flush (no gap)
    width: 20,
    boxSizing: "border-box",
    paddingTop: 12, paddingBottom: 12,
    paddingLeft: hovered ? 8 : 4,
    paddingRight: 4,
    background: active ? c.active : c.idle,
    color: active ? "white" : c.text,
    border: "none", borderRadius: "8px 0 0 8px",
    cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: "0.40rem",
    letterSpacing: "0.10em", boxShadow: `-2px 0 10px ${c.active}33`,
    overflow: "hidden",
    transition: "padding-left 0.18s ease, background 0.15s, color 0.15s",
  };
};

export function GlobalRightPanel({ goals = [], onGoToSection, onLogWin }: Props) {
  const [panel, setPanel] = useState<"ai" | "coach" | "timer" | "routine" | null>(null);
  const toggle = (p: "ai" | "coach" | "timer" | "routine") => setPanel(v => v === p ? null : p);
  const [hoveredBtn, setHoveredBtn] = useState<"ai" | "coach" | "timer" | "routine" | null>(null);

  // Track dashboard AI state so the button reflects it
  const [dashboardAIOn, setDashboardAIOn] = useState(() =>
    localStorage.getItem("adhd-dashboard-show-ai") !== "false"
  );
  useEffect(() => {
    const onToggle = () => {
      // Read after a tick so Dashboard has updated localStorage first
      setTimeout(() => {
        setDashboardAIOn(localStorage.getItem("adhd-dashboard-show-ai") !== "false");
      }, 0);
    };
    window.addEventListener("toggleDashboardAI", onToggle);
    return () => window.removeEventListener("toggleDashboardAI", onToggle);
  }, []);

  // Tour: auto-open/close panels when the onboarding tour highlights them
  useEffect(() => {
    const onOpen = (e: Event) => {
      const p = (e as CustomEvent<string>).detail as "ai" | "coach" | "timer" | "routine";
      if (p === "ai" || p === "coach" || p === "timer" || p === "routine") setPanel(p);
    };
    const onClose = () => setPanel(null);
    window.addEventListener("tour-open-panel", onOpen);
    window.addEventListener("tour-close-panel", onClose);
    return () => {
      window.removeEventListener("tour-open-panel", onOpen);
      window.removeEventListener("tour-close-panel", onClose);
    };
  }, []);

  const onDashboard = () => {
    const hash = window.location.hash.replace("#", "") || "dashboard";
    return hash === "dashboard" || hash === "";
  };

  const handleAIClick = () => {
    if (onDashboard()) {
      setPanel(null); // close any open side popup
      window.dispatchEvent(new CustomEvent("toggleDashboardAI"));
    } else {
      toggle("ai");
    }
  };

  const aiActiveOnDashboard = onDashboard() && dashboardAIOn;

  return (
    <>
      {/* Click-outside backdrop — closes any open panel */}
      {panel && (
        <div
          onClick={() => setPanel(null)}
          style={{ position: "fixed", inset: 0, zIndex: 99, cursor: "default" }}
        />
      )}

      {/* Right-edge button stack */}
      <div data-tour-id="tour-right-panel" style={{ position: "fixed", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 101, display: "flex", flexDirection: "column", gap: 0, alignItems: "flex-end" }}>
        {/* AI */}
        <button data-tour-id="tour-ai-btn"
          style={BTN_STYLE(panel === "ai" || aiActiveOnDashboard, 0, hoveredBtn === "ai")}
          onClick={handleAIClick}
          onMouseEnter={() => setHoveredBtn("ai")}
          onMouseLeave={() => setHoveredBtn(null)}
          title="AI Assistant">
          <Bot size={14} />
          <span style={{ writingMode: "vertical-rl", fontSize: "0.38rem" }}>{aiActiveOnDashboard ? "HIDE AI" : "AI"}</span>
        </button>
        {/* Life Coach */}
        <button data-tour-id="tour-coach-btn"
          style={BTN_STYLE(panel === "coach", 1, hoveredBtn === "coach")}
          onClick={() => toggle("coach")}
          onMouseEnter={() => setHoveredBtn("coach")}
          onMouseLeave={() => setHoveredBtn(null)}
          title="Life Coach">
          <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>🧭</span>
          <span style={{ writingMode: "vertical-rl", fontSize: "0.38rem" }}>COACH</span>
        </button>
        {/* Timer */}
        <TimerButton
          active={panel === "timer"}
          onClick={() => toggle("timer")}
          hovered={hoveredBtn === "timer"}
          onHoverChange={(h) => setHoveredBtn(h ? "timer" : null)}
        />
        {/* Routine */}
        <button data-tour-id="tour-routine-btn"
          style={BTN_STYLE(panel === "routine", 3, hoveredBtn === "routine")}
          onClick={() => toggle("routine")}
          onMouseEnter={() => setHoveredBtn("routine")}
          onMouseLeave={() => setHoveredBtn(null)}
          title="Daily Routine">
          <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>💫</span>
          <span style={{ writingMode: "vertical-rl", fontSize: "0.38rem" }}>ROUTINE</span>
        </button>
      </div>

      {/* Popups — zIndex 100, above backdrop (99) but below buttons (101) */}
      {panel === "ai" && <AIChatPopup onClose={() => setPanel(null)} goals={goals} />}
      {panel === "coach" && <CoachPopup onClose={() => setPanel(null)} goals={goals} />}
      {panel === "timer" && <TimerPopup onClose={() => setPanel(null)} />}
      {panel === "routine" && <RoutinePopup onClose={() => setPanel(null)} onLogWin={onLogWin} />}
    </>
  );
}

/* ── Timer button (shows live countdown) ─────────────────────────── */
function TimerButton({ active, onClick, hovered = false, onHoverChange }: {
  active: boolean;
  onClick: () => void;
  hovered?: boolean;
  onHoverChange?: (h: boolean) => void;
}) {
  const { phase, remaining, mode } = useTimer();
  const isActive = phase === "running" || phase === "paused";
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const modeColor = "oklch(0.42 0.12 275)";
  const modeLightBg = BTN_COLORS[2].active;
  return (
    <button
      data-tour-id="tour-timer-btn"
      style={{
        ...BTN_STYLE(active || isActive, 2, hovered),
        ...(isActive ? {
          background: modeLightBg,
          color: modeColor,
          outline: `2px solid ${modeColor}`,
          outlineOffset: "-2px",
        } : {}),
      }}
      onClick={onClick}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      title="Timer"
    >
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: isActive ? "0.38rem" : "0.38rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
        {isActive ? `${mm}:${ss}` : "⏱"}
      </span>
      <span style={{ writingMode: "vertical-rl", fontSize: "0.38rem" }}>{isActive ? (phase === "paused" ? "PAUSE" : mode?.toUpperCase()) : "TIMER"}</span>
    </button>
  );
}

/* ── Timer popup ─────────────────────────────────────────── */
function TimerPopup({ onClose }: { onClose: () => void }) {
  const { phase, remaining, mode, durations, handleStartPause } = useTimer();
  const sound = useSoundContext();
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const isActive = phase === "running" || phase === "paused";

  // Track if music was playing before pause, resume it on resume
  const [wasPlayingMusic, setWasPlayingMusic] = useState(false);
  useEffect(() => {
    if (phase === "paused" && sound.musicEnabled) {
      setWasPlayingMusic(true);
      sound.toggleMusic(); // stop music
    } else if (phase === "running" && wasPlayingMusic && !sound.musicEnabled) {
      setWasPlayingMusic(false);
      sound.toggleMusic(); // resume music
    } else if (phase !== "paused") {
      setWasPlayingMusic(false);
    }
  }, [phase]);
  const modeColor = "oklch(0.42 0.12 275)"; // dusty lavender — matches timer button

  return (
    <PopupShell onClose={onClose} title="⏱ Timer" width={200} headerColor={BTN_COLORS[2].active}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 8 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "2rem", fontWeight: 700, color: isActive ? modeColor : "oklch(0.45 0.040 330)", letterSpacing: "-0.02em" }}>
          {mm}:{ss}
        </div>
        {isActive && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", color: modeColor, letterSpacing: "0.12em" }}>{mode?.toUpperCase()}</div>}
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <button onClick={handleStartPause} style={{ flex: 1, padding: "8px", borderRadius: 6, border: `1px solid ${modeColor}60`, background: modeColor + "15", color: modeColor, cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: "0.60rem", fontWeight: 700 }}>
            {phase === "running" ? "⏸ Pause" : phase === "paused" ? "▶ Resume" : "▶ Start"}
          </button>
        </div>
        <button onClick={sound.toggleMusic} style={{ width: "100%", padding: "6px", borderRadius: 6, border: "1px solid oklch(0.82 0.050 340)", background: sound.musicEnabled ? "oklch(0.96 0.020 340)" : "transparent", color: "oklch(0.52 0.040 330)", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: "0.55rem" }}>
          ♪ {sound.musicEnabled ? "Music On" : "Music Off"}
        </button>
      </div>
    </PopupShell>
  );
}

/* ── AI Chat popup (synced with Dashboard via same localStorage key) ── */
function AIChatPopup({ onClose, goals }: { onClose: () => void; goals: Goal[] }) {
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    try { return JSON.parse(localStorage.getItem(CHAT_KEY) ?? "[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const clearHistory = () => { setHistory([]); localStorage.removeItem(CHAT_KEY); };

  useEffect(() => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(history.slice(-MAX)));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const addToDump = (text: string) => {
    try {
      const entries = JSON.parse(localStorage.getItem("adhd_braindump_entries") ?? "[]");
      entries.unshift({ id: `dump-${Date.now()}`, text, tags: [], createdAt: new Date().toISOString(), converted: false });
      localStorage.setItem("adhd_braindump_entries", JSON.stringify(entries));
      toast.success(`✓ Dumped to Brain Dump`);
    } catch {}
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    const newHistory = [...history, { role: "user" as const, content: msg }];
    setHistory(newHistory);
    setHistory(prev => [...prev, { role: "assistant" as const, content: "" }]);
    setLoading(true);
    try {
      const routineCtx = buildRoutineContext();
      let reply = "";
      await callAIStream(
        `You are a warm ADHD coach. Goals: ${goals.map(g => g.text).join(", ") || "none"}. Keep replies short (1-2 sentences) unless the user asks for a detailed routine breakdown — then be thorough and specific with the real data.
After your reply, if user wants to dump/capture an idea output on a new line: ACTION:{"type":"create_dump","text":"idea"}

${routineCtx}`,
        msg,
        (delta) => { reply += delta; setHistory(prev => { const u = [...prev]; u[u.length-1] = { ...u[u.length-1], content: reply }; return u; }); },
        () => {
          setLoading(false);
          const actionMatch = reply.match(/ACTION:(\{.*\})/);
          if (actionMatch) {
            try {
              const action = JSON.parse(actionMatch[1]);
              if (action.type === "create_dump" && action.text) addToDump(action.text);
            } catch {}
            // Strip action from displayed message
            setHistory(prev => { const u = [...prev]; u[u.length-1] = { ...u[u.length-1], content: reply.replace(/\nACTION:\{.*\}/g, "").trim() }; return u; });
          }
        }
      );
    } catch { setLoading(false); }
  };

  // Match dashboard AI colors exactly
  const PINK = "oklch(0.58 0.18 340)";
  const PINK_BORDER = "oklch(0.82 0.070 340)";
  const PINK_MSG_BG = "oklch(0.940 0.040 355)";

  return (
    <PopupShell onClose={onClose} title="🤖 AI Assistant" width={320} onClear={history.length > 0 ? clearHistory : undefined} headerColor={BTN_COLORS[0].active}>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6, minHeight: 200, maxHeight: 320 }}>
        {history.length === 0 && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.80rem", color: "oklch(0.55 0.060 340)", fontStyle: "italic", textAlign: "center", marginTop: 20 }}>Ask me anything about your tasks & goals.</p>}
        {history.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "85%", padding: "6px 10px", borderRadius: m.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px", background: m.role === "user" ? PINK : PINK_MSG_BG, color: m.role === "user" ? "white" : "oklch(0.28 0.040 320)", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, border: m.role === "assistant" ? `1px solid ${PINK_BORDER}` : "none" }}>
              {m.role === "assistant" && m.content ? <Streamdown>{m.content}</Streamdown> : m.content || (loading && i === history.length-1 ? "▊" : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "8px 10px", borderTop: `1px solid ${PINK_BORDER}`, display: "flex", gap: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Ask…" autoComplete="off"
          style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid ${PINK_BORDER}`, fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", outline: "none", background: "oklch(0.975 0.018 355)" }} />
        <button onClick={send} disabled={loading || !input.trim()} style={{ padding: "6px 12px", borderRadius: 6, background: input.trim() ? PINK : "transparent", border: `1px solid ${input.trim() ? PINK : PINK_BORDER}`, color: input.trim() ? "white" : "oklch(0.60 0.060 340)", cursor: "pointer" }}>
          {loading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : "→"}
        </button>
      </div>
    </PopupShell>
  );
}

/* ── Life Coach popup ────────────────────────────────────────── */
function CoachPopup({ onClose, goals }: { onClose: () => void; goals: Goal[] }) {
  // Use same storage keys as Goals.tsx so conversations are shared
  const STORAGE_LIFE   = "adhd-life-coach-chat-life";
  const STORAGE_CAREER = "adhd-life-coach-chat-career";
  const loadMsgs = (key: string) => { try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; } };
  const STARTERS_INIT = {
    life: "Let's explore what matters most to you. What area of your life feels most out of alignment with where you want to be — relationships, health, purpose, or something else?",
    career: "What does success look like in 3 years — go deeper, pivot, or build something of your own?"
  };
  const initMsgs = (key: string, type: "life" | "career") => {
    const saved = loadMsgs(key);
    if (saved.length > 0) return saved;
    return [{ role: "coach" as const, text: STARTERS_INIT[type] }];
  };
  const [coachType, setCoachType] = useState<"life" | "career">("life");
  const [lifeMessages,   setLifeMessages]   = useState<{ role: "user" | "coach"; text: string }[]>(() => initMsgs(STORAGE_LIFE, "life"));
  const [careerMessages, setCareerMessages] = useState<{ role: "user" | "coach"; text: string }[]>(() => initMsgs(STORAGE_CAREER, "career"));
  const messages    = coachType === "life" ? lifeMessages   : careerMessages;
  const setMessages = coachType === "life" ? setLifeMessages : setCareerMessages;
  const storageKey  = coachType === "life" ? STORAGE_LIFE   : STORAGE_CAREER;
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(storageKey, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, storageKey]);
  const STARTERS = {
    life: "Let's explore what matters most to you. What area of your life feels most out of alignment with where you want to be — relationships, health, purpose, or something else?",
    career: "What does success look like in 3 years — go deeper, pivot, or build something of your own?"
  };
  const SYSTEMS = {
    life: `You are my long-term life coach. My current goals: ${goals.map(g => g.text).join(", ") || "none"}.
Your coaching process:
Step 1 — Values Clarification: Help me identify my core values and what truly matters to me.
Step 2 — Vision Building: Guide me to create a compelling 1/3/10-year life vision.
Step 3 — Action Design: Break the vision into concrete, measurable 90-day goals.
Step 4 — Reflection Loop: Review progress, celebrate wins, and adjust course.
Rules:
- Ask one powerful question at a time
- Challenge unrealistic assumptions gently but directly
- Highlight blind spots I might be avoiding
- Give concrete, measurable action steps — not just reflective questions
- Keep responses concise (2–4 sentences + question)`,
    career: `You are my strategic career coach. My current goals: ${goals.map(g => g.text).join(", ") || "none"}.
Your coaching process:
Step 1 — Career Direction: Help me clarify my desired role or trajectory, strengths to leverage, and weaknesses to improve.
Step 2 — Skill Gap Analysis: Identify the 3 most critical skills I need to develop.
Step 3 — Career Roadmap: Generate a 3-year career direction, 1-year milestones, and a 90-day execution plan.
Step 4 — Weekly Execution: Hold me accountable to weekly actions and celebrate progress.
Rules:
- Ask one powerful question at a time
- Be direct about market realities and skill gaps
- Give concrete, measurable action steps
- Keep responses concise (2–4 sentences + question)`,
  };
  const startChat = (type: "life" | "career") => {
    setCoachType(type);
    const starter = [{ role: "coach" as const, text: STARTERS[type] }];
    if (type === "life") setLifeMessages(starter); else setCareerMessages(starter);
  };
  const clear = () => {
    if (streaming) return; // never clear while a stream is in flight
    localStorage.removeItem(storageKey);
    localStorage.removeItem("adhd-life-coach-insights");
    // Reset to starter message so the conversation view always shows the initial prompt
    const starter = [{ role: "coach" as const, text: STARTERS[coachType] }];
    if (coachType === "life") setLifeMessages(starter); else setCareerMessages(starter);
  };

  const generateSummary = async (allMsgs: typeof messages, type: "life" | "career") => {
    if (allMsgs.length < 4) return; // need enough convo to summarize
    try {
      const convo = allMsgs.map(m => `${m.role === "user" ? "Me" : "Coach"}: ${m.text}`).join("\n");
      const result = await callAI(
        `Read this ${type === "life" ? "life planning" : "career coaching"} conversation and write a brief, personal 人生看板 summary.
Return JSON: {"direction":"1 sentence about main life/career direction","insights":["3-4 key insight bullets"],"nextStep":"1 concrete action to take"}
Be specific and personal. Use the person's exact words/goals.`,
        convo
      );
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const existing = (() => { try { return JSON.parse(localStorage.getItem("adhd-life-dashboard") ?? "{}"); } catch { return {}; } })();
        existing[type] = { ...parsed, updatedAt: new Date().toISOString() };
        localStorage.setItem("adhd-life-dashboard", JSON.stringify(existing));
        // Notify Dashboard to re-render the coach summary card without a page refresh
        window.dispatchEvent(new CustomEvent("coach-summary-updated"));
      }
    } catch {} // silent fail
  };

  const send = async () => {
    if (!input.trim() || streaming) return;
    const msg = input.trim(); setInput("");
    const newMsgs = [...messages, { role: "user" as const, text: msg }];
    setMessages([...newMsgs, { role: "coach" as const, text: "" }]);
    setStreaming(true);
    try {
      await callAIStream(SYSTEMS[coachType], `Conversation:\n${newMsgs.map(m => `${m.role}: ${m.text}`).join("\n")}\n\nContinue as coach.`,
        (delta) => setMessages(prev => { if (!prev.length) return prev; const u = [...prev]; u[u.length-1] = { ...u[u.length-1], text: (u[u.length-1].text ?? "") + delta }; return u; }),
        () => {
          setStreaming(false);
          // Generate/update summary after every few exchanges
          const finalMsgs = [...newMsgs, { role: "coach" as const, text: "" }];
          if (finalMsgs.length % 4 === 0 || finalMsgs.length >= 6) {
            generateSummary(finalMsgs, coachType);
          }
        }
      );
    } catch { setStreaming(false); }
  };

  const switchCoach = (type: "life" | "career") => {
    setCoachType(type);
    const existing = loadMsgs(type === "life" ? STORAGE_LIFE : STORAGE_CAREER);
    if (existing.length === 0) {
      const starter = [{ role: "coach" as const, text: STARTERS[type] }];
      if (type === "life") setLifeMessages(starter); else setCareerMessages(starter);
    }
  };
  return (
    <PopupShell onClose={onClose} title="🧭 Life Coach" width={320} onClear={messages.length > 0 ? clear : undefined} clearDisabled={streaming} headerColor={BTN_COLORS[1].active}>
      {/* Life / Career switch tabs — always visible */}
      <div style={{ display: "flex", borderBottom: "1px solid oklch(0.82 0.040 285 / 0.4)", background: "oklch(0.97 0.008 285)" }}>
        {(["life", "career"] as const).map(type => {
          const isActive = coachType === type;
          const typeMsgs = type === "life" ? lifeMessages : careerMessages;
          // Show dot only when user has NOT sent any message AND no coach summary exists yet
          const hasUserChat = typeMsgs.some(m => m.role === "user");
          const hasSummary = (() => { try { const d = JSON.parse(localStorage.getItem("adhd-life-dashboard") ?? "{}"); return !!d[type]; } catch { return false; } })();
          const showDot = !hasUserChat && !hasSummary;
          return (
            <button key={type} onClick={() => switchCoach(type)}
              style={{ flex: 1, padding: "6px 8px", border: "none", borderBottom: isActive ? "2px solid oklch(0.55 0.14 285)" : "2px solid transparent", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.70rem", fontWeight: isActive ? 700 : 400,
                color: isActive ? "oklch(0.35 0.12 285)" : "oklch(0.55 0.040 330)", transition: "all 0.15s" }}>
              <span>{type === "life" ? "🌱" : "🚀"}</span>
              <span>{type === "life" ? "Life" : "Career"}</span>
              {showDot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: isActive ? "oklch(0.55 0.14 285)" : "oklch(0.70 0.08 285)", flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 8, minHeight: 200, maxHeight: 300 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "85%", padding: "6px 10px", borderRadius: m.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px", background: m.role === "user" ? "oklch(0.55 0.14 285)" : "white", color: m.role === "user" ? "white" : "oklch(0.28 0.040 320)", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, border: m.role === "coach" ? "1px solid oklch(0.86 0.030 300)" : "none" }}>
              {m.text || (streaming && i === messages.length-1 ? "▊" : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "8px 10px", borderTop: "1px solid oklch(0.86 0.030 300)", display: "flex", gap: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder={`Chat with ${coachType === "life" ? "Life" : "Career"} Coach…`} autoComplete="off"
          style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid oklch(0.86 0.030 300)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", outline: "none" }} />
        <button onClick={send} disabled={streaming || !input.trim()} style={{ padding: "6px 12px", borderRadius: 6, background: input.trim() ? "oklch(0.55 0.14 285)" : "transparent", border: `1px solid ${input.trim() ? "oklch(0.55 0.14 285)" : "oklch(0.86 0.030 300)"}`, color: input.trim() ? "white" : "oklch(0.60 0.040 330)", cursor: "pointer" }}>→</button>
      </div>
    </PopupShell>
  );
}

/* ── Routine Popup ─────────────────────────────────────────── */
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const ROUTINE_KEY = "adhd-routines";

type Routine = { id: string; name: string; days: string[]; iconIdx: number };

function RoutinePopup({ onClose, onLogWin }: { onClose: () => void; onLogWin?: (text: string, iconIdx: number) => void }) {
  const [routines, setRoutines] = useState<Routine[]>(() => {
    try { return JSON.parse(localStorage.getItem(ROUTINE_KEY) ?? "[]"); } catch { return []; }
  });
  const [newName, setNewName] = useState("");
  const [newDays, setNewDays] = useState<string[]>(["Mon","Tue","Wed","Thu","Fri"]);
  const [newIconIdx, setNewIconIdx] = useState(0);
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const today = DAYS[(new Date().getDay() + 6) % 7]; // Mon=0
  const todayKey = new Date().toISOString().slice(0, 10);

  // Track which routines were completed today (reset daily)
  const [doneToday, setDoneToday] = useState<Set<string>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("adhd-routine-done") ?? "{}");
      return new Set(saved.date === todayKey ? saved.ids : []);
    } catch { return new Set(); }
  });

  const saveDoneToday = (ids: Set<string>) => {
    setDoneToday(ids);
    localStorage.setItem("adhd-routine-done", JSON.stringify({ date: todayKey, ids: [...ids] }));
    // Also persist routine counts to adhd-daily-logs so Monthly page shows accurate data
    try {
      const dailyLogsKey = new Date().toDateString(); // e.g. "Mon Apr 07 2026"
      const logs = JSON.parse(localStorage.getItem("adhd-daily-logs") ?? "{}");
      const existing = logs[dailyLogsKey] ?? { dateKey: dailyLogsKey, wrapUpDone: false, dumpCount: 0, winsCount: 0, tasksCompleted: 0, mood: null, score: 0 };
      const routinesDone = ids.size;
      const routinesTotal = todayRoutines.length;
      logs[dailyLogsKey] = {
        ...existing,
        routinesDone,
        routinesTotal,
        routinesDoneIds: [...ids],
        score: Math.min(100, (existing.score ?? 0) - ((existing.routinesDone ?? 0) * 5) + routinesDone * 5),
      };
      localStorage.setItem("adhd-daily-logs", JSON.stringify(logs));
    } catch {}
    // Notify header stats to refresh routine count
    window.dispatchEvent(new CustomEvent("adhd-storage-update", { detail: "adhd-routine-done" }));
    window.dispatchEvent(new CustomEvent("adhd-storage-update", { detail: "adhd-daily-logs" }));
  };

  const saveRoutines = (r: Routine[]) => { setRoutines(r); localStorage.setItem(ROUTINE_KEY, JSON.stringify(r)); };
  const addRoutine = () => {
    if (!newName.trim()) return;
    saveRoutines([...routines, { id: `r-${Date.now()}`, name: newName.trim(), days: newDays, iconIdx: newIconIdx }]);
    setNewName(""); setNewIconIdx(0); setAdding(false);
  };
  const deleteRoutine = (id: string) => saveRoutines(routines.filter(r => r.id !== id));
  const changeIcon = (id: string, idx: number) => {
    saveRoutines(routines.map(r => r.id === id ? { ...r, iconIdx: idx } : r));
    setPickerOpenId(null);
  };
  const todayRoutines = routines.filter(r => r.days.includes(today));

  const markDone = (r: Routine) => {
    if (doneToday.has(r.id)) return;
    const iconIdx = typeof r.iconIdx === "number" ? r.iconIdx % WIN_ICONS.length : 0;
    const win = { id: `routine-${Date.now()}`, text: r.name, iconIdx };
    try {
      const wins = JSON.parse(localStorage.getItem("adhd-wins") ?? "[]");
      wins.unshift({ ...win, createdAt: new Date().toISOString() });
      localStorage.setItem("adhd-wins", JSON.stringify(wins));
    } catch {}
    saveDoneToday(new Set([...doneToday, r.id]));
    onLogWin?.(win.text, win.iconIdx);
    toast.success(`✓ ${r.name} logged as win!`);
  };

  return (
    <PopupShell onClose={onClose} title="💫 Daily Routine" width={300} headerColor={BTN_COLORS[3].active}>
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Today's routines */}
        {todayRoutines.length > 0 && (
          <div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.48rem", letterSpacing: "0.10em", color: "oklch(0.55 0.12 285)", textTransform: "uppercase", marginBottom: 6 }}>Today ({today})</p>
            {todayRoutines.map(r => {
                const done = doneToday.has(r.id);
                const iconDef = WIN_ICONS[(r.iconIdx ?? 0) % WIN_ICONS.length];
                const isPickerOpen = pickerOpenId === r.id;
                return (
                  <div key={r.id} style={{ position: "relative", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: done ? "oklch(0.96 0.012 285)" : "white", borderRadius: 8, border: `1px solid ${done ? "oklch(0.78 0.10 285)" : "oklch(0.86 0.030 300)"}`, transition: "all 0.2s" }}>
                    {/* Category SVG icon — click to change */}
                    <button onClick={() => !done && setPickerOpenId(isPickerOpen ? null : r.id)} title={iconDef.label}
                      style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: isPickerOpen ? `${iconDef.color}15` : "none", border: isPickerOpen ? `1px solid ${iconDef.color}` : "1px solid transparent", borderRadius: 5, cursor: done ? "default" : "pointer", padding: 0, flexShrink: 0 }}>
                      <iconDef.Component size={14} color={done ? "oklch(0.65 0.05 285)" : iconDef.color} />
                    </button>
                    <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: done ? "oklch(0.55 0.10 285)" : "oklch(0.28 0.040 320)", textDecoration: done ? "line-through" : "none", opacity: done ? 0.7 : 1 }}>{r.name}</span>
                    <button
                      onClick={() => markDone(r)}
                      disabled={done}
                      title={done ? "Done today!" : "Mark done"}
                      style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${done ? "oklch(0.55 0.14 285)" : "oklch(0.72 0.10 285)"}`, background: done ? "oklch(0.55 0.14 285)" : "transparent", cursor: done ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}
                      onMouseEnter={e => { if (!done) { (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.62 0.14 285)"; } }}
                      onMouseLeave={e => { if (!done) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; } }}
                    >
                      {done
                        ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="oklch(0.62 0.14 285)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/></svg>
                      }
                    </button>
                  </div>
                  {isPickerOpen && (
                    <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 200, background: "white", border: "1px solid oklch(0.86 0.030 300)", borderRadius: 8, padding: 6, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", marginTop: 2, width: 148 }}>
                      {WIN_ICONS.map((ic, idx) => (
                        <div key={idx} style={{ position: "relative" }}
                          onMouseEnter={e => { const t = e.currentTarget.querySelector<HTMLElement>(".tip"); if (t) t.style.opacity = "1"; }}
                          onMouseLeave={e => { const t = e.currentTarget.querySelector<HTMLElement>(".tip"); if (t) t.style.opacity = "0"; }}
                        >
                          <span className="tip" style={{ position: "absolute", bottom: "calc(100% + 3px)", left: "50%", transform: "translateX(-50%)", background: "oklch(0.28 0.018 65)", color: "white", fontSize: "0.50rem", fontFamily: "'DM Sans', sans-serif", padding: "2px 5px", borderRadius: 3, whiteSpace: "nowrap", pointerEvents: "none", opacity: 0, transition: "opacity 0.08s", zIndex: 300 }}>
                            {ic.label}
                          </span>
                          <button onClick={() => changeIcon(r.id, idx)}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "5px", borderRadius: 6, border: `1.5px solid ${idx === (r.iconIdx ?? 0) ? ic.color : "transparent"}`, background: idx === (r.iconIdx ?? 0) ? `${ic.color}18` : "transparent", cursor: "pointer" }}>
                            <ic.Component size={16} color={ic.color} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                );
              })}
          </div>
        )}
        {todayRoutines.length === 0 && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.80rem", color: "oklch(0.60 0.040 330)", fontStyle: "italic" }}>No routines set for {today}.</p>}
        {/* All routines */}
        <div style={{ borderTop: "1px solid oklch(0.86 0.030 300)", paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.46rem", letterSpacing: "0.10em", color: M_MUTED, textTransform: "uppercase", margin: 0 }}>All Routines</p>
            <button onClick={() => setAdding(v => !v)} style={{ fontSize: "0.55rem", fontFamily: "'Space Mono', monospace", padding: "2px 8px", border: "1px solid oklch(0.55 0.14 285)", borderRadius: 4, background: "transparent", color: "oklch(0.55 0.14 285)", cursor: "pointer" }}>+ Add</button>
          </div>
          {adding && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8, padding: "8px", background: "oklch(0.97 0.010 300)", borderRadius: 8 }}>
              {/* Icon + input inline (like DailyWins) */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {(() => { const ic = WIN_ICONS[newIconIdx]; return (
                  <button onClick={() => setPickerOpenId(pickerOpenId === "new" ? null : "new")} title={ic.label}
                    style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: `1.5px solid ${pickerOpenId === "new" ? ic.color : "oklch(0.82 0.050 340)"}`, background: pickerOpenId === "new" ? `${ic.color}15` : "white", cursor: "pointer" }}>
                    <ic.Component size={16} color={ic.color} />
                  </button>
                ); })()}
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Routine name…" autoFocus
                  style={{ flex: 1, padding: "5px 8px", borderRadius: 4, border: "1px solid oklch(0.82 0.050 340)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", outline: "none" }} />
              </div>
              {/* Inline icon grid — no floating popover (avoids overflow:hidden clip) */}
              {pickerOpenId === "new" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, padding: 6, background: "white", borderRadius: 8, border: "1px solid oklch(0.86 0.030 300)" }}>
                  {WIN_ICONS.map((ic, idx) => (
                    <div key={idx} style={{ position: "relative" }}
                      onMouseEnter={e => { const t = e.currentTarget.querySelector<HTMLElement>(".tip"); if (t) t.style.opacity = "1"; }}
                      onMouseLeave={e => { const t = e.currentTarget.querySelector<HTMLElement>(".tip"); if (t) t.style.opacity = "0"; }}
                    >
                      <span className="tip" style={{ position: "absolute", bottom: "calc(100% + 3px)", left: "50%", transform: "translateX(-50%)", background: "oklch(0.28 0.018 65)", color: "white", fontSize: "0.50rem", fontFamily: "'DM Sans', sans-serif", padding: "2px 5px", borderRadius: 3, whiteSpace: "nowrap", pointerEvents: "none", opacity: 0, transition: "opacity 0.08s", zIndex: 300 }}>
                        {ic.label}
                      </span>
                      <button onClick={() => { setNewIconIdx(idx); setPickerOpenId(null); }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", aspectRatio: "1", borderRadius: 6, border: `1.5px solid ${idx === newIconIdx ? ic.color : "transparent"}`, background: idx === newIconIdx ? `${ic.color}18` : "transparent", cursor: "pointer" }}>
                        <ic.Component size={18} color={ic.color} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {DAYS.map((d) => {
                  const active = newDays.includes(d);
                  return (
                    <button key={d} onClick={() => setNewDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])}
                      style={{ padding: "2px 7px", borderRadius: 10, fontSize: "0.55rem", fontFamily: "'Space Mono', monospace", border: `1px solid ${active ? "oklch(0.55 0.14 285)" : "oklch(0.82 0.050 340)"}`, background: active ? "oklch(0.55 0.14 285 / 0.15)" : "transparent", color: active ? "oklch(0.45 0.14 285)" : "oklch(0.60 0.040 330)", cursor: "pointer", fontWeight: active ? 700 : 400 }}>
                      {d}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={addRoutine} style={{ flex: 1, padding: "5px", borderRadius: 6, background: "oklch(0.55 0.14 285)", color: "white", border: "none", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: "0.55rem" }}>Save</button>
                <button onClick={() => setAdding(false)} style={{ padding: "5px 10px", borderRadius: 6, background: "transparent", border: "1px solid oklch(0.82 0.050 340)", color: "oklch(0.60 0.040 330)", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: "0.55rem" }}>Cancel</button>
              </div>
            </div>
          )}
          {routines.map(r => {
            const ic = WIN_ICONS[(r.iconIdx ?? 0) % WIN_ICONS.length];
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
                <ic.Component size={13} color={ic.color} />
                <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "oklch(0.35 0.040 320)" }}>{r.name}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.42rem", color: "oklch(0.60 0.040 330)" }}>{r.days.join(",")}</span>
                <button onClick={() => deleteRoutine(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.65 0.050 330)", fontSize: "0.70rem" }}>×</button>
              </div>
            );
          })}
        </div>
      </div>
    </PopupShell>
  );
}
const M_MUTED = "oklch(0.52 0.040 330)";

/* ── Shared popup shell ──────────────────────────────────────── */
function PopupShell({ onClose, title, width = 300, children, onClear, clearDisabled, headerColor }: { onClose: () => void; title: string; width?: number; children: React.ReactNode; onClear?: () => void; clearDisabled?: boolean; headerColor?: string; }) {
  const hdr = headerColor ?? "oklch(0.93 0.025 355)";
  const [tourHighlight, setTourHighlight] = useState(false);
  useEffect(() => {
    const onHL = () => setTourHighlight(true);
    const offHL = () => setTourHighlight(false);
    window.addEventListener("tour-highlight-panel", onHL);
    window.addEventListener("tour-unhighlight-panel", offHL);
    window.addEventListener("tour-close-panel", offHL);
    return () => {
      window.removeEventListener("tour-highlight-panel", onHL);
      window.removeEventListener("tour-unhighlight-panel", offHL);
      window.removeEventListener("tour-close-panel", offHL);
    };
  }, []);
  return (
    <div data-tour-id="tour-panel-popup" style={{ position: "fixed", right: 42, top: "50%", transform: "translateY(-50%)", zIndex: 100, width, background: "#fdf4f8", borderRadius: 14, boxShadow: tourHighlight ? "0 0 0 3px oklch(0.58 0.18 340), 0 0 24px oklch(0.58 0.18 340 / 0.45), 0 20px 48px rgba(120,40,180,0.18)" : "0 20px 48px rgba(120,40,180,0.18), 0 4px 12px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", overflow: "hidden", border: tourHighlight ? "2px solid oklch(0.58 0.18 340)" : `1px solid ${hdr}`, transition: "box-shadow 0.3s ease, border 0.3s ease" }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${hdr}`, background: hdr, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.90rem", fontWeight: 700, color: "oklch(0.28 0.040 320)", fontStyle: "italic" }}>{title}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {onClear && <button onClick={clearDisabled ? undefined : onClear} style={{ fontSize: "0.48rem", fontFamily: "'Space Mono', monospace", padding: "2px 6px", border: "1px solid oklch(0.72 0.050 330)", borderRadius: 3, background: "transparent", color: "oklch(0.45 0.050 330)", cursor: clearDisabled ? "not-allowed" : "pointer", opacity: clearDisabled ? 0.4 : 1 }}>Clear</button>}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "oklch(0.45 0.040 330)", lineHeight: 1 }}>×</button>
        </div>
      </div>
      {children}
    </div>
  );
}

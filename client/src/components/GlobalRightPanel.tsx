/* ============================================================
   Global Right Panel — 3 aligned buttons on right edge
   AI Chat | Life Coach | Timer
   All pages, same style, AI chat syncs with Dashboard
   ============================================================ */

import { useState, useEffect, useRef, useCallback } from "react";
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

const BTN_STYLE = (active: boolean, idx: number = 0): React.CSSProperties => {
  const c = BTN_COLORS[idx] ?? BTN_COLORS[0];
  return {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    padding: "10px 4px", background: active ? c.active : c.idle,
    color: active ? "white" : c.text,
    border: "none", borderRadius: "6px 0 0 6px",
    cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: "0.38rem",
    letterSpacing: "0.08em", boxShadow: `-2px 0 8px ${c.active}28`,
    transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.15s",
    minWidth: 24,
  };
};

// Hover handlers for the pop/grow effect
const onBtnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.12) translateX(-2px)";
  (e.currentTarget as HTMLButtonElement).style.boxShadow = "-4px 0 14px oklch(0.60 0.10 320 / 0.25)";
};
const onBtnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1) translateX(0)";
  (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
};

export function GlobalRightPanel({ goals = [], onGoToSection, onLogWin }: Props) {
  const [panel, setPanel] = useState<"ai" | "coach" | "timer" | "routine" | null>(null);
  const toggle = (p: "ai" | "coach" | "timer" | "routine") => setPanel(v => v === p ? null : p);

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
      <div data-tour-id="tour-right-panel" style={{ position: "fixed", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 101, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* AI */}
        <button data-tour-id="tour-ai-btn" style={BTN_STYLE(panel === "ai" || aiActiveOnDashboard, 0)} onClick={handleAIClick} onMouseEnter={onBtnHover} onMouseLeave={onBtnLeave} title="AI Assistant">
          <Bot size={14} />
          <span style={{ writingMode: "vertical-rl", fontSize: "0.38rem" }}>{aiActiveOnDashboard ? "HIDE AI" : "AI"}</span>
        </button>
        {/* Life Coach */}
        <button data-tour-id="tour-coach-btn" style={BTN_STYLE(panel === "coach", 1)} onClick={() => toggle("coach")} onMouseEnter={onBtnHover} onMouseLeave={onBtnLeave} title="Life Coach">
          <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>🧭</span>
          <span style={{ writingMode: "vertical-rl", fontSize: "0.38rem" }}>COACH</span>
        </button>
        {/* Timer */}
        <TimerButton active={panel === "timer"} onClick={() => toggle("timer")} />
        {/* Routine */}
        <button data-tour-id="tour-routine-btn" style={BTN_STYLE(panel === "routine", 3)} onClick={() => toggle("routine")} onMouseEnter={onBtnHover} onMouseLeave={onBtnLeave} title="Daily Routine">
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
function TimerButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  const { phase, remaining, mode } = useTimer();
  const isActive = phase === "running" || phase === "paused";
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  // Use timer button's own color (dusty lavender) at different depths
  const modeColor = "oklch(0.42 0.12 275)";    // darker lavender for text/border
  const modeLightBg = BTN_COLORS[2].active;     // same as button active bg
  return (
    <button
      data-tour-id="tour-timer-btn"
      style={{
        ...BTN_STYLE(active || isActive, 2),
        ...(isActive ? {
          background: modeLightBg,
          color: modeColor,
          border: `2px solid ${modeColor}`,
        } : {}),
      }}
      onClick={onClick} onMouseEnter={onBtnHover} onMouseLeave={onBtnLeave} title="Timer"
    >
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: isActive ? "0.52rem" : "0.38rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
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
      import("sonner").then(({ toast }) => toast.success(`✓ Dumped to Brain Dump`));
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

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify({ coachType, messages }));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, coachType]);

  const STARTERS = { life: "Let's explore what matters most to you. What area feels most out of alignment?", career: "What does success look like to you in 3 years?" };
  const SYSTEMS = {
    life: `Warm life coach. User goals: ${goals.map(g => g.text).join(", ") || "none"}. Ask one question at a time, 2-3 sentences max.`,
    career: `Expert career coach. User goals: ${goals.map(g => g.text).join(", ") || "none"}. Ask one question at a time, 2-3 sentences max.`,
  };

  const startChat = (type: "life" | "career") => { setCoachType(type); setMode("chat"); setMessages([{ role: "coach", text: STARTERS[type] }]); };
  const clear = () => { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem("adhd-life-coach-insights"); setMessages([]); setMode("pick"); };

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
        (delta) => setMessages(prev => { const u = [...prev]; u[u.length-1] = { ...u[u.length-1], text: u[u.length-1].text + delta }; return u; }),
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

  return (
    <PopupShell onClose={onClose} title="🧭 Life Coach" width={320} onClear={messages.length > 0 ? clear : undefined} headerColor={BTN_COLORS[1].active}>
      {mode === "pick" ? (
        <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.80rem", color: "oklch(0.45 0.040 330)", lineHeight: 1.5, margin: 0 }}>AI guides you through building your life framework.</p>
          {[{ type: "life" as const, emoji: "🌱", label: "Life Planning", sub: "Values, purpose, 1/3/10yr vision" }, { type: "career" as const, emoji: "🚀", label: "Career Coaching", sub: "Direction, roadmap, skill gaps" }].map(({ type, emoji, label, sub }) => (
            <button key={type} onClick={() => startChat(type)} style={{ padding: "12px 14px", borderRadius: 8, background: "oklch(0.55 0.12 285 / 0.06)", border: "1px solid oklch(0.55 0.12 285 / 0.25)", cursor: "pointer", textAlign: "left", display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: "1.2rem" }}>{emoji}</span>
              <div><p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "oklch(0.28 0.040 320)", margin: 0, fontSize: "0.85rem" }}>{label}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", color: "oklch(0.52 0.040 330)", margin: 0 }}>{sub}</p></div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 8, minHeight: 200, maxHeight: 320 }}>
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
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Share your thoughts…" autoComplete="off"
              style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid oklch(0.86 0.030 300)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", outline: "none" }} />
            <button onClick={send} disabled={streaming || !input.trim()} style={{ padding: "6px 12px", borderRadius: 6, background: input.trim() ? "oklch(0.55 0.14 285)" : "transparent", border: `1px solid ${input.trim() ? "oklch(0.55 0.14 285)" : "oklch(0.86 0.030 300)"}`, color: input.trim() ? "white" : "oklch(0.60 0.040 330)", cursor: "pointer" }}>→</button>
          </div>
        </>
      )}
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
    import("sonner").then(({ toast }) => toast.success(`✓ ${r.name} logged as win!`));
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
function PopupShell({ onClose, title, width = 300, children, onClear, headerColor }: { onClose: () => void; title: string; width?: number; children: React.ReactNode; onClear?: () => void; headerColor?: string; }) {
  const hdr = headerColor ?? "oklch(0.93 0.025 355)";
  return (
    <div style={{ position: "fixed", right: 42, top: "50%", transform: "translateY(-50%)", zIndex: 100, width, background: "#fdf4f8", borderRadius: 14, boxShadow: "0 20px 48px rgba(120,40,180,0.18), 0 4px 12px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${hdr}` }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${hdr}`, background: hdr, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.90rem", fontWeight: 700, color: "oklch(0.28 0.040 320)", fontStyle: "italic" }}>{title}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {onClear && <button onClick={onClear} style={{ fontSize: "0.48rem", fontFamily: "'Space Mono', monospace", padding: "2px 6px", border: "1px solid oklch(0.72 0.050 330)", borderRadius: 3, background: "transparent", color: "oklch(0.45 0.050 330)", cursor: "pointer" }}>Clear</button>}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "oklch(0.45 0.040 330)", lineHeight: 1 }}>×</button>
        </div>
      </div>
      {children}
    </div>
  );
}

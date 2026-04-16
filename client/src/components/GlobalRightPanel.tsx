/* ============================================================
   Global Right Panel — 3 aligned buttons on right edge
   AI Chat | Life Coach | Timer
   All pages, same style, AI chat syncs with Dashboard
   ============================================================ */

import { useState, useEffect, useRef, useCallback } from "react";
import { Bot, Loader2 } from "lucide-react";
import { callAIStream, callAI } from "@/lib/ai";
import { useTimer } from "@/contexts/TimerContext";
import { useSoundContext } from "@/contexts/SoundContext";
import { Streamdown } from "streamdown";
import type { Goal } from "./Goals";

const CHAT_KEY = "adhd-ai-chat-history"; // same key as Dashboard
const MAX = 10;

interface ChatMessage { role: "user" | "assistant"; content: string; }

interface Props {
  goals?: Goal[];
  onGoToSection?: (s: string) => void;
  onLogWin?: (text: string, iconIdx: number) => void;
}

// Pink → purple → blue gradient per button
const BTN_COLORS = [
  { active: "oklch(0.55 0.18 355)", idle: "oklch(0.88 0.08 355)", text: "oklch(0.40 0.16 355)" }, // AI: pink
  { active: "oklch(0.52 0.16 315)", idle: "oklch(0.87 0.07 315)", text: "oklch(0.38 0.14 315)" }, // Coach: pink-purple
  { active: "oklch(0.48 0.15 275)", idle: "oklch(0.86 0.07 275)", text: "oklch(0.36 0.13 275)" }, // Timer: purple
  { active: "oklch(0.46 0.14 245)", idle: "oklch(0.85 0.07 245)", text: "oklch(0.34 0.12 245)" }, // Routine: blue
];

const BTN_STYLE = (active: boolean, idx: number = 0): React.CSSProperties => {
  const c = BTN_COLORS[idx] ?? BTN_COLORS[0];
  return {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "12px 8px", background: active ? c.active : c.idle,
    color: active ? "white" : c.text,
    border: "none", borderRadius: "8px 0 0 8px",
    cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: "0.40rem",
    letterSpacing: "0.10em", boxShadow: `-2px 0 10px ${c.active}33`,
    transition: "all 0.15s", minWidth: 34,
  };
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
      <div style={{ position: "fixed", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 101, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* AI */}
        <button style={BTN_STYLE(panel === "ai" || aiActiveOnDashboard, 0)} onClick={handleAIClick} title="AI Assistant">
          <Bot size={14} />
          <span style={{ writingMode: "vertical-rl", fontSize: "0.38rem" }}>{aiActiveOnDashboard ? "HIDE AI" : "AI"}</span>
        </button>
        {/* Life Coach */}
        <button style={BTN_STYLE(panel === "coach", 1)} onClick={() => toggle("coach")} title="Life Coach">
          <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>🧭</span>
          <span style={{ writingMode: "vertical-rl", fontSize: "0.38rem" }}>COACH</span>
        </button>
        {/* Timer */}
        <TimerButton active={panel === "timer"} onClick={() => toggle("timer")} />
        {/* Routine */}
        <button style={BTN_STYLE(panel === "routine", 3)} onClick={() => toggle("routine")} title="Daily Routine">
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
  const modeColor = mode === "focus" ? "#b85c38" : mode === "short" ? "#4a9e6b" : "#4a7eb8";
  const modeLightBg = mode === "focus" ? "#fff1ec" : mode === "short" ? "#edf7f1" : "#ecf2fb";
  return (
    <button
      style={{
        ...BTN_STYLE(active || isActive, 2),
        ...(isActive ? {
          background: modeLightBg,
          color: modeColor,
          border: `2px solid ${modeColor}`,
        } : {}),
      }}
      onClick={onClick} title="Timer"
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
  const modeColor = mode === "focus" ? "#b85c38" : mode === "short" ? "#4a9e6b" : "#4a7eb8";

  return (
    <PopupShell onClose={onClose} title="⏱ Timer" width={200}>
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

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    const newHistory = [...history, { role: "user" as const, content: msg }];
    setHistory(newHistory);
    setHistory(prev => [...prev, { role: "assistant" as const, content: "" }]);
    setLoading(true);
    try {
      await callAIStream(
        `You are a warm ADHD coach. Goals: ${goals.map(g => g.text).join(", ") || "none"}. Keep replies short (1-2 sentences).`,
        msg,
        (delta) => setHistory(prev => { const u = [...prev]; u[u.length-1] = { ...u[u.length-1], content: u[u.length-1].content + delta }; return u; }),
        () => setLoading(false)
      );
    } catch { setLoading(false); }
  };

  // Match dashboard AI colors exactly
  const PINK = "oklch(0.58 0.18 340)";
  const PINK_BORDER = "oklch(0.82 0.070 340)";
  const PINK_MSG_BG = "oklch(0.940 0.040 355)";

  return (
    <PopupShell onClose={onClose} title="🤖 AI Assistant" width={320} onClear={history.length > 0 ? clearHistory : undefined}>
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
    <PopupShell onClose={onClose} title="🧭 Life Coach" width={320} onClear={messages.length > 0 ? clear : undefined}>
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

function RoutinePopup({ onClose, onLogWin }: { onClose: () => void; onLogWin?: (text: string, iconIdx: number) => void }) {
  const [routines, setRoutines] = useState<{ id: string; name: string; days: string[] }[]>(() => {
    try { return JSON.parse(localStorage.getItem(ROUTINE_KEY) ?? "[]"); } catch { return []; }
  });
  const [newName, setNewName] = useState("");
  const [newDays, setNewDays] = useState<string[]>(["Mon","Tue","Wed","Thu","Fri"]);
  const [adding, setAdding] = useState(false);
  const today = DAYS[(new Date().getDay() + 6) % 7]; // Mon=0

  const saveRoutines = (r: typeof routines) => { setRoutines(r); localStorage.setItem(ROUTINE_KEY, JSON.stringify(r)); };
  const addRoutine = () => { if (!newName.trim()) return; saveRoutines([...routines, { id: `r-${Date.now()}`, name: newName.trim(), days: newDays }]); setNewName(""); setAdding(false); };
  const deleteRoutine = (id: string) => saveRoutines(routines.filter(r => r.id !== id));
  const todayRoutines = routines.filter(r => r.days.includes(today));

  const markDone = (r: { id: string; name: string }) => {
    const win = { id: `routine-${Date.now()}`, text: `🔄 ${r.name}`, iconIdx: 98 };
    // Save to adhd-wins
    try {
      const wins = JSON.parse(localStorage.getItem("adhd-wins") ?? "[]");
      wins.unshift({ ...win, createdAt: new Date().toISOString() });
      localStorage.setItem("adhd-wins", JSON.stringify(wins));
    } catch {}
    onLogWin?.(win.text, win.iconIdx);
    import("sonner").then(({ toast }) => toast.success(`✓ ${r.name} logged as win!`));
  };

  return (
    <PopupShell onClose={onClose} title="💫 Daily Routine" width={300}>
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Today's routines */}
        {todayRoutines.length > 0 && (
          <div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.48rem", letterSpacing: "0.10em", color: "oklch(0.55 0.12 285)", textTransform: "uppercase", marginBottom: 6 }}>Today ({today})</p>
            {todayRoutines.map(r => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "white", borderRadius: 8, border: "1px solid oklch(0.86 0.030 300)", marginBottom: 4 }}>
                <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: "oklch(0.28 0.040 320)" }}>{r.name}</span>
                <button onClick={() => markDone(r)} style={{ padding: "3px 10px", borderRadius: 6, background: "transparent", color: "oklch(0.48 0.14 285)", border: "2px solid oklch(0.62 0.14 285)", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: "0.50rem", letterSpacing: "0.06em", fontWeight: 700 }}>✓ Done</button>
              </div>
            ))}
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
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Routine name…" autoFocus
                style={{ padding: "5px 8px", borderRadius: 4, border: "1px solid oklch(0.82 0.050 340)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", outline: "none" }} />
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
          {routines.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
              <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "oklch(0.35 0.040 320)" }}>{r.name}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.42rem", color: "oklch(0.60 0.040 330)" }}>{r.days.join(",")}</span>
              <button onClick={() => deleteRoutine(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.65 0.050 330)", fontSize: "0.70rem" }}>×</button>
            </div>
          ))}
        </div>
      </div>
    </PopupShell>
  );
}
const M_MUTED = "oklch(0.52 0.040 330)";

/* ── Shared popup shell ──────────────────────────────────────── */
function PopupShell({ onClose, title, width = 300, children, onClear }: { onClose: () => void; title: string; width?: number; children: React.ReactNode; onClear?: () => void; }) {
  return (
    <div style={{ position: "fixed", right: 42, top: "50%", transform: "translateY(-50%)", zIndex: 100, width, background: "#fdf4f8", borderRadius: 14, boxShadow: "0 20px 48px rgba(120,40,180,0.18), 0 4px 12px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid oklch(0.86 0.030 300)" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid oklch(0.86 0.030 300)", background: "oklch(0.97 0.012 300)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.90rem", fontWeight: 700, color: "oklch(0.28 0.040 320)", fontStyle: "italic" }}>{title}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {onClear && <button onClick={onClear} style={{ fontSize: "0.48rem", fontFamily: "'Space Mono', monospace", padding: "2px 6px", border: "1px solid oklch(0.72 0.050 330)", borderRadius: 3, background: "transparent", color: "oklch(0.55 0.050 330)", cursor: "pointer" }}>Clear</button>}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "oklch(0.52 0.040 330)", lineHeight: 1 }}>×</button>
        </div>
      </div>
      {children}
    </div>
  );
}

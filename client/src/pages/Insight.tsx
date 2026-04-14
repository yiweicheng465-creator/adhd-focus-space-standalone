/* ============================================================
   ADHD FOCUS SPACE — Insight / About page
   Explains the tear-strip focus timer and core app philosophy
   ============================================================ */

import { useLocation } from "wouter";
import { Sidebar } from "@/components/Sidebar";

const M = {
  bg:      "oklch(0.975 0.012 80)",
  card:    "oklch(0.975 0.018 75)",
  border:  "oklch(0.88 0.012 75)",
  ink:     "oklch(0.28 0.018 65)",
  muted:   "oklch(0.55 0.018 70)",
  coral:   "oklch(0.55 0.09 35)",
  coralBg: "oklch(0.55 0.09 35 / 0.08)",
  sage:    "oklch(0.52 0.07 145)",
  sageBg:  "oklch(0.52 0.07 145 / 0.08)",
};

// ── Tear-strip illustration ───────────────────────────────────────────────────
function StripIllustration() {
  const strips = [
    { label: "overthinking", torn: true },
    { label: "email backlog", torn: true },
    { label: "the meeting dread", torn: false },
    { label: "tomorrow's anxiety", torn: false },
  ];
  return (
    <svg width="110" height="148" viewBox="0 0 110 148" fill="none" style={{ flexShrink: 0 }}>
      {/* Paper background */}
      <rect x="4" y="4" width="102" height="140" rx="3" fill="oklch(0.99 0.005 80)" stroke="oklch(0.82 0.015 75)" strokeWidth="1.2" />
      {/* Torn-edge top */}
      <path d="M4 4 Q14 10 24 4 Q34 10 44 4 Q54 10 64 4 Q74 10 84 4 Q94 10 104 4 L106 4 L106 8 Q94 14 84 8 Q74 14 64 8 Q54 14 44 8 Q34 14 24 8 Q14 14 4 8 Z"
        fill="oklch(0.93 0.012 75)" />
      {/* Strips */}
      {strips.map((s, i) => {
        const y = 20 + i * 30;
        const isTorn = s.torn;
        return (
          <g key={i}>
            {/* Strip body */}
            <rect x="10" y={y} width="90" height="22" rx="2"
              fill={isTorn ? "oklch(0.92 0.01 75)" : "oklch(0.97 0.008 80)"}
              stroke={isTorn ? "oklch(0.80 0.015 75)" : "oklch(0.55 0.09 35 / 0.4)"}
              strokeWidth="0.9"
              opacity={isTorn ? 0.5 : 1}
            />
            {/* Tear line on right side for torn strips */}
            {isTorn && (
              <path
                d={`M 90 ${y + 2} Q 93 ${y + 7} 90 ${y + 11} Q 93 ${y + 15} 90 ${y + 20}`}
                fill="none" stroke="oklch(0.70 0.015 75)" strokeWidth="0.8" strokeDasharray="2 2"
              />
            )}
            {/* Label text */}
            <text x="18" y={y + 14}
              fontFamily="'DM Sans', sans-serif" fontSize="7.5"
              fill={isTorn ? "oklch(0.65 0.015 70)" : "oklch(0.35 0.018 65)"}
              opacity={isTorn ? 0.6 : 1}
            >
              {s.label}
            </text>
            {/* Strikethrough for torn */}
            {isTorn && (
              <line x1="18" y1={y + 11} x2={18 + s.label.length * 4.4} y2={y + 11}
                stroke="oklch(0.55 0.09 35)" strokeWidth="0.9" opacity="0.5" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

const CONCEPTS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        {/* Paper strip with tear */}
        <rect x="3" y="8" width="22" height="12" rx="2" fill="oklch(0.55 0.09 35 / 0.12)" stroke="oklch(0.55 0.09 35)" strokeWidth="1.3" />
        <path d="M19 8 Q21 11 19 14 Q21 17 19 20" fill="none" stroke="oklch(0.55 0.09 35)" strokeWidth="1.1" strokeDasharray="2 1.5" />
        <line x1="7" y1="14" x2="16" y2="14" stroke="oklch(0.55 0.09 35)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      </svg>
    ),
    title: "The Strips = Things to Let Go Of",
    body: "Before each session you write down the mental clutter weighing on you — the email backlog, the awkward conversation, tomorrow's anxiety. As you focus, the strips tear away one by one. By the end, the page is clear. So is your head.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 20 Q8 10 14 14 Q20 18 24 8" fill="none" stroke="oklch(0.52 0.07 145)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="24" cy="8" r="3" fill="oklch(0.52 0.07 145 / 0.3)" stroke="oklch(0.52 0.07 145)" strokeWidth="1.2" />
      </svg>
    ),
    title: "Tearing = Progress",
    body: "Each strip that tears is a second of real focus made visible. The tearing is not a countdown to failure — it is a countdown to release. Distractions leave the page as you work. By the end, nothing is left. Neither is the anxiety.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="9" fill="oklch(0.55 0.09 35 / 0.12)" stroke="oklch(0.55 0.09 35)" strokeWidth="1.3" />
        <path d="M14 9 L14 14 L18 16" stroke="oklch(0.55 0.09 35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "The Timer = One Thing at a Time",
    body: "The timer runs across all pages — start it on the Dashboard, switch to Tasks, come back, and it is still counting. There is no reset when you navigate. The session belongs to you, not to a single tab. Focus travels with you.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        {/* Cycle arrows */}
        <path d="M8 6 Q14 3 20 6 Q24 10 22 16" fill="none" stroke="oklch(0.52 0.07 145)" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M20 22 Q14 25 8 22 Q4 18 6 12" fill="none" stroke="oklch(0.55 0.09 35)" strokeWidth="1.4" strokeLinecap="round" />
        <polyline points="22,12 22,16 18,16" fill="none" stroke="oklch(0.52 0.07 145)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="6,18 6,12 10,12" fill="none" stroke="oklch(0.55 0.09 35)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Cycles = Rhythm, Not Grind",
    body: "Focus → Short Break → Focus → Short Break → Focus → Long Break. Four rounds, then rest. The cycle is automatic — you do not have to decide what comes next. ADHD brains thrive on predictable rhythm. The app holds the structure so you can hold the attention.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="5" y="12" width="18" height="12" rx="3" fill="oklch(0.52 0.07 145 / 0.15)" stroke="oklch(0.52 0.07 145)" strokeWidth="1.3" />
        <path d="M10 12 V9 Q10 5 14 5 Q18 5 18 9 V12" fill="none" stroke="oklch(0.52 0.07 145)" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="14" cy="18" r="2" fill="oklch(0.52 0.07 145)" />
      </svg>
    ),
    title: "Wins = Evidence You Exist",
    body: "ADHD brains discount their own achievements constantly. Wins are not trophies — they are proof. Logging a win, no matter how small, trains your brain to notice what it accomplishes instead of only what it missed.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <line x1="5" y1="2" x2="5" y2="26" stroke="oklch(0.55 0.09 35)" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M5 4 L20 8 L5 12 Z" fill="oklch(0.55 0.09 35 / 0.25)" stroke="oklch(0.55 0.09 35)" strokeWidth="1.2" />
      </svg>
    ),
    title: "Goals = Direction, Not Pressure",
    body: "Goals here are not deadlines. They are compass headings. Progress is measured in small nudges (+10%, +25%) because ADHD brains work in bursts. A goal at 40% is not failing — it is 40% further than before.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="5" y="8" width="18" height="16" rx="2.5" fill="oklch(0.55 0.018 70 / 0.12)" stroke="oklch(0.55 0.018 70)" strokeWidth="1.3" />
        <circle cx="10" cy="16" r="2.5" fill="none" stroke="oklch(0.55 0.018 70)" strokeWidth="1" />
        <circle cx="18" cy="16" r="2.5" fill="none" stroke="oklch(0.55 0.018 70)" strokeWidth="1" />
        <line x1="14" y1="8" x2="14" y2="4" stroke="oklch(0.55 0.018 70)" strokeWidth="1.2" />
        <circle cx="14" cy="3" r="1.5" fill="none" stroke="oklch(0.55 0.018 70)" strokeWidth="1" />
      </svg>
    ),
    title: "AI Agents = Extended Cognition",
    body: "Your brain has limited working memory. AI agents are not shortcuts — they are cognitive extensions. Logging what each agent is doing externalises the mental load of tracking parallel work, freeing your focus for what only you can do.",
  },
];

export default function Insight() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex">
      <Sidebar activeSection="" onSectionChange={() => navigate("/")} />

      <main className="flex-1 ml-14 min-h-screen flex flex-col">
        {/* Header */}
        <header
          className="sticky top-0 z-30 px-8 py-4 flex items-center gap-3"
          style={{
            background: "#EFE0C8E6",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #C9A87C",
          }}
        >

          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" fill="oklch(0.55 0.09 35 / 0.15)" stroke="oklch(0.55 0.09 35)" strokeWidth="1.3" />
            <line x1="9" y1="6" x2="9" y2="10" stroke="oklch(0.55 0.09 35)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="9" cy="12.5" r="0.9" fill="oklch(0.55 0.09 35)" />
          </svg>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: M.muted }}>
            INSIGHT
          </span>
        </header>

        <div className="flex-1 px-8 py-8 max-w-2xl" style={{ margin: "0 auto", width: "100%" }}>

          {/* Hero */}
          <div
            className="flex items-center gap-8 mb-10 p-7"
            style={{ background: M.coralBg, border: `1px solid oklch(0.55 0.09 35 / 0.18)` }}
          >
            <div className="shrink-0">
              <StripIllustration />
            </div>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: M.coral, marginBottom: 8 }}>
                THE PHILOSOPHY
              </p>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.45rem", fontWeight: 700, color: M.ink, lineHeight: 1.3, marginBottom: 10 }}>
                Your focus is a page.<br />Distractions are the strips.
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: M.muted, lineHeight: 1.65 }}>
                This workspace is built around one idea: ADHD brains are not broken. They are high-pressure systems that need the right release valves. Every feature here is a valve — and the tear-strip timer is the main one.
              </p>
            </div>
          </div>

          {/* Concept cards */}
          <div className="flex flex-col gap-4">
            {CONCEPTS.map(({ icon, title, body }) => (
              <div
                key={title}
                style={{ background: M.card, border: `1px solid ${M.border}`, borderRadius: 10, overflow: "hidden", boxShadow: "3px 3px 0 oklch(0.65 0.04 75)" }}
              >
                <div style={{ background: "oklch(0.28 0.018 65)", padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "oklch(0.55 0.14 35)" }} />
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "oklch(0.65 0.04 75)" }} />
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "oklch(0.65 0.04 75)" }} />
                  </div>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "oklch(0.75 0.02 75)", marginLeft: 4 }}>insight.txt</span>
                </div>
                <div className="flex items-start gap-5 p-5">
                <div className="shrink-0 mt-0.5">{icon}</div>
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", fontWeight: 700, fontStyle: "italic", color: M.ink, marginBottom: 6 }}>
                    {title}
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: M.muted, lineHeight: 1.65 }}>
                    {body}
                  </p>
                </div>
                </div>{/* end inner padding */}
              </div>
            ))}
          </div>

          {/* Footer quote */}
          <div className="mt-10 mb-8 text-center">
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontStyle: "italic", color: M.muted, lineHeight: 1.7 }}>
              "Your brain is not broken — it just works differently."
            </p>
            <div className="mt-4">
              <button
                onClick={() => navigate("/")}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.75rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: M.coral,
                  background: "transparent",
                  border: `1px solid oklch(0.55 0.09 35 / 0.35)`,
                  padding: "8px 20px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Back to workspace →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

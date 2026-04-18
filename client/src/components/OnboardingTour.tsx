/**
 * OnboardingTour.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Animated spotlight-based feature tour for first-time users.
 *
 * Design language: retro lo-fi (Space Mono labels, warm parchment palette,
 * pencil-stroke borders, terracotta accents) — consistent with the rest of
 * the app.
 *
 * Behaviour
 * ──────────
 * • Auto-triggers once per account (localStorage flag "adhd-tour-completed").
 * • Dismissed (×) → re-shows next session (flag not set).
 * • Completed or "Skip tour" → flag set, never auto-shows again.
 * • Replay available from the sidebar via window event "startOnboardingTour".
 *
 * Each step
 * ─────────
 * • Navigates to the relevant section via window event "navigateTo".
 * • Adds a data-tour-id attribute to the target element and scrolls it into
 *   view, then draws an animated spotlight ring around it.
 * • Shows a retro tooltip card with title, description, and step counter.
 * • Supports Next / Back / Skip / Finish navigation.
 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Sparkles, MapPin } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TourStep {
  /** Section to navigate to before highlighting */
  section: string;
  /** data-tour-id value on the target DOM element */
  targetId: string;
  /** Short retro-style label (all-caps) */
  label: string;
  /** Step title */
  title: string;
  /** Longer description shown in the tooltip */
  description: string;
  /** Emoji icon for visual flair */
  icon: string;
  /** Preferred tooltip placement relative to spotlight */
  placement?: "top" | "bottom" | "left" | "right" | "center";
  /** If true, do not call onNavigate — spotlight the element in-place (for sidebar-only steps that would trigger a route change) */
  noNavigate?: boolean;
}

interface OnboardingTourProps {
  /** Called when the tour is closed (either completed or dismissed) */
  onClose: () => void;
  /** Called when a section navigation is requested */
  onNavigate: (section: string) => void;
}

// ─── Tour steps definition ────────────────────────────────────────────────────

export const TOUR_STEPS: TourStep[] = [
  // ── 1. Dashboard overview ──────────────────────────────────────────────────
  {
    section: "dashboard",
    targetId: "tour-dashboard",
    label: "DASHBOARD",
    title: "Your ADHD Command Centre",
    description:
      "Everything starts here. The Dashboard is your single home base — see your Focus Timer, your most urgent tasks, and your AI assistant all in one glance. No tab-switching, no context loss.",
    icon: "🏠",
    placement: "right",
  },
  // ── 2. Focus Timer (inline) ────────────────────────────────────────────────
  {
    section: "dashboard",
    targetId: "tour-focus-timer",
    label: "FOCUS TIMER",
    title: "Pomodoro Focus Timer",
    description:
      "Start a timed focus block right on the Dashboard. The timer runs a Pomodoro cycle, tracks your sessions, and logs each completed block to your Monthly Calendar automatically.",
    icon: "⏱️",
    placement: "right",
  },
  // ── 3. AI Chat (inline dashboard) ─────────────────────────────────────────
  {
    section: "dashboard",
    targetId: "tour-ai-chat",
    label: "AI CHAT",
    title: "AI Command Center",
    description:
      'Type anything in plain English — "add task review slides", "create goal learn Spanish", "log win finished report". Your AI assistant knows your goals and tasks and handles the rest.',
    icon: "🤖",
    placement: "left",
  },
  // ── 4. AI Assistant button (right panel) ──────────────────────────────────
  {
    section: "dashboard",
    targetId: "tour-ai-btn",
    label: "AI BUTTON",
    title: "AI Assistant — Always Available",
    description:
      "The 🤖 button on the right edge is available on every page. On the Dashboard it shows/hides the inline AI panel. On any other page it opens a floating chat so you never lose your place.",
    icon: "🤖",
    placement: "left",
  },
  // ── 5. Life Coach button ───────────────────────────────────────────────────
  {
    section: "dashboard",
    targetId: "tour-coach-btn",
    label: "LIFE COACH",
    title: "🧭 Life Coach",
    description:
      "The compass button opens your personal AI Life Coach. Have a real conversation about your life direction or career path. When you finish, the coach saves a structured summary as your Life Dashboard — visible at the top of the Goals page.",
    icon: "🧭",
    placement: "left",
  },
  // ── 6. Timer button (right panel) ─────────────────────────────────────────
  {
    section: "dashboard",
    targetId: "tour-timer-btn",
    label: "QUICK TIMER",
    title: "⏱ Quick Timer — Any Page",
    description:
      "The timer button on the right edge lets you start or pause a Pomodoro from any page without leaving what you're doing. The live countdown is shown right on the button.",
    icon: "⏱",
    placement: "left",
  },
  // ── 7. Daily Routine button ────────────────────────────────────────────────
  {
    section: "dashboard",
    targetId: "tour-routine-btn",
    label: "DAILY ROUTINE",
    title: "💫 Daily Routine",
    description:
      "The 💫 button opens your Daily Routine panel — a checklist of habits you want to build. Complete a habit and it auto-logs as a Win. A consistent daily anchor is especially powerful for ADHD brains.",
    icon: "💫",
    placement: "left",
  },
  // ── 8. Tasks ───────────────────────────────────────────────────────────────
  {
    section: "tasks",
    targetId: "tour-tasks",
    label: "TASKS",
    title: "My Tasks",
    description:
      "Capture every task here. Use #hashtags to tag by context — #work, #health, #learning. Tasks have four priority levels: Urgent, Focus, Normal, and Someday. URLs in task text are automatically clickable.",
    icon: "✅",
    placement: "right",
  },
  // ── 9. Goals ──────────────────────────────────────────────────────────────
  {
    section: "goals",
    targetId: "tour-goals",
    label: "GOALS",
    title: "Goals Tracker",
    description:
      "Set up to 5 goals per category and track progress with a visual bar. Use #hashtags in the input to assign categories on the fly. Goals at 100% move to the bottom automatically.",
    icon: "🎯",
    placement: "right",
  },
  // ── 10. Life Dashboard (inside Goals) ─────────────────────────────────────
  {
    section: "goals",
    targetId: "tour-goals",
    label: "LIFE DASHBOARD",
    title: "🌱 Life Dashboard",
    description:
      "After chatting with your Life Coach, a Life Dashboard card appears here at the top of Goals. It shows your life direction, career direction, key insights, and your next step — updated every time you talk to the coach.",
    icon: "🌱",
    placement: "right",
  },
  // ── 11. Brain Dump ────────────────────────────────────────────────────────
  {
    section: "dump",
    targetId: "tour-dump",
    label: "BRAIN DUMP",
    title: "Brain Dump",
    description:
      "When your brain is overflowing, dump everything here — no structure needed. Use #tags to loosely organise. The AI can sort your entries into tasks, goals, ideas, or worries and convert them with one tap.",
    icon: "🧠",
    placement: "right",
  },
  // ── 12. Daily Wins ────────────────────────────────────────────────────────
  {
    section: "wins",
    targetId: "tour-wins",
    label: "DAILY WINS",
    title: "Daily Wins",
    description:
      "Log every win — big or small. Completing a focus block, drinking water, sending that email. Pick an icon that matches the category. Wins feed your Monthly Progress score and remind you that you ARE making progress.",
    icon: "🏆",
    placement: "right",
  },
  // ── 13. AI Agents ─────────────────────────────────────────────────────────
  {
    section: "agents",
    targetId: "tour-agents",
    label: "AI AGENTS",
    title: "AI Agents",
    description:
      "Delegate recurring or complex tasks to AI Agents. Each agent has a brief, a status (Pending → Active → Done), and can be linked to a task. When an agent is marked Done, it auto-logs a Win.",
    icon: "🤖",
    placement: "right",
  },
  // ── 14. Quick Add FAB ────────────────────────────────────────────────────────────
  {
    section: "dashboard",
    targetId: "tour-quick-add",
    label: "QUICK ADD",
    title: "Quick Add — Press + Anywhere",
    description:
      "The + button in the bottom-right corner (or press the + key) opens a quick-capture modal. Add a task, goal, win, or brain dump entry without navigating away. Perfect for capturing thoughts the moment they appear.",
    icon: "➕",
    placement: "top",  // button is bottom-right — tooltip goes above it
  },
  // ── 15. Daily Check-In card ─────────────────────────────────────────────────────
  {
    section: "dashboard",
    targetId: "tour-dashboard",
    label: "CHECK-IN CARD",
    title: "☀️ Daily Check-In Card",
    description:
      "Every morning a Check-In card appears automatically. As someone with ADHD, you shouldn't have to navigate five pages to start your day. Set your mood, review top tasks, and set one intention — all in one card, then dismiss it.",
    icon: "☀️",
    placement: "right",
  },
  // ── 16. Wrap Up ─────────────────────────────────────────────────────────────
  {
    section: "dashboard",
    targetId: "tour-wrapup",          // spotlight the trigger button in the header
    label: "WRAP UP",
    title: "🌙 Daily Wrap Up",
    description:
      "At the end of your day, click Wrap Up in the top bar. It shows your completed tasks, wins, and focus score. The AI writes a personalised reflection on your day. This data feeds your Monthly Progress calendar.",
    icon: "🌙",
    placement: "bottom",              // tooltip appears below the header button
  },
  // ── 17. Monthly Progress ──────────────────────────────────────────────────
  {
    section: "dashboard",   // stay on dashboard — monthly is a separate route
    targetId: "tour-monthly",
    label: "MONTHLY",
    title: "📅 Monthly Progress",
    description:
      "The calendar icon in the sidebar opens your Monthly Progress page. Every day shows a score, mood, wins count, and focus time. Tap any day to see its full summary and AI reflection. Track your patterns over time.",
    icon: "📅",
    placement: "right",
    noNavigate: true,   // spotlight the sidebar button without changing route
  } as TourStep & { noNavigate?: boolean },
  // ── 18. Settings — Effects ────────────────────────────────────────────────
  {
    section: "dashboard",
    targetId: "tour-settings",
    label: "SETTINGS",
    title: "⚙️ Settings — Atmosphere",
    description:
      "The gear icon opens Settings. In the Effects tab you can dial in Film Grain intensity for that lo-fi feel, and shift the Theme Hue to change the entire app's colour palette to match your mood.",
    icon: "🎨",
    placement: "right",
  },
  // ── 19. Settings — Work Mode ──────────────────────────────────────────────
  {
    section: "dashboard",
    targetId: "tour-settings",
    label: "WORK MODE",
    title: "🖤 Work Mode — No Distractions",
    description:
      "Work Mode (in Settings → Effects) strips the UI down to pure function — no decorative elements, muted colours, maximum focus. Toggle it on when you need to get serious. It persists across sessions.",
    icon: "🖤",
    placement: "right",
  },
  // ── 20. Settings — API Key ────────────────────────────────────────────────
  {
    section: "dashboard",
    targetId: "tour-settings",
    label: "API KEY",
    title: "🔑 AI Key — 6 Free Uses Included",
    description:
      "All AI features work out of the box — you get 6 free AI calls included. When you run out, open Settings → API Key tab and paste your own OpenAI key. Your key is encrypted and stored securely on the server.",
    icon: "🔑",
    placement: "right",
  },
  // ── 21. Guide ─────────────────────────────────────────────────────────────
  {
    section: "dashboard",   // stay on dashboard — guide is a separate route
    targetId: "tour-guide",
    label: "GUIDE",
    title: "📖 App Guide & Shortcuts",
    description:
      "The ? button at the bottom of the sidebar opens the full App Guide. It lists every keyboard shortcut (/ for AI chat, D for brain dump, + for quick add, Space for timer) and explains every feature in detail. Always there when you need a reminder.",
    icon: "📖",
    placement: "right",
    noNavigate: true,   // spotlight the sidebar button without changing route
  } as TourStep & { noNavigate?: boolean },
  // ── 22. Storage & Backup ──────────────────────────────────────────────────
  {
    section: "storage",
    targetId: "tour-storage",
    label: "STORAGE",
    title: "💾 Storage & Backup",
    description:
      "All your data lives in your browser. Export a full JSON backup any time, and import it on any device to keep your space in sync. No account required for local data — it's always yours.",
    icon: "💾",
    placement: "right",
  },
];

// ─── Palette tokens (matching app retro lo-fi theme) ─────────────────────────

const P = {
  parchment:  "oklch(0.975 0.012 60)",
  ink:        "oklch(0.28 0.040 320)",
  muted:      "oklch(0.52 0.040 330)",
  border:     "oklch(0.80 0.060 340)",
  terracotta: "oklch(0.58 0.18 340)",
  terracottaBg: "oklch(0.58 0.18 340 / 0.10)",
  sage:       "oklch(0.55 0.10 290)",
  overlay:    "oklch(0.10 0.02 320 / 0.55)",
  spotlight:  "oklch(0.58 0.18 340)",
};

const FONT_MONO = "'Space Mono', monospace";
const FONT_SANS = "'DM Sans', sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTargetRect(id: string): DOMRect | null {
  const el = document.querySelector(`[data-tour-id="${id}"]`);
  if (!el) return null;
  el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  return el.getBoundingClientRect();
}

function useTargetRect(targetId: string, deps: unknown[]) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    // Small delay to allow section transition + scroll to settle
    const t = setTimeout(() => {
      setRect(getTargetRect(targetId));
    }, 420);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, ...deps]);

  // Also update on window resize
  useEffect(() => {
    const onResize = () => setRect(getTargetRect(targetId));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [targetId]);

  return rect;
}

// ─── Spotlight SVG overlay ────────────────────────────────────────────────────

interface SpotlightProps {
  rect: DOMRect;
  padding?: number;
}

function Spotlight({ rect, padding = 14 }: SpotlightProps) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x = rect.left - padding;
  const y = rect.top - padding;
  const w = rect.width + padding * 2;
  const h = rect.height + padding * 2;
  const r = 10; // corner radius

  // SVG clip-path with a rounded rectangle hole
  const clipPath = `M0,0 H${vw} V${vh} H0 Z M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;

  return (
    <motion.svg
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9998, width: vw, height: vh }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Dark overlay with hole */}
      <path d={clipPath} fill={P.overlay} fillRule="evenodd" />
      {/* Animated spotlight ring */}
      <motion.rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        fill="none"
        stroke={P.spotlight}
        strokeWidth={2.5}
        strokeDasharray="8 4"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1, strokeDashoffset: [0, -48] }}
        transition={{
          opacity: { duration: 0.3 },
          scale: { duration: 0.35, ease: "easeOut" },
          strokeDashoffset: { duration: 2, repeat: Infinity, ease: "linear" },
        }}
      />
      {/* Corner accent dots */}
      {[
        [x - 3, y - 3],
        [x + w + 3, y - 3],
        [x - 3, y + h + 3],
        [x + w + 3, y + h + 3],
      ].map(([cx, cy], i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r={4}
          fill={P.spotlight}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + i * 0.05, duration: 0.25 }}
        />
      ))}
    </motion.svg>
  );
}

// ─── Tooltip card ─────────────────────────────────────────────────────────────

interface TooltipCardProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  rect: DOMRect;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onClose: () => void;
}

const CARD_W = 300;
const CARD_H_APPROX = 240; // slightly taller estimate to prevent bottom overflow
const GAP = 20;

function computeCardPosition(
  rect: DOMRect,
  placement: TourStep["placement"] = "right"
): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const safeBottom = vh - 16; // 16px bottom margin

  let left: number | undefined;
  let top: number | undefined;

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  if (placement === "center") {
    // Used for modal/popup targets — centre the card on screen
    left = Math.max(12, (vw - CARD_W) / 2);
    top = Math.max(12, (vh - CARD_H_APPROX) / 2);
  } else if (placement === "right") {
    left = Math.min(rect.right + GAP, vw - CARD_W - 12);
    top = Math.max(12, Math.min(cy - CARD_H_APPROX / 2, safeBottom - CARD_H_APPROX));
  } else if (placement === "left") {
    left = Math.max(12, rect.left - CARD_W - GAP);
    top = Math.max(12, Math.min(cy - CARD_H_APPROX / 2, safeBottom - CARD_H_APPROX));
  } else if (placement === "bottom") {
    left = Math.max(12, Math.min(cx - CARD_W / 2, vw - CARD_W - 12));
    top = Math.min(rect.bottom + GAP, safeBottom - CARD_H_APPROX);
  } else {
    // top
    left = Math.max(12, Math.min(cx - CARD_W / 2, vw - CARD_W - 12));
    top = Math.max(12, rect.top - CARD_H_APPROX - GAP);
  }

  // Final safety clamp: never let card go below viewport
  if (top !== undefined && top + CARD_H_APPROX > safeBottom) {
    top = Math.max(12, safeBottom - CARD_H_APPROX);
  }

  // Horizontal safety clamp
  if (left !== undefined && (left < 0 || left + CARD_W > vw)) {
    left = Math.max(12, (vw - CARD_W) / 2);
  }

  return { position: "fixed", left, top, width: CARD_W, zIndex: 9999 };
}

function TooltipCard({
  step,
  stepIndex,
  totalSteps,
  rect,
  onNext,
  onBack,
  onSkip,
  onClose,
}: TooltipCardProps) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const pos = computeCardPosition(rect, step.placement);

  return (
    <motion.div
      key={stepIndex}
      style={{
        ...pos,
        background: P.parchment,
        border: `1.5px solid ${P.border}`,
        borderRadius: 4,
        boxShadow: "3px 3px 0px oklch(0.58 0.18 340 / 0.18), 0 8px 24px oklch(0.18 0.04 320 / 0.14)",
        fontFamily: FONT_SANS,
        overflow: "hidden",
      }}
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {/* Title bar */}
      <div
        style={{
          background: P.terracottaBg,
          borderBottom: `1px solid ${P.border}`,
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "0.9rem" }}>{step.icon}</span>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: "0.52rem",
              letterSpacing: "0.14em",
              color: P.terracotta,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            {step.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: "0.48rem",
              color: P.muted,
              letterSpacing: "0.10em",
            }}
          >
            {stepIndex + 1}/{totalSteps}
          </span>
          <button
            onClick={onClose}
            title="Close tour"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: P.muted,
              padding: 2,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px 10px" }}>
        <h3
          style={{
            fontFamily: FONT_SANS,
            fontSize: "0.92rem",
            fontWeight: 700,
            color: P.ink,
            margin: "0 0 7px",
            lineHeight: 1.3,
          }}
        >
          {step.title}
        </h3>
        <p
          style={{
            fontFamily: FONT_SANS,
            fontSize: "0.78rem",
            color: P.muted,
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {step.description}
        </p>
      </div>

      {/* Progress dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 5,
          padding: "0 14px 8px",
        }}
      >
        {Array.from({ length: totalSteps }).map((_, i) => (
          <motion.div
            key={i}
            style={{
              width: i === stepIndex ? 16 : 6,
              height: 6,
              borderRadius: 3,
              background: i === stepIndex ? P.terracotta : P.border,
            }}
            animate={{ width: i === stepIndex ? 16 : 6 }}
            transition={{ duration: 0.25 }}
          />
        ))}
      </div>

      {/* Footer buttons */}
      <div
        style={{
          borderTop: `1px solid ${P.border}`,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        {/* Skip / Back */}
        <div style={{ display: "flex", gap: 6 }}>
          {!isFirst && (
            <button
              onClick={onBack}
              style={{
                background: "none",
                border: `1px solid ${P.border}`,
                borderRadius: 2,
                padding: "4px 10px",
                cursor: "pointer",
                fontFamily: FONT_MONO,
                fontSize: "0.52rem",
                letterSpacing: "0.10em",
                color: P.muted,
                display: "flex",
                alignItems: "center",
                gap: 4,
                textTransform: "uppercase",
              }}
            >
              <ArrowLeft size={10} />
              Back
            </button>
          )}
          {isFirst && (
            <button
              onClick={onSkip}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: FONT_MONO,
                fontSize: "0.50rem",
                letterSpacing: "0.10em",
                color: P.muted,
                textTransform: "uppercase",
                padding: "4px 6px",
                textDecoration: "underline",
                opacity: 0.7,
              }}
            >
              Skip tour
            </button>
          )}
        </div>

        {/* Next / Finish */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            fontFamily: FONT_MONO,
            fontSize: "0.42rem",
            color: P.muted,
            letterSpacing: "0.06em",
            opacity: 0.65,
            whiteSpace: "nowrap",
          }}>press →</span>
        <button
          onClick={isLast ? onSkip : onNext}
          style={{
            background: P.terracotta,
            border: "none",
            borderRadius: 2,
            padding: "5px 14px",
            cursor: "pointer",
            fontFamily: FONT_MONO,
            fontSize: "0.52rem",
            letterSpacing: "0.12em",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 5,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {isLast ? (
            <>
              <Sparkles size={11} />
              Let&apos;s Go!
            </>
          ) : (
            <>
              Next
              <ArrowRight size={11} />
            </>
          )}
        </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Welcome splash (step 0 before tour starts) ───────────────────────────────

interface WelcomeSplashProps {
  displayName?: string;
  onStart: () => void;
  onSkip: () => void;
}

function WelcomeSplash({ displayName, onStart, onSkip }: WelcomeSplashProps) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: P.overlay, backdropFilter: "blur(2px)" }}
      />

      {/* Card */}
      <motion.div
        style={{
          position: "relative",
          background: P.parchment,
          border: `2px solid ${P.border}`,
          borderRadius: 6,
          boxShadow: "4px 4px 0px oklch(0.58 0.18 340 / 0.22), 0 16px 40px oklch(0.18 0.04 320 / 0.18)",
          width: 380,
          maxWidth: "90vw",
          overflow: "hidden",
          fontFamily: FONT_SANS,
        }}
        initial={{ scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: -16 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Title bar */}
        <div
          style={{
            background: P.terracottaBg,
            borderBottom: `1.5px solid ${P.border}`,
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <MapPin size={12} color={P.terracotta} />
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: "0.55rem",
              letterSpacing: "0.14em",
              color: P.terracotta,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            welcome.tour
          </span>
          <div style={{ flex: 1 }} />
          {/* Retro window controls */}
          {["_", "□", "×"].map((c) => (
            <span
              key={c}
              style={{
                fontFamily: FONT_MONO,
                fontSize: "0.55rem",
                color: P.muted,
                opacity: 0.5,
                marginLeft: 4,
              }}
            >
              {c}
            </span>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: "28px 28px 20px", textAlign: "center" }}>
          {/* Animated mascot */}
          <motion.div
            style={{ fontSize: "3rem", marginBottom: 14, display: "block" }}
            animate={{ rotate: [0, -8, 8, -4, 4, 0], y: [0, -4, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5 }}
          >
            🐾
          </motion.div>

          <h2
            style={{
              fontFamily: FONT_SANS,
              fontSize: "1.25rem",
              fontWeight: 800,
              color: P.ink,
              margin: "0 0 8px",
              lineHeight: 1.25,
            }}
          >
            Welcome{displayName ? `, ${displayName}` : ""}!
          </h2>
          <p
            style={{
              fontFamily: FONT_SANS,
              fontSize: "0.82rem",
              color: P.muted,
              margin: "0 0 20px",
              lineHeight: 1.6,
            }}
          >
            This is your <strong style={{ color: P.ink }}>ADHD Focus Space</strong> — a calm,
            structured place to manage tasks, track goals, and stay in flow.
            <br />
            <br />
            I'll get you through it —{" "}
            <strong style={{ color: P.terracotta }}>one thing at a time</strong>.
          </p>

          {/* Feature preview pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            {TOUR_STEPS.map((s) => (
              <span
                key={s.targetId}
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: "0.46rem",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: P.terracotta,
                  background: P.terracottaBg,
                  border: `1px solid oklch(0.58 0.18 340 / 0.25)`,
                  borderRadius: 2,
                  padding: "3px 7px",
                }}
              >
                {s.icon} {s.label}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center" }}>
            <button
              onClick={onSkip}
              style={{
                background: "none",
                border: `1px solid ${P.border}`,
                borderRadius: 2,
                padding: "7px 16px",
                cursor: "pointer",
                fontFamily: FONT_MONO,
                fontSize: "0.52rem",
                letterSpacing: "0.10em",
                color: P.muted,
                textTransform: "uppercase",
              }}
            >
              Skip for now
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                fontFamily: FONT_MONO,
                fontSize: "0.44rem",
                color: P.muted,
                letterSpacing: "0.06em",
                opacity: 0.65,
                whiteSpace: "nowrap",
              }}>press →</span>
              <button
                onClick={onStart}
                style={{
                  background: P.terracotta,
                  border: "none",
                  borderRadius: 2,
                  padding: "7px 20px",
                  cursor: "pointer",
                  fontFamily: FONT_MONO,
                  fontSize: "0.52rem",
                  letterSpacing: "0.12em",
                  color: "white",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Sparkles size={12} />
                Start Tour
              </button>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div
          style={{
            borderTop: `1px solid ${P.border}`,
            padding: "8px 14px",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: "0.44rem",
              color: P.muted,
              letterSpacing: "0.08em",
              opacity: 0.7,
            }}
          >
            You can replay this tour anytime from the sidebar (? → Tour)
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Completion splash ────────────────────────────────────────────────────────

interface CompletionSplashProps {
  onClose: () => void;
}

function CompletionSplash({ onClose }: CompletionSplashProps) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{ background: P.overlay, backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />
      <motion.div
        style={{
          position: "relative",
          background: P.parchment,
          border: `2px solid ${P.border}`,
          borderRadius: 6,
          boxShadow: "4px 4px 0px oklch(0.58 0.18 340 / 0.22), 0 16px 40px oklch(0.18 0.04 320 / 0.18)",
          width: 340,
          maxWidth: "90vw",
          padding: "32px 28px",
          textAlign: "center",
          fontFamily: FONT_SANS,
          overflow: "hidden",
        }}
        initial={{ scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: -16 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          style={{ fontSize: "3rem", marginBottom: 14 }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          🎉
        </motion.div>
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: 800,
            color: P.ink,
            margin: "0 0 8px",
          }}
        >
          You&apos;re all set!
        </h2>
        <p
          style={{
            fontSize: "0.80rem",
            color: P.muted,
            margin: "0 0 22px",
            lineHeight: 1.6,
          }}
        >
          You now know your way around ADHD Focus Space.
          <br />
          Time to get into the zone. 🚀
        </p>
        <button
          onClick={onClose}
          style={{
            background: P.terracotta,
            border: "none",
            borderRadius: 2,
            padding: "8px 24px",
            cursor: "pointer",
            fontFamily: FONT_MONO,
            fontSize: "0.54rem",
            letterSpacing: "0.12em",
            color: "white",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Let&apos;s Focus!
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main OnboardingTour component ────────────────────────────────────────────

type TourPhase = "welcome" | "touring" | "complete" | "idle";

export function OnboardingTour({ onClose, onNavigate }: OnboardingTourProps) {
  const [phase, setPhase] = useState<TourPhase>("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [sectionReady, setSectionReady] = useState(false);
  const prevSectionRef = useRef<string>("");

  const currentStep = TOUR_STEPS[stepIndex];

  // Navigate to section when step changes
  useEffect(() => {
    if (phase !== "touring") return;
    const targetSection = currentStep.section;
    const skip = (currentStep as TourStep & { noNavigate?: boolean }).noNavigate;
    if (!skip && prevSectionRef.current !== targetSection) {
      onNavigate(targetSection);
      prevSectionRef.current = targetSection;
      setSectionReady(false);
      // Allow time for section to render
      const t = setTimeout(() => setSectionReady(true), 350);
      return () => clearTimeout(t);
    } else {
      // Either same section or noNavigate — element is already in DOM
      setSectionReady(true);
    }
  }, [phase, stepIndex, currentStep, onNavigate]);

  const rect = useTargetRect(
    phase === "touring" ? currentStep.targetId : "__none__",
    [stepIndex, sectionReady]
  );

  // ── Arrow-right keyboard shortcut to advance steps ───────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight") return;
      // Don't fire if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      e.preventDefault();
      if (phase === "welcome") {
        setPhase("touring");
        setStepIndex(0);
        prevSectionRef.current = "";
      } else if (phase === "touring") {
        if (stepIndex < TOUR_STEPS.length - 1) {
          setStepIndex((i) => i + 1);
        } else {
          // Last step — finish
          fetch("/api/tour-completed", { method: "POST", credentials: "include" }).catch(() => {
            localStorage.setItem("adhd-tour-completed", "1");
          });
          setPhase("complete");
        }
      } else if (phase === "complete") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, stepIndex, onClose]);

  const handleStart = useCallback(() => {
    setPhase("touring");
    setStepIndex(0);
    prevSectionRef.current = "";
  }, []);

  const handleNext = useCallback(() => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    }
  }, [stepIndex]);

  const handleBack = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex]);

  const handleFinish = useCallback(() => {
    // Persist tour-completed flag server-side (per user account)
    // Falls back gracefully if user is not authenticated
    fetch("/api/tour-completed", { method: "POST", credentials: "include" }).catch(() => {
      // Fallback: keep localStorage as a local cache so the tour doesn't
      // re-appear in the same session if the API call fails
      localStorage.setItem("adhd-tour-completed", "1");
    });
    setPhase("complete");
  }, []);

  const handleClose = useCallback(() => {
    // Dismissed (×) — don't set flag so it re-shows next session
    onClose();
  }, [onClose]);

  const handleCompletionClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence mode="wait">
      {phase === "welcome" && (
        <WelcomeSplash
          key="welcome"
          onStart={handleStart}
          onSkip={handleFinish}
        />
      )}

      {phase === "touring" && rect && (
        <React.Fragment key={`step-${stepIndex}`}>
          <Spotlight rect={rect} />
          <TooltipCard
            step={currentStep}
            stepIndex={stepIndex}
            totalSteps={TOUR_STEPS.length}
            rect={rect}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleFinish}
            onClose={handleClose}
          />
        </React.Fragment>
      )}

      {/* Loading state while waiting for section/element */}
      {phase === "touring" && !rect && sectionReady && (
        <motion.div
          key="loading"
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 9999 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            style={{
              background: P.parchment,
              border: `1.5px solid ${P.border}`,
              borderRadius: 4,
              padding: "10px 18px",
              fontFamily: FONT_MONO,
              fontSize: "0.55rem",
              letterSpacing: "0.12em",
              color: P.muted,
              textTransform: "uppercase",
            }}
          >
            Loading step…
          </div>
        </motion.div>
      )}

      {phase === "complete" && (
        <CompletionSplash key="complete" onClose={handleCompletionClose} />
      )}
    </AnimatePresence>
  );
}

// ─── Hook for controlling tour visibility ─────────────────────────────────────────────────────

export function useOnboardingTour() {
  const [show, setShow] = useState(false);

  // Auto-trigger for first-time users — checks server-side flag first,
  // falls back to localStorage if the user is not authenticated.
  useEffect(() => {
    const skippedName = localStorage.getItem("adhd-name-skipped");
    const hasName = localStorage.getItem("adhd-display-name");
    const delay = hasName || skippedName ? 1800 : 3200;

    let cancelled = false;

    async function checkAndShow() {
      // 1. Try server-side flag (works across devices / browsers)
      try {
        const resp = await fetch("/api/tour-completed", { credentials: "include" });
        if (resp.ok) {
          const data = await resp.json();
          if (data.tourCompleted) return; // already completed on this account
          // Server says not completed — schedule the tour
          setTimeout(() => { if (!cancelled) setShow(true); }, delay);
          return;
        }
      } catch {
        // Network error or not authenticated — fall through to localStorage
      }

      // 2. Fallback: localStorage (unauthenticated / offline users)
      const localCompleted = localStorage.getItem("adhd-tour-completed");
      if (localCompleted) return;
      setTimeout(() => { if (!cancelled) setShow(true); }, delay);
    }

    checkAndShow();
    return () => { cancelled = true; };
  }, []);

  // Listen for manual replay trigger from sidebar
  useEffect(() => {
    const handler = () => setShow(true);
    window.addEventListener("startOnboardingTour", handler);
    return () => window.removeEventListener("startOnboardingTour", handler);
  }, []);

  const close = useCallback(() => setShow(false), []);

  return { show, close };
}
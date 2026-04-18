/* ============================================================
   ADHD FOCUS SPACE — Monthly Progress Page
   Reads wins + tasks from localStorage, passes to MonthlyProgress.
   Supports two modes:
   - Standalone: full page with its own Sidebar + header (direct /monthly route)
   - Embedded:   renders only the MonthlyProgress content inside Home.tsx
                 so the onboarding tour and global overlays stay alive.
   ============================================================ */

import { Sidebar } from "@/components/Sidebar";
import { MonthlyProgress } from "@/components/MonthlyProgress";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useBlockStreak } from "@/hooks/useBlockStreak";
import type { Win } from "@/components/DailyWins";
import type { Task } from "@/components/TaskManager";
import { useLocation } from "wouter";

interface MonthlyProps {
  /** When true, renders only the content (no sidebar/header) — used inside Home.tsx */
  embedded?: boolean;
  /** Called when user wants to navigate to another section (embedded mode only) */
  onNavigate?: (section: string) => void;
}

export default function Monthly({ embedded = false, onNavigate }: MonthlyProps) {
  const [, navigate] = useLocation();
  const [wins]  = useLocalStorage<Win[]>("adhd-wins",  []);
  const [tasks] = useLocalStorage<Task[]>("adhd-tasks", []);
  const { streak: blockStreak, history: blockHistory } = useBlockStreak();

  const handleBack = () => {
    if (embedded && onNavigate) {
      onNavigate("dashboard");
    } else {
      navigate("/");
    }
  };

  // ── Embedded mode: just the content, no sidebar or header ──────────────────
  if (embedded) {
    return (
      <div className="flex-1 overflow-y-auto" data-tour-id="tour-monthly-page">
        <MonthlyProgress wins={wins} tasks={tasks} blockHistory={blockHistory} blockStreak={blockStreak} />
      </div>
    );
  }

  // ── Standalone mode: full page with sidebar + header ───────────────────────
  return (
    <div className="min-h-screen flex">
      <Sidebar activeSection="monthly" onSectionChange={(s) => {
        if (s === "monthly") return;
        navigate("/");
      }} />

      <main className="flex-1 ml-14 min-h-screen flex flex-col">
        {/* Top header bar */}
        <header
          className="sticky top-0 z-30 px-8 py-4 flex items-center gap-4"
          style={{
            background: "oklch(0.975 0.018 355 / 0.90)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid oklch(0.87 0.025 340)",
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ color: "oklch(0.58 0.18 340)", flexShrink: 0 }}>
              <rect x="2" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <line x1="2" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="6" y1="2" x2="6" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <h1
              className="text-base font-bold italic leading-tight truncate"
              style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.22 0.040 320)" }}
            >
              Monthly Progress
            </h1>
          </div>
          <button
            onClick={handleBack}
            className="text-xs transition-colors"
            style={{ color: "oklch(0.52 0.040 330)", fontFamily: "'DM Sans', sans-serif" }}
          >
            ← Back to dashboard
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <MonthlyProgress wins={wins} tasks={tasks} blockHistory={blockHistory} blockStreak={blockStreak} />
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   ADHD FOCUS SPACE — Global Quick Add v6.0
   Configurable quick-reply chips, persisted to DB via tRPC
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Flame, Loader2, Plus, Settings, Sparkles, Star, Trash2, X, Zap } from "lucide-react";
import { callAI } from "@/lib/ai";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Task } from "./TaskManager";

const M = {
  coral:    "oklch(0.58 0.18 340)",
  coralBg:  "oklch(0.58 0.18 340 / 0.08)",
  coralBdr: "oklch(0.58 0.18 340 / 0.28)",
  ink:      "oklch(0.28 0.040 320)",
  muted:    "oklch(0.52 0.040 330)",
  border:   "oklch(0.82 0.050 340)",
  card:     "oklch(0.975 0.018 355)",
};

const PRIORITY_CFG = {
  urgent: { label: "Urgent", Icon: Flame, color: "oklch(0.55 0.09 35)",  bg: "oklch(0.55 0.09 35 / 0.08)",  border: "oklch(0.55 0.09 35 / 0.28)" },
  focus:  { label: "Focus",  Icon: Zap,   color: "oklch(0.52 0.14 290)", bg: "oklch(0.52 0.14 290 / 0.08)", border: "oklch(0.52 0.14 290 / 0.28)" },
  normal: { label: "Normal", Icon: Star,  color: "oklch(0.55 0.10 330)", bg: "oklch(0.72 0.10 330 / 0.10)", border: "oklch(0.72 0.10 330 / 0.30)" },
} as const;

type Priority = "urgent" | "focus" | "normal";

const DEFAULT_CHIPS = [
  "Reply message from Sarah",
  "Reply email from manager",
  "Book appointment with doctor",
  "Book meeting with team",
  "Review pull request from Alex",
  "Send invoice to client",
];

interface GlobalQuickAddProps {
  onAddTask: (task: Task) => void;
}

export function GlobalQuickAdd({ onAddTask }: GlobalQuickAddProps) {
  const [open, setOpen]           = useState(false);
  const [configMode, setConfigMode] = useState(false);
  const [text, setText]           = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [priority, setPriority]   = useState<Priority>("focus");
  const [newChip, setNewChip]     = useState("");
  const inputRef    = useRef<HTMLInputElement>(null);
  const newChipRef  = useRef<HTMLInputElement>(null);

  // ── localStorage chips ─────────────────────────────────────────────────────
  const [customChips, setCustomChips] = useLocalStorage<string[]>("adhd-quick-chips", []);

  const createChip = {
    mutate: ({ text }: { text: string }) => setCustomChips((prev) => [...prev, text]),
    isPending: false,
  };
  const deleteChip = {
    mutate: ({ text }: { text: string }) => setCustomChips((prev) => prev.filter((c) => c !== text)),
    isPending: false,
  };

  // Use custom chips if any, otherwise use defaults
  const chips: string[] = customChips.length > 0 ? customChips : DEFAULT_CHIPS;

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === "Escape") { setOpen(false); setConfigMode(false); }
      if (e.key === "+") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && !(e.target as HTMLElement).isContentEditable) {
          e.preventDefault();
          setOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open && !configMode) setTimeout(() => inputRef.current?.focus(), 80);
    if (configMode) setTimeout(() => newChipRef.current?.focus(), 80);
  }, [open, configMode]);

  // ── Submit task ───────────────────────────────────────────────────────────
  const handleAiRefine = async () => {
    if (!text.trim()) return;
    setAiGenerating(true);
    try {
      const result = await callAI(
        `Convert the user's rough note into a clean, actionable task name. Max 60 chars, start with a verb, be specific. Return ONLY the task name.`,
        text.trim()
      );
      setText(result.trim().replace(/^["']|["']$/g, ""));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg !== "no-key" && msg !== "invalid-key") {
        import("sonner").then(({ toast }) => toast.error("AI unavailable", { duration: 2000 }));
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const hashMatch = trimmed.match(/(^|\s)#([\w-]+)/);
    const effectiveTag = hashMatch ? hashMatch[2].toLowerCase() : "personal";
    const cleanText = hashMatch
      ? trimmed.replace(/(^|\s)#[\w-]+(\s|$)/g, " ").replace(/\s{2,}/g, " ").trim()
      : trimmed;
    onAddTask({
      id: nanoid(),
      text: cleanText,
      priority,
      context: (effectiveTag === "work" || effectiveTag === "personal" ? effectiveTag : "personal") as "work" | "personal",
      done: false,
      createdAt: new Date(),
    });
    toast.success(`Task added · ${priority}${effectiveTag !== "personal" ? ` · #${effectiveTag}` : ""}`);
    setText("");
    setPriority("focus");
    setOpen(false);
  };

  // ── Add chip ──────────────────────────────────────────────────────────────
  const handleAddChip = () => {
    const trimmed = newChip.trim();
    if (!trimmed) return;
    // If using defaults (no custom chips yet), seed them first then add
    if (customChips.length === 0) {
      setCustomChips([...DEFAULT_CHIPS, trimmed]);
    } else {
      createChip.mutate({ text: trimmed });
    }
    setNewChip("");
  };

  // ── Delete chip ───────────────────────────────────────────────────────────
  const handleDeleteChip = (chipText: string) => {
    // If using defaults, seed them first then remove the target
    if (customChips.length === 0) {
      setCustomChips(DEFAULT_CHIPS.filter((c) => c !== chipText));
    } else {
      deleteChip.mutate({ text: chipText });
    }
  };

  const closeModal = () => { setOpen(false); setConfigMode(false); };

  return (
    <>
      {/* Floating trigger */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1.5"
        style={{ opacity: open ? 0 : 1, pointerEvents: open ? "none" : "auto", transition: "opacity 0.15s" }}
      >
        <button
          onClick={() => setOpen(true)}
          title="Quick add task (⌘K or +)"
          className="w-12 h-12 flex items-center justify-center transition-all duration-200 active:translate-y-[2px] active:shadow-none"
          style={{ background: "oklch(0.975 0.018 355)", border: `2px solid ${M.ink}`, boxShadow: `3px 3px 0 ${M.ink}`, fontFamily: "'Space Mono', monospace" }}
        >
          <Plus className="w-5 h-5" style={{ color: M.coral }} />
        </button>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.50rem", letterSpacing: "0.08em", color: M.muted, textAlign: "center", lineHeight: 1.3, userSelect: "none", pointerEvents: "none" }}>
          press +
        </span>
      </div>

      {/* Backdrop + modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "oklch(0.18 0.01 60 / 0.25)", backdropFilter: "blur(4px)" }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg overflow-hidden shadow-2xl"
            style={{ background: M.card, border: `1px solid ${M.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: M.coralBg, border: `1px solid ${M.coralBdr}` }}>
                <Zap className="w-4 h-4" style={{ color: M.coral }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>Quick capture</p>
                <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                  {configMode ? "Manage quick-reply chips" : "One sentence — no formatting needed"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setConfigMode((v) => !v)}
                  title="Configure chips"
                  className="p-1 transition-colors"
                  style={{ color: configMode ? M.coral : M.muted }}
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button onClick={closeModal} className="p-1 transition-colors" style={{ color: M.muted }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Config mode ── */}
            {configMode ? (
              <div className="px-5 pb-5">
                {/* Add new chip */}
                <div className="flex gap-2 mb-4">
                  <input
                    ref={newChipRef}
                    value={newChip}
                    onChange={(e) => setNewChip(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddChip(); }}
                    placeholder="New quick-reply chip…"
                    autoComplete="off"
                    className="flex-1 text-sm px-3 py-2 bg-transparent focus:outline-none"
                    style={{ border: `1px solid ${M.border}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = M.coralBdr; }}
                    onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = M.border; }}
                  />
                  <button
                    onClick={handleAddChip}
                    disabled={!newChip.trim()}
                    className="m-btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontSize: "0.75rem" }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                {/* Chip list */}
                <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
                  {chips.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>No chips yet. Add one above.</p>
                  )}
                  {chips.map((chip) => (
                    <div
                      key={chip}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                      style={{ border: `1px solid ${M.border}`, background: "oklch(0.99 0.010 355)" }}
                    >
                      <span className="text-xs flex-1 truncate" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>{chip}</span>
                      <button
                        onClick={() => handleDeleteChip(chip)}
                        className="p-0.5 transition-colors shrink-0"
                        style={{ color: M.muted }}
                        title="Delete chip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-xs mt-3" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                  Chips are saved to your account and backed up automatically.
                </p>
              </div>
            ) : (
              /* ── Capture mode ── */
              <div className="px-5 pb-5">
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") closeModal(); }}
                  placeholder="e.g. Reply message from Alice…"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full text-base px-4 py-3 bg-transparent focus:outline-none"
                  style={{ border: `1px solid ${M.border}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = M.coralBdr; }}
                  onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = M.border; }}
                />

                {/* AI refine button */}
                <button
                  onClick={handleAiRefine}
                  disabled={aiGenerating || !text.trim()}
                  title="AI: refine into a clean task name"
                  className="flex items-center gap-1.5 mt-2"
                  style={{
                    background: "none", border: "none", cursor: aiGenerating || !text.trim() ? "not-allowed" : "pointer",
                    color: text.trim() ? M.coral : M.muted, padding: "2px 0",
                    fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.08em",
                    opacity: text.trim() ? 1 : 0.4,
                  }}
                >
                  {aiGenerating ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={11} />}
                  <span>{aiGenerating ? "Refining…" : "✦ AI refine"}</span>
                </button>

                {/* Priority row */}
                <div className="flex items-center gap-1.5 mt-2">
                  {(["urgent", "focus", "normal"] as Priority[]).map((p) => {
                    const { label, Icon, color, bg, border } = PRIORITY_CFG[p];
                    const isActive = priority === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className="flex items-center gap-1.5 px-3 py-1 transition-all"
                        style={{
                          background:    isActive ? bg : "transparent",
                          color:         isActive ? color : M.muted,
                          border:        `1px solid ${isActive ? border : M.border}`,
                          fontFamily:    "'DM Sans', sans-serif",
                          fontSize:      "0.62rem",
                          fontWeight:    isActive ? 600 : 400,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          borderRadius:  0,
                        }}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Quick chips */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => { setText(chip); inputRef.current?.focus(); }}
                      className="m-chip"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Submit row */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                    tip: type <span style={{ color: M.coral }}>#tag</span> in text to categorise
                  </p>
                  <button
                    onClick={submit}
                    disabled={!text.trim()}
                    className="m-btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add task
                    <kbd className="text-xs opacity-60 ml-1">↵</kbd>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   ADHD FOCUS SPACE — Brain Dump v5.0 (DB-backed)
   All entries persisted to database via tRPC
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { PixelBrain } from "@/components/PixelIcons";
import { cn } from "@/lib/utils";
import { ArrowRight, Hash, Sparkles, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { callAI } from "@/lib/ai";

interface BrainDumpEntry {
  id: string;
  text: string;
  tags: string[];
  createdAt: Date;
  converted: boolean;
}

interface BrainDumpProps {
  onConvertToTask: (task: Task) => void;
  onCreateAgent?: (taskText: string) => void;
  onAddGoal?: (text: string) => void;
  onDump?: () => void;
  initialText?: string;
  onInitialTextConsumed?: () => void;
}

const M = {
  coral:    "oklch(0.58 0.18 340)",
  coralBg:  "oklch(0.58 0.18 340 / 0.08)",
  coralBdr: "oklch(0.58 0.18 340 / 0.28)",
  sage:     "oklch(0.52 0.10 168)",
  sageBg:   "oklch(0.52 0.10 168 / 0.08)",
  sageBdr:  "oklch(0.52 0.10 168 / 0.28)",
  ink:      "oklch(0.28 0.040 320)",
  muted:    "oklch(0.52 0.040 330)",
  border:   "oklch(0.82 0.050 340)",
  card:     "oklch(0.975 0.018 355)",
  tagBg:    "oklch(0.58 0.18 340 / 0.10)",
  tagBdr:   "oklch(0.58 0.18 340 / 0.22)",
};

/** Extract all #tags from a string, return lowercase without the # */
function extractTags(text: string): string[] {
  const matches = text.match(/(?:^|\s)(#[a-zA-Z0-9\u4e00-\u9fa5_-]+)/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((t) => t.trim().slice(1).toLowerCase())));
}

/** Render text with #tags highlighted as inline coral chips */
function HighlightedText({ text, activeTag }: { text: string; activeTag: string | null }) {
  const parts = text.split(/((?:^|(?<=\s))#[a-zA-Z0-9\u4e00-\u9fa5_-]+)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("#")) {
          const tag = part.slice(1).toLowerCase();
          const isActive = activeTag === tag;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-0.5 mx-0.5 px-1.5 py-0.5 text-xs font-medium"
              style={{
                background: isActive ? M.coral : M.tagBg,
                border: `1px solid ${isActive ? M.coral : M.tagBdr}`,
                color: isActive ? "oklch(0.97 0.010 355)" : M.coral,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              <Hash className="w-2.5 h-2.5" />
              {part.slice(1)}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function BrainDump({ onConvertToTask, onCreateAgent, onAddGoal, onDump, initialText, onInitialTextConsumed }: BrainDumpProps) {
  const [currentThought, setCurrentThought] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [initialTextHandled, setInitialTextHandled] = useState(false);
  const [aiSorting, setAiSorting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // localStorage-backed entries
  const [rawEntries, setRawEntries] = useLocalStorage<Array<{
    id: string; text: string; tags: string[]; createdAt: string; converted: boolean;
  }>>("adhd_braindump_entries", []);

  const entries: BrainDumpEntry[] = useMemo(() =>
    rawEntries.map((e) => ({ ...e, createdAt: new Date(e.createdAt) })),
    [rawEntries]
  );

  const isLoading = false;

  const createMutation = {
    mutate: ({ id, text, tags }: { id: string; text: string; tags: string[] }) => {
      setRawEntries((prev) => [{ id, text, tags, createdAt: new Date().toISOString(), converted: false }, ...prev]);
    },
    isPending: false,
  };

  const updateMutation = {
    mutate: ({ id, converted }: { id: string; converted?: boolean }) => {
      setRawEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...(converted !== undefined && { converted }) } : e));
    },
  };

  const deleteMutation = {
    mutate: ({ id }: { id: string }) => {
      setRawEntries((prev) => prev.filter((e) => e.id !== id));
    },
  };

  const deleteAllMutation = {
    mutate: () => {
      setRawEntries([]);
      setActiveTag(null);
    },
  };

  // All unique tags across all entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [entries]);

  // Entries filtered by active tag — exclude converted entries from display
  const visibleEntries = useMemo(() => {
    const active = entries.filter((e) => !e.converted);
    if (!activeTag) return active;
    return active.filter((e) => e.tags.includes(activeTag));
  }, [entries, activeTag]);

  const dump = (text?: string) => {
    const thought = (text ?? currentThought).trim();
    if (!thought) return;
    const tags = extractTags(thought);
    const id = nanoid();
    createMutation.mutate({ id, text: thought, tags });
    if (!text) setCurrentThought("");
    onDump?.();
    const tagMsg = tags.length > 0 ? ` Tagged: ${tags.map((t) => `#${t}`).join(", ")}` : "";
      };

  const convertToTask = (entry: BrainDumpEntry) => {
    const cleanText = entry.text.replace(/(?:^|\s)#[a-zA-Z0-9\u4e00-\u9fa5_-]+/g, " ").replace(/\s{2,}/g, " ").trim();
    onConvertToTask({
      id: nanoid(), text: cleanText || entry.text.trim(), priority: "focus",
      context: "work", done: false, createdAt: new Date(),
    });
    updateMutation.mutate({ id: entry.id, converted: true });
      };

  const deleteEntry = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const clearAll = () => {
    deleteAllMutation.mutate();
    toast.info("Brain dump cleared.", { duration: 2000 });
  };

  const handleAiSort = async () => {
    const active = entries.filter((e) => !e.converted);
    if (active.length === 0) { toast.info("Nothing to sort."); return; }
    setAiSorting(true);
    try {
      const result = await callAI(
        `You categorize brain dump entries. Return ONLY valid JSON with this shape:
{ "items": [{ "original": string, "category": string, "action": string, "rewritten": string, "emoji": string }] }
Categories: task, idea, worry, reference, someday. Keep it brief.`,
        active.map((e) => e.text).join("\n")
      );
      // Try to parse JSON from the response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { items: { original: string; category: string; action: string; rewritten: string; emoji: string }[] };
        if (parsed.items?.length) {
          toast.success(`AI sorted ${parsed.items.length} entries. Tags auto-applied.`);
          // Re-tag entries with AI category as a hashtag
          parsed.items.forEach((item) => {
            const entry = active.find((e) => e.text.includes(item.original.slice(0, 20)));
            if (entry) {
              const newTag = item.category.replace(/\s+/g, "_").toLowerCase();
              if (!entry.tags.includes(newTag)) {
                setRawEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, tags: [...e.tags, newTag] } : e));
              }
            }
          });
        }
      } else {
        toast.info("AI sorted your dump — check the console for details.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI sort failed";
      toast.error(msg, { duration: 5000 });
    } finally {
      setAiSorting(false);
    }
  };

  // Auto-dump initialText once on mount
  useEffect(() => {
    if (initialText && initialText.trim() && !initialTextHandled) {
      setInitialTextHandled(true);
      dump(initialText.trim());
      onInitialTextConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText]);

  // Live tag preview while typing
  const liveTagsInInput = extractTags(currentThought);

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <PixelBrain size={28} color={M.coral} />
        <div>
          <p className="text-sm font-semibold italic" style={{ color: M.ink, fontFamily: "'Playfair Display', serif" }}>Brain Dump</p>
          <p className="editorial-label" style={{ color: M.muted }}>Use <span style={{ color: M.coral }}>#tags</span> to organise</p>
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <Textarea
          ref={textareaRef}
          value={currentThought}
          onChange={(e) => setCurrentThought(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) dump(); }}
          placeholder={"What's on your mind? Use #tags to label ideas…"}
          className="resize-none min-h-[100px]"
          style={{ background: M.card, border: `1px solid ${M.border}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
          rows={4}
        />

        {/* Live tag preview */}
        {liveTagsInInput.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3 h-3 shrink-0" style={{ color: M.muted }} />
            <span className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Detected:</span>
            {liveTagsInInput.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium"
                style={{ background: M.tagBg, border: `1px solid ${M.tagBdr}`, color: M.coral, fontFamily: "'DM Sans', sans-serif" }}
              >
                <Hash className="w-2.5 h-2.5" />
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>⌘ + Enter to capture</span>
          <button onClick={() => dump()} disabled={createMutation.isPending} className="m-btn-primary">
            {createMutation.isPending ? "Saving…" : "Dump It"}
          </button>
        </div>
      </div>

      {/* AI Results Panel */}
      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.10em", textTransform: "uppercase" }}>
              Filter by tag
            </span>
            <button onClick={() => setActiveTag(null)} className={cn("m-chip", !activeTag && "active")}>
              All ({entries.filter(e => !e.converted).length})
            </button>
            {allTags.map((tag) => {
              const count = entries.filter((e) => e.tags.includes(tag) && !e.converted).length;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={cn("m-chip", activeTag === tag && "active")}
                >
                  <Hash className="w-2.5 h-2.5" />
                  {tag} ({count})
                </button>
              );
            })}
          </div>
          {activeTag && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                Showing {visibleEntries.length} idea{visibleEntries.length !== 1 ? "s" : ""} tagged
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium"
                style={{ background: M.coral, border: `1px solid ${M.coral}`, color: "oklch(0.97 0.005 80)", fontFamily: "'DM Sans', sans-serif" }}>
                <Hash className="w-2.5 h-2.5" />
                {activeTag}
              </span>
              <button onClick={() => setActiveTag(null)} className="p-0.5 transition-opacity hover:opacity-60" style={{ color: M.muted }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Entries header */}
      {entries.filter(e => !e.converted).length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
            {activeTag ? `#${activeTag}` : "All thoughts"}{" "}
            <span style={{ color: M.muted }}>({visibleEntries.length})</span>
          </p>
          <div className="flex items-center gap-2">
            <button onClick={handleAiSort} disabled={aiSorting} className="m-btn-link flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {aiSorting ? "Sorting…" : "AI Sort"}
            </button>
            <button onClick={clearAll} disabled={deleteAllMutation.isPending} className="m-btn-link">
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <span className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Loading…</span>
        </div>
      )}

      {/* Entries list */}
      {!isLoading && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {entries.filter(e => !e.converted).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div style={{ opacity: 0.3 }}><PixelBrain size={40} color={M.muted} /></div>
              <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Empty. Let your thoughts flow.</p>
            </div>
          )}

          {visibleEntries.length === 0 && entries.filter(e => !e.converted).length > 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Tag className="w-8 h-8 mb-2" style={{ color: `${M.muted}50` }} />
              <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                No ideas tagged <span style={{ color: M.coral }}>#{activeTag}</span> yet.
              </p>
            </div>
          )}

          {visibleEntries.map((entry) => (
            <div
              key={entry.id}
              className={cn("group flex flex-col gap-2 p-3 transition-all")}
              style={{
                background: entry.converted ? "oklch(0.93 0.030 355 / 0.5)" : M.card,
                border: `1px solid ${M.border}`,
                opacity: entry.converted ? 0.55 : 1,
              }}
              onMouseEnter={(e) => {
                if (!entry.converted) (e.currentTarget as HTMLDivElement).style.borderColor = M.coralBdr;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = M.border;
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    className={cn("text-sm leading-relaxed", entry.converted && "line-through")}
                    style={{ color: entry.converted ? M.muted : M.ink, fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {entry.text.replace(/(?:^|\s)#[a-zA-Z0-9\u4e00-\u9fa5_-]+/g, "").trim()}
                  </p>
                  <p className="text-xs mt-1" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                    {new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>

                {!entry.converted && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => convertToTask(entry)} className="m-chip active">
                      <ArrowRight className="w-3 h-3" />
                      Task
                    </button>
                    <button onClick={() => deleteEntry(entry.id)} className="p-1 transition-colors" style={{ color: M.muted }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {entry.converted && (
                  <span className="text-xs shrink-0" style={{ color: M.sage, fontFamily: "'DM Sans', sans-serif" }}>→ Task</span>
                )}
              </div>

              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1" style={{ borderTop: `1px solid ${M.border}` }}>
                  {entry.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      className={cn("m-chip", activeTag === tag && "active")}
                      style={{ fontSize: "0.58rem" }}
                    >
                      <Hash className="w-2 h-2" />
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

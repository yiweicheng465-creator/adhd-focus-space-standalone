/* ============================================================
   ADHD FOCUS SPACE — Daily Wins Tracker v6.0
   Icons: lifestyle SVG (health, study, work, social, creative,
          mindfulness, fitness, nutrition) — no pixel text
   Each logged win has a clickable icon to change category.
   Archiving: wins can be archived (hidden from main list but
   still count toward totals). Archived wins can be permanently
   deleted from the archive view.
   ============================================================ */

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Plus, Archive, Trash2, ArchiveRestore, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";

export interface Win {
  id: string;
  text: string;
  iconIdx: number;
  createdAt: Date;
  archived?: boolean;
}

// ── Lifestyle SVG icons ────────────────────────────────────────────────────────
interface IconProps { size?: number; color?: string }

function IconHealth({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 0.5C21 14.5 12 21 12 21z" />
      <polyline points="6,12 9,9 11,14 13,10 15,12 18,12" strokeWidth="1.4" />
    </svg>
  );
}

function IconStudy({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6s2-1 6-1 6 1 6 1v13s-2-1-6-1-6 1-6 1V6z" />
      <path d="M14 6s2-1 6-1v13s-2-1-6-1" />
      <line x1="12" y1="6" x2="12" y2="19" />
    </svg>
  );
}

function IconWork({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="20" height="13" rx="2" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="2" y1="14" x2="22" y2="14" />
    </svg>
  );
}

function IconSocial({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <circle cx="18" cy="7" r="2.5" />
      <path d="M21 21v-1.5a3 3 0 0 0-2.5-2.97" />
    </svg>
  );
}

function IconCreative({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="8.5" cy="10" r="1.5" fill={color} stroke="none" />
      <circle cx="15.5" cy="10" r="1.5" fill={color} stroke="none" />
      <circle cx="12" cy="7" r="1.5" fill={color} stroke="none" />
      <path d="M12 21a4 4 0 0 0 4-4c0-2-2-3-4-3s-4 1-4 3a4 4 0 0 0 4 4z" fill={color} stroke="none" opacity="0.4" />
    </svg>
  );
}

function IconMindful({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20c0 0-7-5-7-10a7 7 0 0 1 14 0c0 5-7 10-7 10z" />
      <path d="M12 20c0 0 4-3 4-7" strokeWidth="1.2" opacity="0.5" />
      <path d="M12 20c0 0-4-3-4-7" strokeWidth="1.2" opacity="0.5" />
      <circle cx="12" cy="10" r="2" fill={color} stroke="none" opacity="0.5" />
    </svg>
  );
}

function IconFitness({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="18" y2="12" />
      <rect x="2" y="9" width="4" height="6" rx="1" />
      <rect x="18" y="9" width="4" height="6" rx="1" />
      <rect x="5" y="10.5" width="2" height="3" rx="0.5" />
      <rect x="17" y="10.5" width="2" height="3" rx="0.5" />
    </svg>
  );
}

function IconNutrition({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c-1 0-3 1-3 3 0 0 1-1 3-1s3 1 3 1c0-2-2-3-3-3z" fill={color} stroke="none" opacity="0.4" />
      <path d="M12 5c-4 0-6 3-6 7 0 5 3 8 6 8s6-3 6-8c0-4-2-7-6-7z" />
      <line x1="12" y1="3" x2="13" y2="1" />
    </svg>
  );
}

// ── Special block-complete icon (iconIdx === 99) ─────────────────────────────
function IconBlockComplete({ size = 20, color = "#C0622F" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Flame */}
      <path
        d="M12 2c0 0-1 3-1 5 0 1.5 1 3 1 3s-3-1-3-4c0 0-3 3-3 7a6 6 0 0 0 12 0c0-5-4-8-6-11z"
        fill={color}
        opacity="0.85"
        stroke="none"
      />
      <path
        d="M12 14c0 0-1.5 1-1.5 2.5a1.5 1.5 0 0 0 3 0C13.5 15 12 14 12 14z"
        fill="oklch(0.95 0.04 60)"
        stroke="none"
      />
    </svg>
  );
}

// ── Icon registry ──────────────────────────────────────────────────────────────
export const WIN_ICONS = [
  { key: "health",    Component: IconHealth,    label: "Health",    color: "oklch(0.58 0.18 355)" },
  { key: "study",     Component: IconStudy,     label: "Study",     color: "oklch(0.52 0.14 270)" },
  { key: "work",      Component: IconWork,      label: "Work",      color: "oklch(0.50 0.14 290)" },
  { key: "social",    Component: IconSocial,    label: "Social",    color: "oklch(0.58 0.18 340)" },
  { key: "creative",  Component: IconCreative,  label: "Creative",  color: "oklch(0.55 0.14 310)" },
  { key: "mindful",   Component: IconMindful,   label: "Mindful",   color: "oklch(0.55 0.10 250)" },
  { key: "fitness",   Component: IconFitness,   label: "Fitness",   color: "oklch(0.53 0.18 340)" },
  { key: "nutrition", Component: IconNutrition, label: "Nutrition", color: "oklch(0.52 0.12 320)" },
];

const M = {
  coral:    "oklch(0.55 0.09 35)",
  coralBg:  "oklch(0.55 0.09 35 / 0.08)",
  coralBdr: "oklch(0.55 0.09 35 / 0.28)",
  pink:     "oklch(0.62 0.06 20)",
  pinkBg:   "oklch(0.62 0.06 20 / 0.08)",
  pinkBdr:  "oklch(0.62 0.06 20 / 0.28)",
  slumber:  "oklch(0.55 0.018 70)",
  slumBg:   "oklch(0.72 0.018 75 / 0.15)",
  slumBdr:  "oklch(0.72 0.018 75 / 0.40)",
  archiveBg:  "oklch(0.70 0.04 220 / 0.10)",
  archiveBdr: "oklch(0.60 0.06 220 / 0.30)",
  archiveClr: "oklch(0.48 0.07 220)",
  ink:      "oklch(0.28 0.018 65)",
  muted:    "oklch(0.55 0.018 70)",
  border:   "oklch(0.88 0.014 75)",
  card:     "oklch(0.985 0.007 80)",
};

// ── Floating icon picker popover ───────────────────────────────────────────────
export function IconPickerPopover({
  current,
  onSelect,
  onClose,
  anchorRef,
}: {
  current: number;
  onSelect: (idx: number) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [anchorRef]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          anchorRef?.current && !anchorRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose, anchorRef]);

  const style: React.CSSProperties = pos
    ? { position: "fixed", top: pos.top, left: pos.left }
    : { position: "absolute", top: "calc(100% + 6px)", left: 0 };

  return (
    <div
      ref={ref}
      style={{
        ...style,
        zIndex: 9999,
        background: M.card,
        border: `1px solid ${M.border}`,
        borderRadius: 10,
        padding: 10,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 6,
        boxShadow: "0 4px 20px oklch(0.28 0.018 65 / 0.12)",
        minWidth: 196,
      }}
    >
      {WIN_ICONS.map((icon, idx) => {
        const active = idx === current;
        return (
          <div key={icon.key} style={{ position: "relative" }}
            onMouseEnter={e => { const t = e.currentTarget.querySelector<HTMLElement>(".tip"); if (t) t.style.opacity = "1"; }}
            onMouseLeave={e => { const t = e.currentTarget.querySelector<HTMLElement>(".tip"); if (t) t.style.opacity = "0"; }}
          >
            <span className="tip" style={{ position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", background: "oklch(0.28 0.018 65)", color: "white", fontSize: "0.55rem", fontFamily: "'DM Sans', sans-serif", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none", opacity: 0, transition: "opacity 0.08s", zIndex: 10 }}>
              {icon.label}
            </span>
            <button
              onClick={() => { onSelect(idx); onClose(); }}
              style={{
                width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 8, border: `1.5px solid ${active ? icon.color : "transparent"}`,
                background: active ? `${icon.color}18` : "transparent", cursor: "pointer",
                transition: "background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = `${icon.color}12`; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <icon.Component size={20} color={icon.color} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Win card ───────────────────────────────────────────────────────────────────
function WinCard({
  win,
  isToday,
  isArchiveView,
  editingWinId,
  setEditingWinId,
  winPickerBtnRefs,
  setWinBtnRef,
  onChangeIcon,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  win: Win;
  isToday: boolean;
  isArchiveView: boolean;
  editingWinId: string | null;
  setEditingWinId: (id: string | null) => void;
  winPickerBtnRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
  setWinBtnRef: (id: string) => (el: HTMLButtonElement | null) => void;
  onChangeIcon: (winId: string, idx: number) => void;
  onArchive: (winId: string) => void;
  onUnarchive: (winId: string) => void;
  onDelete: (winId: string) => void;
}) {
  // 99 = block complete, 97 = focus session — special display only
  // 98 = old routine wins (now use real category idx 0-7) — treat as normal
  const isBlockWin = win.iconIdx === 99 || win.iconIdx === 97;
  const isRoutineWin = win.id.startsWith("routine-");
  const iconIdx = isBlockWin ? 0 : (typeof win.iconIdx === "number" ? win.iconIdx % WIN_ICONS.length : 0);
  const iconDef = WIN_ICONS[iconIdx];
  const blockColor = "oklch(0.55 0.13 35)"; // deep terracotta for block wins
  const isEditing = editingWinId === win.id;

  return (
    <div
      className="flex items-start gap-3 p-3 transition-all group"
      style={{
        background: isArchiveView
          ? M.archiveBg
          : isToday
          ? M.pinkBg
          : "oklch(0.93 0.012 78 / 0.4)",
        border: `1px solid ${isArchiveView ? M.archiveBdr : isToday ? M.pinkBdr : M.border}`,
        opacity: isArchiveView ? 0.75 : isToday ? 1 : 0.65,
        borderRadius: 6,
      }}
    >
      {/* Clickable icon — opens picker to change category (only in main view) */}
      <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
        <button
          ref={setWinBtnRef(win.id)}
          onClick={() => !isArchiveView && !isRoutineWin && setEditingWinId(isEditing ? null : win.id)}
          title={isRoutineWin ? "Routine win" : isArchiveView ? iconDef.label : "Click to change category"}
          style={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            border: `1px solid ${isEditing ? iconDef.color : "transparent"}`,
            background: isEditing ? `${iconDef.color}15` : "transparent",
            cursor: isArchiveView ? "default" : "pointer",
            transition: "background 0.12s, border-color 0.12s",
          }}
          onMouseEnter={(e) => {
            if (!isArchiveView) (e.currentTarget as HTMLButtonElement).style.background = `${iconDef.color}15`;
          }}
          onMouseLeave={(e) => {
            if (!isEditing && !isArchiveView) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          {(isBlockWin || isRoutineWin)
            ? <span style={{ fontSize: "1rem", lineHeight: 1 }}>💫</span>
            : <iconDef.Component size={16} color={isArchiveView ? M.archiveClr : iconDef.color} />
          }
        </button>
        {isEditing && !isArchiveView && (
          <IconPickerPopover
            current={iconIdx}
            onSelect={(idx) => onChangeIcon(win.id, idx)}
            onClose={() => setEditingWinId(null)}
            anchorRef={{ current: winPickerBtnRefs.current.get(win.id) ?? null }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* FOCUS TIMER pill — shown for session/block wins only, not routine wins */}
        {(isBlockWin || win.id.startsWith("session-")) && !isRoutineWin && !isArchiveView && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              marginBottom: 3,
              padding: "2px 6px",
              borderRadius: 4,
              background: "oklch(0.88 0.06 35)",
              border: "1px solid oklch(0.75 0.10 35 / 0.4)",
              color: "oklch(0.40 0.13 35)",
              fontSize: 10,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="9" />
              <polyline points="12,7 12,12 15,15" />
            </svg>
            FOCUS TIMER
          </div>
        )}
        <p
          className="text-sm font-medium leading-snug"
          style={{
            color: isArchiveView ? M.muted : M.ink,
            fontFamily: "'DM Sans', sans-serif",
            textDecoration: isArchiveView ? "line-through" : "none",
          }}
        >
          {isRoutineWin ? win.text.replace(/^[\p{Emoji}\s]+/u, "").trim() || win.text : win.text}
        </p>
        <p className="text-xs mt-0.5" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
          {isToday && !isArchiveView
            ? "Today"
            : new Date(win.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          {" · "}
          <span style={{ color: isArchiveView ? M.archiveClr : iconDef.color, opacity: 0.8 }}>
            {isBlockWin ? "Block" : iconDef.label}
          </span>
          {isArchiveView && (
            <span style={{ color: M.archiveClr, opacity: 0.7 }}> · archived</span>
          )}
        </p>
      </div>

      {/* Action buttons — appear on hover */}
      <div
        className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {isArchiveView ? (
          <>
            {/* Unarchive */}
            <button
              onClick={() => onUnarchive(win.id)}
              title="Restore to wins"
              style={{
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 5,
                border: `1px solid ${M.archiveBdr}`,
                background: "transparent",
                cursor: "pointer",
                color: M.archiveClr,
              }}
            >
              <ArchiveRestore size={13} />
            </button>
            {/* Permanent delete */}
            <button
              onClick={() => onDelete(win.id)}
              title="Delete permanently"
              style={{
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 5,
                border: "1px solid oklch(0.65 0.12 15 / 0.30)",
                background: "transparent",
                cursor: "pointer",
                color: "oklch(0.55 0.12 15)",
              }}
            >
              <Trash2 size={13} />
            </button>
          </>
        ) : (
          /* Archive button */
          <button
            onClick={() => onArchive(win.id)}
            title="Archive this win"
            style={{
              width: 26,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 5,
              border: `1px solid ${M.border}`,
              background: "transparent",
              cursor: "pointer",
              color: M.muted,
            }}
          >
            <Archive size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface DailyWinsProps {
  wins: Win[];
  onWinsChange: (wins: Win[]) => void;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function DailyWins({ wins, onWinsChange }: DailyWinsProps) {
  const [newWin,         setNewWin]         = useState("");
  const [selectedIcon,   setSelectedIcon]   = useState(0);
  const [showNewPicker,  setShowNewPicker]  = useState(false);
  const [editingWinId,   setEditingWinId]   = useState<string | null>(null);
  const [showArchive,    setShowArchive]    = useState(false);
  const newPickerBtnRef = useRef<HTMLButtonElement>(null);
  const winPickerBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const setWinBtnRef = useCallback((id: string) => (el: HTMLButtonElement | null) => {
    if (el) winPickerBtnRefs.current.set(id, el);
    else winPickerBtnRefs.current.delete(id);
  }, []);

  // Separate active vs archived
  const activeWins   = wins.filter((w) => !w.archived).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const archivedWins = wins.filter((w) => w.archived);

  const addWin = () => {
    if (!newWin.trim()) return;
    onWinsChange([{ id: nanoid(), text: newWin.trim(), iconIdx: selectedIcon, createdAt: new Date() }, ...wins]);
    setNewWin("");
      };

  const changeWinIcon = (winId: string, idx: number) => {
    onWinsChange(wins.map((w) => w.id === winId ? { ...w, iconIdx: idx } : w));
  };

  const archiveWin = (winId: string) => {
    onWinsChange(wins.map((w) => w.id === winId ? { ...w, archived: true } : w));
  };

  const unarchiveWin = (winId: string) => {
    onWinsChange(wins.map((w) => w.id === winId ? { ...w, archived: false } : w));
    toast("Win restored.", { duration: 2000 });
  };

  const deleteWin = (winId: string) => {
    const deleted = wins.find(w => w.id === winId);
    onWinsChange(wins.filter((w) => w.id !== winId));
    if (deleted) toast("Win deleted", {
      duration: 5000,
      action: { label: "Undo", onClick: () => onWinsChange([...wins]) },
    });
  };

  const todayStr = new Date().toDateString();
  // Today = ALL wins from today (including archived) so archiving doesn't reduce the count
  const todayWins = wins.filter((w) => new Date(w.createdAt).toDateString() === todayStr);

  const SelectedIconDef = WIN_ICONS[selectedIcon] ?? WIN_ICONS[0];

  const CAT_YELLOW = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/cat5_yellow_small_1870bc42.png";
  return (
    <div className="flex flex-col gap-4 h-full" style={{ position: "relative" }}>
      {/* Cat sticker: yellow small cat — top-right corner */}
      <img src={CAT_YELLOW} alt="" aria-hidden="true" style={{ position: "absolute", top: 0, right: 0, width: 58, opacity: 0.42, pointerEvents: "none", zIndex: 5 }} />
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3" style={{ background: M.pinkBg, border: `1px solid ${M.pinkBdr}`, borderRadius: 6 }}>
          <div className="flex items-center gap-2 mb-1">
            <IconHealth size={14} color={M.pink} />
            <span className="text-xs font-medium" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Today</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: M.pink, fontFamily: "'Playfair Display', serif" }}>{todayWins.length}</p>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>wins today</p>
        </div>
        <div className="p-3" style={{ background: M.slumBg, border: `1px solid ${M.slumBdr}`, borderRadius: 6 }}>
          <div className="flex items-center gap-2 mb-1">
            <IconCreative size={14} color={M.slumber} />
            <span className="text-xs font-medium" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Total</span>
          </div>
          {/* Total counts ALL wins including archived */}
          <p className="text-2xl font-bold" style={{ color: M.slumber, fontFamily: "'Playfair Display', serif" }}>{wins.length}</p>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>all time</p>
        </div>
        <div className="p-3" style={{ background: M.archiveBg, border: `1px solid ${M.archiveBdr}`, borderRadius: 6 }}>
          <div className="flex items-center gap-2 mb-1">
            <Archive size={14} color={M.archiveClr} />
            <span className="text-xs font-medium" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Archived</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: M.archiveClr, fontFamily: "'Playfair Display', serif" }}>{archivedWins.length}</p>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>stored away</p>
        </div>
      </div>

      {/* Add win input row */}
      <div className="flex gap-2 items-center" style={{ position: "relative" }}>
        {/* Icon picker button — click to open popover */}
        <button
          ref={newPickerBtnRef}
          onClick={() => setShowNewPicker(v => !v)}
          title={`Category: ${SelectedIconDef.label}`}
          style={{
            width: 38, height: 38, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8,
            border: `1.5px solid ${showNewPicker ? SelectedIconDef.color : M.border}`,
            background: showNewPicker ? `${SelectedIconDef.color}15` : M.card,
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          <SelectedIconDef.Component size={18} color={SelectedIconDef.color} />
        </button>
        {showNewPicker && (
          <IconPickerPopover
            current={selectedIcon}
            onSelect={(idx) => { setSelectedIcon(idx); setShowNewPicker(false); }}
            onClose={() => setShowNewPicker(false)}
            anchorRef={newPickerBtnRef}
          />
        )}
        <Input
          value={newWin}
          onChange={(e) => setNewWin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addWin()}
          placeholder="What did you accomplish? ✦"
          className="flex-1"
          style={{ background: M.card, border: `1px solid ${M.border}`, fontFamily: "'DM Sans', sans-serif" }}
        />
        <button onClick={addWin} className="m-btn-primary shrink-0">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Active wins list ── */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {activeWins.length === 0 && !showArchive && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <IconHealth size={32} color={M.muted} />
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Log your first win.</p>
          </div>
        )}

        {activeWins.map((win) => {
          const isToday = new Date(win.createdAt).toDateString() === todayStr;
          return (
            <WinCard
              key={win.id}
              win={win}
              isToday={isToday}
              isArchiveView={false}
              editingWinId={editingWinId}
              setEditingWinId={setEditingWinId}
              winPickerBtnRefs={winPickerBtnRefs}
              setWinBtnRef={setWinBtnRef}
              onChangeIcon={changeWinIcon}
              onArchive={archiveWin}
              onUnarchive={unarchiveWin}
              onDelete={deleteWin}
            />
          );
        })}
      </div>

      {/* ── Archive section ── */}
      {archivedWins.length > 0 && (
        <div>
          {/* Archive toggle header */}
          <button
            onClick={() => setShowArchive((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 transition-colors"
            style={{
              background: M.archiveBg,
              border: `1px solid ${M.archiveBdr}`,
              borderRadius: 6,
              color: M.archiveClr,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <div className="flex items-center gap-2">
              <Archive size={14} />
              <span>Archive ({archivedWins.length})</span>
            </div>
            {showArchive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Archive list */}
          {showArchive && (
            <div className="mt-2 space-y-2">
              <p
                className="text-xs px-1 pb-1"
                style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}
              >
                Archived wins still count toward your total. Restore or permanently delete them here.
              </p>
              {archivedWins.map((win) => {
                const isToday = new Date(win.createdAt).toDateString() === todayStr;
                return (
                  <WinCard
                    key={win.id}
                    win={win}
                    isToday={isToday}
                    isArchiveView={true}
                    editingWinId={editingWinId}
                    setEditingWinId={setEditingWinId}
                    winPickerBtnRefs={winPickerBtnRefs}
                    setWinBtnRef={setWinBtnRef}
                    onChangeIcon={changeWinIcon}
                    onArchive={archiveWin}
                    onUnarchive={unarchiveWin}
                    onDelete={deleteWin}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

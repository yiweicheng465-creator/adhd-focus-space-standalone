/* ============================================================
   ADHD FOCUS SPACE — Context Switcher v5.0 (m-chip style)
   Matches Brain Dump filter button style: m-chip / m-chip active
   Work  → sage green  oklch(0.48 0.07 145)
   Personal → dusty mauve  oklch(0.52 0.06 20)
   Custom → auto-generated Morandi palette from label hash
   ============================================================ */

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Briefcase, LayoutGrid, User, Hash } from "lucide-react";

// ItemContext is now a flexible string — "work" | "personal" | any custom tag
export type ItemContext   = string;
export type ActiveContext = string; // "all" | any ItemContext

/* Built-in contexts with dreamy SukiSketch colors */
export const BUILTIN_CONTEXT_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}> = {
  work: {
    label:  "Work",
    icon:   Briefcase,
    color:  "oklch(0.48 0.14 290)",
    bg:     "oklch(0.48 0.14 290 / 0.10)",
    border: "oklch(0.48 0.14 290 / 0.28)",
  },
  personal: {
    label:  "Personal",
    icon:   User,
    color:  "oklch(0.48 0.18 340)",
    bg:     "oklch(0.48 0.18 340 / 0.08)",
    border: "oklch(0.48 0.18 340 / 0.25)",
  },
};

// Keep legacy export for compatibility
export const CONTEXT_CONFIG = BUILTIN_CONTEXT_CONFIG;

/* Generate a deterministic dreamy pastel color from a string label */
function hashColor(label: string): { color: string; bg: string; border: string } {
  const hues = [340, 355, 290, 270, 220, 200, 168, 150, 60, 40, 310, 330, 180];
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) & 0xffff;
  const hue = hues[hash % hues.length];
  return {
    color:  `oklch(0.48 0.12 ${hue})`,
    bg:     `oklch(0.48 0.12 ${hue} / 0.08)`,
    border: `oklch(0.48 0.12 ${hue} / 0.25)`,
  };
}

/* Get config for any context — built-in or custom */
export function getContextConfig(ctx: string): {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
} {
  if (BUILTIN_CONTEXT_CONFIG[ctx]) return BUILTIN_CONTEXT_CONFIG[ctx];
  const colors = hashColor(ctx);
  return {
    label: ctx.charAt(0).toUpperCase() + ctx.slice(1),
    icon:  Hash,
    ...colors,
  };
}

interface ContextSwitcherProps {
  active: ActiveContext;
  onChange: (ctx: ActiveContext) => void;
  counts?: Record<string, number>;
  /** All known contexts to show as tabs (besides "all") */
  contexts?: string[];
  /** Called when user deletes a custom (non-builtin) context tag — kept for API compat but × button removed */
  onDeleteContext?: (ctx: string) => void;
  /** Optional label shown before the filter buttons, e.g. "FILTER BY TAG" */
  label?: string;
}

export function ContextSwitcher({ active, onChange, counts, contexts, label }: ContextSwitcherProps) {
  const builtins = ["work", "personal"];
  const custom   = (contexts ?? []).filter((c) => !builtins.includes(c));

  // Hide custom tags that have 0 items — builtins always shown
  const visibleCustom = custom.filter((c) => {
    const count = counts?.[c] ?? 0;
    return count > 0;
  });

  const allCtxs = [...builtins, ...visibleCustom];

  const options: { id: string; label: string; icon: React.ElementType }[] = [
    { id: "all", label: "All", icon: LayoutGrid },
    ...allCtxs.map((c) => {
      const cfg = getContextConfig(c);
      return { id: c, label: cfg.label, icon: cfg.icon };
    }),
  ];

  return (
    <div
      className="flex items-center gap-1.5"
      style={{ padding: "2px 0", flexWrap: "nowrap", minWidth: "max-content" }}
    >
      {label && (
        <span
          style={{
            fontSize: 9,
            fontFamily: "'Space Mono', monospace",
            letterSpacing: "0.10em",
            color: "oklch(0.52 0.040 330)",
            textTransform: "uppercase" as const,
            fontWeight: 600,
            whiteSpace: "nowrap" as const,
            opacity: 0.75,
            paddingRight: 4,
            userSelect: "none" as const,
          }}
        >
          {label}
        </span>
      )}
      {options.map(({ id, label: optLabel, icon: Icon }) => {
        const isActive = active === id;
        const count    = counts?.[id];
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn("m-chip", isActive && "active")}
          >
            <Icon className="w-2.5 h-2.5" />
            {optLabel}
            {count !== undefined && count > 0 && (
              <span>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* Inline context badge — used on task cards */
export function ContextBadge({ context }: { context: string }) {
  const cfg  = getContextConfig(context);
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 shrink-0"
      style={{
        background:    cfg.bg,
        color:         cfg.color,
        border:        `1.5px solid ${cfg.border}`,
        borderRadius:  2,
        padding:       "2px 6px",
        fontFamily:    "'Space Mono', monospace",
        fontSize:      "0.6rem",
        fontWeight:    700,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
      }}
    >
      <Icon style={{ width: 9, height: 9 }} />
      {cfg.label}
    </span>
  );
}

/* Clickable context badge — shows dropdown to switch tag */
export function ClickableContextBadge({ context, allContexts, onChange }: {
  context: string;
  allContexts: string[];
  onChange: (ctx: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  // Compute position from DOM on every render when needed
  const pos = open && btnRef.current ? (() => {
    const r = btnRef.current!.getBoundingClientRect();
    return { top: r.bottom + 4, left: r.left };
  })() : null;
  const cfg = getContextConfig(context);
  const Icon = cfg.icon;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    // Use capture to ensure we catch the event before anything else
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(o => !o);
  };

  return (
    <div style={{ display: "inline-flex" }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="inline-flex items-center gap-1 shrink-0"
        style={{
          background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`,
          borderRadius: 2, padding: "2px 6px", fontFamily: "'Space Mono', monospace",
          fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase" as const, cursor: "pointer",
        }}
      >
        <Icon style={{ width: 9, height: 9 }} />
        {cfg.label}
      </button>
      {open && pos && (
        <div ref={dropRef} style={{
          position: "fixed", top: pos.top, left: pos.left, zIndex: 99999,
          background: "#fdf4f8", border: "1.5px solid oklch(0.82 0.050 340)",
          borderRadius: 6, boxShadow: "0 4px 16px rgba(140,40,90,0.15)",
          padding: "4px", minWidth: 120, display: "flex", flexDirection: "column", gap: 1,
        }}>
          {allContexts.map(ctx => {
            const c = getContextConfig(ctx);
            const CIcon = c.icon;
            return (
              <button
                key={ctx}
                onClick={() => { onChange(ctx); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 8px", borderRadius: 4, cursor: "pointer",
                  background: ctx === context ? c.bg : "transparent",
                  border: "none", width: "100%", textAlign: "left",
                }}
              >
                <CIcon style={{ width: 10, height: 10, color: c.color }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.58rem",
                  fontWeight: 600, letterSpacing: "0.06em", color: c.color, textTransform: "uppercase" }}>
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

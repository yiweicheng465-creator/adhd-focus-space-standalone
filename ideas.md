# ADHD Focus Space — Design Brainstorm

## Response 1
<response>
<text>
**Design Movement:** Brutalist Calm — raw structure meets intentional stillness

**Core Principles:**
- Heavy typographic hierarchy to anchor attention
- Stark contrast between active and inactive zones
- No decorative noise — every element earns its place
- Tactile, pressable UI that gives physical feedback

**Color Philosophy:**
Warm off-white (#F5F0E8) background with deep charcoal (#1A1A1A) text. A single punchy accent — electric amber (#F5A623) — used only for the active/focus state. The palette communicates "serious work mode" without clinical coldness.

**Layout Paradigm:**
Left-rail sidebar (fixed, narrow) for navigation. Main area split into a large "NOW" zone (top 60%) and a "NEXT" zone (bottom 40%). No cards — sections are separated by thick ruled lines, not boxes.

**Signature Elements:**
- Oversized countdown timer as the visual centerpiece
- Bold section labels in uppercase condensed font
- Amber highlight bar that "fills" as focus session progresses

**Interaction Philosophy:**
Every click produces a satisfying micro-animation. The timer pulses gently. Completing a task triggers a brief full-screen flash of amber — a dopamine hit.

**Animation:**
Entrance: elements slide in from left with slight deceleration. Timer: slow radial fill. Task completion: scale-up + fade-out with amber overlay flash.

**Typography System:**
- Display: "Bebas Neue" (uppercase, condensed) for timers and section labels
- Body: "DM Sans" (regular 400, medium 500) for task text and UI labels
</text>
<probability>0.07</probability>
</response>

## Response 2
<response>
<text>
**Design Movement:** Soft Neomorphism + Organic Calm

**Core Principles:**
- Gentle depth through soft shadows, not hard borders
- Warm, nature-inspired palette to reduce anxiety
- Rounded, friendly shapes that feel approachable
- Generous whitespace to prevent overwhelm

**Color Philosophy:**
Sage green (#A8C5A0) as the primary calm anchor. Warm cream (#FAF7F2) background. Dusty rose (#E8B4B8) for gentle alerts/wins. Deep forest (#2D4A3E) for text. The palette mimics a quiet forest morning — grounding and focused.

**Layout Paradigm:**
Single-column scrollable dashboard with floating widget cards. Each widget has a distinct "zone" — Focus Timer at top, Today's Tasks in middle, Daily Wins at bottom. Sidebar is a thin icon rail that expands on hover.

**Signature Elements:**
- Soft shadow cards that appear to float above the surface
- Leaf/organic motif as subtle background texture
- Gentle progress rings instead of bars

**Interaction Philosophy:**
Hover states reveal soft glows. Completing tasks triggers a gentle "bloom" animation — a small flower icon expands and fades. Nothing harsh or jarring.

**Animation:**
Entrance: fade-in with upward drift (20px). Progress: smooth arc fill. Completion: bloom particle burst in sage green.

**Typography System:**
- Display: "Playfair Display" (italic for emphasis) for headings
- Body: "Nunito" (rounded, friendly) for all UI text
</text>
<probability>0.08</probability>
</response>

## Response 3 — SELECTED
<response>
<text>
**Design Movement:** Focused Modernism — precision tools for scattered minds

**Core Principles:**
- Asymmetric grid that creates visual hierarchy without clutter
- High-contrast focus zones vs. low-contrast rest zones
- Color as a functional signal, not decoration
- Everything visible at a glance — no hunting for information

**Color Philosophy:**
Deep navy (#0F172A) sidebar/header. Warm white (#FAFAF8) main canvas. Teal (#14B8A6) as the primary action color — energizing but not aggressive. Soft coral (#FB7185) for urgent/overdue items. Muted gold (#F59E0B) for wins and rewards. The palette is purposeful: each color communicates a specific state.

**Layout Paradigm:**
Fixed left sidebar (64px icon rail, expands to 220px). Main area: top status bar showing today's date + mood. Below: 3-column asymmetric grid — large focus timer column (50%), task list column (30%), wins/stats column (20%). On mobile: single column with bottom tab nav.

**Signature Elements:**
- Circular focus timer with animated stroke dash
- Color-coded task priority chips (teal=focus, coral=urgent, gold=done)
- "Brain dump" quick-capture floating button

**Interaction Philosophy:**
Keyboard-first design. Every action has a shortcut. The UI responds instantly — no loading states for local operations. Completing a task triggers a satisfying checkmark animation + subtle confetti burst.

**Animation:**
Sidebar: smooth width transition (200ms ease-out). Timer: requestAnimationFrame stroke animation. Task complete: checkmark draw + scale + confetti. Mood selection: bounce scale on hover/select.

**Typography System:**
- Display: "Space Grotesk" (600-700) for timers, headings, and numbers
- Body: "Inter" (400-500) for task text and labels — but used sparingly, only for body content
- Monospace: "JetBrains Mono" for timer digits
</text>
<probability>0.09</probability>
</response>

## Decision: Response 3 — Focused Modernism
Deep navy sidebar, warm white canvas, teal/coral/gold functional color system, asymmetric 3-column grid, Space Grotesk + JetBrains Mono typography.

# ADHD Focus Space — TODO

## Completed Features
- [x] Full app structure with Dashboard, Focus Timer, Brain Dump, Daily Wins, Tasks, Monthly Calendar, AI Hub, AI Agents tabs
- [x] Focus Timer with animated paper strip tearing mechanic
- [x] Daily Wins system with category icons
- [x] Brain Dump page with AI categorization (→ Task, → Agent buttons)
- [x] Monthly Calendar with hover cards and day detail panel
- [x] AI Hub tab with 5 AI features
- [x] AI Agents page with task chip redesign and AI-powered Create Agent popup
- [x] URLs in task chips are clickable
- [x] FOCUS TIMER badge: smaller pill badge with single clock icon
- [x] Focus sessions removed from Wins list — shown as ⏱ pill badge in Dashboard stats bar
- [x] One-time localStorage migration to clean up old session win entries
- [x] Session numbering fixed (persists across page reloads)
- [x] Removed motivational tip block from Monthly page
- [x] Calendar day detail card redesigned with full wrap-up content
- [x] Backend upgraded to full-stack for AI API calls
- [x] Focus sessions recorded in Monthly Calendar and Daily Wrap-up as dedicated "Focus Tracker" section
  - recordFocusSession() now saves detailed entries (sessionNumber, duration, timestamp) to adhd-focus-session-list
  - Daily Wrap-up shows each session as a row with session number, duration, and time
  - Monthly day detail panel shows focus sessions as a dedicated Focus Tracker section

## Pending (User Suggestions)
- [x] Name personalisation — one-time name input, greet user as "Good morning, [Name]"
- [ ] Space bar shortcut on Focus page to start/pause timer
- [ ] Agent → Win auto-log when Agent marked as Done
- [ ] AI reflection button inside day detail card for past days
- [ ] Session win category picker (Work, Study, etc.) for focus session wins

## Bugs
- [x] Strip hashtags from display text in Brain Dump entries and Task cards (tags already shown as badges below)
- [x] Simplify Focus Sessions in Monthly day detail to inline "Focus Time: N sessions" next to Mood
- [x] Redesign Dashboard to compact grid layout that fits laptop screen without scrolling
- [x] Add Talk with AI panel directly on the Dashboard page
- [x] Restore illustrated hero header in Dashboard (illustration left + greeting/quick-capture right)
- [x] Redesign dashboard task list cards to look cuter and more polished
- [x] Add quick-complete checkboxes on dashboard Next Up task rows
- [x] Upgrade dashboard AI chat to full command center (create tasks, agents, goals, wins via natural language)
- [x] Add MIT "What should I focus on?" button in task panel with glowing border on top task
- [x] Persist AI chat history (last 10 messages) to localStorage
- [x] Refine dashboard UI: softer chat panel colors, muted action buttons, warmer overall palette
- [x] Improve MIT card glow to gradient glow effect (not just box-shadow)
- [x] Add "Start 25 min focus on this" button after MIT is highlighted
- [x] Wire mood score from daily check-in into AI greeting (personalised opening message)
- [x] Fix MIT task not getting gradient glow highlight (mitTaskId not matching task id)
- [x] Replace AI auto-greeting with suggestion chips as the default empty state
- [ ] Full visual restyle to soft retro-desktop lo-fi aesthetic (grid paper bg, vintage OS windows, monospace labels, dusty rose/sand palette)

## Retro Lo-Fi Restyle (Completed)
- [x] Global CSS updated: grid-paper background, Space Mono font, warm palette CSS variables
- [x] .retro-window class: cream/parchment fill, pencil-stroke border, subtle shadow
- [x] .retro-titlebar class: warm title bar with _ □ X controls
- [x] Dashboard.tsx: All 3 panels (Focus Timer, Next Up, AI Command Center) now use retro-window + retro-titlebar
- [x] Dashboard.tsx: Color constants aligned with CSS variables (terracotta, parchment, pencil border)
- [x] Sidebar.tsx: Already using retro lo-fi aesthetic (Space Mono, terracotta active state, warm parchment bg)
- [x] FocusTimer.tsx: Already uses warm cream/terracotta palette consistent with retro aesthetic
- [x] MIT to FocusTimer pre-label: adhd-start-mit-focus event listener added to FocusTimer; MIT task name shown as label badge when timer is idle
- [x] / keyboard shortcut: Press / anywhere on dashboard to focus the AI input field

## Current Session
- [x] Remove MIT highlight feature from dashboard (button, glow, "Start 25 min focus" button, mitTaskId state)
- [x] Sort dashboard task list by urgency: urgent > focus > normal > someday
- [x] Color-code task cards by priority (distinct colors per level, clearly visible)

## Hero Restyle + Stickers
- [x] Restyle hero banner: grid paper bg, retro window chrome, warmer palette
- [x] Add decorative SVG stickers to hero (plant, moon, star, leaf, cloud)
- [x] Add subtle sticker accents to dashboard panels

## Modal Retro Styling
- [x] Restyle DailyCheckIn modal with retro window chrome (title bar, grid bg, pencil borders)
- [x] Restyle DailyWrapUp modal with retro window chrome
- [x] Restyle WeeklyResetNudge modal with retro window chrome

## Full-Page Retro Styling
- [ ] Apply retro window chrome to TaskManager page
- [ ] Apply retro window chrome to BrainDump page
- [ ] Apply retro window chrome to Goals page
- [ ] Apply retro window chrome to AgentTracker page
- [ ] Apply retro window chrome to DailyWins page
- [ ] Apply retro window chrome to MonthlyProgress page
- [ ] Apply retro window chrome to FocusTimer full page (if separate)

## Grid/Plaid Background Refactor
- [x] Add grid pattern to global page background (body/html in index.css)
- [x] Remove grid pattern from Dashboard panel interiors
- [x] Remove grid pattern from DailyCheckIn modal interior
- [x] Remove grid pattern from DailyWrapUp modal interior
- [x] Remove grid pattern from WeeklyResetNudge interior
- [x] Remove grid pattern from RetroPageWrapper interior

## Retro UI Polish (Current Session)
- [ ] Restyle all buttons to retro lo-fi flat style (thick dark border, 3D offset shadow, cream fill, Space Mono font)
- [ ] Replace cursor with pixel-art hand pointer SVG via CSS cursor property
- [ ] Simplify sidebar icons to thin-line minimal geometric style (no pixel art, clean outlines)
- [ ] Redesign task list to retro dashed-border card rows with icon boxes and dotted line connectors

## Full Lo-Fi Palette Overhaul
- [ ] Shift global palette to warm caramel/sand (body bg, card bg, borders)
- [ ] Restyle retro window chrome: warmer title bars, rounded corners, terracotta borders
- [ ] Add scattered background sticker SVGs (moon, stars, plants, folder, speech bubble, diamonds)
- [ ] Update task priority colors to warm lo-fi palette (no harsh reds/greens)
- [x] Restyle all buttons to retro lo-fi 3D offset style (thick dark border, offset shadow, Space Mono font)
- [x] Replace cursor with pixel-art hand pointer SVG via CSS cursor property
- [x] Simplify sidebar icons to thin-line minimal geometric SVGs (clean outlines, no pixel art)
- [x] Redesign task list to retro dashed-border card rows with icon boxes and dotted connectors

## Active Bugs
- [x] Fix GAINS % in CYBER_PET.EXE focus timer — removed growth % display entirely
- [x] Add animated growth % counter back to FocusTimer pet (counts up 1→2→...→100 gradually based on sessions)
- [x] Make FocusTimer widget same height as next_up panel; scrollable care log showing latest 2 + history
- [x] Persist care log to localStorage so it survives section navigation
- [x] Fix FocusTimer AND AI chat box to fixed height — neither should grow with content
- [x] Remove Focus Micro-Reflection card from AI tab page
- [x] Lighten and shrink placeholder text in task and goal input fields
- [x] Shorten full-width buttons in AI tab page to auto-width
- [x] Fix growth % counter — not incrementing and color too dark
- [x] Migrate tasks/goals/wins/brain-dump/agents/focus-sessions from localStorage to MySQL database (tRPC procedures + DB tables created)
- [ ] Apply retro lo-fi button style to Daily Check-in "Start my day" button
- [x] Restyle category filter tabs (All/Work/Personal/Video) on main page with retro lo-fi button styling
- [x] Add toggleable animated film grain overlay effect to the whole app (sidebar toggle button, persisted to localStorage)
- [x] Add "Work Mode" toggle — switches entire app from pink/lavender to clean black/white/grey professional palette, persisted to localStorage
- [x] Revert care action buttons, set FocusTimer to compact natural height matching reference screenshot
- [x] Care log idle placeholder: soft faded text when timer not started, replaced by rolling entries when running
- [x] All 3 dashboard columns fixed at 480px height — no growing when content is added; FocusTimer pet screen expands to fill extra space
- [x] Remove all height stretching from FocusTimer — widget sits at natural compact height, no fillHeight, no spacer
- [x] Add API key input to name setup modal (hello.exe) and save per-user; use user's own key for AI calls
- [x] Block AI calls for users with no API key (no fallback to server key)
- [ ] Update hello.exe hint text to "Your OpenAI key — used for AI features."
- [ ] Migrate Brain Dump entries from localStorage to database
- [x] Migrate BrainDump entries from localStorage to database
- [x] Persist AI chat messages to database
- [x] Create central app storage utility (localStorage, export/import JSON)
- [x] Build Storage & Backup settings page with Google Drive OAuth
- [x] Implement Google Drive backup and restore (client-side only)
- [x] Add "Update API key" input to EffectsPanel/FX settings
- [x] Add 7-day backup reminder toast in Home.tsx
- [x] Auto-open FX panel when AI feature used without API key
- [ ] 7-day backup reminder toast
- [x] Fix NO_API_KEY error detection in all AI components (use isNoApiKeyError utility)
- [x] Add API key validation (test call to LLM endpoint) before saving in FX settings
- [x] Add ApiKeyDialog centered modal popup when AI feature used without API key
- [x] Add Space bar shortcut to start/pause focus timer from anywhere on focus page
- [x] Remove Space bar shortcut from FocusTimer (it shortens the running timer)
- [x] Restyle all Sonner toasts to match retro lo-fi aesthetic (Space Mono font, pink palette, retro border)
- [x] Add key type selector (OpenAI / Manus) to NamePrompt, EffectsPanel, and ApiKeyDialog
- [x] Add accurate payment requirement messaging for each key type
- [x] Add keyType field to users DB schema and migrate
- [x] Update server-side AI router to route to correct LLM endpoint based on key type
- [x] Change all black/dark buttons to pink retro style (Sonner toast action buttons + any other dark buttons)
- [x] Fix timer starting 2 seconds short (shows 24:58 instead of 25:00 on Start click)
- [x] Remove "($20/mo+)" from Manus API key tab text
- [ ] Fix ApiKeyDialog not auto-opening when AI feature used without a key
- [x] Fix EffectsPanel: fetch existing keyType + masked key from DB on load (currently always defaults to openai)
- [x] Auto-select Manus tab in EffectsPanel when settings opens and no key is configured yet
- [x] Add key status dot (green/red) next to SET icon in Sidebar
- [x] Update NamePrompt to default to Manus tab instead of OpenAI
- [x] Fix Manus API routing: use forge.manus.im (public API) for user keys, not forge.manus.ai (internal server endpoint)
- [x] Test Manus key end-to-end with the provided key
- [x] Fix ApiKeyDialog auto-open: dispatch openApiKeyDialog event from all AI error handlers when NO_API_KEY
- [x] Add Test Connection button in SET panel (ping forge with saved key, show inline green/red result)
- [x] Implement 7-day backup reminder toast (check lastBackupDate in localStorage, nudge if overdue)
- [ ] Rework AI key system: use built-in forge key by default, OpenAI key as fallback, remove Manus tab
- [ ] Update server getUserApiConfig to use built-in forge key first, fall back to user OpenAI key
- [x] Remove Manus tab from EffectsPanel, NamePrompt, ApiKeyDialog
- [ ] Show clear "AI credits exhausted" message with prompt to add OpenAI key
- [x] Fix signal dot: green=AI working (built-in or OpenAI key), red=credits exhausted+no key
- [ ] Remove green SAVED button state - keep pink/terracotta retro style
- [x] Add inline ✓ fade confirmation next to SAVE button in EffectsPanel (1.5s fade, no toast)
- [ ] Add "remove key" link in SET panel (visible only when key is saved, switches back to built-in AI)
- [x] Wire signal dot tooltip in sidebar (hover shows "AI ready" or "AI unavailable — add OpenAI key in SET")

## Current Session
- [x] Remove AI Features tab from sidebar navigation
- [x] Create detailed instruction/guide page (hidden, accessible from unobvious location)
- [x] Disable autocomplete on Quick Capture input

## New Features (Current Session)
- [ ] Music track picker in sound panel (lo-fi, rain, white noise) with localStorage
- [ ] Sidebar timer pill mini popover with pause/resume controls
- [x] In-app bug/feature report via tRPC + email API instead of mailto
- [x] Music track picker in sound panel (lo-fi, rain, white noise) with localStorage
- [x] Sidebar timer pill mini popover with pause/resume controls

## Bugs & Features (Current Session)
- [x] Remove weekly_reset.exe panel from Tasks page
- [x] Reduce visible task count in dashboard Next Up panel (show ~3, then +N more)
- [x] Fix Wins category icon picker bug (wins.update procedure + Home.tsx wiring already in place — confirmed working)
- [x] Add inline category and tag editing to existing tasks (pencil icon on hover opens edit popover)
- [x] Add goal link/change/remove to existing tasks (goal dropdown in edit popover, can add/change/remove)
- [x] Disable browser autocomplete on daily check-in task input (already had autoComplete=off)
- [x] Add task link dropdown to daily check-in agents step (always visible, shows new + existing tasks)
- [x] Change Next Up task limit from 6 to 7
- [x] Make Quick Capture quick-reply chips configurable (add/edit/delete) with DB persistence
- [x] Add config button (gear icon) to Quick Capture modal to manage chips
- [x] Daily check-in task step: goal dropdown now shows both new goals (this session) and all existing DB goals in grouped optgroups
- [x] Fix ambient sound player: removed Web Audio graph from ambient element (createMediaElementSource can only be called once per element); now uses audio.volume directly — track switching works reliably
- [x] openai_key already in users table (apiKey + keyType columns)
- [x] tRPC procedures already exist: profile.getApiKey, profile.updateApiKey, profile.validateApiKey, profile.testConnection
- [x] Fixed invokeLLM to fall back to built-in Manus key when no user key provided
- [x] OpenAI key settings UI already exists in EffectsPanel.tsx and ApiKeyDialog.tsx
- [ ] AI active indicator: show "Using: OpenAI" vs "Using: Manus built-in" in AI Hub
- [ ] Auto-show API key dialog when OpenAI returns 401/quota error
- [ ] Per-user AI usage stats: track call count in DB, show in settings
- [ ] Fix dashboard top bar placeholder: change "press / to start..." to "what's in your mind? or dump your thought here"
- [ ] AI chatbox: move "press / to focus" hint into typing bar placeholder; remove old chip hints (add task, set goal, log win)

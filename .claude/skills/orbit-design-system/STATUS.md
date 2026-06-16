# Implementation status — Orbit design system in the app

Register of which design-system surfaces are implemented in the app and which remain backlog.
Update this file whenever a DS feature lands or a new gap is identified.

## Implemented (June 2026 port)

- **Foundations** — Bone/Evening themes, coral accent, radii/spacing/typography tokens, Fraunces + Inter
  (native `expo-font`), single card shadow, opacity press/disabled states (`theme.ts`).
- **OrbitRing / OrbitMini** — Views + Reanimated (no SVG); one-notch settle animation, halo pulse, no
  progress arc (`habits/components/OrbitRing`). DS tick marks between dots intentionally dropped.
- **Group detail** — hero card (ring, due-aware "Your turn"/"Up next" kicker, DS `SlideToConfirm`
  slide-to-log replacing the tap CTA, ghost Skip, `HeroStrip` image thumbs, italic "Next turn — …" line
  when idle), `HabitNoteCard` under the hero, habit-count + concise-cadence chips, queue card with slim
  rows (up-next lives in the hero — no NOW row; swipe-right over a coral DS `Swipeable` pane = tick
  out of order, no skip on rows; `QueueMosaic` image strips; ¶ note-presence hint;
  long-press charges with a dim and opens the reader on hold-elapsed), undo toast.
- **Habit reader sheet** — formSheet with markdown note, image strip + viewer; Edit flips the same sheet
  into the editor (`habits/components/HabitEditor`) — no stacked sheets. The group-name kicker links to the
  rotation's Group screen (a `card` push from within the sheet — sanctioned, not a stacked sheet — using
  `navigate`, which pops to the Group if it's already below in the stack). This is the only path to the
  Group detail for rotations surfaced in Home's Carried over / Up next sections (their list card is gone).
- **Rotations index (Home)** — `◯ ORBIT` status strip + date, list cards with OrbitMini, cadence·count meta,
  due-aware "Up next" line, Literary empty state.
- **Home triage — Carried over / Up next / Other rotations** — Home aggregates rotations into two
  sections above the list (`misc/screens/Home/TodaySections`): **Carried over** (coral-soft card —
  rotations whose last *completed* tick predates the last occurrence by >15 min, oldest-first, tag =
  time since) and **Up next** (surface card — newly created rotations (never completed) and ones due
  within the last 15 min show `NOW` with a halo dot, new ones first; not-yet-due turns scheduled later
  in the active-hours window show their time, e.g. `5P`).
  Remaining rotations fall under an **Other rotations** header (the existing OrbitMini cards). Rows
  reuse the shared `SwipeToLog` (swipe-right = log the up-next habit) and tap-open the Habit sheet;
  logging raises the undo toast. Derivation: `habits/utils/buildHomeSections` (+ `lastCompletedInGroup`,
  `formatElapsedAgo`, `formatSlotTime`, `misc/utils/activeWindow` for the wrapping-window "today").
  `isGroupDue` was **unified** onto the same last-completed-vs-occurrence rule, so the Group hero
  kicker and the Home cards agree on "due" (skip no longer clears a turn — only a completion does).
- **Active hours** — chip on Home + formSheet editor (`misc/screens/ActiveHours`); replaces inline day-boundaries card.
- **Create/edit sheets** — rotation/habit forms with field kickers, cream borderless inputs, schedule editor
  restyled to cadence chips; image add-sheet with Camera/Library/Files/Paste sources.
- **Microcopy** — Literary dictionary: "rotation" terminology, sentence case, calm voice; notification copy
  "{Group} · your turn" / "Up next: {habit}".
- **Pastel palette removed** — DS-pure: surface cards + single coral accent.
- **Icon library** — Lucide (`@react-native-vector-icons/lucide`); sole icon set. Replaces Unicode glyphs in
  SlideToConfirm, SwipeToLog, NumberStepper, Home orbit rings, and ImageSourceChips (2026-06-12).
- **App icon set** (`app-icons/`) — iOS light/dark icons, Android adaptive + monochrome (bone background),
  notification small icon, bone/evening splash screens.

## Backlog (not implemented — by design-system area)

- **TabBar** — app is single-stack; the "due today" aggregation now lives on Home (Carried over /
  Up next — see Implemented). A dedicated Today *tab* is only worth it if more top-level destinations land.
- **Insights / stats** (heatmap, streaks, per-rotation activity strips, ticksPerWeek) — blocked on data:
  the model stores only `lastActioned` per habit, no tick history log.
- **Settings screen** — only active hours exist today; a full settings surface awaits more settings.
- **Paused rotations** (banner, dimmed list cards, ring-on-hold) — no pause concept in the data model.
- **Onboarding** (3-page intro with ring/cadence/queue illustrations).
- **Whisper / "a note for next time"** (`whisper.jsx`) — per-habit transient note that surfaces on next turn.
- **Edit the time of a tick** (`edit-time.jsx`) — retro-dating a tick; also needs a tick log.
- **Notification action buttons** (Mark done / Snooze 1h / Skip on the notification itself).
- **Today swipe-card variant** (`today-list.jsx`) — the right-swipe-to-log row shipped on Home (see
  Implemented); the left-swipe "postpone" was dropped (no postpone concept in the data model).
- **Lock-screen notification preview** — marketing/design artifact, not an app surface.

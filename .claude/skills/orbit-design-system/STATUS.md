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
  into the editor (`habits/components/HabitEditor`) — no stacked sheets.
- **Rotations index (Home)** — `◯ ORBIT` status strip + date, list cards with OrbitMini, cadence·count meta,
  due-aware "Up next" line, Literary empty state.
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

- **TabBar + Today screen** — needs a "due today" aggregation surface; app is single-stack with Home as the
  rotations index. Revisit if more top-level destinations land.
- **Insights / stats** (heatmap, streaks, per-rotation activity strips, ticksPerWeek) — blocked on data:
  the model stores only `lastActioned` per habit, no tick history log.
- **Settings screen** — only active hours exist today; a full settings surface awaits more settings.
- **Paused rotations** (banner, dimmed list cards, ring-on-hold) — no pause concept in the data model.
- **Onboarding** (3-page intro with ring/cadence/queue illustrations).
- **Whisper / "a note for next time"** (`whisper.jsx`) — per-habit transient note that surfaces on next turn.
- **Edit the time of a tick** (`edit-time.jsx`) — retro-dating a tick; also needs a tick log.
- **Notification action buttons** (Mark done / Snooze 1h / Skip on the notification itself).
- **Today swipe-card variant** (`today-list.jsx`) — optional DS variant, not the default.
- **Lock-screen notification preview** — marketing/design artifact, not an app surface.

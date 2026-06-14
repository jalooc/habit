# Components — Orbit + Ink

Reference for every component the app ships. Each entry lists: purpose, key props (where they exist in `screens.jsx` / `rings.jsx`), states, and notes on motion / interaction.

All components read tokens via `useTokens()` (runtime) or CSS variables from `colors_and_type.css` (static). Theme flips by toggling `data-theme="dark"` on the root.

---

## Foundations

### `OrbitRing`

The signature visual. Radial ring of dots; up-next anchored at 12 o'clock; ring rotates one notch when a habit is ticked.

| Prop | Type | Notes |
|---|---|---|
| `group` | `Group` | Source of habits + cursor. |
| `size` | `number` | Hero ring is 244–276 (size varies with the `ring` size token). Mini is 56–88. |
| `rotating` | `boolean` | Toggle to play the one-step settle animation. |

The ring is **display-only** for ticking — it is not the tap/swipe target. Ticking the up-next habit happens on the slide-to-confirm control below it (see Hero card). The ring just plays the settle once a tick is committed.

**Math.** Habits sit at evenly spaced angles, `angle = (i / n) * 360 - 90` (the `-90` puts index 0 at the top). The whole `<g>` is rotated by `-cursor * (360 / n)` so up-next stays at 12 o'clock. Each dot transforms include a counter-rotation `rotate(-rot)` so any label stays upright.

**Native recipe (no SVG required).** Build the ring from absolutely-positioned `View`s, not SVG. Each dot is a `View` placed with `transform: [{ rotate: '<angle>deg' }, { translateY: -radius }, { rotate: '-<angle>deg' }]` so it sits on the circle and stays upright. Rotate the **container** `View` for the one-notch settle and counter-rotate dot content. Drive both the 550 ms settle and the halo pulse with **Reanimated** (`useSharedValue` + `withTiming` / `withRepeat`). SVG (react-native-svg) is optional — only worth it if you also draw the thin outer ring stroke; otherwise a 1px-bordered circular `View` covers it.

**Motion.** On tick, rotation animates from `baseRot` to `baseRot - step` over 550 ms (`cubic-bezier(.55,.06,.3,1)`). At ~600 ms the parent advances the cursor; the ring snaps back to its new "up next at top" position with no visible jump.

**Halo.** The active dot has a slow pulse (`r: 14 → 20 → 14`, opacity `.16 → .06 → .16`, 2.4 s, infinite). It pauses during the rotation.

**Tick marks** between dots are **optional** — dropped in the current native port. Re-add only if a ring reads as too sparse.

**Don't.** No progress arc. Rotation has no end — drawing one suggests a journey-toward-completion that doesn't exist.

---

## Layout primitives

### `Phone` / Status strip

Wraps any screen in an Android device frame at 412 × 892. The app's own chrome (the `◯ ORBIT` status strip + the bottom Tab bar) lives *inside* the device, not on the OS status bar.

### `OIHead({ title, kicker, onBack, action })`

The screen header. Optional back button + optional right-side action + kicker (uppercase) + H1 (Fraunces 32px, -0.4 letter-spacing).

### `TabBar({ active, onTab })`

Four tabs: Today / Rotations / Insights / Settings. Active tab is a white pill with `--shadow`; others are flat ink-soft labels. Icons are **Lucide, 1.5px stroke** (see Iconography in README): Today → `disc`, Rotations → `circle-dot` / `refresh-cw`, Insights → `bar-chart-2`, Settings → `settings`.

---

## Buttons & chips

### `PillButton` — variants

| Variant | Visual | Use |
|---|---|---|
| `primary` | Ink fill, white text, 13×32px padding, uppercase | Real buttons — Continue, Create rotation, sheet Save/Done. Always the highest action on a screen. (The hero "up next" tick is NOT a pill — it's the slide-to-confirm control; see Hero card.) |
| `secondary` | White card with `accent-dim` border, ink-soft text | Edit / Pause / Resume in headers. |
| `ghost` | Transparent with `accent-dim` border | Quiet alternate actions. |
| `accent` | Coral fill, white text | Rare. Only the **Resume** button inside the paused banner. |

Padding scales by content size. All are pill-radius (100px). **Press feedback is opacity 0.6** (native `Pressable`); there is no hover state and no `cursor` on native — the hover/cursor rules in `colors_and_type.css` are web-only.

### `ActiveHoursChip({ onEdit })`

A 1px-rule outlined pill, ink-faint text, with a small coral dot. Subtle. Renders below the Today H1 and links to Settings. Copy: `"Active hours · 8:00 – 22:00"`.

### Habit-count chip (in group header)

Coral-soft fill, coral text, with a 5px coral dot inside. `"5 habits in rotation"`. Stays in coral-soft territory — not a CTA.

### Cadence chips (in Create form)

Pill-shaped segmented options. Selected = ink fill with bone text; unselected = white card with ink-soft text. Tap to choose.

---

## Cards

### Hero card (rotation + slide to confirm)

| Token | Value |
|---|---|
| Radius | 28 (`xl`) |
| Padding | top 2xl (24) · sides lg (16) · bottom xl (20) |
| Shadow | `--shadow` |
| Background | `--card` / `surface` (white in light; `#252629` in dark) |

Contains: small kicker (group name in coral, uppercase), the ring, and — as the hero action — a **slide-to-confirm** control with a ghost **"Skip this turn"** beside it.

**Slide to confirm (the hero tick).** A pill-radius track (the up-next habit name sits as the track label) with a draggable coral knob at the leading edge. Drag the knob to the trailing end to commit the tick; release before the end and it springs back, untouched. This **replaces the old "MARK DONE" pill** as the hero CTA — ticking is destructive and hard to undo, so it must be deliberate, not a single tap. (Ink-on-bone pills are still the pattern for *real* buttons elsewhere — Continue, Create, sheet Save.)

- On commit: the ring plays its 550 ms settle, the cursor advances, the knob fills the track briefly, then the card re-renders on the next habit. An undo toast appears.
- **"Skip this turn"** (ghost pill, beside the slider) cycles the up-next habit to the back of the ring untouched — no tick logged. Skip is meaningful **only** for the current turn (see Queue rows: rows have no skip).

**Paused state.** The ring dims to `opacity: 0.55; filter: saturate(0.35)` (web) / reduced opacity + desaturation (native), the slide-to-confirm control is replaced by a dashed "Ring is on hold" pill, and the paused banner shows. Three signals together — impossible to miss.

### List card (Rotations index)

| Token | Value |
|---|---|
| Radius | 22 (`lg`) |
| Padding | 18 (`md`) |
| Shadow | `--shadow` |

Mini-ring (72px) on the left, group name (Fraunces 22, italic-eligible) + meta + "Up next · {habit}" stacked on the right. **Tap opens** the group detail.

**Paused list cards** swap background to `--accent-subtle`, drop the shadow, set opacity 0.78, and stamp a `PAUSED` micro-label.

### Queue list item (in Group detail)

A row inside an `oi-card` (radius 18 / `md`). Contains:

- A 26px circle. Active habit: coral filled with white ✓. All others: a small (8px) hollow dot, no number.
- The habit name in Fraunces 16. Active = `text`; others = `textSecondary`.
- A right-side `NOW` micro-label (coral, uppercase) on the active row.

**Interaction model — slide/swipe = act, tap = open.**

- **Swipe-right to tick (out of order).** Dragging a row right reveals a coral (`--accent-subtle` → `--accent`) pane with a ✓; completing the swipe ticks that habit *out of order* (it moves to the back of the queue; the cursor stays put). This is the only way to tick a non-up-next habit. Use a swipeable row primitive (`swipeable.jsx` on web; `react-native-gesture-handler`'s `Swipeable` / `ReanimatedSwipeable` on native).
- **Tap opens** the habit — a read/edit sheet. Tapping never ticks. (Image thumbs likewise tap-open a viewer, never tick.)
- **No skip on rows.** Skip only means something for the *current* turn (the hero's "Skip this turn"). Rows have no skip affordance.
- **Long-press is reserved** (group title → edit) and must fire on **hold-elapsed**, not on release, so a deliberate hold is distinguishable from a tap.

There is **no "Do this one" pill, no out-of-order menu, no numbering.** Out-of-order ticking is the swipe; opening is the tap.

---

## Inputs

### Name input (Create / Edit)

A borderless cream-card input set in Fraunces 18. Placeholder `"e.g. Core, Mobility…"`. Radius 14.

### Habit row (Create / Edit)

- A small (8px) bullet dot on the left. Hollow (`accent-dim` border) when empty; filled coral when text exists.
- Borderless input, Fraunces 15, ink color.
- `×` (Inter 18, ink-faint) to delete on hover, only when 3+ habits exist (minimum 2).

### Time picker

Native `<input type="time">`. Bordered with `accent-dim`, 8px radius, 6×8 padding, Inter 500 13. The Active hours field uses two pickers separated by an en-dash.

### Toggle

40 × 22 pill. On: `--accent` background, knob slid right. Off: `--accent-dim`, knob left. Knob is 18 × 18 white circle.

---

## Banners & toasts

### Paused banner (Group detail)

A **prominent** coral fill banner with white text and a Resume CTA on the right.

```
┌─────────────────────────────────────────────┐
│ ⏸  ROTATION PAUSED              [ RESUME ] │
│    No reminders will arrive.                │
│    The queue holds its place.               │
└─────────────────────────────────────────────┘
```

- Background: `--accent`. Text: `--card`.
- Resume button: white card fill, coral text, uppercase, letter-spacing 1.2.
- Radius 18, padding `14px 16px 14px 18px`, gap 12.
- Glow: `--shadow-paused` (coral-tinted).

The hero card *also* dims to `opacity: 0.55; filter: saturate(0.35)` and the Mark Done button disappears, replaced by a dashed "Ring is on hold" pill. Three signals together — the paused state is impossible to miss.

### Undo toast

Black pill at the bottom of the screen, white text, coral "Undo" affordance.

```
┌──────────────────────────────────┐
│ Logged · Hollow hold       UNDO │
└──────────────────────────────────┘
```

Auto-dismisses at 5.5 s. Slides in from below with opacity.

---

## Heatmap & insights

### Activity grid

12 weeks × 7 days. Each cell is 14px tall, 3px gap. Two colors: `--accent-dim` for empty, `--accent` with stepped opacity (0.25 → 0.95) for activity levels.

### Per-rotation activity strip

Each rotation in the "By rotation" card shows:

- The group name.
- A **`ticksPerWeek`** number (large, Inter 500 14) + "/ wk" (ink-soft 12).
- A "Recent" strip: 10 small dots, most recent on the right. Filled coral 9px = done. Hollow 7px = skip. Opacity climbs from 0.45 (oldest) to ~1.0 (most recent).
- A meta line: `"{lastDone} · {n} habits"`, italic Fraunces 11, ink-faint.

There is **no `%` progress bar.** Rotation has no end to measure progress against — the strip shows *cadence-keeping*, not completion.

---

## Notification preview

The lock-screen mock. A single notification card, no secondary "logged ✓" entry (the app does not notify on done — only on due).

```
┌──────────────────────────────────────────┐
│ ◯  ORBIT · now                          │
│ Core · your turn                         │
│ Up next: Hollow hold, 45s                │
│                                          │
│ [Mark done]  [Snooze 1h]  [Skip]         │
└──────────────────────────────────────────┘
```

Background: a coral → ink → near-black linear gradient at 160°. Clock above (Fraunces 76 light), date below (Inter 500 14).

---

## Onboarding

Three pages. Each page has a small illustration (built from the same primitives — dots, pills, weekday cells), a coral kicker, a 30px Fraunces title, and a 16/24 body paragraph in Fraunces. Pager dots at the top; ink-on-bone Continue at the bottom.

The illustrations re-use the orbit metaphor: page 1 is a static ring, page 2 is a weekday grid, page 3 is the queue.

---

## States summary

| Surface | States covered |
|---|---|
| Today | Has-due, all-caught-up (empty-quiet), undo-visible. |
| Rotations index | Default, paused-cards-dimmed. |
| Group detail | Active, paused (prominent banner), undo-visible, mid-tick (row highlight + line-through). |
| Create | Empty, partially-filled, valid (CTA enabled), invalid (CTA grey). |
| Settings | Default. Active-hours edit-in-place. |
| Insights | Default with mock data. |

Edge cases: error / no-network is not yet modeled — see "Caveats" in `README.md`.

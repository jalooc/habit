# Microcopy — Orbit + Ink

Two dictionaries: **Literary** (the canonical voice) and **Functional** (a tighter, less ornamented variant for accessibility / shorter copy). Both are warm. Neither is cheerleader-y.

The Tweaks panel can flip between them at runtime; the strings below mirror the `TONES` object in `tokens.jsx`.

## Voice rules

1. **Calm > urgent.** "A quiet moment" not "Nothing to do!". The app never raises its voice.
2. **Indirect address.** "The ring waits" — not "You haven't done anything".
3. **No streaks-as-cheers.** Numbers are stated, not celebrated.
4. **No "day" for cadence-agnostic copy.** Habits can ping in minutes. Use "moment", "right now", "when it's time".
5. **No emoji** in body copy. The coral-dot ✓ is rendered as a glyph inside the active-dot circle, not as a character in a sentence.
6. **Italics for group names.** "Core", "Languages", "Calls" — set in Fraunces italic.
7. **Em-dashes are welcome.** They match the breathing pace. "A quiet moment — nothing in rotation."

## Strings

### Empty / first-run

| Key | Literary | Functional |
|---|---|---|
| `emptyHero` | Nothing in orbit yet. | No groups yet. |
| `emptyBody` | A rotation is a small set of related habits that take turns. Make one to begin. | Create a group of habits that rotate through a cadence. |
| `emptyCta` | Make your first rotation | New group |

### Today

| Key | Literary | Functional |
|---|---|---|
| `todayLabel` | Today | Today |
| `nothingDue` | A quiet moment — nothing in rotation. | Nothing due right now. |
| `nothingDueSub` | Your due rotations are all squared away. The next ping comes when it's time. | All caught up. |

### The ring

| Key | Literary | Functional |
|---|---|---|
| `upNext` | Up next | Next |
| `markDone` | Mark done | Mark done |
| `logged` | Logged ✓ | Done |

### Group detail

| Key | Literary | Functional |
|---|---|---|
| `theQueue` | The queue | Queue |
| `skip` | Skip this turn | Skip |
| `skipExplain` | The habit cycles to the back of the ring, untouched. | Skips this turn. Habit moves to end of queue. |
| `reorderHint` | Hold and drag to reorder | Drag to reorder |
| `pausedDescription` | On hold. The ring waits. | Paused — no reminders. |

### Paused banner (always Literary — this is the prominent state)

> **Rotation paused**  
> No reminders will arrive. The queue holds its place.

### Create / Edit

| Key | Literary | Functional |
|---|---|---|
| `newRotation` | New rotation | New group |
| `create` | Create rotation | Create group |
| `cycleSub` | A group cycles through its habits | Group of habits that rotate |
| `reminder` (reminder card title) | Reminder when due | Reminder when due |

### Settings · Reminders

- **Active hours** — "Pings only between {start} and {end}. Outside the window the app stays quiet."
- **Spread reminders** — "Scatter pings across the active window so they don't all land at once."

(There is **no** "Quiet hours" — that framing was rejected. The model is *active hours*: the window during which the app is allowed to ping.)

### Insights

| Key | Copy |
|---|---|
| Page title | Insights |
| Page kicker | Last 12 weeks |
| Big number labels | Streak / Completion / Total ticks |
| Heatmap labels | Less ··· More |
| Per-rotation strip | "Recent" + a row of dots; right side: "N / wk" |

### Misc

- Tab labels: **Today** · **Rotations** · **Insights** · **Settings**
- Wordmark: **◯ ORBIT** (uppercase, letter-spacing 1.4, coral)
- Status strip date: weekday + day, no year. "Thu · May 15"
- Tagline (settings footer): *"Built for habits that don't fit a checklist."* — italic Fraunces.

## Notifications

The notification is **the only place** where the app addresses the user directly with a verb:

> **{Group} · your turn**  
> Up next: {Habit name}  
> [Mark done]  [Snooze 1h]  [Skip]

Three actions, no more. The notification never says "logged ✓" — we don't ping when a habit is *done*, only when one is *due*.

## What we don't say

- **"Streak broken"** — never. Streaks are reported; their loss is not.
- **"Don't forget!"** / "You missed yesterday" — the app doesn't nag.
- **"Great job!"** / "Way to go!" — the app doesn't praise.
- **"Crush", "smash", "level up"** — wrong register.
- **"Daily habit"** — say "rotation" (or "group") and let cadence be its own thing.

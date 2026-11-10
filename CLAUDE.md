# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start             # Expo dev server (requires prior native build)
npm run ios           # expo run:ios — build + run iOS
npm run android       # expo run:android — build + run Android
npm run web           # Expo web
npm run type-check    # tsc --noEmit
npm run lint          # eslint . --max-warnings 0
npm test              # vitest (all tests)
npm test -- src/path/to/file.test.ts        # run a single test file
npm test -- -t "test name"                  # run tests matching a name pattern
```

This is an Expo dev-client project: `npm start` alone is not enough — `npm run ios` / `npm run android` must be run at least once to produce the native build. Path alias: imports use `src/...` (resolved via `tsconfig.json` `baseUrl: "./"`).

## Architecture

### Tech Stack
- **Expo SDK 57** + React Native 0.86 (New Architecture is always on)
- **React Navigation 7** static API (`createStaticNavigation`)
- **jotai 3** for state; the three persisted stores are `atomWithStorage` atoms over **react-native-mmkv** (see *State + persistence*)
- **Unistyles 3** for styling (babel plugin configured with `root: 'src'` — must stay in sync if `src/` is renamed)
- **React Navigation `formSheet`** for bottom sheets (native iOS sheet) — use `presentation: 'formSheet'` + `sheetAllowedDetents` in screen options; recurrence is a **custom engine** (`src/domains/recurrence/`, see below), **zod** for schema validation, **dayjs** for dates. `rrule-temporal` is still a dependency but only to parse legacy v1 rrule strings during store migration (`parseRRule`) — don't reach for it in new code
- **`expo-image`** for image display (drop-in for RN `Image`); **`react-native-enriched-markdown`** for markdown rendering
- **remeda** preferred over lodash; **tsafe** + **type-fest** for type-level helpers
- **Icons**: `@react-native-vector-icons/lucide` — the only icon set; don't add others. Unicode stays fine for typographic marks (`·` `¶` `↗`), styled Views for custom shapes (ring dots)

### Domain-oriented structure

Code is organized by domain under `src/domains/`, not by technical layer:

```
src/domains/
  habits/        screens/ (Group, Habit, NewHabit, forms), stores/ (habits, groups, lastAction),
                 components/ (UndoToast, HabitEditor, ImageViewer, Description),
                 utils/ (habitActions, orderQueue, groupDueness, formatCadence, formatNextTurn, notifications scheduler, deep-link config)
  recurrence/    utils/ (recurrence — types + legacy rrule parsing, getOccurrence — the occurrence engine)
  misc/          screens/ (Home, ActiveHours), stores/dayBoundaries, utils/ (navigation, theme, atomWithMMKV), components/ (Box, Button, Chip)
  notifications/ utils/notifications.ts — the *only* file that imports `expo-notifications` directly
  devTools/      Dev-only screens (DevTools, DevLog, Backup) and devLog util
```

When adding code, place it in the domain it belongs to; create a new domain folder rather than dumping things in `misc/`. Complex screens follow the folder pattern: `ScreenName/{ScreenName.tsx, SubComponent.tsx, index.ts}` (see `habits/screens/Group/`).

### State + persistence

Stores live next to their domain (`habits/stores/habits.ts`, `habits/stores/groups.ts`, `misc/stores/dayBoundaries.ts`). Each is a single **jotai** atom holding the whole table, built by `misc/utils/atomWithMMKV`: `atomWithStorage` over one shared MMKV instance (`mmkvStorage`; its id `obsPersist` is inherited from the Legend State plugin so pre-switch installs keep their data) with `getOnInit: true`, so the first read is synchronous. There is deliberately no `subscribe`: MMKV reports the app's own writes through the same listener as external ones, so relaying them would double every update. The Rozenite storage devtools can browse and edit the instance, but an edit shows up after a restart. Its `parse` runs the stored JSON through a **zod schema** and handles migrations (e.g. `habitsSchemaV1 → habitsSchemaV2`); when changing a store's shape, bump the schema and migrate in `parse` rather than wiping data. Keep the versioned schemas and the alias naming the current one (`habitsSchema = habitsSchemaV2`), and build any compatibility schema out of them: since the previous store wrote one field at a time, a habit is read as v2 plus the v1 `lastCompleted` that store may have left next to it (`persistedHabitSchema`). A missing key yields the initial value. Every write replaces the whole stored value, so when a store can't read all of what is under its key, the bytes are first copied to `<key>.unreadable.<timestamp>` (once per distinct value; no write touches these, and a backup export carries them as `unreadable`), and the cause goes to the dev log. The groups and habits parsers leave out only the entry they can't read; any other failure starts the store from its initial value rather than throwing at import. Backup import is stricter and rejects a backup holding an unreadable rotation or habit, before it replaces any images. A rotation keeps the ids of habits left out on load, so a restored habit comes back: count and list a rotation's habits through `orderQueue`, which skips ids the habits store doesn't hold, never by indexing the habits store with `Object.keys(group.habits)`. A rotation left out on load is invisible to the delete flows: deleting a rotation treats a habit whose only other rotation is the left-out one as unshared and deletes it for good (the set-aside copy keeps the rotation, not the habit). `cleanupOrphanedImages` skips an empty habits store, since that is also what an unreadable one loads as, and keeps any file whose name appears in a set-aside habits copy (searched as text, since the copy need not be JSON). `lastAction` is a plain in-memory atom. Deliberately one atom per table, not per entity: at this scale immutable spreads are fine, and per-entity persistence would need an index atom and per-key migrations for nothing visible.

How to read and write:
- **Reads:** `useAtomValue(xAtom)` in components (indexing straight into it is fine: `useAtomValue(groupsAtom)[groupId]`), `getDefaultStore().get(xAtom)` outside React. Derived values are computed inline in the component or, when shared or expensive, as a derived atom next to its consumer (`homeSectionsAtom` in `Home.tsx`).
- **Single-atom writes:** `useSetAtom(xAtom)` with a functional update. Membership changes go through `withHabitLinked` / `withHabitUnlinked` from the groups store, and any other change to one rotation or habit through `withGroupUpdated` / `withHabitUpdated`: they leave an id that is no longer there alone rather than writing a partial entity the next launch can't read. Removing a key is a rest-destructure (`({ [id]: _removed, ...rest }) => rest`), not remeda's `omit`, whose typing collapses string-keyed records.
- **A write touching two or more atoms must be a write-only atom** (`atom(null, (get, set, …) => …)`), module-local to its caller and invoked via `useSetAtom` or `getDefaultStore().set`. jotai flushes derived atoms and listeners once per `store.set`, so this is the batching primitive; separate `set` calls would let `homeSectionsAtom` recompute against, say, imported habits next to the previous rotations. Existing ones: tick / link / habit deletion / undo (`habitActions`), backup import (`importData`), rotation deletion (`EditGroup`), habit create / update (`HabitEditor`).
- **Side effects on store changes** use `getDefaultStore().sub(xAtom, listener)`. Know that `atomWithStorage` re-reads storage when an atom gets its first subscriber, and the parser returns a fresh object, so that first subscriber sees one no-op update. Nothing may therefore treat a bare subscription event as proof that data changed; the notifications scheduler doesn't care because it reschedules on start anyway.

Testing stores: `vi.mock('react-native-mmkv')` swaps in the in-memory `__mocks__/react-native-mmkv.ts` (instances sharing an id share values, as natively); mock `devLog` too, since it imports `expo-crypto` and thereby `react-native`, which vitest can't parse. `getOnInit` reads storage the moment the atom is created, i.e. at import, so a test that seeds "disk" must do so in `vi.hoisted` before importing the store (`groups.persistence.test.ts`).

### Recurrence engine

`src/domains/recurrence/utils/getOccurrence/` is the single source of schedule times: `getOccurrence.next/previous(recurrence, referenceDate, dayBoundaries)` for `times-per-day`, plus a fourth `lastServedAt` argument for interval types (`every-x-days`, …). Both `next` and `previous` are inclusive of an occurrence landing exactly on `referenceDate`; `getOccurrence.currentSlot(…)` returns the slot containing a reference instant. Everything downstream (dueness, Home bucketing, notifications, cadence labels) derives from it; never compute these times ad hoc. `times-per-day` and `every-x-days` are implemented; the other `RecurrenceType`s throw, and `isRecurrenceTypeImplemented` is what gates the schedule picker, so keep the two in sync. Call sites pass `lastServedAt` on every call; `getOccurrence` strips it for `times-per-day` internally.

**Two words in the engine: occurrence and slot.** An **occurrence** is an *instant*, the moment the recurrence fires, which is what `next`/`previous` return and what notifications are scheduled on. A **slot** is the *interval* that instant sits in, returned by `currentSlot` as `{ opensAt, dueAt, closesAt }` (`undefined` outside active hours and on days the recurrence doesn't run). One occurrence per slot, sitting at its `dueAt`. Name variables accordingly: a `Dayjs` is an occurrence, a `{ opensAt, dueAt, closesAt }` is a slot.

**Calendar-anchored vs completion-anchored.** `times-per-day` divides the active-hours span into equal slots and ignores `lastServedAt`. Interval types anchor on rotation service history instead: `lastServedAt === null` means due immediately (bootstrap clamps into active hours — e.g. 06:00 before the span → `dueAt` at `dayBoundaries.start`, not the raw reference time). After a completion, `dueAt` = anchor + `value` calendar days with the anchor's hour and minute preserved (`.add(value, 'day')`); `specificDays` snaps the **date** forward while keeping time.

**`every-x-days` slots.** Bootstrap obligations use centred slots (`opensAt`/`closesAt` ± `value/2` days around `dueAt`). After a serve, the served slot runs `opensAt = lastServedAt` through `closesAt = dueAt + value/2` days; the next centred slot opens once that closes. Early ticks anywhere inside a slot serve it, same rule as `times-per-day`.

**A third word, and it belongs to the habits domain: turn.** A turn is a slot a rotation has to serve — the unit behind "Skip this turn". `recurrence/` deliberately never says it: that domain knows nothing about habits, completions or users, so `isGroupDue` and `nextTurnDueAt` are where a slot becomes a turn. Don't push "turn" down into the engine, and don't invent a fourth word ("window") for the interval — "window" is already spoken for twice in `buildHomeSections` (`NOW_WINDOW_MS`, `isWithinTodayWindow`), both meaning something else.

- **Placement (`times-per-day`):** on 08:00–20:00, `1×` comes due at 14:00, `2×` at 11:00/17:00, `3×` at 10:00/14:00/18:00. Occurrences deliberately never land on the day boundaries: one firing at the minute active hours end leaves no time to act on it, and one at day start fires the moment you wake. Spans crossing midnight are supported and attributed to the weekday their *middle* falls on (matters for `specificDays`).
- **The interval is why early ticks count.** Completing anywhere inside a turn serves it, so ticking ahead of the due moment doesn't leave the rotation due again minutes later, and a missed turn stays due until its slot runs out. For `times-per-day`, `isGroupDue` hangs on the most recently due turn's `opensAt` (via `previous(now)` then `currentSlot` at that occurrence). For `every-x-days`, obligation windows can open before their `dueAt`, so `isGroupDue` reads `currentSlot(now)` directly. `habits/utils/nextTurnDueAt` answers "when is the next due moment that isn't already served", and is what Home's upcoming rows, the Group screen's next-turn label and `buildNotifications` must use, since calling `getOccurrence.next` directly there would announce a turn that is already done. It always answers in the future, so a turn that is past due and unserved is *not* what it returns — that state is `isGroupDue`'s to report. Note the two anchor on different slots for `times-per-day`: `isGroupDue` on the slot of the most recently *due* turn, `nextTurnDueAt` on the slot `now` sits in. They differ while `now` is between a slot's `opensAt` and its `dueAt`, and never disagree, because "not behind" in that stretch already implies the current slot is served.
- **Complete vs skip:** only a `completed` action serves a turn, so a skipped rotation stays due. A skip *is* history though — it advances the queue and takes the rotation out of the "new" state. Home's `buildHomeSections` buckets on exactly that pair; it owns the thresholds, so read them there rather than restating them here.
- **A turn belongs to one rotation, freshness belongs to the habit.** Service is recorded on the rotation (the group's `lastServedAt`, written only by `actionHabit` and only for the rotation the tick was made in); queue order is recorded on the habit (`lastActioned`, seen by every rotation the habit is in). The two are deliberately different scopes: how recently you did something is a fact about the world, whereas a turn is one rotation's obligation. Deriving dueness from the habits instead lets a habit shared with a faster rotation serve this one's turn every time, so the rest of its habits never come up. Consequence worth knowing: a habit kept fresh by a fast rotation sinks to the back of the slow one's queue permanently, so its membership there is effectively decorative and the "N habits in rotation" count overstates.
- **The parser normalises; the first write settles.** What is stored or backed up is not one schema version or another: the previous store persisted one path at a time, so a single group can hold a v1 RRULE-string `recurrence` next to a `lastServedAt` written by a tick yesterday, and a backup taken from it carries that mix. Everything about how the groups store loads follows from that, and all of it was learned the hard way:
  - **Don't version-discriminate; normalise.** `parsePersistedGroups` reads each field in whatever shape it is in and converts it, rather than trying schema versions in turn. A whole-table schema is worse still: one stale group takes every rotation down with it.
  - **A migration must be stable under re-running.** Nothing is written back on load, so the parser re-runs on every launch until the first ordinary change rewrites the whole table. That is why a rotation with no service record comes back as `lastServedAt: null` rather than a seed derived from its habits — a derived seed would change from launch to launch and hand the rotation credit for a completion made elsewhere.
  - **Report the current shape's complaint.** On a parse failure the old-version errors are noise ("unrecognized key `lastServedAt`" for data that plainly has one); they cost two rounds of misdiagnosis. `groups.persistence.test.ts` drives the real pipeline over the in-memory MMKV mock.
- **Missed turns don't pile up.** A rotation is either behind or it isn't (`isGroupDue`); nothing counts how many turns it has missed, so a single completion always clears it. A missed turn does stay behind indefinitely, but the age shown on a *Carried over* row is measured from the most recent due moment, which is why a rotation untouched for a month reads `3h ago` rather than `30d ago`.
- **Active hours are wall-clock, and a span is only ever as long as the clock made it.** Both ends of a span are set from `hour`/`minute` components and its length is then measured between them, so 08:00–20:00 means local 08:00–20:00 on a DST transition day too, and an overnight span containing the skipped or repeated hour is divided by the hours it really has (22:00–06:00 is 7 hours in spring, 9 in autumn). Never reintroduce a nominal minute count added to or subtracted from a day boundary — that assumption caused both DST bugs the engine has had. Stepping between days (`.add(_, 'day')`) preserves wall clock and is the cheap way to reach the next span.
- **The engine works in instants, not minute counts.** `next`/`previous`/`currentSlot` compare `Dayjs` against slot edges directly; there is no `diff` to truncate and no closed-form slot index. Slot edges are counted in whole slots from the span's *opening* (`slotEdgeAt`), never derived from the preceding edge, so a slot length that isn't a whole millisecond truncates once instead of accumulating — that is what keeps one slot's `closesAt` identical to the next one's `opensAt`, and keeps occurrences off `13:59:59.999`. Anything stepping past an occurrence should step a millisecond, not a minute: `next` is inclusive, and a minute-sized step assumes slots are minutes long.
- **The test suite pins `TZ=Europe/Warsaw`** (`vitest.config.ts`). Every date fixture is written in local time, so the suite only means anything in a fixed zone, and the DST cases need one that actually transitions — which rules out UTC.

### Reactive notifications scheduler

`src/domains/habits/utils/habitsNotificationsScheduler/` exports `startNotificationsScheduler`, which `App` calls once `setupNotifications` has settled (the Android channel must exist first). A failed setup still starts it, as it did when the scheduler started at import. It rebuilds the full notification set (`buildNotifications`) then `cancelAllScheduledNotificationsAsync` + reschedules — once on start, which also carries the 64-notification horizon forward on launches where nothing changes, and again on every change to `groupsAtom`, `habitsAtom` or `dayBoundariesAtom` via `getDefaultStore().sub()`. The module has no import-time side effects. Don't add ad-hoc `Notifications.scheduleNotificationAsync` calls elsewhere; the scheduler owns the queue and a stray call will be wiped on the next change.

### Image handling

Habits can have attached images. The flow is split across two utilities in `src/domains/habits/utils/`:

- `habitImages.ts` — permanent storage in `<documents>/habit-images/`. Exports `imageFileUri(filename)` for display and `cleanupOrphanedImages()` (called at startup) to prune files no longer referenced by any habit (see *State + persistence* for what it keeps).
- `usePendingImages.ts` — staged uploads. Images are compressed and written to `<cache>/pending-images/` during editing. On save, call `commitPendingImages()` to move them to the permanent dir and get back the filenames to store in the habit record. On cancel, call `clearPendingImages()`.

### Navigation + deep linking

Navigator is in `src/domains/misc/utils/navigation.ts` (not `App.tsx`), declared via `createNativeStackNavigator({ screens: { … } })` and exported as `Navigation = createStaticNavigation(RootStack)`. The global `ReactNavigation.RootParamList` is augmented from `StaticParamList<typeof RootStack>` so screens are typed without manual param-list maintenance.

Deep links are wired in `App.tsx`'s `linking` prop, combining `expo-linking` (regular deep links) **and** `expo-notifications` response listeners (so tapping a notification routes via React Navigation). Screen-specific link parsing lives with the screen — e.g. `habits/utils/linking.ts` exports `groupScreenLinkingConfig` and a `createGroupScreenLink()` builder that is reused when scheduling notifications. When adding a deep-linkable screen, follow this pattern: colocate `linkingConfig` + link builder with the screen. A link or a notification can outlive what it points at, so a linked screen must handle a missing entity: the Group screen pops to Home when its rotation is gone.

## Other architectural choices
- Prefer using native components (either React Native ones or ones provided by https://docs.expo.dev/versions/latest/sdk/ui/universal/, especially considering https://docs.expo.dev/versions/latest/sdk/ui/drop-in-replacements/ as replacements for popular 3rd party libraries).

## Style rules worth knowing here

- ESLint runs `tseslint.strictTypeChecked` + `stylisticTypeChecked` with `--max-warnings 0`. Run `npm run lint` before claiming a change is done.
- 2-space indent, single quotes, no semicolons, trailing commas on multiline, max line length 120, `arrow-parens: as-needed`.
- Default `React` import is banned — use named imports: `import { useState } from 'react'`.
- The user's global rules (see `~/.claude/CLAUDE.md`) apply: inline `export`, no switch-case (use object lookups), prefer type inference, no `as` assertions, no `interface`, functional style, etc.

### ESLint import rules (enforced, will fail lint)

These are easy to violate by accident:

- **`expo-notifications` is banned directly** — always import from `src/domains/notifications/utils/notifications` instead.
- **No sub-module deep imports** — `src/domains/*/*/*/**` is blocked. A screen's internal helpers must be re-exported through the screen's root module if needed externally.
- **No explicit `index` in import paths** — import the directory, not the file: `import Foo from 'src/domains/habits/screens/Group'`, not `…/Group/index`.
- **Module placement** — all `src/` imports must be under `src/domains/<domain>/{components,utils,assets,screens,stores}/`. Anything outside those buckets triggers a lint error.

### Styling (Unistyles)

Use `StyleSheet.create` with the theme callback for static styles — avoid plain RN `StyleSheet` and inline style objects. For styles that mix theme values with runtime values (entity ids, user data), use a dynamic style function inside the stylesheet — the inline alternative would need `useUnistyles()`, which re-renders on every theme change, while stylesheet styles update without re-rendering. Plain inline styles remain fine for values with no theme dependency at all (e.g. a width computed from user data):

```ts
import { StyleSheet } from 'react-native-unistyles'

const styles = StyleSheet.create(theme => ({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  bar: (widthFraction: number) => ({
    backgroundColor: theme.colors.accent,
    width: `${widthFraction * 100}%`,
  }),
}))
```

Theme tokens are defined in `src/domains/misc/utils/theme.ts`: `colors`, `shadows` (RN `boxShadow` strings), `fonts`, `spacing`, `typography`, `radii`. There are two themes (`light`/`dark`) with `adaptiveThemes: true` — dark mode is live, so never hardcode colors that assume a light background. For translucent overlays on theme colors, use `withAlpha(theme.colors.background, 0.15)` (exported from `theme.ts`; hex tokens only, not the rgba `border` token).

### Design system

Visual guidelines come from the `/orbit-design-system` skill (`.claude/skills/orbit-design-system/`) — consult it before building new UI. `STATUS.md` in the skill folder is the register of which DS surfaces are implemented vs backlog — keep it updated when porting more of the system. Rules already encoded in this codebase:

- **Fonts**: Fraunces (serif — titles, headings, body) + Inter (sans — captions, labels, buttons), embedded natively via the `expo-font` config plugin in `app.config.ts` (no runtime `useFonts`). `fontFamily` strings must match the TTFs' PostScript names — `theme.fonts` holds the verified ones (e.g. `serifItalic` for group names). Android quirk: `serifItalic` at small sizes (13–14) silently drops trailing colon-digit runs (`9:09`) from rendered text (glyphs exist in the TTF; it's a measure/shaping bug) — don't set times in italic, use `serif`.
- **`fontWeight` is ESLint-banned outside `theme.ts`** (`no-restricted-syntax` registry in `eslint.config.js`; `theme.ts` is exempted via `omit`). Spread a `theme.typography` role instead. Only Fraunces 400 (+ italic) and Inter 400/500 are bundled — any other weight would render as synthetic faux-bold on Android.
- **Primary CTAs are ink-on-bone** (`colors.text` fill, `colors.background` text) — never coral. The coral accent is reserved for small markers and highlights.
- **Disabled = `opacity: 0.5`, pressed = `opacity: 0.6`** — opacity states, not color swaps.
- **Interaction model**: slide/swipe = act, tap = open (never tick). The hero's up-next habit is ticked via `SlideToConfirm` (slide-to-log) with a ghost "Skip this turn" beside it; queue rows tick out-of-order via swipe-right over a coral `SwipeToLog` pane (no skip on rows — skip only means something for the current turn). Tapping a queue row or the hero habit name opens the `Habit` sheet (read + edit); image thumbnails tap-open the viewer. Long-press is reserved for the group title (→ `EditGroup`) and must activate on hold-elapsed (`Gesture.LongPress().onStart`), never on release.
- **Never stack sheets** — a `formSheet` must not open another sheet/modal on top of itself. Expand in place instead (see the image source chips in `HabitEditor`) or navigate within the sheet.
- **Ticking goes through `habits/utils/habitActions`** (`actionHabit(habitId, type, groupId)` / `undoLastAction`) — never set `lastActioned` or `lastServedAt` directly; the undo toast depends on both being written together, and a tick with no rotation attached can't serve anything. The queue is *derived*: habits sorted by `lastActioned` ascending (`orderQueue`), index 0 is up next; `isGroupDue` + `formatCadence` provide due-state and concise cadence labels. Deleting a rotation must also clear `lastActionAtom` in the same write-only atom: undo leaves an entity that no longer exists alone, but the toast would otherwise keep offering an undo that does nothing. Deleting a habit goes through `deleteHabit`, whose own undo replaces whatever was on offer. Its image files stay on disk until that offer ends, which `lastActionAtom`'s write handles, so anything clearing the action after restoring a habit must restore it first. `cleanupOrphanedImages` at launch covers an app killed during the offer; don't call it when an offer ends instead, since saving a habit moves new images into the folder before the habit references them.
- **One chromatic accent** — cards are `colors.surface` on `colors.background`; coral only for small markers (active ring dot, due markers, kickers, chips).
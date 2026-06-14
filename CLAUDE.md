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
- **Expo SDK 56** + React Native 0.85 (New Architecture is always on)
- **React Navigation 7** static API (`createStaticNavigation`)
- **Legend State 3** (`@legendapp/state`) for reactive state, persisted via MMKV
- **Unistyles 3** for styling (babel plugin configured with `root: 'src'` — must stay in sync if `src/` is renamed)
- **React Navigation `formSheet`** for bottom sheets (native iOS sheet) — use `presentation: 'formSheet'` + `sheetAllowedDetents` in screen options; **rrule-temporal** for recurrence, **zod** for schema validation, **dayjs** for dates
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
  misc/          screens/ (Home, ActiveHours), stores/dayBoundaries, utils/ (navigation, theme), components/ (Box, Button, Chip)
  notifications/ utils/notifications.ts — the *only* file that imports `expo-notifications` directly
  devTools/      Dev-only screens (DevTools, DevLog, Backup) and devLog util
```

When adding code, place it in the domain it belongs to; create a new domain folder rather than dumping things in `misc/`. Complex screens follow the folder pattern: `ScreenName/{ScreenName.tsx, SubComponent.tsx, index.ts}` (see `habits/screens/Group/`).

### State + persistence

Stores live next to their domain (`habits/stores/habits.ts`, `habits/stores/groups.ts`, `misc/stores/dayBoundaries.ts`). Each store is a Legend State `observable(synced({ persist: { plugin: ObservablePersistMMKV, transform: { load, save } } }))`. The `transform.load` runs the incoming payload through a **zod schema** and handles migrations (e.g. `habitsSchemaVm1 → habitsSchema`); when changing a store's shape, bump the schema and add a load-time migration rather than wiping data.

Legend State conventions (see global rules):
- No `observer()` HOC
- `useObservable()` for local state, `useValue(obs$)` for reactive reads, `useSelector(() => …)` for derived values
- Bare `.get()` is fine in event handlers (no reactivity needed there)

### Reactive notifications scheduler

`src/domains/habits/utils/habitsNotificationsScheduler/` subscribes to `groups$`, `habits$`, and `dayBoundaries$` via `.onChange()` and on every change rebuilds the full notification set (`buildNotifications`) then `cancelAllScheduledNotificationsAsync` + reschedules. **Side effect:** importing `App.tsx` activates this — see the bare `import 'src/domains/habits/utils/habitsNotificationsScheduler'` at the top of `App.tsx`. Don't add ad-hoc `Notifications.scheduleNotificationAsync` calls elsewhere; the scheduler owns the queue and a stray call will be wiped on the next change.

### Image handling

Habits can have attached images. The flow is split across two utilities in `src/domains/habits/utils/`:

- `habitImages.ts` — permanent storage in `<documents>/habit-images/`. Exports `imageFileUri(filename)` for display and `cleanupOrphanedImages()` (called at startup) to prune files no longer referenced by any habit.
- `usePendingImages.ts` — staged uploads. Images are compressed and written to `<cache>/pending-images/` during editing. On save, call `commitPendingImages()` to move them to the permanent dir and get back the filenames to store in the habit record. On cancel, call `clearPendingImages()`.

### Navigation + deep linking

Navigator is in `src/domains/misc/utils/navigation.ts` (not `App.tsx`), declared via `createNativeStackNavigator({ screens: { … } })` and exported as `Navigation = createStaticNavigation(RootStack)`. The global `ReactNavigation.RootParamList` is augmented from `StaticParamList<typeof RootStack>` so screens are typed without manual param-list maintenance.

Deep links are wired in `App.tsx`'s `linking` prop, combining `expo-linking` (regular deep links) **and** `expo-notifications` response listeners (so tapping a notification routes via React Navigation). Screen-specific link parsing lives with the screen — e.g. `habits/utils/linking.ts` exports `groupScreenLinkingConfig` and a `createGroupScreenLink()` builder that is reused when scheduling notifications. When adding a deep-linkable screen, follow this pattern: colocate `linkingConfig` + link builder with the screen.

## Other architectural choices
- Prefer using native components (either React Native ones or ones provided by https://docs.expo.dev/versions/latest/sdk/ui/universal/, especially considering https://docs.expo.dev/versions/latest/sdk/ui/drop-in-replacements/ as replacements for popular 3rd party libraries).

## Style rules worth knowing here

- ESLint runs `tseslint.strictTypeChecked` + `stylisticTypeChecked` with `--max-warnings 0`. Run `npm run lint` before claiming a change is done.
- 2-space indent, single quotes, no semicolons, trailing commas on multiline, max line length 120, `arrow-parens: as-needed`.
- `@stylistic/jsx-pascal-case` allows `$Upper…` names — that's for Legend State's `$TextInput` etc.
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

- **Fonts**: Fraunces (serif — titles, headings, body) + Inter (sans — captions, labels, buttons), embedded natively via the `expo-font` config plugin in `app.json` (no runtime `useFonts`). `fontFamily` strings must match the TTFs' PostScript names — `theme.fonts` holds the verified ones (e.g. `serifItalic` for group names). Android quirk: `serifItalic` at small sizes (13–14) silently drops trailing colon-digit runs (`9:09`) from rendered text (glyphs exist in the TTF; it's a measure/shaping bug) — don't set times in italic, use `serif`.
- **`fontWeight` is ESLint-banned outside `theme.ts`** (`no-restricted-syntax` registry in `eslint.config.js`; `theme.ts` is exempted via `omit`). Spread a `theme.typography` role instead. Only Fraunces 400 (+ italic) and Inter 400/500 are bundled — any other weight would render as synthetic faux-bold on Android.
- **Primary CTAs are ink-on-bone** (`colors.text` fill, `colors.background` text) — never coral. The coral accent is reserved for small markers and highlights.
- **Disabled = `opacity: 0.5`, pressed = `opacity: 0.6`** — opacity states, not color swaps.
- **Interaction model**: slide/swipe = act, tap = open (never tick). The hero's up-next habit is ticked via `SlideToConfirm` (slide-to-log) with a ghost "Skip this turn" beside it; queue rows tick out-of-order via swipe-right over a coral `SwipeToLog` pane (no skip on rows — skip only means something for the current turn). Tapping a queue row or the hero habit name opens the `Habit` sheet (read + edit); image thumbnails tap-open the viewer. Long-press is reserved for the group title (→ `EditGroup`) and must activate on hold-elapsed (`Gesture.LongPress().onStart`), never on release.
- **Never stack sheets** — a `formSheet` must not open another sheet/modal on top of itself. Expand in place instead (see the image source chips in `HabitEditor`) or navigate within the sheet.
- **Ticking goes through `habits/utils/habitActions`** (`actionHabit` / `undoLastAction`) — never set `lastActioned` directly; the undo toast depends on it. The queue is *derived*: habits sorted by `lastActioned` ascending (`orderQueue`), index 0 is up next; `groupDueness` + `formatCadence` provide due-state and concise cadence labels.
- **One chromatic accent** — cards are `colors.surface` on `colors.background`; coral only for small markers (active ring dot, due markers, kickers, chips).
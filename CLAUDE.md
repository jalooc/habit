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
- **`@react-native-vector-icons/ionicons`** for icons — import from the `/static` sub-path: `import Ionicons from '@react-native-vector-icons/ionicons/static'`

### Domain-oriented structure

Code is organized by domain under `src/domains/`, not by technical layer:

```
src/domains/
  habits/        screens/, stores/ (habits, groups), utils/ (notifications scheduler, deep-link config)
  misc/          screens/Home, stores/dayBoundaries, utils/ (navigation, theme)
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

Use `StyleSheet.create` with the theme callback for static styles — avoid plain RN `StyleSheet` or inline style objects unless values are dynamic (e.g. derived from user data, an API response, or randomised at runtime):

```ts
import { StyleSheet } from 'react-native-unistyles'

const styles = StyleSheet.create(theme => ({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
}))
```

Theme tokens are defined in `src/domains/misc/utils/theme.ts` (`colors`, `spacing`, `typography`, `radii`, `pastels`). Group pastel colors by entity ID via `pastelOf(id)` from that module.
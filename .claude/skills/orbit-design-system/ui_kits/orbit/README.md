# Orbit UI Kit

A working React UI kit for the Orbit + Ink design system. The source files live at the **project root**; this folder is a focused demo and an entry point.

## Anatomy

| Source file (project root) | What's in it |
|---|---|
| [`tokens.jsx`](../../tokens.jsx) | Runtime `TokenProvider`, `useTokens` hook, palette / density / tone / ring tables. |
| [`rings.jsx`](../../rings.jsx) | `OrbitRing`, `OrbitMini`. The signature visual. |
| [`screens.jsx`](../../screens.jsx) | `TodayScreen`, `RotationsScreen`, `GroupScreen`, `CreateScreen` + shared chrome (`OIHead`, `TabBar`, `OrbitStrip`, `ActiveHoursChip`, `PillButton`, `UndoToast`, `PausedBanner`). |
| [`screens-extra.jsx`](../../screens-extra.jsx) | `EmptyScreen`, `NotificationPreview`, `OnboardingScreen`, `SettingsScreen`, `StatsScreen` + their sub-illustrations. |
| [`prototype.jsx`](../../prototype.jsx) | `OrbitInkApp` — nav-stack shell that composes everything. |
| [`shared-data.js`](../../shared-data.js) | Data model (`Group`, `Habit`) + rotation helpers (`upNext`, `tickOff`, `skipTurn`, `tickOutOfOrder`, `queueOrder`). |
| [`colors_and_type.css`](../../colors_and_type.css) | Canonical CSS variables + semantic styles (parallel to `tokens.jsx` for non-JSX consumers). |
| [`design-tokens.json`](../../design-tokens.json) | Machine-readable token map. |

## How to use this kit in Claude Code

```jsx
// 1. Provide tokens at your app root.
const TWEAK_DEFAULTS = { dark: false, density: 'cozy', tone: 'literary', ringSize: 'default' };
const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
<TokenProvider tweaks={tweaks}>
  <YourApp />
</TokenProvider>

// 2. Drop screens / components anywhere inside the provider.
<TodayScreen groups={groups} setGroups={setGroups} go={navigate} ringId="orbit" />

// 3. Or use the full shell.
<OrbitInkApp ringId="orbit" />
```

The components read tokens via `useTokens()` and have no external dependencies beyond React 18.

## What `OrbitInkApp` does

It owns:
- A `groups` state seeded from `SAMPLE_GROUPS` (you can pass `initialGroups`).
- A small navigation stack `stack` with `home / groups / group / create / edit / settings / stats / empty / onboarding`.
- A `go(route)` / `back()` / `setTab(tabId)` API.

Drop it inside an Android device chrome at 412 × 892 (see `android-frame.jsx` for one such chrome) — it expands to fill the frame.

## Mechanic — port verbatim

The four rotation helpers in `shared-data.js` encode the entire rotation behavior. Any port (React Native, Compose, Flutter, plain React) should reuse them as-is:

```js
upNext(group)               // → group.habits[cursor]
tickOff(group)              // → cursor = (cursor + 1) % n
skipTurn(group)             // → identical effect, different event log entry
tickOutOfOrder(group, hid)  // → move picked habit to end of queue, cursor stays
queueOrder(group)           // → habits[] rotated so cursor is index 0
```

## Demo

Open [`index.html`](./index.html) in a browser. It mounts `OrbitInkApp` inside an Android device frame with a small Tweaks panel for theme / density / ring / tone. This is intentionally narrower than the full lab (`../../index.html`) — it's the "give-me-just-the-app" view.

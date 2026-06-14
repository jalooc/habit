---
name: orbit-design-system
description: Use this skill to generate well-branded interfaces and assets for Orbit + Ink — a rotating-habits app with a calm, literary voice and a single-coral palette. Contains design guidelines (colors, type, fonts, spacing, motion), microcopy dictionaries, machine-readable tokens, a React UI kit, and per-component reference. Use for production code, prototypes, marketing surfaces, or one-off mocks.
user-invocable: true
---

Read `README.md` first; it lays out the product context, the **Porting to React Native / Expo** section, content fundamentals, visual foundations, iconography, and a file index.

**Target platform: React Native / Expo** (Unistyles 3, React Navigation 7). The reference lab is web, but the canonical consumer is native — prefer `design-tokens.json` (named for RN/Unistyles) over the CSS file when they disagree, and read every web-ism (CSS vars, `@import`, hover, `cursor`, SVG) as "web lab only".

Then follow up with:

- `microcopy.md` for the voice + Literary / Functional tone dictionaries.
- `components.md` for the component reference (props, states, motion, interaction spec).
- `design-tokens.json` for the canonical machine-readable token map (colors, type roles, radii, flat spacing scale, ring sizing, motion) — named for RN/Unistyles conventions, with a `legacyNames` old→new map.
- `colors_and_type.css` for canonical CSS variables + semantic typography classes you can drop straight into a static site.
- `tokens.jsx`, `rings.jsx`, `screens.jsx`, `screens-extra.jsx`, `prototype.jsx`, `shared-data.js` for the working React UI kit (inline JSX, no build step).
- `images.jsx`, `description.jsx`, `whisper.jsx`, `edit-time.jsx` for the per-feature components (habit images, habit description, "a note for next time", editing the time of a tick).
- `ui_kits/orbit/index.html` for a focused interactive demo of the full app.
- `index.html` (project root) for the full lab — every screen + edge state + feature + Tweaks.

## When invoked

If the user invokes this skill without specific guidance, ask what they want to build (a screen, a deck, an email, a marketing page, a code component) and *for what audience*. Then act as an expert designer who outputs HTML artifacts (for static visuals) or production code (for an actual app).

## Non-negotiables

- **Two themes only.** Bone (light) + Evening (dark), live adaptive. Earlier exploration included Moss and Slate — those were rejected.
- **One chromatic accent.** Coral (#c96442 light / #e3a37a dark). Never coral on a primary CTA — primary is always ink-on-bone.
- **Two type families, embedded as discrete TTFs.** Fraunces (`Fraunces-Regular`, `Fraunces-Italic`) for display + body; Inter (`Inter-Regular`, `Inter-Medium`) for chrome. `fontFamily` = PostScript name. No variable axes; **no Inter 600** (faux-bold on Android). No other families.
- **Voice is calm.** No streaks-as-cheers, no urgency, no emoji, no exclamation marks in product copy. See `microcopy.md`.
- **No brand imagery.** No photos, no hand-drawn illustrations. The orbit ring + Lucide marks are the only graphics. (The per-habit *images* feature is user content, not brand imagery.) If the work needs photography, flag it.
- **Slide/swipe to act, tap to open.** Tick the up-next habit with a **slide-to-confirm** control (ghost "Skip this turn" beside it); tick queue rows **out of order via swipe-right**; **tap opens** the habit (read/edit sheet); **long-press** is reserved (group title → edit, on hold-elapsed). Ticking is never a bare tap. No "Do this one" pill, no out-of-order menu, no numbered rows.
- **Sheets never stack.** Don't present a sheet from a sheet (broken on iOS formSheet) — expand in place or flip one sheet between modes (reader → editor).
- **Rotation has no end.** Do not draw progress bars or completion arcs for the rotation itself — it loops forever. Streaks and per-cadence "did the user show up" stats are fair game.

## Caveats

- Native fonts are embedded TTFs (PostScript names); the web lab loads Fraunces + Inter from Google via `@import` in `colors_and_type.css`. Don't set clock times in italic (Android drops colon-digit runs at 13–14px).
- **Lucide** (`stroke-width: 1.5`) is the official icon set. Unicode is reserved for typographic marks in copy (`· — ↗`).
- The orbit ring is `View`s + Reanimated on native (SVG optional). No progress arc, ever.
- Mobile-only at 412 × 892 (design canvas; real builds use device safe-area insets). Tablet / desktop layouts are not in the system; design them deliberately if needed.

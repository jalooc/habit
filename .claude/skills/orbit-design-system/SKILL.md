---
name: orbit-design-system
description: Use this skill to generate well-branded interfaces and assets for Orbit + Ink — a rotating-habits app with a calm, literary voice and a single-coral palette. Contains design guidelines (colors, type, fonts, spacing, motion), microcopy dictionaries, machine-readable tokens, a React UI kit, and per-component reference. Use for production code, prototypes, marketing surfaces, or one-off mocks.
user-invocable: true
---

Read `README.md` first; it lays out the product context, content fundamentals, visual foundations, iconography, and a file index.

Then follow up with:

- `microcopy.md` for the voice + Literary / Functional tone dictionaries.
- `components.md` for the component reference (props, states, motion, interaction spec).
- `design-tokens.json` for a machine-readable token map (colors, type roles, radii, density, ring sizing, motion).
- `colors_and_type.css` for canonical CSS variables + semantic typography classes you can drop straight into a static site.
- `tokens.jsx`, `rings.jsx`, `screens.jsx`, `screens-extra.jsx`, `prototype.jsx`, `shared-data.js` for the working React UI kit (inline JSX, no build step).
- `images.jsx`, `description.jsx`, `whisper.jsx`, `edit-time.jsx` for the per-feature components (habit images, habit description, "a note for next time", editing the time of a tick).
- `ui_kits/orbit/index.html` for a focused interactive demo of the full app.
- `index.html` (project root) for the full lab — every screen + edge state + feature + Tweaks.

## When invoked

If the user invokes this skill without specific guidance, ask what they want to build (a screen, a deck, an email, a marketing page, a code component) and *for what audience*. Then act as an expert designer who outputs HTML artifacts (for static visuals) or production code (for an actual app).

## Non-negotiables

- **Two themes only.** Bone (light) + Evening (dark). Earlier exploration included Moss and Slate — those were rejected.
- **One chromatic accent.** Coral (#c96442 light / #e3a37a dark). Never coral on a primary CTA — primary is always ink-on-bone.
- **Two type families.** Fraunces (variable, ital + opsz) for display + body; Inter (400/500/600) for chrome. No other families.
- **Voice is calm.** No streaks-as-cheers, no urgency, no emoji, no exclamation marks in product copy. See `microcopy.md`.
- **No imagery.** No photos, no hand-drawn illustrations. The orbit ring SVG + Unicode marks are the only graphics. If the work needs photography, flag it.
- **Tap to tick.** Any habit row in the queue is tappable to mark done. There is no out-of-order menu, no "Do this one" pill, no numbered queue items.
- **Rotation has no end.** Do not draw progress bars or completion arcs for the rotation itself — it loops forever. Streaks and per-cadence "did the user show up" stats are fair game.

## Caveats

- Fonts load from Google Fonts via `@import`. No local TTFs ship; download Fraunces + Inter if offline.
- No icon library. Unicode (◯ ◐ ◔ ◌ ✓ · —) + inline SVG primitives only. Substitute Lucide (1.5px stroke) if a richer set is unavoidable and **flag the substitution**.
- Mobile-only at 412 × 892. Tablet / desktop layouts are not in the system; design them deliberately if needed.

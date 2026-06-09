# Project: Habit

## Navigation model

When designing screens and transitions for this project, mirror the presentation
modes available in React Navigation's Native Stack Navigator
(https://reactnavigation.org/docs/native-stack-navigator/#presentation). Pick
the right one per screen instead of defaulting everything to a card push.

### Presentation modes to support

- **card** (default) — full-screen push. New screen slides in from the trailing
  edge, previous screen slides out. Use for primary navigation between
  top-level destinations and detail drill-downs.
- **modal** — screen slides up from the bottom and covers the previous one.
  Previous screen stays mounted underneath. Use for self-contained tasks
  (compose, settings, auth) where the user should explicitly dismiss.
- **transparentModal** — like modal but the screen background is transparent,
  so the previous screen remains visible behind. Use for confirmations,
  pickers, tooltips, contextual menus.
- **formSheet** — iOS-style sheet that doesn't cover the full screen; the
  previous screen is visible at the top edge. Supports detents (medium /
  large) so the sheet can snap to partial heights and be dragged between them.
  Use for secondary tasks, quick edits, filters, share flows.
- **fullScreenModal** — modal that takes the whole screen with no peek of the
  previous screen. Use when the modal needs to feel like a full takeover
  (onboarding, video player, focus mode).
- **containedModal** / **containedTransparentModal** — modal that respects the
  current navigator's bounds rather than the whole screen. Rare; use only
  when a nested navigator needs to present within its own region.

### When designing or prototyping

1. **Declare the presentation** in the screen's frame/title (e.g.
   "Add Habit — formSheet, medium detent"). Don't leave it implicit.
2. **Match the motion** to the mode:
   - card → horizontal slide
   - modal / fullScreenModal → vertical slide-up
   - transparentModal → fade or scale, background dimmed
   - formSheet → slide-up with detent snap; dim background only above the
     sheet, show grabber handle at the top
3. **Show the underlying screen** for modal, transparentModal, and formSheet —
   the previous screen should be visible (dimmed for modal/transparentModal,
   peeking at top for formSheet). Don't render them as fully isolated.
4. **Dismissal affordances** must match:
   - card → back chevron / swipe from edge
   - modal / fullScreenModal → "Cancel" or "Done" in the leading/trailing
     header slot, swipe-down on iOS
   - transparentModal → tap outside to dismiss, plus an explicit close
   - formSheet → grabber handle, swipe down, or explicit close
5. **Status bar and safe areas**: card and fullScreenModal own the full safe
   area; modal/formSheet leave the system status bar on the underlying
   screen.
6. **Stacking**: a modal can present another modal. Show this clearly when
   prototyping — don't collapse stacked modals into a single screen.

### Tweaks

When the screen could plausibly use more than one presentation mode, expose it
as a Tweak (e.g. `presentation: 'modal' | 'formSheet' | 'fullScreenModal'`)
so the choice can be explored side by side.

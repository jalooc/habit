// tokens.jsx — Theme / density / tone / ring config for Orbit + Ink.
// All artboards on the canvas read from a single TokenCtx that the
// Tweaks panel updates. Editing tokens here flows through every artboard.

const PALETTES = {
  bone: {
    name: 'Light · Bone',
    bg: '#f5f1ec', card: '#ffffff', ink: '#1a1814',
    inkSoft: '#7a766e', inkFaint: '#b5b0a6',
    accent: '#c96442', accentDim: '#e7dccf', accentSoft: '#f4dccf',
    rule: 'rgba(26,24,20,0.10)',
    shadow: '0 1px 2px rgba(26,24,20,0.04), 0 8px 32px rgba(26,24,20,0.08)',
    statusDark: false,
  },
  evening: {
    name: 'Dark · Evening',
    bg: '#1c1d20', card: '#252629', ink: '#ece8e2',
    inkSoft: '#9a958c', inkFaint: '#5d594f',
    accent: '#e3a37a', accentDim: '#3a342d', accentSoft: '#2b2723',
    rule: 'rgba(236,232,226,0.10)',
    shadow: '0 1px 2px rgba(0,0,0,0.25), 0 12px 36px rgba(0,0,0,0.4)',
    statusDark: true,
  },
};

const DENSITIES = {
  compact: { name: 'Compact', heroPad: '20px 14px 18px', cardPad: 12, screenPad: 18, gap: 8,  ringBoxPad: '18px 12px 14px' },
  cozy:    { name: 'Cozy',    heroPad: '28px 16px 22px', cardPad: 16, screenPad: 22, gap: 12, ringBoxPad: '24px 14px 20px' },
  roomy:   { name: 'Roomy',   heroPad: '34px 20px 28px', cardPad: 20, screenPad: 26, gap: 16, ringBoxPad: '32px 18px 26px' },
};

const TONES = {
  literary: {
    name: 'Literary',
    skipExplain: 'The habit cycles to the back of the ring, untouched.',
    markDone: 'Mark done', logged: 'Logged ✓',
    upNext: 'Up next', theQueue: 'The queue',
    create: 'Create rotation', newRotation: 'New rotation',
    cycleSub: 'A group cycles through its habits',
    skip: 'Skip this turn',
    pausedDescription: 'On hold. The ring waits.',
    emptyHero: 'Nothing in orbit yet.',
    emptyBody: 'A rotation is a small set of related habits that take turns. Make one to begin.',
    emptyCta: 'Make your first rotation',
    rotationsTitle: 'Rotations', todayLabel: 'Today',
    nothingDue: 'A quiet moment — nothing in rotation.',
    nothingDueSub: 'Your due rotations are all squared away. The next ping comes when it\u2019s time.',
    undo: 'Undo', undone: 'Undone',
    reorderHint: 'Hold and drag to reorder',
    reminder: 'Reminder', activeHours: 'Active hours',
  },
  functional: {
    name: 'Functional',
    skipExplain: 'Skips this turn. Habit moves to end of queue.',
    markDone: 'Mark done', logged: 'Done',
    upNext: 'Next', theQueue: 'Queue',
    create: 'Create group', newRotation: 'New group',
    cycleSub: 'Group of habits that rotate',
    skip: 'Skip',
    pausedDescription: 'Paused — no reminders.',
    emptyHero: 'No groups yet.',
    emptyBody: 'Create a group of habits that rotate through a cadence.',
    emptyCta: 'New group',
    rotationsTitle: 'Groups', todayLabel: 'Today',
    nothingDue: 'Nothing due right now.',
    nothingDueSub: 'All caught up.',
    undo: 'Undo', undone: 'Undone',
    reorderHint: 'Drag to reorder',
    reminder: 'Reminder', activeHours: 'Active hours',
  },
};

const RING_SIZES = {
  small:   { hero: 216, mini: 56, miniSmall: 48, font: 19 },
  default: { hero: 244, mini: 72, miniSmall: 56, font: 21 },
  large:   { hero: 276, mini: 88, miniSmall: 64, font: 24 },
};

// ────────────────────────────────────────────────────────────────────
// Tweak defaults — host parses this JSON block on disk to persist edits.
// Keep it valid JSON.
// ────────────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "density": "cozy",
  "tone": "literary",
  "ringSize": "default",
  "imgAdd": "formSheet",
  "thumbShape": "rounded",
  "heroStrip": true,
  "showTweaks": true
}/*EDITMODE-END*/;

const TokenCtx = React.createContext(null);

function TokenProvider({ tweaks, children }) {
  const palette = tweaks.dark ? 'evening' : 'bone';
  const value = React.useMemo(() => ({
    t: PALETTES[palette],
    paletteId: palette,
    dark: !!tweaks.dark,
    d: DENSITIES[tweaks.density] || DENSITIES.cozy,
    densityId: tweaks.density || 'cozy',
    tone: TONES[tweaks.tone] || TONES.literary,
    toneId: tweaks.tone || 'literary',
    ring: RING_SIZES[tweaks.ringSize] || RING_SIZES.default,
    ringId: tweaks.ringSize || 'default',
    imgAdd: tweaks.imgAdd || 'formSheet',
    thumbShape: tweaks.thumbShape || 'rounded',
    heroStrip: tweaks.heroStrip !== false,
    activeHours: tweaks.activeHours || '8:00 – 22:00',
  }), [palette, tweaks.dark, tweaks.density, tweaks.tone, tweaks.ringSize, tweaks.imgAdd, tweaks.thumbShape, tweaks.heroStrip, tweaks.activeHours]);
  return <TokenCtx.Provider value={value}>{children}</TokenCtx.Provider>;
}

function useTokens() { return React.useContext(TokenCtx); }

// Local-only token override (lets one artboard pin its own palette without
// affecting the global Tweaks state — used by the Visual Variants section).
function TokenOverride({ palette, children }) {
  const parent = React.useContext(TokenCtx);
  const value = React.useMemo(() => ({
    ...parent,
    t: PALETTES[palette] || parent.t,
    paletteId: palette,
  }), [parent, palette]);
  return <TokenCtx.Provider value={value}>{children}</TokenCtx.Provider>;
}

const SERIF = '"Fraunces", Georgia, serif';
const SANS = '"Inter", system-ui, -apple-system, sans-serif';

Object.assign(window, {
  PALETTES, DENSITIES, TONES, RING_SIZES, TWEAK_DEFAULTS,
  TokenProvider, TokenOverride, TokenCtx, useTokens,
  SERIF, SANS,
});

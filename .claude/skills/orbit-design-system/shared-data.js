// Shared mock data + utilities for all variations.
// Plain JS — attached to window so each Babel-transpiled variation can read it.

const SAMPLE_GROUPS = [
  {
    id: 'core',
    name: 'Core',
    cadence: { kind: 'daily', label: 'Once a day' },
    habits: [
      { id: 'h1', name: 'Front plank, 60s', images: [
        { id: 'h1a', src: 'assets/img/ref-2.png' },
        { id: 'h1b', src: 'assets/img/ref-3.png' },
      ] },
      { id: 'h2', name: 'Dead bug, 12 reps' },
      { id: 'h3', name: 'Hollow hold, 45s', images: [
        { id: 'h3a', src: 'assets/img/ref-1.png' },
        { id: 'h3b', src: 'assets/img/ref-4.png' },
        { id: 'h3c', src: 'assets/img/ref-5.png' },
        { id: 'h3d', src: 'assets/img/ref-9.png' },
      ], note: "Ribs **down**, lower back pressed to the floor. Tension across the **whole** chain, not just the abs.\n- 30s on, 30s off\n- 4 rounds\n- see [form cues](https://example.com/hollow-hold)",
        whisper: 'Slow the eccentric — felt the lower back last time.' },
      { id: 'h4', name: 'Bird dog, 10/side',
        whisper: 'Do 11 next time — last set was easy on the second half.' },
      { id: 'h5', name: 'Glute bridge, 15 reps', images: [
        { id: 'h5a', src: 'assets/img/ref-7.png' },
        { id: 'h5b', src: 'assets/img/ref-8.png' },
      ] },
    ],
    cursor: 2, // 0-indexed: whose turn is next
    paused: false,
    lastDone: 'Yesterday · Dead bug',
  },
  {
    id: 'mobility',
    name: 'Mobility',
    cadence: { kind: 'daily', label: 'Once a day' },
    habits: [
      { id: 'm1', name: 'Hip flexor stretch', images: [
        { id: 'm1a', src: 'assets/img/ref-6.png' },
      ] },
      { id: 'm2', name: 'Thoracic rotation' },
      { id: 'm3', name: 'Hamstring scoop' },
      { id: 'm4', name: 'Ankle dorsiflexion', images: [
        { id: 'm4a', src: 'assets/img/ref-3.png' },
      ] },
      { id: 'm5', name: '90/90 hip switch' },
    ],
    cursor: 0,
    paused: false,
    lastDone: '2 days ago · 90/90 hip switch',
  },
  {
    id: 'study',
    name: 'Languages',
    cadence: { kind: 'weekdays', label: 'Weekdays' },
    habits: [
      { id: 's1', name: 'Spanish — 15 min' },
      { id: 's2', name: 'French — 15 min' },
      { id: 's3', name: 'Italian — 15 min' },
    ],
    cursor: 1,
    paused: false,
    lastDone: 'Yesterday · Spanish',
  },
  {
    id: 'clean',
    name: 'House',
    cadence: { kind: 'weekly', label: '2× per week' },
    habits: [
      { id: 'c1', name: 'Kitchen deep clean' },
      { id: 'c2', name: 'Bathroom' },
      { id: 'c3', name: 'Floors' },
      { id: 'c4', name: 'Windows & mirrors' },
    ],
    cursor: 3,
    paused: false,
    lastDone: '4 days ago · Floors',
  },
  {
    id: 'call',
    name: 'Calls',
    cadence: { kind: 'weekly', label: 'Once a week' },
    habits: [
      { id: 'p1', name: 'Mom' },
      { id: 'p2', name: 'Dad', note: "# Last call: 12 May\nHe mentioned the new flat in Wrocław. Ask how the **move** went and whether the cat settled in.\n- Anniversary of his birthday approaching — be gentle.\n- Send him the [photo](https://example.com/lake) from the lake.\n- He's been into woodworking again." },
      { id: 'p3', name: 'Sister' },
      { id: 'p4', name: 'Grandma' },
    ],
    cursor: 1,
    paused: true,
    lastDone: '12 days ago · Mom',
  },
  {
    id: 'guitar',
    name: 'Guitar',
    cadence: { kind: 'everyN', label: 'Every 2 days' },
    habits: [
      { id: 'g1', name: 'Chromatic warm-up' },
      { id: 'g2', name: 'Bar-chord drills' },
      { id: 'g3', name: 'Fingerpicking pattern' },
      { id: 'g4', name: 'Learn a riff', images: [
        { id: 'g4a', src: 'assets/img/ref-8.png' },
      ] },
    ],
    cursor: 2,
    paused: false,
    lastDone: '2 days ago · Bar-chord drills',
  },
];

// Get the habit currently up in a group.
function upNext(group) {
  return group.habits[group.cursor % group.habits.length];
}

// Advance the rotation: current item is done → cursor moves forward.
function tickOff(group) {
  return { ...group, cursor: (group.cursor + 1) % group.habits.length };
}

// Skip current → cursor advances anyway; the skipped habit was never done.
function skipTurn(group) {
  return { ...group, cursor: (group.cursor + 1) % group.habits.length };
}

// Out-of-order completion: chosen habit is moved to "just-done" position
// (i.e. it goes to the end of the upcoming queue), cursor stays where the
// previous up-next was so the original order resumes.
function tickOutOfOrder(group, habitId) {
  const habits = group.habits.slice();
  const idx = habits.findIndex((h) => h.id === habitId);
  if (idx === -1) return group;
  // Build the new ordered queue: keep everything except picked, then append picked.
  const [picked] = habits.splice(idx, 1);
  habits.push(picked);
  // If picked was before cursor, cursor shifts back by 1 (because array shrank).
  let cursor = group.cursor;
  if (idx < cursor) cursor -= 1;
  return { ...group, habits, cursor };
}

// Return queue ordered starting at cursor.
function queueOrder(group) {
  const n = group.habits.length;
  return Array.from({ length: n }, (_, i) => group.habits[(group.cursor + i) % n]);
}

window.SAMPLE_GROUPS = SAMPLE_GROUPS;
window.upNext = upNext;
window.tickOff = tickOff;
window.skipTurn = skipTurn;
window.tickOutOfOrder = tickOutOfOrder;
window.queueOrder = queueOrder;

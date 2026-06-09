// today-list.jsx — Variant 1 hero section: two stacked cards (Carried over /
// Up next) with swipe gestures. Replaces the ring-as-hero on the Today screen.
// Right-swipe ticks the row off; left-swipe postpones it.

const { useState: useTL, useEffect: useTLE, useMemo: useTLM } = React;

// ─── Demo data ────────────────────────────────────────────────────────
// Which due groups are currently "carried over" (a previous slot was missed)
// and how long ago. In real life this would live on the group itself; for
// the design we mock-mark a couple of due groups so both list sections
// have content.
const TL_CARRIED_INITIAL = {
  core:  { since: '2h',  missedLabel: 'this morning' },
  study: { since: '8m',  missedLabel: '8 min ago' },
};

// What time of day each upcoming group is scheduled, shown as a tiny tag.
const TL_UPCOMING_AT = {
  mobility: 'now',
  guitar:   '5p',
  clean:    'eve',
};

// Pick the relative-time tag for an upcoming group; falls back to the
// cadence label if we don't have a slot. Always uppercase-short.
function tlUpcomingTag(g) {
  return TL_UPCOMING_AT[g.id] || g.cadence.label.split(' ')[0].toLowerCase();
}

// ─── Status dot in the row gutter ─────────────────────────────────────
function StatusDot({ kind }) {
  const { t } = useTokens();
  const base = {
    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
    border: `1.5px solid ${t.accentDim}`, background: 'transparent',
  };
  if (kind === 'past') {
    return <span style={{ ...base, background: t.accent, borderColor: t.accent }} />;
  }
  if (kind === 'now') {
    return <span style={{
      ...base, background: t.accent, borderColor: t.accent,
      boxShadow: `0 0 0 4px rgba(201,100,66,0.18)`,
    }} />;
  }
  return <span style={base} />;
}

// ─── One row ──────────────────────────────────────────────────────────
function TodayRow({ group, when, kind, isFirst, onTick, onPostpone }) {
  const { t, tone } = useTokens();
  const habit = upNext(group);
  const isPast = kind === 'past';

  return (
    <Swipeable
      direction="both"
      threshold={0.32}
      rightBackground={{ color: t.accent, fg: '#fff', icon: '✓', label: tone.logged }}
      leftBackground={{ color: '#1a1814', fg: '#fff', icon: '⌛', label: 'Postpone' }}
      onTrigger={(dir) => {
        if (dir === 'right') onTick();
        else onPostpone();
      }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        background: isPast ? t.accentSoft : t.card,
        borderTop: isFirst
          ? 'none'
          : `1px solid ${isPast ? 'rgba(201,100,66,0.18)' : t.rule}`,
      }}>
        <StatusDot kind={kind} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            font: `600 10px/1 ${SANS}`, letterSpacing: 1.4,
            color: t.accent, textTransform: 'uppercase', marginBottom: 5,
          }}>{group.name}</div>
          <div style={{
            font: `400 16px/1.2 ${SERIF}`, color: t.ink, letterSpacing: -0.1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{habit.name}</div>
        </div>
        <div style={{
          font: `500 10px/1 ${SANS}`,
          color: isPast ? t.accent : t.inkFaint,
          letterSpacing: 1.2, textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>{when}</div>
      </div>
    </Swipeable>
  );
}

// ─── Section label (Carried over · 2 ··· oldest 2h ago) ───────────────
function TodaySectionLabel({ label, count, kind, since }) {
  const { t, d } = useTokens();
  const past = kind === 'past';
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 10,
      padding: `6px 6px 10px`,
    }}>
      <span style={{
        font: `500 10px/1 ${SANS}`, letterSpacing: 1.8,
        color: past ? t.accent : t.inkSoft, textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{
        background: past ? t.accent : t.accentSoft,
        color: past ? '#fff' : t.accent,
        padding: '3px 7px', borderRadius: 100,
        font: `500 10px/1 ${SANS}`, letterSpacing: 0.4,
      }}>{count}</span>
      <span style={{ flex: 1 }} />
      <span style={{
        font: `400 11px/1 ${SERIF}`, fontStyle: 'italic',
        color: t.inkFaint,
      }}>{since}</span>
    </div>
  );
}

// ─── The hero list (replaces the ring + slide-to-confirm) ─────────────
function TodayList({ groups, setGroups, onAction }) {
  const { t, d } = useTokens();
  const dueKinds = new Set(['daily', 'weekdays', 'everyN']);
  const visible = groups.filter((g) => !g.paused && dueKinds.has(g.cadence.kind));

  // Carry-over state is local to the screen — when the user ticks or
  // postpones a carried item, it leaves the carried section.
  const [carried, setCarried] = useTL(TL_CARRIED_INITIAL);

  const past = visible.filter((g) => carried[g.id]);
  const upcoming = visible.filter((g) => !carried[g.id]);

  const removeCarry = (id) => setCarried((c) => {
    if (!c[id]) return c;
    const next = { ...c }; delete next[id]; return next;
  });

  const tick = (g) => {
    onAction?.({ kind: 'tick', group: g, wasCarried: !!carried[g.id] });
    setGroups((all) => all.map((x) => x.id === g.id ? tickOff(x) : x));
    removeCarry(g.id);
  };
  // For demo: postpone just removes the carry-over (or pushes upcoming to end).
  // In a real build it would push the slot to a later time.
  const postpone = (g) => {
    onAction?.({ kind: 'postpone', group: g });
    removeCarry(g.id);
  };

  return (
    <div style={{ padding: `4px ${d.screenPad - 6}px 16px` }}>
      {past.length > 0 && (
        <>
          <TodaySectionLabel
            label="Carried over" count={past.length} kind="past"
            since={`oldest ${past.map(g => carried[g.id].since)[0]} ago`} />
          <div style={{
            background: t.accentSoft, borderRadius: 18, overflow: 'hidden',
            marginBottom: 12,
          }}>
            {past.map((g, i) => (
              <TodayRow key={g.id} group={g} when={carried[g.id].since}
                kind="past" isFirst={i === 0}
                onTick={() => tick(g)}
                onPostpone={() => postpone(g)} />
            ))}
          </div>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <TodaySectionLabel
            label="Up next" count={upcoming.length} kind="upcoming"
            since="today" />
          <div style={{
            background: t.card, borderRadius: 18, overflow: 'hidden',
            boxShadow: t.shadow,
          }}>
            {upcoming.map((g, i) => {
              const kind = i === 0 ? 'now' : 'upcoming';
              return (
                <TodayRow key={g.id} group={g} when={tlUpcomingTag(g)}
                  kind={kind} isFirst={i === 0}
                  onTick={() => tick(g)}
                  onPostpone={() => postpone(g)} />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { TodayList, TodayRow, TodaySectionLabel, StatusDot });

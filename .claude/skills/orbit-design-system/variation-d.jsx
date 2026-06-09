// Variation D — Orbit + Ink
// Same mechanics as Orbit (ring of dots, rotation on tick) — but in Stack's bone/ink/coral palette.

const { useState: useStateD, useEffect: useEffectD, useRef: useRefD } = React;

const orbitInkTokens = {
  bg: '#f5f1ec',
  card: '#ffffff',
  ink: '#1a1814',
  inkSoft: '#7a766e',
  inkFaint: '#b5b0a6',
  accent: '#c96442',
  accentDim: '#e7dccf',
  accentSoft: '#f4dccf',
  rule: 'rgba(26,24,20,0.10)',
  shadow: '0 1px 2px rgba(26,24,20,0.04), 0 8px 32px rgba(26,24,20,0.08)',
  serif: '"Fraunces", Georgia, serif',
  sans: '"Inter", system-ui, -apple-system, sans-serif',
};

// ─────────────────────────────────────────────────────────────
// Ring — animated rotation visualization
// up-next is at the top (12 o'clock). After tick, ring rotates one step.
// ─────────────────────────────────────────────────────────────
function OrbitInkRing({ group, size = 240, rotating }) {
  const n = group.habits.length;
  const step = 360 / n;
  const radius = (size - 36) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // The "current" dot sits at top in screen space, so rotate the whole group
  // by (-cursor * step). When ticking, we play one additional -step rotation,
  // and onTick is fired at the end.
  const baseRot = -group.cursor * step;
  const rot = rotating ? baseRot - step : baseRot;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        {/* outer ring */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={orbitInkTokens.accentDim} strokeWidth="1" />
        <g style={{ transition: rotating ? 'transform .55s cubic-bezier(.55,.06,.3,1)' : 'transform .4s ease', transformOrigin: `${cx}px ${cy}px` }}
          transform={`rotate(${rot})`}>
          {group.habits.map((h, i) => {
            const angle = (i / n) * 360 - 90; // start at top
            const rad = (angle * Math.PI) / 180;
            const x = cx + radius * Math.cos(rad);
            const y = cy + radius * Math.sin(rad);
            const isNow = i === group.cursor;
            // counter-rotate the label so it remains upright
            return (
              <g key={h.id} transform={`translate(${x}, ${y}) rotate(${-rot})`}>
                <circle r={isNow ? 12 : 5}
                  fill={isNow ? orbitInkTokens.accent : orbitInkTokens.card}
                  stroke={isNow ? orbitInkTokens.accent : orbitInkTokens.accentDim}
                  strokeWidth={isNow ? 0 : 1.5} />
                {isNow && (
                  <circle r="4" fill={orbitInkTokens.card} />
                )}
              </g>
            );
          })}
        </g>
      </svg>
      {/* center label */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          font: `500 10px/1 ${orbitInkTokens.sans}`, letterSpacing: 2,
          color: orbitInkTokens.inkFaint, textTransform: 'uppercase', marginBottom: 10,
        }}>UP NEXT · {group.cursor + 1}/{n}</div>
        <div style={{
          font: `400 21px/1.2 ${orbitInkTokens.serif}`, color: orbitInkTokens.ink,
          letterSpacing: -0.2, textWrap: 'pretty', maxWidth: size - 100,
        }}>{upNext(group).name}</div>
        {group.paused && (
          <div style={{ marginTop: 10, font: `500 10px/1 ${orbitInkTokens.sans}`, letterSpacing: 1.5, color: orbitInkTokens.inkFaint, textTransform: 'uppercase' }}>Paused</div>
        )}
      </div>
    </div>
  );
}

// Mini ring for list views
function OrbitInkMini({ group, size = 64 }) {
  const n = group.habits.length;
  const radius = (size - 14) / 2;
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={orbitInkTokens.accentDim} strokeWidth="1" />
      {group.habits.map((h, i) => {
        const angle = (i / n) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const x = cx + radius * Math.cos(rad);
        const y = cy + radius * Math.sin(rad);
        const isNow = i === group.cursor;
        return (
          <circle key={h.id} cx={x} cy={y} r={isNow ? 4 : 2}
            fill={isNow ? orbitInkTokens.accent : orbitInkTokens.accentDim} />
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Screens
// ─────────────────────────────────────────────────────────────
function OIHead({ title, kicker, onBack, action }) {
  return (
    <div style={{ padding: '12px 22px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 24, marginBottom: 14 }}>
        {onBack && (
          <button onClick={onBack} style={{
            border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
            color: orbitInkTokens.inkSoft, font: `500 14px ${orbitInkTokens.sans}`,
          }}>← Back</button>
        )}
        <span style={{ flex: 1 }} />
        {action}
      </div>
      {kicker && (
        <div style={{
          font: `500 11px/1 ${orbitInkTokens.sans}`, letterSpacing: 1.8,
          color: orbitInkTokens.inkSoft, textTransform: 'uppercase', marginBottom: 8,
        }}>{kicker}</div>
      )}
      <div style={{
        font: `400 32px/1.1 ${orbitInkTokens.serif}`, color: orbitInkTokens.ink,
        letterSpacing: -0.4, textWrap: 'pretty',
      }}>{title}</div>
    </div>
  );
}

function OIHomeScreen({ groups, setGroups, go }) {
  const visible = groups.filter((g) => !g.paused);
  const due = visible.filter((g) => ['daily', 'weekdays', 'everyN'].includes(g.cadence.kind));
  const [rotating, setRotating] = useStateD(null);

  const tick = (g) => {
    if (rotating) return;
    setRotating(g.id);
    setTimeout(() => {
      setGroups((all) => all.map((x) => x.id === g.id ? tickOff(x) : x));
      setRotating(null);
    }, 600);
  };

  const [idx, setIdx] = useStateD(0);
  const active = due[idx];

  return (
    <div style={{ background: orbitInkTokens.bg, color: orbitInkTokens.ink, minHeight: '100%' }}>
      <OIHead kicker="Thursday, May 15" title={`Today · ${due.length} groups`} />

      {active && (
        <div style={{ padding: '8px 22px 24px' }}>
          <div style={{
            background: orbitInkTokens.card, borderRadius: 28, padding: '28px 20px 24px',
            boxShadow: orbitInkTokens.shadow, display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{
              font: `500 11px/1 ${orbitInkTokens.sans}`, letterSpacing: 1.8,
              color: orbitInkTokens.accent, textTransform: 'uppercase', marginBottom: 18,
            }}>{active.name}</div>
            <OrbitInkRing group={active} size={244} rotating={rotating === active.id} />
            {!active.paused && (
              <button onClick={() => tick(active)} disabled={rotating === active.id} style={{
                marginTop: 22, border: 'none',
                background: orbitInkTokens.ink, color: orbitInkTokens.card,
                padding: '13px 32px', borderRadius: 100, cursor: rotating === active.id ? 'default' : 'pointer',
                font: `500 12px/1 ${orbitInkTokens.sans}`, letterSpacing: 1.5, textTransform: 'uppercase',
                opacity: rotating === active.id ? 0.6 : 1, transition: 'opacity .2s',
              }}>{rotating === active.id ? 'Logged ✓' : 'Mark done'}</button>
            )}
          </div>

          {/* pager */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
            {due.map((g, i) => (
              <button key={g.id} onClick={() => setIdx(i)} style={{
                border: 'none', padding: 0, cursor: 'pointer',
                width: i === idx ? 18 : 6, height: 6, borderRadius: 3,
                background: i === idx ? orbitInkTokens.accent : orbitInkTokens.accentDim,
                transition: 'width .2s, background .2s',
              }} />
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '4px 22px 32px' }}>
        <div style={{
          font: `500 11px/1 ${orbitInkTokens.sans}`, letterSpacing: 1.8,
          color: orbitInkTokens.inkSoft, textTransform: 'uppercase', marginBottom: 14,
        }}>Other rotations</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.filter((g) => !due.includes(g)).map((g) => (
            <div key={g.id} onClick={() => go({ name: 'group', id: g.id })}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: 14,
                background: orbitInkTokens.card, borderRadius: 18, cursor: 'pointer',
              }}>
              <OrbitInkMini group={g} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: `400 17px/1.2 ${orbitInkTokens.serif}`, color: orbitInkTokens.ink }}>{g.name}</div>
                <div style={{ font: `400 13px/1.3 ${orbitInkTokens.sans}`, color: orbitInkTokens.inkSoft, marginTop: 3 }}>
                  Up next · {upNext(g).name}
                </div>
              </div>
              <div style={{ font: `500 10px ${orbitInkTokens.sans}`, color: orbitInkTokens.inkFaint, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'right' }}>{g.cadence.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OIGroupsScreen({ groups, go }) {
  return (
    <div style={{ background: orbitInkTokens.bg, color: orbitInkTokens.ink, minHeight: '100%' }}>
      <OIHead title="Rotations" kicker={`${groups.length} groups`} action={
        <button onClick={() => go({ name: 'create' })} style={{
          border: 'none', background: orbitInkTokens.ink, color: orbitInkTokens.card,
          padding: '8px 16px', borderRadius: 100, cursor: 'pointer',
          font: `500 12px/1 ${orbitInkTokens.sans}`, letterSpacing: 0.5,
        }}>+ New</button>
      } />
      <div style={{ padding: '4px 22px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map((g) => (
          <div key={g.id} onClick={() => go({ name: 'group', id: g.id })}
            style={{
              background: g.paused ? orbitInkTokens.accentSoft : orbitInkTokens.card,
              borderRadius: 22, padding: 18, cursor: 'pointer',
              boxShadow: g.paused ? 'none' : orbitInkTokens.shadow,
              opacity: g.paused ? 0.7 : 1,
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <OrbitInkMini group={g} size={72} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ font: `400 22px/1.1 ${orbitInkTokens.serif}`, color: orbitInkTokens.ink, letterSpacing: -0.3 }}>{g.name}</div>
                  {g.paused && <div style={{ font: `500 9px/1 ${orbitInkTokens.sans}`, letterSpacing: 1.5, color: orbitInkTokens.inkFaint, textTransform: 'uppercase' }}>PAUSED</div>}
                </div>
                <div style={{ font: `400 13px/1.3 ${orbitInkTokens.sans}`, color: orbitInkTokens.inkSoft, marginTop: 4 }}>
                  {g.cadence.label} · {g.habits.length} habits
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                  <div style={{ font: `500 10px/1 ${orbitInkTokens.sans}`, color: orbitInkTokens.inkFaint, letterSpacing: 1.5, textTransform: 'uppercase' }}>Next</div>
                  <div style={{ font: `400 14px/1.3 ${orbitInkTokens.serif}`, color: orbitInkTokens.ink }}>{upNext(g).name}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OIGroupScreen({ group, setGroups, go, back }) {
  const [rotating, setRotating] = useStateD(false);
  const [menuFor, setMenuFor] = useStateD(null);

  if (!group) return null;
  const queue = queueOrder(group);

  const tick = () => {
    if (rotating || group.paused) return;
    setRotating(true);
    setTimeout(() => {
      setGroups((all) => all.map((x) => x.id === group.id ? tickOff(x) : x));
      setRotating(false);
    }, 600);
  };
  const tickAt = (habitId) => {
    setGroups((all) => all.map((x) => x.id === group.id ? tickOutOfOrder(x, habitId) : x));
    setMenuFor(null);
  };
  const skip = () => setGroups((all) => all.map((x) => x.id === group.id ? skipTurn(x) : x));
  const pause = () => setGroups((all) => all.map((x) => x.id === group.id ? { ...x, paused: !x.paused } : x));

  return (
    <div style={{ background: orbitInkTokens.bg, color: orbitInkTokens.ink, minHeight: '100%' }}>
      <OIHead onBack={back} kicker={`${group.cadence.label} · ${group.habits.length} habits`} title={group.name}
        action={
          <button onClick={pause} style={{
            border: `1px solid ${orbitInkTokens.accentDim}`, background: orbitInkTokens.card,
            padding: '6px 14px', borderRadius: 100, cursor: 'pointer',
            font: `500 12px/1 ${orbitInkTokens.sans}`, color: orbitInkTokens.inkSoft,
          }}>{group.paused ? 'Resume' : 'Pause'}</button>
        } />

      <div style={{ padding: '4px 22px 18px' }}>
        <div style={{
          background: orbitInkTokens.card, borderRadius: 28, padding: '28px 16px 24px',
          boxShadow: orbitInkTokens.shadow, display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <OrbitInkRing group={group} size={250} rotating={rotating} />
          {!group.paused && (
            <button onClick={tick} disabled={rotating} style={{
              marginTop: 22, border: 'none',
              background: orbitInkTokens.ink, color: orbitInkTokens.card,
              padding: '13px 32px', borderRadius: 100, cursor: rotating ? 'default' : 'pointer',
              font: `500 12px/1 ${orbitInkTokens.sans}`, letterSpacing: 1.5, textTransform: 'uppercase',
              opacity: rotating ? 0.6 : 1, transition: 'opacity .2s',
            }}>{rotating ? 'Logged ✓' : 'Mark done'}</button>
          )}
        </div>
      </div>

      <div style={{ padding: '8px 22px' }}>
        <div style={{
          font: `500 11px/1 ${orbitInkTokens.sans}`, letterSpacing: 1.8,
          color: orbitInkTokens.inkSoft, textTransform: 'uppercase', marginBottom: 12,
        }}>The queue</div>
      </div>
      <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 1, background: orbitInkTokens.card, margin: '0 16px', borderRadius: 18, overflow: 'hidden' }}>
        {queue.map((h, i) => (
          <div key={h.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
            background: orbitInkTokens.card,
            borderTop: i ? `1px solid ${orbitInkTokens.rule}` : 'none',
          }}
            onClick={() => i > 0 && setMenuFor(menuFor === h.id ? null : h.id)}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: i === 0 ? orbitInkTokens.accent : 'transparent',
              border: i === 0 ? 'none' : `1.5px solid ${orbitInkTokens.accentDim}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: `500 11px/1 ${orbitInkTokens.sans}`, color: i === 0 ? orbitInkTokens.card : orbitInkTokens.inkFaint,
              flexShrink: 0,
            }}>{i === 0 ? '✓' : i + 1}</div>
            <div style={{ flex: 1, font: `400 16px/1.3 ${orbitInkTokens.serif}`, color: i === 0 ? orbitInkTokens.ink : orbitInkTokens.inkSoft }}>{h.name}</div>
            {menuFor === h.id && (
              <button onClick={(e) => { e.stopPropagation(); tickAt(h.id); }} style={{
                border: 'none', background: orbitInkTokens.ink, color: orbitInkTokens.card,
                padding: '6px 12px', borderRadius: 100, cursor: 'pointer',
                font: `500 11px/1 ${orbitInkTokens.sans}`,
              }}>Do this one</button>
            )}
            {i === 0 && (
              <div style={{ font: `500 10px/1 ${orbitInkTokens.sans}`, color: orbitInkTokens.accent, letterSpacing: 1, textTransform: 'uppercase' }}>NOW</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: '22px 22px 32px' }}>
        <button onClick={skip} style={{
          width: '100%', border: `1px solid ${orbitInkTokens.accentDim}`, background: 'transparent',
          padding: '12px', borderRadius: 100, cursor: 'pointer',
          font: `500 13px/1 ${orbitInkTokens.sans}`, color: orbitInkTokens.inkSoft,
        }}>Skip this turn</button>
        <div style={{
          marginTop: 10, font: `400 12px/1.5 ${orbitInkTokens.sans}`,
          color: orbitInkTokens.inkFaint, textAlign: 'center',
        }}>The habit cycles to the back of the ring, untouched.</div>
        <div style={{ marginTop: 22 }}>
          <div style={{ font: `500 11px/1 ${orbitInkTokens.sans}`, letterSpacing: 1.5, color: orbitInkTokens.inkSoft, textTransform: 'uppercase', marginBottom: 6 }}>Last logged</div>
          <div style={{ font: `400 14px/1.4 ${orbitInkTokens.serif}`, color: orbitInkTokens.inkSoft }}>{group.lastDone}</div>
        </div>
      </div>
    </div>
  );
}

function OICreateScreen({ back, setGroups }) {
  const [name, setName] = useStateD('');
  const [cadence, setCadence] = useStateD('daily');
  const [habits, setHabits] = useStateD(['', '', '']);
  const [reminders, setReminders] = useStateD(true);
  const [reminderTime, setReminderTime] = useStateD('08:00');

  const cadenceOpts = [
    { id: 'daily', label: 'Once a day' },
    { id: 'multi', label: 'Multiple per day' },
    { id: 'weekdays', label: 'Weekdays' },
    { id: 'xweek', label: '3× per week' },
    { id: 'everyN', label: 'Every 2 days' },
  ];

  const cadObj = cadenceOpts.find((c) => c.id === cadence);
  const updateHabit = (i, v) => setHabits((arr) => arr.map((x, idx) => idx === i ? v : x));
  const addHabit = () => setHabits((arr) => [...arr, '']);
  const removeHabit = (i) => setHabits((arr) => arr.filter((_, idx) => idx !== i));
  const canCreate = name.trim() && habits.filter((h) => h.trim()).length >= 2;

  const create = () => {
    if (!canCreate) return;
    const clean = habits.filter((h) => h.trim()).map((h, i) => ({ id: `n${Date.now()}-${i}`, name: h.trim() }));
    setGroups((all) => [...all, {
      id: `g${Date.now()}`, name: name.trim(), cadence: cadObj,
      habits: clean, cursor: 0, paused: false, lastDone: '—',
    }]);
    back();
  };

  // Preview ring grows as you add habits
  const previewGroup = {
    id: 'preview', name: name || 'New group',
    cursor: 0, habits: habits.map((h, i) => ({ id: `p${i}`, name: h || 'habit ' + (i + 1) })),
    paused: false,
  };

  return (
    <div style={{ background: orbitInkTokens.bg, color: orbitInkTokens.ink, minHeight: '100%' }}>
      <OIHead onBack={back} title="New rotation" kicker="A group cycles through its habits" />

      <div style={{ padding: '6px 22px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: orbitInkTokens.card, borderRadius: 24, padding: '16px 16px 12px',
          boxShadow: orbitInkTokens.shadow,
        }}>
          <OrbitInkMini group={previewGroup} size={104} />
        </div>
      </div>

      <div style={{ padding: '8px 22px' }}>
        <div style={{ font: `500 11px/1 ${orbitInkTokens.sans}`, letterSpacing: 1.5, color: orbitInkTokens.inkSoft, textTransform: 'uppercase', marginBottom: 8 }}>Name</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Core, Mobility…"
          style={{
            width: '100%', border: 'none', background: orbitInkTokens.card,
            padding: '14px 16px', borderRadius: 14,
            font: `400 18px ${orbitInkTokens.serif}`, color: orbitInkTokens.ink, outline: 'none',
          }} />
      </div>

      <div style={{ padding: '14px 22px' }}>
        <div style={{ font: `500 11px/1 ${orbitInkTokens.sans}`, letterSpacing: 1.5, color: orbitInkTokens.inkSoft, textTransform: 'uppercase', marginBottom: 10 }}>Cadence</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {cadenceOpts.map((c) => (
            <button key={c.id} onClick={() => setCadence(c.id)} style={{
              border: 'none', cursor: 'pointer',
              background: cadence === c.id ? orbitInkTokens.ink : orbitInkTokens.card,
              color: cadence === c.id ? orbitInkTokens.card : orbitInkTokens.inkSoft,
              padding: '10px 14px', borderRadius: 100,
              font: `500 13px/1 ${orbitInkTokens.sans}`,
            }}>{c.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ font: `500 11px/1 ${orbitInkTokens.sans}`, letterSpacing: 1.5, color: orbitInkTokens.inkSoft, textTransform: 'uppercase' }}>Habits in rotation</div>
          <div style={{ font: `400 12px/1 ${orbitInkTokens.sans}`, color: orbitInkTokens.inkFaint }}>{habits.filter((h) => h.trim()).length} added</div>
        </div>
        <div style={{ background: orbitInkTokens.card, borderRadius: 16, padding: 6 }}>
          {habits.map((h, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              borderBottom: i < habits.length - 1 ? `1px solid ${orbitInkTokens.rule}` : 'none',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: orbitInkTokens.accentSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: `500 11px ${orbitInkTokens.sans}`, color: orbitInkTokens.inkSoft,
              }}>{i + 1}</div>
              <input value={h} onChange={(e) => updateHabit(i, e.target.value)} placeholder="Habit name"
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', font: `400 15px ${orbitInkTokens.serif}`, color: orbitInkTokens.ink, padding: '6px 0' }} />
              {habits.length > 2 && (
                <button onClick={() => removeHabit(i)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: orbitInkTokens.inkFaint, fontSize: 18 }}>×</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addHabit} style={{
          marginTop: 10, border: 'none', background: 'transparent', cursor: 'pointer',
          font: `500 12px/1 ${orbitInkTokens.sans}`, color: orbitInkTokens.accent, padding: '6px 0',
        }}>+ Add habit</button>
      </div>

      {/* Reminder preview */}
      <div style={{ padding: '14px 22px' }}>
        <div style={{
          background: orbitInkTokens.card, borderRadius: 16, padding: 16,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: `500 12px/1.2 ${orbitInkTokens.sans}`, color: orbitInkTokens.ink }}>Daily reminder</div>
            <div style={{ font: `400 12px/1.3 ${orbitInkTokens.sans}`, color: orbitInkTokens.inkSoft, marginTop: 4 }}>“{name || 'New group'} · {habits.find((h) => h.trim()) || 'habit 1'}”</div>
          </div>
          <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)}
            style={{ border: `1px solid ${orbitInkTokens.accentDim}`, borderRadius: 8, padding: '6px 8px', background: 'transparent', font: `500 13px ${orbitInkTokens.sans}`, color: orbitInkTokens.ink }} />
          <button onClick={() => setReminders(!reminders)} style={{
            border: 'none', cursor: 'pointer',
            width: 40, height: 22, borderRadius: 100,
            background: reminders ? orbitInkTokens.accent : orbitInkTokens.accentDim,
            position: 'relative', transition: 'background .2s',
          }}>
            <div style={{
              position: 'absolute', top: 2, left: reminders ? 20 : 2,
              width: 18, height: 18, borderRadius: '50%', background: orbitInkTokens.card,
              transition: 'left .2s',
            }} />
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 22px 32px' }}>
        <button onClick={create} disabled={!canCreate} style={{
          width: '100%', border: 'none', borderRadius: 100,
          background: canCreate ? orbitInkTokens.ink : orbitInkTokens.accentDim,
          color: orbitInkTokens.card, padding: '15px',
          cursor: canCreate ? 'pointer' : 'not-allowed',
          font: `500 14px/1 ${orbitInkTokens.sans}`, letterSpacing: 0.5,
        }}>Create rotation</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shell
// ─────────────────────────────────────────────────────────────
function OrbitInkApp() {
  const [groups, setGroups] = useStateD(SAMPLE_GROUPS);
  const [stack, setStack] = useStateD([{ name: 'home' }]);
  const route = stack[stack.length - 1];
  const go = (r) => setStack((s) => [...s, r]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const setTab = (name) => setStack([{ name }]);

  let screen;
  if (route.name === 'home') screen = <OIHomeScreen groups={groups} setGroups={setGroups} go={go} />;
  else if (route.name === 'groups') screen = <OIGroupsScreen groups={groups} go={go} />;
  else if (route.name === 'group') screen = <OIGroupScreen group={groups.find((g) => g.id === route.id)} setGroups={setGroups} go={go} back={back} />;
  else if (route.name === 'create') screen = <OICreateScreen back={back} setGroups={setGroups} />;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: orbitInkTokens.bg }}>
      <div style={{
        height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', background: orbitInkTokens.bg, position: 'relative', flexShrink: 0,
      }}>
        <div style={{ font: `500 13px/1 ${orbitInkTokens.sans}`, color: orbitInkTokens.ink }}>9:30</div>
        <div style={{ position: 'absolute', left: '50%', top: 8, transform: 'translateX(-50%)', width: 24, height: 24, borderRadius: 100, background: '#2e2e2e' }} />
        <div style={{ font: `600 11px ${orbitInkTokens.sans}`, color: orbitInkTokens.accent, letterSpacing: 1.2 }}>◯ orbit</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>{screen}</div>

      <div style={{
        display: 'flex', padding: '8px 16px',
        background: orbitInkTokens.bg, gap: 8, flexShrink: 0,
      }}>
        {[
          { id: 'home', label: 'Today' },
          { id: 'groups', label: 'Rotations' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, border: 'none', cursor: 'pointer',
            background: route.name === t.id ? orbitInkTokens.card : 'transparent',
            color: route.name === t.id ? orbitInkTokens.ink : orbitInkTokens.inkSoft,
            padding: '12px 0', borderRadius: 100,
            font: `500 13px/1 ${orbitInkTokens.sans}`,
            boxShadow: route.name === t.id ? orbitInkTokens.shadow : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: orbitInkTokens.bg }}>
        <div style={{ width: 100, height: 3, borderRadius: 2, background: orbitInkTokens.ink, opacity: 0.3 }} />
      </div>
    </div>
  );
}

window.OrbitInkApp = OrbitInkApp;

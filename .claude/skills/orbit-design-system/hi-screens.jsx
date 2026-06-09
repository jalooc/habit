// hi-screens.jsx — Hi-fi screens for the "habit images" feature.
//   HiCreateScreen · Option A — per-habit thumb strip + add affordances
//   HiGroupScreen  · Option A hero strip below the ring + Option D queue mosaic
// Reuses OIHead, SlideToConfirm, Swipeable, OrbitRing, OrbitStrip, TabBar, useTokens.

const { useState: useHS } = React;

// ──────────────────────────────────────────────────────────────
// CREATE / EDIT — habits carry images
// ──────────────────────────────────────────────────────────────
function HiCreateScreen({ group, shape, onName, onCadence, onAddHabit, onRemoveHabit,
                          onHabitName, onRequestAdd, onRemoveImage, onOpenViewer, back }) {
  const { t, d, tone, ring } = useTokens();
  const [cadence, setCad] = useHS(group.cadence?.kind || 'daily');
  const [expanded, setExpanded] = useHS(group.habits[group.cursor]?.id || group.habits[0]?.id);
  const [reminders, setReminders] = useHS(true);

  const cadenceOpts = [
    { id: 'daily', label: 'Once a day' },
    { id: 'multi', label: 'Multiple per day' },
    { id: 'weekdays', label: 'Weekdays' },
    { id: 'xweek', label: '3× per week' },
    { id: 'everyN', label: 'Every 2 days' },
  ];

  const Mini = RING_VARIANTS.orbit.Mini;
  const totalImgs = group.habits.reduce((s, h) => s + h.images.length, 0);

  return (
    <div style={{ background: t.bg, color: t.ink, minHeight: '100%' }}>
      <OrbitStrip />
      <OIHead onBack={back} title={`Edit · ${group.name}`} kicker="Update the rotation" />

      {/* preview ring */}
      <div style={{ padding: `6px ${d.screenPad}px 16px`, display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: t.card, borderRadius: 24, padding: '16px 16px 12px', boxShadow: t.shadow }}>
          <Mini group={group} size={104} />
        </div>
      </div>

      <FieldLabel>Name</FieldLabel>
      <div style={{ padding: `0 ${d.screenPad}px` }}>
        <input value={group.name} onChange={(e) => onName(e.target.value)} placeholder="e.g. Core, Mobility…"
               style={{ width: '100%', border: 'none', background: t.card, padding: '14px 16px',
                        borderRadius: 14, font: `400 18px ${SERIF}`, color: t.ink, outline: 'none' }} />
      </div>

      <FieldLabel>Cadence</FieldLabel>
      <div style={{ padding: `0 ${d.screenPad}px` }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {cadenceOpts.map((c) => (
            <button key={c.id} onClick={() => { setCad(c.id); onCadence?.(c); }} style={{
              border: 'none', cursor: 'pointer',
              background: cadence === c.id ? t.ink : t.card,
              color: cadence === c.id ? t.card : t.inkSoft,
              padding: '10px 14px', borderRadius: 100, font: `500 13px/1 ${SANS}`,
            }}>{c.label}</button>
          ))}
        </div>
      </div>

      <FieldLabel right={`${totalImgs} ${totalImgs === 1 ? 'image' : 'images'} across ${group.habits.length}`}>
        Habits in rotation
      </FieldLabel>
      <div style={{ padding: `0 ${d.screenPad}px` }}>
        <div style={{ background: t.card, borderRadius: 16, padding: 6 }}>
          {group.habits.map((h, i) => {
            const open = expanded === h.id;
            const has = h.images.length > 0;
            return (
              <div key={h.id} style={{
                borderBottom: i < group.habits.length - 1 ? `1px solid ${t.rule}` : 'none',
                padding: '4px 4px 6px',
              }}>
                {/* name row */}
                <div onClick={() => setExpanded(open ? null : h.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px', cursor: 'pointer',
                }}>
                  <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: h.name.trim() ? t.accent : 'transparent',
                      border: h.name.trim() ? 'none' : `1.5px solid ${t.accentDim}`,
                    }} />
                  </div>
                  <input value={h.name} onChange={(e) => onHabitName(h.id, e.target.value)}
                         onClick={(e) => { e.stopPropagation(); setExpanded(h.id); }}
                         placeholder="Habit name"
                         style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none',
                                  font: `400 15px ${SERIF}`, color: t.ink, padding: '6px 0' }} />

                  {/* collapsed: show stacked-thumb count chip */}
                  {!open && has && (
                    <div onClick={(e) => { e.stopPropagation(); setExpanded(h.id); }}
                         style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: 2 }}>
                      {h.images.slice(0, 3).map((im, k) => (
                        <img key={im.id} src={im.src} alt="" style={{
                          width: 26, height: 26, borderRadius: shape === 'circle' ? '50%' : 7,
                          objectFit: 'cover', border: `2px solid ${t.card}`, marginLeft: k ? -10 : 0,
                        }} />
                      ))}
                      {h.images.length > 3 && (
                        <span style={{ marginLeft: 4, font: `500 11px/1 ${SANS}`, color: t.inkSoft }}>
                          +{h.images.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  {!open && !has && (
                    <button onClick={(e) => { e.stopPropagation(); setExpanded(h.id); onRequestAdd(h.id); }}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0,
                                     color: t.accent, font: `500 11px/1 ${SANS}`, display: 'inline-flex',
                                     alignItems: 'center', gap: 5 }}>
                      <span style={{ font: '400 14px/1 system-ui' }}>+</span> image
                    </button>
                  )}

                  {group.habits.length > 2 && (
                    <button onClick={(e) => { e.stopPropagation(); onRemoveHabit(h.id); }}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer',
                                     color: t.inkFaint, fontSize: 18, flexShrink: 0, padding: '0 2px' }}>×</button>
                  )}
                </div>

                {/* expanded: image strip + hint */}
                {open && (
                  <div style={{ padding: '2px 8px 8px 42px' }}>
                    <CreateStrip
                      images={h.images}
                      shape={shape}
                      onOpenViewer={(idx) => onOpenViewer(h.id, idx)}
                      onRemove={(imgId) => onRemoveImage(h.id, imgId)}
                      onAdd={() => onRequestAdd(h.id)} />
                    <div style={{ marginTop: 9, font: `500 9px/1 ${SANS}`, letterSpacing: 1.4,
                                  color: t.inkFaint, textTransform: 'uppercase' }}>
                      Gallery · Camera · Paste (⌘V)
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={onAddHabit} style={{
          marginTop: 10, border: 'none', background: 'transparent', cursor: 'pointer',
          font: `500 12px/1 ${SANS}`, color: t.accent, padding: '6px 0',
        }}>+ Add habit</button>
      </div>

      {/* reminder card (static) */}
      <div style={{ padding: `14px ${d.screenPad}px` }}>
        <div style={{ background: t.card, borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: `500 12px/1.2 ${SANS}`, color: t.ink }}>Reminder when due</div>
            <div style={{ font: `400 12px/1.3 ${SANS}`, color: t.inkSoft, marginTop: 4 }}>
              "{group.name} · {group.habits.find((h) => h.name.trim())?.name || 'habit 1'}"
            </div>
          </div>
          <button onClick={() => setReminders(!reminders)} style={{
            border: 'none', cursor: 'pointer', width: 40, height: 22, borderRadius: 100,
            background: reminders ? t.accent : t.accentDim, position: 'relative', transition: 'background .2s',
          }}>
            <div style={{ position: 'absolute', top: 2, left: reminders ? 20 : 2, width: 18, height: 18,
                          borderRadius: '50%', background: t.card, transition: 'left .2s' }} />
          </button>
        </div>
      </div>

      <div style={{ padding: `8px ${d.screenPad}px 32px` }}>
        <button onClick={back} style={{
          width: '100%', border: 'none', borderRadius: 100, background: t.ink, color: t.card,
          padding: '15px', cursor: 'pointer', font: `500 14px/1 ${SANS}`, letterSpacing: 0.5,
        }}>Save changes</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// GROUP — hero strip (Option A) + queue mosaic (Option D)
// ──────────────────────────────────────────────────────────────
function HiGroupScreen({ group, shape, heroStrip, setGroup, onOpenViewer, back, go }) {
  const { t, d, tone, ring } = useTokens();
  const [rotating, setRotating] = useHS(false);
  const [undoState, setUndoState] = useHS(null);
  const [tickedId, setTickedId] = useHS(null);
  const undoRef = React.useRef(null);

  const queue = queueOrder(group);
  const Ring = RING_VARIANTS.orbit.Ring;
  const upNextHabit = group.habits[group.cursor % group.habits.length];

  const tick = () => {
    if (rotating) return;
    setRotating(true);
    setUndoState({ prevCursor: group.cursor, prevHabits: group.habits });
    setTimeout(() => { setGroup((g) => tickOff(g)); setRotating(false); }, 600);
    clearTimeout(undoRef.current);
    undoRef.current = setTimeout(() => setUndoState(null), 5500);
  };
  const tickQueueItem = (habit) => {
    const isActive = group.habits[group.cursor].id === habit.id;
    if (isActive) { tick(); return; }
    setTickedId(habit.id);
    setUndoState({ prevCursor: group.cursor, prevHabits: group.habits });
    setTimeout(() => { setGroup((g) => tickOutOfOrder(g, habit.id)); setTickedId(null); }, 280);
    clearTimeout(undoRef.current);
    undoRef.current = setTimeout(() => setUndoState(null), 5500);
  };
  const undo = () => {
    if (!undoState) return;
    setGroup((g) => ({ ...g, cursor: undoState.prevCursor, habits: undoState.prevHabits }));
    setUndoState(null);
  };
  const skip = () => setGroup((g) => skipTurn(g));

  return (
    <div style={{ background: t.bg, color: t.ink, minHeight: '100%', position: 'relative' }}>
      <OrbitStrip />
      <OIHead onBack={back} kicker={group.cadence.label} title={group.name}
        action={
          <button onClick={() => go('create')} style={{
            border: `1px solid ${t.accentDim}`, background: t.card, padding: '6px 12px',
            borderRadius: 100, cursor: 'pointer', font: `500 12px/1 ${SANS}`, color: t.inkSoft,
          }}>Edit</button>
        } />

      <div style={{ padding: `0 ${d.screenPad}px 6px` }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                       borderRadius: 100, background: t.accentSoft, color: t.accent,
                       font: `500 11px/1 ${SANS}`, letterSpacing: 0.4 }}>
          <span style={{ width: 5, height: 5, borderRadius: 3, background: t.accent }} />
          {group.habits.length} habits in rotation
        </span>
      </div>

      {/* hero */}
      <div style={{ padding: `4px ${d.screenPad}px 18px` }}>
        <div style={{ position: 'relative', background: t.card, borderRadius: 28, padding: d.ringBoxPad,
                      boxShadow: t.shadow, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Ring group={group} size={ring.hero + 6} rotating={rotating} />

          {/* Option A — thumb strip for the up-next habit */}
          {heroStrip && (
            <HeroStrip
              images={upNextHabit.images}
              shape={shape}
              onOpen={(idx) => onOpenViewer(upNextHabit.id, idx)} />
          )}

          <div style={{ width: '100%', marginTop: 20 }}>
            <SlideToConfirm label={`Slide · ${tone.markDone.toLowerCase()}`} doneLabel={tone.logged}
                            disabled={rotating} onConfirm={tick} />
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ font: `400 12px/1.2 ${SANS}`, color: t.inkFaint }}>Logging as now</span>
              <span aria-hidden="true" style={{ width: 3, height: 3, borderRadius: 2, background: t.inkFaint, opacity: 0.6 }} />
              <button onClick={skip} disabled={rotating} style={{
                border: 'none', background: 'transparent', cursor: rotating ? 'default' : 'pointer', padding: '4px 6px',
                font: `400 12px/1.2 ${SANS}`, color: t.inkFaint, display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <span>skip turn</span>
                <span aria-hidden="true" style={{ fontSize: 13, lineHeight: 1, color: t.accent }}>›</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* queue */}
      <div style={{ padding: `8px ${d.screenPad}px 0` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div style={{ font: `500 11px/1 ${SANS}`, letterSpacing: 1.8, color: t.inkSoft, textTransform: 'uppercase' }}>
            {tone.theQueue}
          </div>
          <div style={{ font: `400 11px ${SANS}`, color: t.inkFaint }}>Swipe a row to log it</div>
        </div>
      </div>
      <div style={{ padding: `0 ${d.screenPad - 6}px` }}>
        <div style={{ background: t.card, borderRadius: 18, overflow: 'hidden' }}>
          {queue.map((h, i) => {
            const justTicked = tickedId === h.id;
            const rowInner = (
              <div style={{
                padding: '14px 16px 12px', background: justTicked ? t.accentSoft : t.card,
                borderTop: i ? `1px solid ${t.rule}` : 'none', transition: 'background .25s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {i === 0 ? (
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: t.accent, color: t.card,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  font: `500 13px/1 ${SANS}`, flexShrink: 0 }}>✓</div>
                  ) : (
                    <div style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${t.accentDim}` }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0, font: `400 16px/1.3 ${SERIF}`,
                                color: i === 0 ? t.ink : t.inkSoft,
                                textDecoration: justTicked ? 'line-through' : 'none', textDecorationColor: t.accent }}>
                    {h.name}
                  </div>
                  {i === 0 ? (
                    <div style={{ font: `500 10px/1 ${SANS}`, color: t.accent, letterSpacing: 1, textTransform: 'uppercase' }}>NOW</div>
                  ) : (
                    <div style={{ font: `500 9px/1 ${SANS}`, color: t.inkFaint, letterSpacing: 1.4, textTransform: 'uppercase',
                                  display: 'flex', alignItems: 'center', gap: 4, opacity: 0.7 }}>
                      <span>swipe</span><span style={{ fontSize: 13, lineHeight: 1 }}>›</span>
                    </div>
                  )}
                </div>
                {/* Option D — mosaic strip, only when the habit has images */}
                <QueueMosaic images={h.images} shape={shape} indent={40}
                             onOpen={(idx) => onOpenViewer(h.id, idx)} />
              </div>
            );
            return (
              <Swipeable key={h.id} direction="right" threshold={0.4}
                rightBackground={{ color: t.accent, fg: '#fff', icon: '✓', label: tone.logged }}
                onTrigger={() => tickQueueItem(h)}>
                {rowInner}
              </Swipeable>
            );
          })}
        </div>
      </div>

      <div style={{ padding: `22px ${d.screenPad}px 32px` }}>
        <div style={{ font: `500 11px/1 ${SANS}`, letterSpacing: 1.5, color: t.inkSoft, textTransform: 'uppercase', marginBottom: 6 }}>Last logged</div>
        <div style={{ font: `400 14px/1.4 ${SERIF}`, color: t.inkSoft }}>{group.lastDone}</div>
        <div style={{ marginTop: 14, font: `400 12px/1.5 ${SERIF}`, color: t.inkFaint }}>{tone.skipExplain}</div>
      </div>

      <UndoToast visible={!!undoState} onUndo={undo} label={tone.undone + ' a tick'} />
    </div>
  );
}

Object.assign(window, { HiCreateScreen, HiGroupScreen });

// screens.jsx — Core 4 screens (Today / Rotations / Group / Create) + shared bits.
// All read from useTokens(); ring is selected per-instance via the `ringId` prop.

const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM } = React;

// ──────────────────────────────────────────────────────────────
// Shared chrome
// ──────────────────────────────────────────────────────────────
function OIHead({ title, kicker, onBack, action }) {
  const { t, d } = useTokens();
  return (
    <div style={{ padding: `12px ${d.screenPad}px 16px` }}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 24, marginBottom: 14 }}>
        {onBack && (
          <button onClick={onBack} style={{
            border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
            color: t.inkSoft, font: `500 14px ${SANS}`,
          }}>← Back</button>
        )}
        <span style={{ flex: 1 }} />
        {action}
      </div>
      {kicker && (
        <div style={{
          font: `500 11px/1 ${SANS}`, letterSpacing: 1.8,
          color: t.inkSoft, textTransform: 'uppercase', marginBottom: 8,
        }}>{kicker}</div>
      )}
      <div style={{
        font: `400 32px/1.1 ${SERIF}`, color: t.ink,
        letterSpacing: -0.4, textWrap: 'pretty',
      }}>{title}</div>
    </div>
  );
}

function PillButton({ children, onClick, variant = 'primary', disabled, style }) {
  const { t } = useTokens();
  const bgMap = {
    primary: t.ink, secondary: t.card, ghost: 'transparent', accent: t.accent,
  };
  const fgMap = {
    primary: t.card, secondary: t.inkSoft, ghost: t.inkSoft, accent: t.card,
  };
  const borderMap = {
    primary: 'none', secondary: `1px solid ${t.accentDim}`,
    ghost: `1px solid ${t.accentDim}`, accent: 'none',
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border: borderMap[variant], background: bgMap[variant], color: fgMap[variant],
      padding: '13px 26px', borderRadius: 100, cursor: disabled ? 'default' : 'pointer',
      font: `500 12px/1 ${SANS}`, letterSpacing: 1.4, textTransform: 'uppercase',
      opacity: disabled ? 0.5 : 1, transition: 'opacity .2s, transform .15s',
      ...style,
    }}>{children}</button>
  );
}

// Toast — used by Undo after a tick
function UndoToast({ visible, onUndo, label }) {
  const { t, tone } = useTokens();
  return (
    <div style={{
      position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
      background: t.ink, color: t.card, borderRadius: 100,
      padding: '10px 14px 10px 18px', display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: t.shadow, opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
      transition: 'opacity .25s, transform .25s',
      zIndex: 30, whiteSpace: 'nowrap',
    }}>
      <span style={{ font: `400 13px ${SERIF}` }}>{label}</span>
      <button onClick={onUndo} style={{
        border: 'none', background: 'transparent', color: t.accent,
        font: `500 12px/1 ${SANS}`, letterSpacing: 1.2, textTransform: 'uppercase',
        cursor: 'pointer', padding: 0,
      }}>{tone.undo}</button>
    </div>
  );
}

// Tab bar — bottom nav
function TabBar({ active, onTab }) {
  const { t, tone } = useTokens();
  return (
    <div style={{
      display: 'flex', padding: '8px 14px', gap: 6, background: t.bg, flexShrink: 0,
      borderTop: `1px solid ${t.rule}`,
    }}>
      {[
        { id: 'home', label: tone.todayLabel, icon: '◐' },
        { id: 'groups', label: tone.rotationsTitle, icon: '◯' },
        { id: 'stats', label: 'Insights', icon: '◔' },
        { id: 'settings', label: 'Settings', icon: '◌' },
      ].map((tab) => {
        const on = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onTab(tab.id)} style={{
            flex: 1, border: 'none', cursor: 'pointer',
            background: on ? t.card : 'transparent',
            color: on ? t.ink : t.inkSoft,
            padding: '10px 0', borderRadius: 100,
            font: `500 11px/1 ${SANS}`, letterSpacing: 0.3,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            boxShadow: on ? t.shadow : 'none', transition: 'background .2s',
          }}>
            <span style={{ font: `400 14px/1 ${SERIF}` }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Status strip — local, ignores the Android frame's own bar
function OrbitStrip() {
  const { t, tone, activeHours } = useTokens();
  return (
    <div style={{
      height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 22px', background: 'transparent', flexShrink: 0,
    }}>
      <div style={{
        font: `600 11px ${SANS}`, color: t.accent, letterSpacing: 1.4, textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>◯ orbit</div>
      <div style={{
        font: `500 10px ${SANS}`, color: t.inkFaint, letterSpacing: 1.4, textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>Thu · May 15</div>
    </div>
  );
}

// Active-hours chip — subtle, tappable, sits at the top of the Today screen.
// Reminds the user when the app pings; tap to edit.
function ActiveHoursChip({ onEdit }) {
  const { t, tone, activeHours } = useTokens();
  return (
    <button onClick={onEdit} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      border: `1px solid ${t.rule}`, background: 'transparent', cursor: 'pointer',
      padding: '6px 12px', borderRadius: 100,
      color: t.inkFaint, font: `500 11px/1 ${SANS}`, letterSpacing: 0.6,
      textTransform: 'none', whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: 3, background: t.accent, opacity: 0.6,
      }} />
      <span>{tone.activeHours} · {activeHours}</span>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// Today
// ──────────────────────────────────────────────────────────────
function TodayScreen({ groups, setGroups, go, ringId = 'orbit' }) {
  const { t, d, tone, ring } = useTokens();
  const visible = groups.filter((g) => !g.paused);
  const due = visible.filter((g) => ['daily', 'weekdays', 'everyN'].includes(g.cadence.kind));
  const others = visible.filter((g) => !due.includes(g));
  const [undoStack, setUndoStack] = useS([]);
  const [undoLabel, setUndoLabel] = useS('');
  const undoRef = useR(null);

  const Variant = RING_VARIANTS[ringId] || RING_VARIANTS.orbit;
  const Mini = Variant.Mini;
  const active = due[0];

  const handleAction = ({ kind, group }) => {
    if (kind === 'tick') {
      setUndoStack((s) => [...s, { groupId: group.id, prevCursor: group.cursor }]);
      const habit = upNext(group);
      setUndoLabel(`${tone.logged} · ${habit.name}`);
      clearTimeout(undoRef.current);
      undoRef.current = setTimeout(() => setUndoStack([]), 5500);
    }
    // postpone has no undo path in the demo
  };

  const undo = () => {
    setUndoStack((s) => {
      if (s.length === 0) return s;
      const last = s[s.length - 1];
      setGroups((all) => all.map((x) => x.id === last.groupId ? { ...x, cursor: last.prevCursor } : x));
      return s.slice(0, -1);
    });
  };

  // Empty state — no due
  if (!active) {
    return (
      <div style={{ background: t.bg, color: t.ink, minHeight: '100%', position: 'relative' }}>
        <OrbitStrip />
        <OIHead kicker="Thursday, May 15" title={tone.nothingDue} />
        <div style={{ padding: `0 ${d.screenPad}px 6px` }}>
          <ActiveHoursChip onEdit={() => go({ name: 'settings' })} />
        </div>
        <div style={{ padding: `12px ${d.screenPad}px 24px`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%', border: `2px dashed ${t.accentDim}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: t.inkFaint, font: `400 24px ${SERIF}`,
          }}>·</div>
          <div style={{
            marginTop: 22, font: `400 16px/1.4 ${SERIF}`,
            color: t.inkSoft, textAlign: 'center', maxWidth: 280, textWrap: 'pretty',
          }}>{tone.nothingDueSub}</div>
        </div>
        {others.length > 0 && <OtherRotations groups={others} go={go} Mini={Mini} />}
      </div>
    );
  }

  return (
    <div style={{ background: t.bg, color: t.ink, minHeight: '100%', position: 'relative' }}>
      <OrbitStrip />
      <OIHead kicker="Thursday, May 15" title={`${tone.todayLabel} · ${due.length} ${due.length === 1 ? 'rotation' : 'rotations'}`} />
      <div style={{ padding: `0 ${d.screenPad}px 6px` }}>
        <ActiveHoursChip onEdit={() => go({ name: 'settings' })} />
      </div>

      <TodayList groups={groups} setGroups={setGroups} onAction={handleAction} />

      {others.length > 0 && <OtherRotations groups={others} go={go} Mini={Mini} />}

      <UndoToast
        visible={undoStack.length > 0}
        onUndo={undo}
        label={undoLabel || tone.undone + ' a tick'} />
    </div>
  );
}

function OtherRotations({ groups, go, Mini }) {
  const { t, d, tone } = useTokens();
  return (
    <div style={{ padding: `4px ${d.screenPad}px 32px` }}>
      <div style={{
        font: `500 11px/1 ${SANS}`, letterSpacing: 1.8,
        color: t.inkSoft, textTransform: 'uppercase', marginBottom: 14,
      }}>Other rotations</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groups.map((g) => (
          <div key={g.id} onClick={() => go({ name: 'group', id: g.id })}
               style={{
                 display: 'flex', alignItems: 'center', gap: 14, padding: 14,
                 background: t.card, borderRadius: 18, cursor: 'pointer',
               }}>
            <Mini group={g} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: `400 17px/1.2 ${SERIF}`, color: t.ink }}>{g.name}</div>
              <div style={{ font: `400 13px/1.3 ${SANS}`, color: t.inkSoft, marginTop: 3 }}>
                {tone.upNext} · {upNext(g).name}
              </div>
            </div>
            <div style={{ font: `500 10px ${SANS}`, color: t.inkFaint, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'right' }}>{g.cadence.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Rotations list
// ──────────────────────────────────────────────────────────────
function RotationsScreen({ groups, go, ringId = 'orbit' }) {
  const { t, d, tone } = useTokens();
  const Variant = RING_VARIANTS[ringId] || RING_VARIANTS.orbit;
  const Mini = Variant.Mini;

  return (
    <div style={{ background: t.bg, color: t.ink, minHeight: '100%' }}>
      <OrbitStrip />
      <OIHead title={tone.rotationsTitle} kicker={`${groups.length} ${groups.length === 1 ? 'group' : 'groups'}`} action={
        <button onClick={() => go({ name: 'create' })} style={{
          border: 'none', background: t.ink, color: t.card,
          padding: '8px 16px', borderRadius: 100, cursor: 'pointer',
          font: `500 12px/1 ${SANS}`, letterSpacing: 0.5,
        }}>+ New</button>
      } />
      <div style={{ padding: `4px ${d.screenPad}px 32px`, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map((g) => (
          <div key={g.id} onClick={() => go({ name: 'group', id: g.id })}
               style={{
                 background: g.paused ? t.accentSoft : t.card,
                 borderRadius: 22, padding: d.cardPad + 4, cursor: 'pointer',
                 boxShadow: g.paused ? 'none' : t.shadow,
                 opacity: g.paused ? 0.78 : 1,
               }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Mini group={g} size={72} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ font: `400 22px/1.1 ${SERIF}`, color: t.ink, letterSpacing: -0.3 }}>{g.name}</div>
                  {g.paused && <div style={{ font: `500 9px/1 ${SANS}`, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase' }}>Paused</div>}
                </div>
                <div style={{ font: `400 13px/1.3 ${SANS}`, color: t.inkSoft, marginTop: 4 }}>
                  {g.cadence.label} · {g.habits.length} habits
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                  <div style={{ font: `500 10px/1 ${SANS}`, color: t.inkFaint, letterSpacing: 1.5, textTransform: 'uppercase' }}>{tone.upNext}</div>
                  <div style={{ font: `400 14px/1.3 ${SERIF}`, color: t.ink }}>{upNext(g).name}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Group detail — hero ring, queue (with reorder + out-of-order tick),
// undo on tick, skip, last logged.
// ──────────────────────────────────────────────────────────────
function GroupScreen({ group, setGroups, back, go, ringId = 'orbit', initialOverlay = null, onOpenNote }) {
  const { t, d, tone, ring, thumbShape, heroStrip } = useTokens();
  const [rotating, setRotating] = useS(false);
  const [undoState, setUndoState] = useS(null);
  const [tickedId, setTickedId] = useS(null);   // brief tick highlight for non-active row
  const [dragging, setDragging] = useS(null);
  const [imgView, setImgView] = useS(initialOverlay);  // {habitId, index} → lightbox
  const [whisperDraft, setWhisperDraft] = useS('');
  const [composerExpanded, setComposerExpanded] = useS(false);
  const undoRef = useR(null);

  if (!group) return null;
  const queue = queueOrder(group);
  const viewHabit = imgView ? group.habits.find((h) => h.id === imgView.habitId) : null;
  const Variant = RING_VARIANTS[ringId] || RING_VARIANTS.orbit;
  const Ring = Variant.Ring;

  const tick = () => {
    if (rotating || group.paused) return;
    setRotating(true);
    const tickedHabitId = group.habits[group.cursor].id;
    const draftToAttach = whisperDraft.trim();
    setUndoState({
      groupId: group.id, prevCursor: group.cursor, prevHabits: group.habits,
      prevDraft: whisperDraft, prevExpanded: composerExpanded,
    });
    setTimeout(() => {
      setGroups((all) => all.map((x) => {
        if (x.id !== group.id) return x;
        // 1) Consume the pending whisper on the just-ticked habit
        //    and 2) attach the new draft to the same habit so it shows up
        //    on the next instance.
        const habits = x.habits.map((h) => h.id !== tickedHabitId ? h : ({
          ...h,
          whisper: draftToAttach || undefined,
        }));
        return tickOff({ ...x, habits });
      }));
      setRotating(false);
    }, 600);
    setWhisperDraft('');
    setComposerExpanded(false);
    clearTimeout(undoRef.current);
    undoRef.current = setTimeout(() => setUndoState(null), 5500);
  };
  // Tap any non-active queue item: it counts as done, moves to back of queue.
  // The cursor stays on the original up-next.
  const tickQueueItem = (habit) => {
    if (group.paused) return;
    const isActive = group.habits[group.cursor].id === habit.id;
    if (isActive) { tick(); return; }
    const prev = group;
    setTickedId(habit.id);
    setTimeout(() => {
      setGroups((all) => all.map((x) => x.id === group.id ? tickOutOfOrder(x, habit.id) : x));
      setTickedId(null);
    }, 280);
    setUndoState({ groupId: prev.id, prevCursor: prev.cursor, prevHabits: prev.habits });
    clearTimeout(undoRef.current);
    undoRef.current = setTimeout(() => setUndoState(null), 5500);
  };
  const undo = () => {
    if (!undoState) return;
    setGroups((all) => all.map((x) => x.id === undoState.groupId
      ? { ...x, cursor: undoState.prevCursor, habits: undoState.prevHabits } : x));
    if (typeof undoState.prevDraft === 'string') setWhisperDraft(undoState.prevDraft);
    if (typeof undoState.prevExpanded === 'boolean') setComposerExpanded(undoState.prevExpanded);
    setUndoState(null);
  };
  const skip = () => setGroups((all) => all.map((x) => x.id === group.id ? skipTurn(x) : x));
  const pause = () => setGroups((all) => all.map((x) => x.id === group.id ? { ...x, paused: !x.paused } : x));

  return (
    <div style={{ background: t.bg, color: t.ink, minHeight: '100%', position: 'relative' }}>
      <OrbitStrip />
      <OIHead onBack={back}
        kicker={`${group.cadence.label}${group.paused ? ' · paused' : ''}`}
        title={group.name}
        action={
          <button onClick={() => go({ name: 'edit', id: group.id })} style={{
            border: `1px solid ${t.accentDim}`, background: t.card,
            padding: '6px 12px', borderRadius: 100, cursor: 'pointer',
            font: `500 12px/1 ${SANS}`, color: t.inkSoft,
          }}>Edit</button>
        } />

      {/* Habit-count chip below title */}
      <div style={{ padding: `0 ${d.screenPad}px 6px` }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 100,
          background: t.accentSoft, color: t.accent,
          font: `500 11px/1 ${SANS}`, letterSpacing: 0.4,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 3, background: t.accent }} />
          {group.habits.length} habits in rotation
        </span>
      </div>

      {group.paused && (
        <PausedBanner onResume={pause} />
      )}

      <div style={{ padding: `4px ${d.screenPad}px 14px`, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          position: 'relative',
          background: t.card, borderRadius: 28, padding: d.ringBoxPad,
          boxShadow: t.shadow, display: 'flex', flexDirection: 'column', alignItems: 'center',
          opacity: group.paused ? 0.55 : 1,
          filter: group.paused ? 'saturate(0.35)' : 'none',
          transition: 'opacity .3s, filter .3s',
        }}>
          <Ring group={group} size={ring.hero + 6} rotating={rotating} />
          {heroStrip && !group.paused && (
            <HeroStrip
              images={upNext(group).images || []}
              shape={thumbShape}
              onOpen={(idx) => setImgView({ habitId: upNext(group).id, index: idx })} />
          )}
          {!group.paused && upNext(group).whisper && (
            <div style={{ width: '100%', marginTop: 18 }}>
              <WhisperHeroCard note={upNext(group).whisper} />
            </div>
          )}
          {!group.paused && (
            <div style={{ width: '100%', marginTop: 22 }}>
              <SlideToConfirm
                label={`Slide · ${tone.markDone.toLowerCase()}`}
                doneLabel={tone.logged}
                disabled={rotating}
                onConfirm={tick} />
              <div style={{
                marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
              }}>
                <HeroEditLabel time={null} onClick={() => {}} />
                <span aria-hidden="true" style={{
                  width: 3, height: 3, borderRadius: 2, background: t.inkFaint, opacity: 0.6,
                }} />
                <button onClick={skip} disabled={rotating} style={{
                  border: 'none', background: 'transparent', cursor: rotating ? 'default' : 'pointer',
                  padding: '4px 10px',
                  font: `400 12px/1.2 ${SANS}`,
                  color: t.inkFaint,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <span>skip turn</span>
                  <span aria-hidden="true" style={{
                    fontSize: 13, lineHeight: 1, color: t.accent,
                  }}>›</span>
                </button>
              </div>

              {/* Whisper composer — inline affordance to leave a note for next time */}
              <div style={{ width: '100%', marginTop: 14 }}>
                <WhisperComposer
                  value={whisperDraft}
                  onChange={setWhisperDraft}
                  expanded={composerExpanded}
                  onExpand={() => setComposerExpanded(true)}
                  onCollapse={() => { setComposerExpanded(false); setWhisperDraft(''); }}
                />
              </div>
            </div>
          )}
          {group.paused && (
            <div style={{
              marginTop: 18, padding: '8px 14px', borderRadius: 100,
              background: 'transparent', border: `1px dashed ${t.accentDim}`,
              font: `500 10px/1 ${SANS}`, letterSpacing: 2, color: t.inkFaint, textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>Ring is on hold</div>
          )}
        </div>

        {!group.paused && upNext(group).note && (
          <HabitNoteCard
            note={upNext(group).note}
            onTap={onOpenNote ? () => onOpenNote(upNext(group).id) : null} />
        )}
      </div>

      <div style={{ padding: `8px ${d.screenPad}px 0` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div style={{
            font: `500 11px/1 ${SANS}`, letterSpacing: 1.8,
            color: t.inkSoft, textTransform: 'uppercase',
          }}>{tone.theQueue}</div>
          <div style={{ font: `400 11px ${SANS}`, color: t.inkFaint }}>
            Swipe a row to log it
          </div>
        </div>
      </div>
      <div style={{ padding: `0 ${d.screenPad - 6}px`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: t.card, borderRadius: 18, overflow: 'hidden' }}>
          {queue.map((h, i) => {
            const justTicked = tickedId === h.id;
            const rowImgs = h.images || [];
            const rowInner = (
              <div style={{
                padding: '14px 16px 12px',
                background: justTicked ? t.accentSoft : t.card,
                borderTop: i ? `1px solid ${t.rule}` : 'none',
                transition: 'background .25s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {i === 0 ? (
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: t.accent, color: t.card,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      font: `500 13px/1 ${SANS}`, flexShrink: 0,
                    }}>✓</div>
                  ) : (
                    <div style={{
                      width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        border: `1.5px solid ${t.accentDim}`, background: 'transparent',
                      }} />
                    </div>
                  )}
                  <div style={{
                    flex: 1, minWidth: 0, font: `400 16px/1.3 ${SERIF}`,
                    color: i === 0 ? t.ink : t.inkSoft,
                    textDecoration: justTicked ? 'line-through' : 'none',
                    textDecorationColor: t.accent,
                  }}>{h.name}</div>
                  {h.whisper && (
                    <WhisperRowMark size={13} />
                  )}
                  {i === 0 ? (
                    <div style={{
                      font: `500 10px/1 ${SANS}`, color: t.accent,
                      letterSpacing: 1, textTransform: 'uppercase',
                    }}>NOW</div>
                  ) : (
                    <div style={{
                      font: `500 9px/1 ${SANS}`, color: t.inkFaint,
                      letterSpacing: 1.4, textTransform: 'uppercase',
                      display: 'flex', alignItems: 'center', gap: 4, opacity: 0.7,
                    }}>
                      <span>swipe</span>
                      <span style={{ fontSize: 13, lineHeight: 1 }}>›</span>
                    </div>
                  )}
                </div>
                <QueueMosaic images={rowImgs} shape={thumbShape} indent={40}
                  onOpen={(idx) => setImgView({ habitId: h.id, index: idx })} />
              </div>
            );
            return (
              <Swipeable key={h.id}
                disabled={group.paused}
                direction="right"
                threshold={0.4}
                rightBackground={{
                  color: t.accent, fg: '#fff',
                  icon: '✓', label: tone.logged,
                }}
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
        <div style={{
          marginTop: 14, font: `400 12px/1.5 ${SERIF}`,
          color: t.inkFaint,
        }}>{tone.skipExplain}</div>
      </div>

      <UndoToast visible={!!undoState} onUndo={undo} label={tone.undone + ' a tick'} />

      {imgView && viewHabit && (viewHabit.images || []).length > 0 && (
        <Lightbox
          images={viewHabit.images}
          index={Math.min(imgView.index, viewHabit.images.length - 1)}
          habitName={viewHabit.name}
          onIndex={(idx) => setImgView((v) => ({ ...v, index: idx }))}
          onClose={() => setImgView(null)} />
      )}
    </div>
  );
}

// Paused banner — prominent strip below the title. Resume CTA inline.
function PausedBanner({ onResume }) {
  const { t, d } = useTokens();
  return (
    <div style={{ padding: `4px ${d.screenPad}px 10px` }}>
      <div style={{
        background: t.accent, color: t.card, borderRadius: 18,
        padding: '14px 16px 14px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 6px 22px rgba(201,100,66,0.28)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ width: 3, height: 12, borderRadius: 1, background: t.card }} />
            <div style={{ width: 3, height: 12, borderRadius: 1, background: t.card }} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: `600 12px/1 ${SANS}`, letterSpacing: 1.6, textTransform: 'uppercase' }}>
            Rotation paused
          </div>
          <div style={{ font: `400 13px/1.35 ${SERIF}`, opacity: 0.9, marginTop: 4 }}>
            No reminders will arrive. The queue holds its place.
          </div>
        </div>
        <button onClick={onResume} style={{
          border: 'none', background: t.card, color: t.accent,
          padding: '9px 16px', borderRadius: 100, cursor: 'pointer',
          font: `600 11px/1 ${SANS}`, letterSpacing: 1.2, textTransform: 'uppercase',
          flexShrink: 0,
        }}>Resume</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Create
// ──────────────────────────────────────────────────────────────
let _newHabitCount = 0;
const newHabit = () => ({ id: `nh${Date.now()}-${_newHabitCount++}`, name: '', images: [] });
let _newImgCount = 0;
const newImg = (src) => ({ id: `ni${Date.now()}-${_newImgCount++}`, src });

function CreateScreen({ back, setGroups, ringId = 'orbit', initial, initialOverlay = null }) {
  const { t, d, tone, ring, thumbShape, imgAdd } = useTokens();
  const [name, setName] = useS(initial?.name || '');
  const [cadence, setCadence] = useS(initial?.cadence?.kind || 'daily');
  const [habits, setHabits] = useS(
    initial?.habits?.map((h) => ({ id: h.id, name: h.name, images: h.images || [] }))
    || [newHabit(), newHabit(), newHabit()]
  );
  const [expanded, setExpanded] = useS(initialOverlay?.habitId || (initial?.habits?.[initial.cursor]?.id) || null);
  const [overlay, setOverlay] = useS(initialOverlay);  // {kind:'add'|'view', habitId, index}
  const [reminders, setReminders] = useS(true);
  const [reminderTime, setReminderTime] = useS('08:00');
  const editing = !!initial;

  const cadenceOpts = [
    { id: 'daily', label: 'Once a day' },
    { id: 'multi', label: 'Multiple per day' },
    { id: 'weekdays', label: 'Weekdays' },
    { id: 'xweek', label: '3× per week' },
    { id: 'everyN', label: 'Every 2 days' },
  ];

  const cadObj = cadenceOpts.find((c) => c.id === cadence);
  const updateHabit = (i, v) => setHabits((arr) => arr.map((x, k) => k === i ? { ...x, name: v } : x));
  const addHabit = () => setHabits((arr) => [...arr, newHabit()]);
  const removeHabit = (i) => setHabits((arr) => arr.filter((_, k) => k !== i));
  const canCreate = name.trim() && habits.filter((h) => h.name.trim()).length >= 2;

  // image handlers (operate on the local draft until saved)
  const addImages = (habitId, srcs) => setHabits((arr) => arr.map((h) =>
    h.id === habitId ? { ...h, images: [...h.images, ...srcs.map(newImg)] } : h));
  const removeImage = (habitId, imgId) => setHabits((arr) => arr.map((h) =>
    h.id === habitId ? { ...h, images: h.images.filter((im) => im.id !== imgId) } : h));
  const openAdd = (habitId) => { setExpanded(habitId); setOverlay({ kind: 'add', habitId }); };
  const openViewer = (habitId, index) => setOverlay({ kind: 'view', habitId, index });
  const overlayHabit = overlay ? habits.find((h) => h.id === overlay.habitId) : null;
  const totalImgs = habits.reduce((s, h) => s + h.images.length, 0);

  const create = () => {
    if (!canCreate) return;
    const clean = habits.filter((h) => h.name.trim()).map((h) => ({ id: h.id, name: h.name.trim(), images: h.images }));
    if (editing) {
      setGroups((all) => all.map((x) => x.id === initial.id ? { ...x, name: name.trim(), cadence: cadObj, habits: clean } : x));
    } else {
      setGroups((all) => [...all, {
        id: `g${Date.now()}`, name: name.trim(), cadence: cadObj,
        habits: clean, cursor: 0, paused: false, lastDone: '—',
      }]);
    }
    back();
  };

  const Variant = RING_VARIANTS[ringId] || RING_VARIANTS.orbit;
  const Mini = Variant.Mini;
  const previewGroup = {
    id: 'preview', name: name || 'New group',
    cursor: 0, habits: habits.map((h, i) => ({ id: `p${i}`, name: h.name || 'habit ' + (i + 1) })),
    paused: false, cadence: cadObj,
  };
  if (previewGroup.habits.length === 0) previewGroup.habits = [{ id: 'p0', name: '—' }];

  return (
    <div style={{ background: t.bg, color: t.ink, minHeight: '100%', position: 'relative' }}>
      <OrbitStrip />
      <OIHead onBack={back} title={editing ? `Edit · ${initial.name}` : tone.newRotation} kicker={editing ? 'Update the rotation' : tone.cycleSub} />

      <div style={{ padding: `6px ${d.screenPad}px 16px`, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: t.card, borderRadius: 24, padding: '16px 16px 12px',
          boxShadow: t.shadow,
        }}>
          <Mini group={previewGroup} size={104} />
        </div>
      </div>

      <FieldLabel>Name</FieldLabel>
      <div style={{ padding: `0 ${d.screenPad}px` }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Core, Mobility…"
               style={{
                 width: '100%', border: 'none', background: t.card,
                 padding: '14px 16px', borderRadius: 14,
                 font: `400 18px ${SERIF}`, color: t.ink, outline: 'none',
               }} />
      </div>

      <FieldLabel>Cadence</FieldLabel>
      <div style={{ padding: `0 ${d.screenPad}px` }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {cadenceOpts.map((c) => (
            <button key={c.id} onClick={() => setCadence(c.id)} style={{
              border: 'none', cursor: 'pointer',
              background: cadence === c.id ? t.ink : t.card,
              color: cadence === c.id ? t.card : t.inkSoft,
              padding: '10px 14px', borderRadius: 100,
              font: `500 13px/1 ${SANS}`,
            }}>{c.label}</button>
          ))}
        </div>
      </div>

      <FieldLabel right={`${habits.filter(h => h.name.trim()).length} added · ${totalImgs} ${totalImgs === 1 ? 'image' : 'images'}`}>Habits in rotation</FieldLabel>
      <div style={{ padding: `0 ${d.screenPad}px` }}>
        <div style={{ background: t.card, borderRadius: 16, padding: 6 }}>
          {habits.map((h, i) => {
            const open = expanded === h.id;
            const has = h.images.length > 0;
            return (
              <div key={h.id} style={{
                borderBottom: i < habits.length - 1 ? `1px solid ${t.rule}` : 'none',
                padding: '4px 4px 6px',
              }}>
                <div onClick={() => setExpanded(open ? null : h.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px', cursor: 'pointer',
                }}>
                  {/* bullet dot — no numbering; rotation order isn't stable per-slot */}
                  <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: h.name.trim() ? t.accent : 'transparent',
                      border: h.name.trim() ? 'none' : `1.5px solid ${t.accentDim}`,
                      transition: 'background .15s',
                    }} />
                  </div>
                  <input value={h.name} onChange={(e) => updateHabit(i, e.target.value)}
                         onClick={(e) => { e.stopPropagation(); setExpanded(h.id); }}
                         placeholder="Habit name"
                         style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none',
                                  font: `400 15px ${SERIF}`, color: t.ink, padding: '6px 0' }} />

                  {!open && has && (
                    <div onClick={(e) => { e.stopPropagation(); setExpanded(h.id); }}
                         style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: 2 }}>
                      {h.images.slice(0, 3).map((im, k) => (
                        <img key={im.id} src={im.src} alt="" style={{
                          width: 26, height: 26, borderRadius: thumbShape === 'circle' ? '50%' : 7,
                          objectFit: 'cover', border: `2px solid ${t.card}`, marginLeft: k ? -10 : 0,
                        }} />
                      ))}
                      {h.images.length > 3 && (
                        <span style={{ marginLeft: 4, font: `500 11px/1 ${SANS}`, color: t.inkSoft }}>+{h.images.length - 3}</span>
                      )}
                    </div>
                  )}
                  {!open && !has && (
                    <button onClick={(e) => { e.stopPropagation(); openAdd(h.id); }}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0,
                                     color: t.accent, font: `500 11px/1 ${SANS}`, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ font: '400 14px/1 system-ui' }}>+</span> image
                    </button>
                  )}

                  {habits.length > 2 && (
                    <button onClick={(e) => { e.stopPropagation(); removeHabit(i); }}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: t.inkFaint, fontSize: 18, flexShrink: 0, padding: '0 2px' }}>×</button>
                  )}
                </div>

                {open && (
                  <div style={{ padding: '2px 8px 8px 42px' }}>
                    <CreateStrip
                      images={h.images}
                      shape={thumbShape}
                      onOpenViewer={(idx) => openViewer(h.id, idx)}
                      onRemove={(imgId) => removeImage(h.id, imgId)}
                      onAdd={() => openAdd(h.id)} />
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
        <button onClick={addHabit} style={{
          marginTop: 10, border: 'none', background: 'transparent', cursor: 'pointer',
          font: `500 12px/1 ${SANS}`, color: t.accent, padding: '6px 0',
        }}>+ Add habit</button>
      </div>

      <div style={{ padding: `14px ${d.screenPad}px` }}>
        <div style={{
          background: t.card, borderRadius: 16, padding: 16,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: `500 12px/1.2 ${SANS}`, color: t.ink }}>Reminder when due</div>
            <div style={{ font: `400 12px/1.3 ${SANS}`, color: t.inkSoft, marginTop: 4 }}>
              "{name || 'New group'} · {habits.find((h) => h.name.trim())?.name || 'habit 1'}"
            </div>
          </div>
          <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)}
                 style={{ border: `1px solid ${t.accentDim}`, borderRadius: 8, padding: '6px 8px',
                          background: 'transparent', font: `500 13px ${SANS}`, color: t.ink }} />
          <button onClick={() => setReminders(!reminders)} style={{
            border: 'none', cursor: 'pointer',
            width: 40, height: 22, borderRadius: 100,
            background: reminders ? t.accent : t.accentDim,
            position: 'relative', transition: 'background .2s',
          }}>
            <div style={{
              position: 'absolute', top: 2, left: reminders ? 20 : 2,
              width: 18, height: 18, borderRadius: '50%', background: t.card,
              transition: 'left .2s',
            }} />
          </button>
        </div>
      </div>

      <div style={{ padding: `20px ${d.screenPad}px 32px` }}>
        <button onClick={create} disabled={!canCreate} style={{
          width: '100%', border: 'none', borderRadius: 100,
          background: canCreate ? t.ink : t.accentDim,
          color: t.card, padding: '15px',
          cursor: canCreate ? 'pointer' : 'not-allowed',
          font: `500 14px/1 ${SANS}`, letterSpacing: 0.5,
        }}>{editing ? 'Save changes' : tone.create}</button>
      </div>

      {overlay?.kind === 'add' && overlayHabit && (
        <AddSheet
          habit={overlayHabit}
          presentation={imgAdd}
          shape={thumbShape}
          onAdd={(srcs) => addImages(overlay.habitId, srcs)}
          onClose={() => setOverlay(null)} />
      )}
      {overlay?.kind === 'view' && overlayHabit && overlayHabit.images.length > 0 && (
        <Lightbox
          images={overlayHabit.images}
          index={Math.min(overlay.index, overlayHabit.images.length - 1)}
          habitName={overlayHabit.name}
          onIndex={(idx) => setOverlay((o) => ({ ...o, index: idx }))}
          onClose={() => setOverlay(null)} />
      )}
    </div>
  );
}

function FieldLabel({ children, right }) {
  const { t, d } = useTokens();
  return (
    <div style={{ padding: `14px ${d.screenPad}px 8px`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div style={{ font: `500 11px/1 ${SANS}`, letterSpacing: 1.5, color: t.inkSoft, textTransform: 'uppercase' }}>{children}</div>
      {right && <div style={{ font: `400 12px/1 ${SANS}`, color: t.inkFaint }}>{right}</div>}
    </div>
  );
}

Object.assign(window, {
  TodayScreen, RotationsScreen, GroupScreen, CreateScreen,
  OIHead, PillButton, UndoToast, TabBar, OrbitStrip, FieldLabel,
});

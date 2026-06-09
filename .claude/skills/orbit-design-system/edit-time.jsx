// edit-time.jsx — UI for editing the time of a tick.
//
// Surfaces:
//   - EditableUndoToast   The undo toast with an EDIT chip next to the
//                         timestamp. EDIT is visually clustered with the
//                         time; a hairline separates them from UNDO so the
//                         two actions read as distinct.
//   - HeroEditLabel       "logging as now" beneath the slide-to-confirm
//                         pill on the Group screen hero. Tap → opens picker.
//   - TimeSheet           Bottom-sheet shell with grabber + dim backdrop.
//                         Holds the three picker stages.
//   - PickerStage1/2/3    Quick chips → today scrubber → date + scrubber.
//                         Progressive: most users live in stage 1.
//   - LogSheet            Day-scoped tick log with a < TODAY > selector.
//                         Reachable from the Today date and from Insights.
//
// Each artboard host is a thin wrapper that pins the screen behind the
// sheet so the design reads in context.

const { useState: useEt } = React;

// ─────────────────────────────────────────────────────────────────────
// Shell
// ─────────────────────────────────────────────────────────────────────

function SheetBackdrop({ onDismiss }) {
  return (
    <div onClick={onDismiss} style={{
      position: 'absolute', inset: 0,
      background: 'rgba(26,24,20,0.46)',
      zIndex: 40,
    }} />
  );
}

function BottomSheet({ height = 480, children }) {
  const { t } = useTokens();
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      height,
      background: t.card,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      boxShadow: '0 -10px 36px rgba(26,24,20,0.22)',
      zIndex: 41,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'center', padding: '10px 0 4px',
        flexShrink: 0,
      }}>
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: t.rule,
        }} />
      </div>
      {children}
    </div>
  );
}

function SheetHeader({ kicker, title, onBack, action }) {
  const { t } = useTokens();
  return (
    <div style={{ padding: '4px 22px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 22 }}>
        {onBack && (
          <button onClick={onBack} style={{
            border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
            color: t.inkSoft, font: `400 22px/1 ${SERIF}`, marginRight: 8,
            transform: 'translateY(-1px)',
          }}>‹</button>
        )}
        <span style={{
          font: `500 10px/1 ${SANS}`, letterSpacing: 1.8,
          color: t.inkSoft, textTransform: 'uppercase',
        }}>{kicker}</span>
        <span style={{ flex: 1 }} />
        {action}
      </div>
      {title && (
        <div style={{
          font: `400 22px/1.2 ${SERIF}`, color: t.ink,
          letterSpacing: -0.3, marginTop: 10, textWrap: 'pretty',
        }}>{title}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EditableUndoToast — toast with EDIT next to time, separated from UNDO
// ─────────────────────────────────────────────────────────────────────

function EditableUndoToast({ visible, label, time, onEdit, onUndo }) {
  const { t, tone } = useTokens();
  return (
    <div style={{
      position: 'absolute', bottom: 14, left: '50%',
      transform: visible
        ? 'translateX(-50%) translateY(0)'
        : 'translateX(-50%) translateY(20px)',
      background: t.ink, color: t.card, borderRadius: 100,
      padding: '10px 16px 10px 18px',
      display: 'flex', alignItems: 'center',
      boxShadow: t.shadow,
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'opacity .25s, transform .25s',
      zIndex: 30, whiteSpace: 'nowrap', maxWidth: 'calc(100% - 28px)',
    }}>
      <span style={{ font: `400 13px ${SERIF}`, opacity: 0.95 }}>{label}</span>
      <span style={{ font: `400 13px ${SERIF}`, opacity: 0.55, margin: '0 6px' }}>·</span>

      {/* Cluster: time + EDIT, single tap target */}
      <button onClick={onEdit} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
        color: 'inherit',
      }}>
        <span style={{
          font: `500 13px/1 ${SANS}`,
          color: t.card,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: 0.3,
        }}>{time}</span>
        <span style={{
          font: `500 11px/1 ${SANS}`, color: t.accent,
          letterSpacing: 1.4, textTransform: 'uppercase',
        }}>Edit</span>
      </button>

      {/* Hairline separator + wider gap before UNDO */}
      <span style={{
        width: 1, height: 16, background: 'rgba(236,232,226,0.18)',
        margin: '0 14px',
      }} />

      <button onClick={onUndo} style={{
        border: 'none', background: 'transparent', color: t.accent,
        font: `500 12px/1 ${SANS}`, letterSpacing: 1.4, textTransform: 'uppercase',
        cursor: 'pointer', padding: 0,
      }}>{tone.undo}</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// HeroEditLabel — "logging as now" / "logging as 13:04" under slide pill
// ─────────────────────────────────────────────────────────────────────

function HeroEditLabel({ time, onClick }) {
  const { t } = useTokens();
  const isNow = !time || time === 'now';
  const displayValue = isNow ? 'now' : time;
  return (
    <button onClick={onClick} style={{
      border: 'none', background: 'transparent', cursor: 'pointer',
      padding: '4px 10px',
      font: `400 12px/1.2 ${SANS}`,
      color: isNow ? t.inkFaint : t.accent,
      display: 'inline-flex', alignItems: 'baseline', gap: 6,
    }}>
      <span>logging as</span>
      <span style={{
        color: isNow ? t.inkSoft : t.accent,
        font: isNow ? `400 12px ${SANS}` : `500 13px/1 ${SANS}`,
        fontVariantNumeric: 'tabular-nums',
        borderBottom: `1px dashed ${isNow ? t.accentDim : t.accent}`,
        paddingBottom: 1,
      }}>{displayValue}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Picker — Stage 1: quick chips
// ─────────────────────────────────────────────────────────────────────

function PickerStage1({ habitName, onPickRelative, onEarlier }) {
  const { t } = useTokens();
  const chips = [
    { id: '15', label: '15 minutes ago' },
    { id: '30', label: '30 minutes ago' },
    { id: '60', label: '1 hour ago' },
    { id: '120', label: '2 hours ago' },
  ];
  return (
    <>
      <SheetHeader
        kicker="Log time"
        title={<>Log <i>{habitName}</i> as</>} />
      <div style={{
        padding: '20px 22px 24px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {chips.map((c) => (
          <button key={c.id} onClick={() => onPickRelative(c.id)} style={{
            border: `1px solid ${t.rule}`, background: 'transparent',
            color: t.ink, padding: '15px 18px', borderRadius: 14,
            textAlign: 'left', font: `400 16px ${SERIF}`, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              border: `1.5px solid ${t.accentDim}`, flexShrink: 0,
            }} />
            <span style={{ flex: 1 }}>{c.label}</span>
          </button>
        ))}

        <button onClick={onEarlier} style={{
          marginTop: 8, alignSelf: 'flex-start',
          border: 'none', background: 'transparent', cursor: 'pointer',
          font: `500 12px/1 ${SANS}`, color: t.accent,
          letterSpacing: 1.4, textTransform: 'uppercase',
          padding: '10px 6px',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          Earlier <span style={{ fontSize: 14, lineHeight: 1 }}>→</span>
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Picker — Stage 2: today scrubber
// ─────────────────────────────────────────────────────────────────────

function TimeScrubber({ thumbPct, leftLabels, captionRight }) {
  const { t } = useTokens();
  return (
    <div>
      <div style={{ position: 'relative', height: 40 }}>
        {/* base track */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%',
          height: 2, background: t.rule, borderRadius: 1,
          transform: 'translateY(-50%)',
        }} />
        {/* fill */}
        <div style={{
          position: 'absolute', left: 0, top: '50%',
          width: `${thumbPct}%`, height: 2, background: t.accent,
          borderRadius: 1, transform: 'translateY(-50%)',
        }} />
        {/* tick marks every 25% */}
        {[0, 25, 50, 75, 100].map((p) => (
          <div key={p} style={{
            position: 'absolute', left: `${p}%`, top: '50%',
            width: 1, height: 7, background: t.inkFaint, opacity: 0.55,
            transform: 'translate(-50%, -50%)',
          }} />
        ))}
        {/* thumb */}
        <div style={{
          position: 'absolute', left: `${thumbPct}%`, top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 30, height: 30, borderRadius: '50%',
          background: t.card,
          border: `3px solid ${t.accent}`,
          boxShadow: '0 2px 10px rgba(26,24,20,0.18)',
          cursor: 'grab',
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        font: `400 10px ${SANS}`, color: t.inkFaint, letterSpacing: 1.2,
        textTransform: 'uppercase', marginTop: 10,
      }}>
        {leftLabels.map((lab, i) => <span key={i}>{lab}</span>)}
        <span style={{ color: t.inkSoft, fontWeight: 500 }}>{captionRight}</span>
      </div>
    </div>
  );
}

function PickerStage2({ habitName, time, relativeLabel, thumbPct, onBack, onPickDate, onConfirm }) {
  const { t } = useTokens();
  return (
    <>
      <SheetHeader
        onBack={onBack}
        kicker="Log time · today"
        title={<>Log <i>{habitName}</i> as</>} />
      <div style={{
        padding: '22px 22px 24px',
        display: 'flex', flexDirection: 'column', gap: 22,
      }}>
        <TimeScrubber
          thumbPct={thumbPct}
          leftLabels={['06:00', '12:00', '18:00']}
          captionRight="now · 13:34" />

        <div style={{ textAlign: 'center' }}>
          <div style={{
            font: `300 46px/1 ${SERIF}`, color: t.ink,
            letterSpacing: -1.2, fontVariantNumeric: 'tabular-nums',
          }}>{time}</div>
          <div style={{
            font: `400 12px/1 ${SANS}`, color: t.inkSoft,
            marginTop: 10, fontStyle: 'italic',
          }}>{relativeLabel}</div>
        </div>

        <button onClick={onConfirm} style={{
          width: '100%', border: 'none', background: t.ink, color: t.card,
          padding: '15px', borderRadius: 100, cursor: 'pointer',
          font: `500 12px/1 ${SANS}`, letterSpacing: 1.4, textTransform: 'uppercase',
        }}>Log at {time}</button>

        <button onClick={onPickDate} style={{
          alignSelf: 'center',
          border: 'none', background: 'transparent', cursor: 'pointer',
          font: `500 12px/1 ${SANS}`, color: t.accent,
          letterSpacing: 1.4, textTransform: 'uppercase',
          padding: '4px 6px',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          Pick a date <span style={{ fontSize: 14, lineHeight: 1 }}>→</span>
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Picker — Stage 3: any past date + scrubber
// ─────────────────────────────────────────────────────────────────────

// May 2026 — fictional: Thu = May 15. Mon-first.
const MONTH_ROWS = [
  [{d:'28',o:1},{d:'29',o:1},{d:'30',o:1},{d:'1'},{d:'2'},{d:'3'},{d:'4'}],
  [{d:'5'},{d:'6'},{d:'7'},{d:'8'},{d:'9'},{d:'10'},{d:'11'}],
  [{d:'12'},{d:'13',sel:1},{d:'14'},{d:'15',tod:1},{d:'16',dis:1},{d:'17',dis:1},{d:'18',dis:1}],
  [{d:'19',dis:1},{d:'20',dis:1},{d:'21',dis:1},{d:'22',dis:1},{d:'23',dis:1},{d:'24',dis:1},{d:'25',dis:1}],
  [{d:'26',dis:1},{d:'27',dis:1},{d:'28',dis:1},{d:'29',dis:1},{d:'30',dis:1},{d:'31',dis:1},{d:'1',o:1,dis:1}],
];
const DOW = ['M','T','W','T','F','S','S'];

function MiniMonth() {
  const { t } = useTokens();
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <button style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          font: `400 18px ${SERIF}`, color: t.inkSoft, padding: 4,
        }}>‹</button>
        <div style={{
          font: `400 15px ${SERIF}`, color: t.ink, letterSpacing: 0.2,
        }}>May 2026</div>
        <button disabled style={{
          border: 'none', background: 'transparent', cursor: 'default',
          font: `400 18px ${SERIF}`, color: t.inkFaint, padding: 4, opacity: 0.4,
        }}>›</button>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 2, font: `500 9px/1 ${SANS}`, color: t.inkFaint,
        letterSpacing: 1.4, textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        {DOW.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2,
      }}>
        {MONTH_ROWS.flat().map((cell, i) => {
          const muted = cell.o || cell.dis;
          const sel = cell.sel;
          const tod = cell.tod;
          return (
            <button key={i} disabled={cell.dis} style={{
              border: 'none', cursor: cell.dis ? 'default' : 'pointer',
              background: sel ? t.accent : 'transparent',
              color: sel ? t.card : (muted ? t.inkFaint : t.ink),
              padding: '10px 0', borderRadius: 8,
              font: tod
                ? `600 14px ${SANS}`
                : `400 14px ${SERIF}`,
              opacity: cell.dis ? 0.35 : 1,
              position: 'relative',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {cell.d}
              {tod && !sel && (
                <span style={{
                  position: 'absolute', left: '50%', bottom: 4,
                  transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: 2,
                  background: t.accent,
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PickerStage3({ habitName, dayLabel, time, thumbPct, onBack, onConfirm }) {
  const { t } = useTokens();
  return (
    <>
      <SheetHeader
        onBack={onBack}
        kicker="Log time · pick a day"
        title={<>Log <i>{habitName}</i></>} />
      <div style={{
        padding: '18px 22px 24px',
        display: 'flex', flexDirection: 'column', gap: 18,
        flex: 1, overflow: 'auto',
      }}>
        <MiniMonth />

        <div style={{ height: 1, background: t.rule, margin: '4px 0' }} />

        <TimeScrubber
          thumbPct={thumbPct}
          leftLabels={['00:00', '06:00', '12:00', '18:00']}
          captionRight="23:59" />

        <div style={{ textAlign: 'center' }}>
          <div style={{
            font: `400 13px/1 ${SANS}`, color: t.inkSoft,
            letterSpacing: 1.4, textTransform: 'uppercase',
          }}>{dayLabel}</div>
          <div style={{
            font: `300 42px/1 ${SERIF}`, color: t.ink,
            letterSpacing: -1, fontVariantNumeric: 'tabular-nums',
            marginTop: 8,
          }}>{time}</div>
        </div>

        <button onClick={onConfirm} style={{
          width: '100%', border: 'none', background: t.ink, color: t.card,
          padding: '15px', borderRadius: 100, cursor: 'pointer',
          font: `500 12px/1 ${SANS}`, letterSpacing: 1.4, textTransform: 'uppercase',
        }}>Log at this time</button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// LogSheet — day-scoped tick log with < TODAY > selector
// ─────────────────────────────────────────────────────────────────────

const DAYS = [
  // index 0 = today, going backward
  { label: 'Today',           sub: 'Thu · May 15', isToday: true,
    ticks: [
      { time: '13:34', habit: 'Hollow hold, 45s',  group: 'Core' },
      { time: '09:12', habit: 'Hip flexor stretch', group: 'Mobility' },
      { time: '07:48', habit: 'Bar-chord drills',   group: 'Guitar' },
    ] },
  { label: 'Yesterday',       sub: 'Wed · May 14',
    ticks: [
      { time: '21:40', habit: 'Italian — 15 min',  group: 'Languages' },
      { time: '08:00', habit: 'Dead bug, 12 reps', group: 'Core' },
    ] },
  { label: 'Tue · May 13',    sub: '2 days ago',
    ticks: [
      { time: '22:10', habit: 'Spanish — 15 min',   group: 'Languages' },
      { time: '07:30', habit: 'Bird dog, 10/side',  group: 'Core' },
    ] },
  { label: 'Mon · May 12',    sub: '3 days ago',
    ticks: [
      { time: '19:05', habit: 'Mom',                group: 'Calls' },
      { time: '08:14', habit: '90/90 hip switch',   group: 'Mobility' },
    ] },
  { label: 'Sun · May 11',    sub: '4 days ago',  ticks: [] },
  { label: 'Sat · May 10',    sub: '5 days ago',
    ticks: [
      { time: '16:30', habit: 'Floors',             group: 'House' },
      { time: '11:20', habit: 'Glute bridge, 15',   group: 'Core' },
      { time: '08:00', habit: 'Thoracic rotation',  group: 'Mobility' },
    ] },
];

function DaySelector({ idx, onPrev, onNext }) {
  const { t } = useTokens();
  const day = DAYS[idx];
  const canForward = idx > 0;
  const canBack = idx < DAYS.length - 1;
  const arrowStyle = (enabled) => ({
    border: 'none', background: 'transparent',
    cursor: enabled ? 'pointer' : 'default',
    color: enabled ? t.inkSoft : t.inkFaint,
    font: `400 22px/1 ${SERIF}`,
    padding: '8px 12px',
    opacity: enabled ? 1 : 0.35,
  });
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 8px 12px',
    }}>
      <button onClick={canBack ? onPrev : undefined} disabled={!canBack} style={arrowStyle(canBack)}>‹</button>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          font: `400 22px/1.1 ${SERIF}`, color: t.ink, letterSpacing: -0.2,
        }}>{day.label}</div>
        <div style={{
          font: `400 11px ${SANS}`, color: t.inkFaint,
          letterSpacing: 0.4, marginTop: 4,
        }}>{day.sub}</div>
      </div>
      <button onClick={canForward ? onNext : undefined} disabled={!canForward} style={arrowStyle(canForward)}>›</button>
    </div>
  );
}

function LogSheet({ startIdx = 0, onRow }) {
  const { t } = useTokens();
  const [idx, setIdx] = useEt(startIdx);
  const day = DAYS[idx];
  return (
    <BottomSheet height={620}>
      <div style={{
        padding: '0 14px', borderBottom: `1px solid ${t.rule}`, flexShrink: 0,
      }}>
        <div style={{
          font: `500 10px/1 ${SANS}`, letterSpacing: 1.8, color: t.inkSoft,
          textTransform: 'uppercase', textAlign: 'center', marginTop: 4,
        }}>Log</div>
        <DaySelector idx={idx} onPrev={() => setIdx(idx + 1)} onNext={() => setIdx(idx - 1)} />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 0 18px' }}>
        {day.ticks.length === 0 ? (
          <div style={{
            padding: '60px 22px 24px', textAlign: 'center',
            color: t.inkFaint, font: `400 14px/1.5 ${SERIF}`,
            fontStyle: 'italic',
          }}>
            A quiet day — no ticks logged.
          </div>
        ) : day.ticks.map((tk, i) => (
          <button key={i} onClick={() => onRow?.(tk)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 22px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            textAlign: 'left',
            borderTop: i ? `1px solid ${t.rule}` : 'none',
          }}>
            <div style={{
              font: `500 14px ${SANS}`, color: t.ink,
              letterSpacing: 0.3, width: 52,
              fontVariantNumeric: 'tabular-nums',
            }}>{tk.time}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                font: `400 16px/1.2 ${SERIF}`, color: t.ink, marginBottom: 3,
              }}>{tk.habit}</div>
              <div style={{
                font: `500 10px/1 ${SANS}`, color: t.accent,
                letterSpacing: 1.4, textTransform: 'uppercase',
              }}>{tk.group}</div>
            </div>
            <span style={{
              color: t.inkFaint, font: `400 18px/1 ${SERIF}`, opacity: 0.6,
            }}>›</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

Object.assign(window, {
  SheetBackdrop, BottomSheet, SheetHeader,
  EditableUndoToast, HeroEditLabel,
  PickerStage1, PickerStage2, PickerStage3,
  TimeScrubber, MiniMonth,
  LogSheet, DAYS,
});

// screens-extra.jsx — Empty state, Notification preview, Onboarding, Settings, Stats.
// Edit-group reuses CreateScreen with initial={group}.

const { useState: useSx, useEffect: useEx, useMemo: useMx } = React;

// ──────────────────────────────────────────────────────────────
// Empty state — first run, no groups yet
// ──────────────────────────────────────────────────────────────
function EmptyScreen({ go }) {
  const { t, d, tone } = useTokens();
  return (
    <div style={{ background: t.bg, color: t.ink, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <OrbitStrip />
      <OIHead kicker="Welcome" title={tone.emptyHero} />
      <div style={{ flex: 1, padding: `12px ${d.screenPad}px 40px`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
        {/* large faint sample orbit */}
        <div style={{ position: 'relative', width: 220, height: 220, marginTop: 16 }}>
          <svg width="220" height="220" viewBox="0 0 220 220" style={{ overflow: 'visible' }}>
            <circle cx="110" cy="110" r="92" fill="none" stroke={t.accentDim} strokeWidth="1" strokeDasharray="3 4" />
            {[0, 1, 2, 3, 4].map((i) => {
              const a = i / 5 * 360 - 90;
              const r = a * Math.PI / 180;
              const x = 110 + 92 * Math.cos(r);
              const y = 110 + 92 * Math.sin(r);
              return <circle key={i} cx={x} cy={y} r="4" fill={t.accentDim} />;
            })}
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: `400 20px ${SERIF}`, color: t.inkFaint, fontStyle: 'italic'
          }}>your first rotation</div>
        </div>
        <div style={{
          marginTop: 30, font: `400 16px/1.5 ${SERIF}`,
          color: t.inkSoft, textAlign: 'center', maxWidth: 300, textWrap: 'pretty'
        }}>{tone.emptyBody}</div>

        {/* mini examples */}
        <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320 }}>
          <div style={{ font: `500 10px/1 ${SANS}`, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase', marginBottom: 4 }}>For example</div>
          {[
          { name: 'Core', sub: 'plank · dead bug · hollow hold · bird dog', cad: 'daily' },
          { name: 'Languages', sub: 'spanish · french · italian', cad: 'weekdays' },
          { name: 'Calls', sub: 'mom · dad · sister · grandma', cad: 'weekly' }].
          map((ex) =>
          <div key={ex.name} style={{
            padding: '10px 14px', background: t.card, borderRadius: 12,
            border: `1px solid ${t.rule}`,
            display: 'flex', flexDirection: 'column', gap: 2
          }}>
              <div style={{ font: `400 15px ${SERIF}`, color: t.ink }}>{ex.name}</div>
              <div style={{ font: `400 12px ${SANS}`, color: t.inkFaint, fontStyle: 'italic' }}>{ex.sub}</div>
            </div>
          )}
        </div>

        <button onClick={() => go({ name: 'create' })} style={{
          marginTop: 32, border: 'none', background: t.ink, color: t.card,
          padding: '15px 32px', borderRadius: 100, cursor: 'pointer',
          font: `500 13px/1 ${SANS}`, letterSpacing: 1.4, textTransform: 'uppercase'
        }}>{tone.emptyCta}</button>
      </div>
    </div>);

}

// ──────────────────────────────────────────────────────────────
// Notification preview — mock Android lock screen with the ping
// ──────────────────────────────────────────────────────────────
function NotificationPreview({ group }) {
  const { t } = useTokens();
  const g = group || {
    name: 'Core', habits: [{ name: 'Hollow hold, 45s' }], cursor: 0
  };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, #2a2624 0%, #3e3833 40%, #c96442 100%)',
      color: '#fff'
    }}>
      {/* clock */}
      <div style={{ textAlign: 'center', paddingTop: 56 }}>
        <div style={{ font: `300 76px/1 ${SERIF}`, letterSpacing: -2 }}>9:12</div>
        <div style={{ font: `500 14px/1 ${SANS}`, opacity: 0.85, marginTop: 8, letterSpacing: 0.6 }}>
          Thursday, May 15
        </div>
      </div>

      {/* notification card */}
      <div style={{
        position: 'absolute', top: 240, left: 14, right: 14,
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
        borderRadius: 20, padding: '14px 16px',
        boxShadow: '0 18px 60px rgba(0,0,0,0.4)',
        color: '#1a1814'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: '#c96442', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', font: `600 11px ${SANS}`
          }}>◯</div>
          <div style={{ font: `600 11px/1 ${SANS}`, color: '#7a766e', letterSpacing: 0.5 }}>
            ORBIT · now
          </div>
        </div>
        <div style={{ font: `500 15px/1.25 ${SANS}`, color: '#1a1814' }}>
          {g.name} · your turn
        </div>
        <div style={{ font: `400 14px/1.35 ${SERIF}`, color: '#1a1814', marginTop: 4 }}>
          Up next: {g.habits[g.cursor]?.name || g.habits[0].name}
        </div>
        <div style={{ marginTop: 12 }}>
          <SlideToConfirm
            label="Slide to mark done"
            doneLabel="Logged ✓"
            onConfirm={() => {}}
            trackColor="#1a1814"
            fillColor="#c96442"
            handleColor="#fff"
            textColor="rgba(255,255,255,0.7)"
            height={44}
            resetMs={900} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button style={{
            border: '1px solid #e7dccf', background: 'transparent', color: '#7a766e',
            padding: '7px 14px', borderRadius: 100, cursor: 'pointer',
            font: `500 11px/1 ${SANS}`, letterSpacing: 0.8, textTransform: 'uppercase'
          }}>Snooze 1h</button>
          <button style={{
            border: '1px solid #e7dccf', background: 'transparent', color: '#7a766e',
            padding: '7px 14px', borderRadius: 100, cursor: 'pointer',
            font: `500 11px/1 ${SANS}`, letterSpacing: 0.8, textTransform: 'uppercase'
          }}>Skip</button>
        </div>
      </div>

      {/* fingerprint hint */}
      <div style={{
        position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
        width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          width: 20, height: 20, border: '1.5px solid rgba(255,255,255,0.55)',
          borderRadius: '50%'
        }} />
      </div>
      <div style={{
        position: 'absolute', bottom: 24, left: 0, right: 0,
        textAlign: 'center', font: `500 11px/1 ${SANS}`, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5
      }}>swipe up to unlock</div>
    </div>);

}

// ──────────────────────────────────────────────────────────────
// Onboarding — three pages, swipe between, last page hands off to Create
// ──────────────────────────────────────────────────────────────
function OnboardingScreen({ onFinish, step = 0 }) {
  const { t, d } = useTokens();
  const [cur, setCur] = useSx(step);

  const PAGES = [
  {
    kicker: 'How orbit works',
    title: 'Habits take turns.',
    body: 'A rotation is a small set of related practices that cycle. One pings you at a time — when it\'s done, the next one comes up.',
    illo: <OnbRingIllo />
  },
  {
    kicker: 'Pick a cadence',
    title: 'You set the pace.',
    body: 'Daily, weekdays, every other day, a few times a week. The ring waits between cycles; it never doubles up.',
    illo: <OnbCadenceIllo />
  },
  {
    kicker: 'Start small',
    title: 'Three habits is enough.',
    body: 'Five different ab exercises. Three languages. Four people to call. One small set, taking turns. That\'s it.',
    illo: <OnbQueueIllo />
  }];

  const page = PAGES[cur];

  return (
    <div style={{ background: t.bg, color: t.ink, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <OrbitStrip />
      <div style={{ padding: '20px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {PAGES.map((_, i) =>
          <div key={i} style={{
            width: i === cur ? 22 : 6, height: 6, borderRadius: 3,
            background: i === cur ? t.accent : t.accentDim,
            transition: 'width .25s'
          }} />
          )}
        </div>
        {cur < PAGES.length - 1 &&
        <button onClick={onFinish} style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          font: `500 12px ${SANS}`, color: t.inkSoft, letterSpacing: 0.5
        }}>Skip</button>
        }
      </div>

      <div style={{ flex: 1, padding: `32px ${d.screenPad}px 24px`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {page.illo}
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{
            font: `500 11px/1 ${SANS}`, letterSpacing: 1.8, color: t.accent,
            textTransform: 'uppercase', marginBottom: 14
          }}>{page.kicker}</div>
          <div style={{
            font: `400 30px/1.1 ${SERIF}`, color: t.ink, letterSpacing: -0.4,
            marginBottom: 14, textWrap: 'pretty'
          }}>{page.title}</div>
          <div style={{
            font: `400 16px/1.5 ${SERIF}`, color: t.inkSoft, textWrap: 'pretty'
          }}>{page.body}</div>
        </div>
      </div>

      <div style={{ padding: '0 22px 32px' }}>
        <button onClick={() => cur < PAGES.length - 1 ? setCur(cur + 1) : onFinish()} style={{
          width: '100%', border: 'none', borderRadius: 100,
          background: t.ink, color: t.card, padding: '15px',
          cursor: 'pointer', font: `500 13px/1 ${SANS}`, letterSpacing: 1.4, textTransform: 'uppercase'
        }}>{cur < PAGES.length - 1 ? 'Continue' : 'Make my first rotation'}</button>
      </div>
    </div>);

}

function OnbRingIllo() {
  const { t } = useTokens();
  return (
    <svg width="240" height="240" viewBox="0 0 240 240">
      <circle cx="120" cy="120" r="92" fill="none" stroke={t.accentDim} strokeWidth="1" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = i / 5 * 360 - 90;
        const r = a * Math.PI / 180;
        const x = 120 + 92 * Math.cos(r);
        const y = 120 + 92 * Math.sin(r);
        const isNow = i === 0;
        return (
          <g key={i}>
            {isNow && <circle cx={x} cy={y} r="20" fill={t.accent} opacity="0.15" />}
            <circle cx={x} cy={y} r={isNow ? 11 : 5}
            fill={isNow ? t.accent : t.card}
            stroke={isNow ? t.accent : t.accentDim} strokeWidth={isNow ? 0 : 1.5} />
            {isNow && <circle cx={x} cy={y} r="4" fill={t.card} />}
          </g>);

      })}
      <text x="120" y="124" textAnchor="middle"
      style={{ font: `400 17px/1 ${SERIF}`, fill: t.ink }}>Habit 1</text>
      <text x="120" y="148" textAnchor="middle"
      style={{ font: `500 9px/1 ${SANS}`, fill: t.accent, letterSpacing: 1.5 }}>NOW</text>
    </svg>);

}

function OnbCadenceIllo() {
  const { t } = useTokens();
  const cells = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {cells.map((c, i) =>
        <div key={i} style={{
          width: 28, height: 36, borderRadius: 8,
          background: i < 5 ? t.accentSoft : t.card,
          border: `1px solid ${t.accentDim}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4
        }}>
            <div style={{ font: `500 10px ${SANS}`, color: i < 5 ? t.accent : t.inkFaint, letterSpacing: 0.5 }}>{c}</div>
            {i < 5 && <div style={{ width: 4, height: 4, borderRadius: 2, background: t.accent }} />}
          </div>
        )}
      </div>
      <div style={{ font: `400 13px ${SANS}`, color: t.inkSoft, fontStyle: 'italic' }}>
        e.g. Weekdays
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {['Once a day', 'Every 2 days', '3×/week'].map((c, i) =>
        <div key={i} style={{
          padding: '7px 12px', borderRadius: 100,
          background: i === 0 ? t.ink : t.card,
          color: i === 0 ? t.card : t.inkSoft,
          font: `500 11px ${SANS}`,
          border: i === 0 ? 'none' : `1px solid ${t.accentDim}`
        }}>{c}</div>
        )}
      </div>
    </div>);

}

function OnbQueueIllo() {
  const { t } = useTokens();
  const items = ['Plank, 60s', 'Dead bug', 'Hollow hold', 'Bird dog', 'Glute bridge'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 260 }}>
      {items.map((h, i) =>
      <div key={i} style={{
        padding: '10px 14px', borderRadius: 12,
        background: t.card, border: `1px solid ${t.rule}`,
        display: 'flex', alignItems: 'center', gap: 12,
        opacity: 1 - i * 0.12
      }}>
          {i === 0 ? (
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: t.accent,
              color: t.card, font: `500 11px ${SANS}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✓</div>
          ) : (
            <div style={{
              width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%',
                border: `1.5px solid ${t.accentDim}` }} />
            </div>
          )}
          <div style={{ flex: 1, font: `400 15px ${SERIF}`, color: i === 0 ? t.ink : t.inkSoft }}>{h}</div>
          {i === 0 && <div style={{ font: `500 10px ${SANS}`, color: t.accent, letterSpacing: 1, textTransform: 'uppercase' }}>NOW</div>}
        </div>
      )}
    </div>);

}

// ──────────────────────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────────────────────
function SettingsScreen() {
  const { t, d } = useTokens();
  const [active, setActive] = useSx({ start: '08:00', end: '22:00' });
  return (
    <div style={{ background: t.bg, color: t.ink, minHeight: '100%' }}>
      <OrbitStrip />
      <OIHead kicker="Preferences" title="Settings" />

      <SettingsSection title="Reminders">
        <SettingRow label="Active hours"
                    sub={`Pings only between ${active.start} and ${active.end}. Outside the window the app stays quiet.`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="time" value={active.start} onChange={(e) => setActive({ ...active, start: e.target.value })}
              style={{ border: `1px solid ${t.accentDim}`, borderRadius: 8, padding: '6px 8px',
                background: t.card, font: `500 12px ${SANS}`, color: t.ink, width: 88 }} />
            <span style={{ color: t.inkFaint, font: `400 12px ${SANS}` }}>–</span>
            <input type="time" value={active.end} onChange={(e) => setActive({ ...active, end: e.target.value })}
              style={{ border: `1px solid ${t.accentDim}`, borderRadius: 8, padding: '6px 8px',
                background: t.card, font: `500 12px ${SANS}`, color: t.ink, width: 88 }} />
          </div>
        </SettingRow>
        <SettingRow label="Spread reminders"
                    sub="Scatter pings across the active window so they don't all land at once">
          <Toggle on={true} onChange={() => {}} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingRow label="Export history" sub="Download all logged ticks as CSV">
          <span style={{ font: `500 12px ${SANS}`, color: t.accent }}>Export</span>
        </SettingRow>
        <SettingRow label="Backup & restore" sub="To Google Drive">
          <span style={{ font: `400 13px ${SERIF}`, color: t.inkSoft }}>›</span>
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="About">
        <SettingRow label="Orbit + Ink" sub="v0.4 · habit rotation" />
        <SettingRow label="The metaphor" sub="Why we chose a ring" />
        <SettingRow label="Open source" sub="MIT · view on GitHub" />
      </SettingsSection>

      <div style={{ padding: `4px ${d.screenPad}px 32px`, font: `400 12px/1.5 ${SERIF}`, color: t.inkFaint, textAlign: 'center', fontStyle: 'italic' }}>
        Built for habits that don't fit a checklist.
      </div>
    </div>);

}

function SettingsSection({ title, children }) {
  const { t, d } = useTokens();
  return (
    <div style={{ padding: `4px ${d.screenPad}px 12px` }}>
      <div style={{
        font: `500 11px/1 ${SANS}`, letterSpacing: 1.8,
        color: t.inkSoft, textTransform: 'uppercase', margin: '14px 4px 10px'
      }}>{title}</div>
      <div style={{ background: t.card, borderRadius: 16, overflow: 'hidden' }}>
        {children}
      </div>
    </div>);

}
function SettingRow({ label, sub, children }) {
  const { t } = useTokens();
  return (
    <div style={{
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      borderTop: `1px solid ${t.rule}`
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: `400 15px ${SERIF}`, color: t.ink }}>{label}</div>
        {sub && <div style={{ font: `400 12px/1.3 ${SANS}`, color: t.inkSoft, marginTop: 3 }}>{sub}</div>}
      </div>
      {children}
    </div>);

}
function Toggle({ on, onChange }) {
  const { t } = useTokens();
  return (
    <button onClick={() => onChange(!on)} style={{
      border: 'none', cursor: 'pointer',
      width: 40, height: 22, borderRadius: 100,
      background: on ? t.accent : t.accentDim,
      position: 'relative', transition: 'background .2s'
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 18, height: 18, borderRadius: '50%', background: t.card,
        transition: 'left .2s'
      }} />
    </button>);

}

// ──────────────────────────────────────────────────────────────
// Stats — completions, streaks, by-group breakdown
// ──────────────────────────────────────────────────────────────
function StatsScreen({ groups }) {
  const { t, d } = useTokens();
  // Mock data — deterministic for visual stability
  const weeks = 12;
  const ticksByDay = useMx(() => {
    const out = [];
    for (let i = 0; i < weeks * 7; i++) {
      // simple deterministic pseudo-random pattern
      const v = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * 0.5 + 0.5;
      out.push(v > 0.35 ? Math.round(v * 4) : 0);
    }
    return out;
  }, []);

  const totalDone = ticksByDay.reduce((a, b) => a + b, 0);
  const streak = 11;
  const completion = 0.82;

  // Per-group activity — a recent ticks strip (last 10 events).
  // No % bars; rotation has no end to measure progress against.
  const groupActivity = (groups || SAMPLE_GROUPS).slice(0, 5).map((g, i) => {
    // deterministic "recent events" pattern per group
    const recent = Array.from({ length: 10 }).map((_, k) => {
      const v = (Math.sin((i + 1) * (k + 1) * 0.7) + Math.cos((i + 1) * 1.3)) * 0.5 + 0.5;
      if (v > 0.7) return 'done';
      if (v > 0.35) return 'done';
      return 'skip';
    });
    const ticksPerWeek = Math.round(3 + Math.sin(i * 1.7) * 2.4);
    return { name: g.name, recent, ticksPerWeek, last: g.lastDone, n: g.habits.length };
  });

  return (
    <div style={{ background: t.bg, color: t.ink, minHeight: '100%' }}>
      <OrbitStrip />
      <OIHead kicker="Last 12 weeks" title="Insights" />

      {/* big numbers */}
      <div style={{ padding: `0 ${d.screenPad}px 8px`, display: 'flex', gap: 12 }}>
        <StatBigCard label="Streak" value={`${streak} days`} hint="Current" />
        <StatBigCard label="Completion" value={`${Math.round(completion * 100)}%`} hint="Of due ticks" />
      </div>
      <div style={{ padding: `0 ${d.screenPad}px 14px` }}>
        <div style={{
          background: t.card, borderRadius: 18, padding: 18, boxShadow: t.shadow
        }}>
          <div style={{ font: `500 11px/1 ${SANS}`, letterSpacing: 1.5, color: t.inkSoft, textTransform: 'uppercase', marginBottom: 4 }}>Total ticks</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ font: `400 42px/1 ${SERIF}`, color: t.ink, letterSpacing: -1 }}>{totalDone}</div>
            <div style={{ font: `400 13px ${SANS}`, color: t.inkSoft }}>in 84 days</div>
          </div>
        </div>
      </div>

      {/* heatmap */}
      <div style={{ padding: `4px ${d.screenPad}px 14px` }}>
        <div style={{ font: `500 11px/1 ${SANS}`, letterSpacing: 1.5, color: t.inkSoft, textTransform: 'uppercase', marginBottom: 10 }}>Activity</div>
        <div style={{
          background: t.card, borderRadius: 18, padding: 18, boxShadow: t.shadow,
          display: 'flex', flexDirection: 'column', gap: 4
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks}, 1fr)`, gridAutoRows: '14px', gap: 3 }}>
            {Array.from({ length: 7 * weeks }).map((_, idx) => {
              const week = idx % weeks;
              const day = Math.floor(idx / weeks);
              const v = ticksByDay[day * weeks + week] || 0;
              const op = v === 0 ? 0.12 : 0.25 + v * 0.2;
              return (
                <div key={idx} style={{
                  background: v === 0 ? t.accentDim : t.accent,
                  opacity: op, borderRadius: 3
                }} />);

            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, font: `400 10px ${SANS}`, color: t.inkFaint }}>
            <div>12 wk ago</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span>Less</span>
              {[0.12, 0.35, 0.55, 0.75, 0.95].map((o, i) =>
              <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: i === 0 ? t.accentDim : t.accent, opacity: o }} />
              )}
              <span>More</span>
            </div>
          </div>
        </div>
      </div>

      {/* by group */}
      <div style={{ padding: `4px ${d.screenPad}px 32px` }}>
        <div style={{ font: `500 11px/1 ${SANS}`, letterSpacing: 1.5, color: t.inkSoft, textTransform: 'uppercase', marginBottom: 10 }}>By rotation</div>
        <div style={{ background: t.card, borderRadius: 18, padding: '4px 0', boxShadow: t.shadow }}>
          {groupActivity.map((g, i) =>
          <div key={g.name} style={{
            padding: '14px 18px',
            borderTop: i ? `1px solid ${t.rule}` : 'none',
            display: 'flex', flexDirection: 'column', gap: 8
          }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ font: `400 17px ${SERIF}`, color: t.ink }}>{g.name}</div>
                <div style={{ font: `400 12px ${SANS}`, color: t.inkSoft }}>
                  <span style={{ font: `500 14px ${SANS}`, color: t.ink }}>{g.ticksPerWeek}</span> / wk
                </div>
              </div>
              {/* recent ticks strip — most recent on the right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ font: `500 9px/1 ${SANS}`, color: t.inkFaint, letterSpacing: 1, textTransform: 'uppercase', width: 38 }}>Recent</div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {g.recent.map((kind, k) => (
                    <div key={k} title={kind} style={{
                      width: kind === 'done' ? 9 : 7,
                      height: kind === 'done' ? 9 : 7,
                      borderRadius: '50%',
                      background: kind === 'done' ? t.accent : 'transparent',
                      border: kind === 'done' ? 'none' : `1.5px solid ${t.accentDim}`,
                      opacity: 0.45 + k * 0.055,
                    }} />
                  ))}
                </div>
              </div>
              <div style={{ font: `400 11px ${SANS}`, color: t.inkFaint, fontStyle: 'italic' }}>{g.last} · {g.n} habits</div>
            </div>
          )}
        </div>
      </div>
    </div>);

}

function StatBigCard({ label, value, hint }) {
  const { t } = useTokens();
  return (
    <div style={{
      flex: 1, background: t.card, borderRadius: 18, padding: 18, boxShadow: t.shadow
    }}>
      <div style={{ font: `500 11px/1 ${SANS}`, letterSpacing: 1.5, color: t.inkSoft, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ font: `400 28px/1.1 ${SERIF}`, color: t.ink, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ font: `400 11px ${SANS}`, color: t.inkFaint, marginTop: 4 }}>{hint}</div>
    </div>);

}

Object.assign(window, {
  EmptyScreen, NotificationPreview, OnboardingScreen, SettingsScreen, StatsScreen
});
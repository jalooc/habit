// edit-time-hosts.jsx — artboard scenes for the edit-time exploration.
//
// Each host renders one design state inside a Phone frame. The hosts pin
// the underlying screen behind any sheet so the design always reads in
// context.

const { useState: useEth, useRef: useEthR } = React;

// ─── Shared: pinned Today behind a sheet ────────────────────────────
function PinnedToday() {
  const [groups, setGroups] = useEth(SAMPLE_GROUPS);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <TodayScreen groups={groups} setGroups={setGroups} go={() => {}} ringId="orbit" />
      </div>
      <TabBar active="home" onTab={() => {}} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Artboard 1 — Editable toast on Today
// ────────────────────────────────────────────────────────────────────

function ToastDemoHost() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <PinnedTodayInner />
      </div>
      <TabBar active="home" onTab={() => {}} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 80, pointerEvents: 'none' }}>
        <EditableUndoToast
          visible
          label={<>Logged · <i>Hollow hold</i></>}
          time="13:34"
          onEdit={() => {}}
          onUndo={() => {}} />
      </div>
    </div>
  );
}

function PinnedTodayInner() {
  const [groups, setGroups] = useEth(SAMPLE_GROUPS);
  return <TodayScreen groups={groups} setGroups={setGroups} go={() => {}} ringId="orbit" />;
}

// ────────────────────────────────────────────────────────────────────
// Artboards 2 + 3 — Group hero with edit label
//
// Mirrors GroupScreen's hero + queue layout but injects HeroEditLabel
// directly beneath SlideToConfirm.
// ────────────────────────────────────────────────────────────────────

function GroupHeroWithEditLabel({ stagedTime, onLabelClick }) {
  const { t, d, tone, ring } = useTokens();
  const group = SAMPLE_GROUPS.find(g => g.id === 'core');
  const queue = queueOrder(group);
  const Variant = RING_VARIANTS.orbit;
  const Ring = Variant.Ring;
  return (
    <div style={{ background: t.bg, color: t.ink, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <OrbitStrip />
        <OIHead onBack={() => {}}
          kicker={group.cadence.label}
          title={group.name}
          action={
            <button style={{
              border: `1px solid ${t.accentDim}`, background: t.card,
              padding: '6px 12px', borderRadius: 100, cursor: 'pointer',
              font: `500 12px/1 ${SANS}`, color: t.inkSoft,
            }}>Edit</button>
          } />

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

        <div style={{ padding: `4px ${d.screenPad}px 18px` }}>
          <div style={{
            position: 'relative',
            background: t.card, borderRadius: 28, padding: d.ringBoxPad,
            boxShadow: t.shadow,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <Ring group={group} size={ring.hero + 6} rotating={false} />
            <div style={{ width: '100%', marginTop: 22 }}>
              <SlideToConfirm
                label={`Slide · ${tone.markDone.toLowerCase()}`}
                doneLabel={stagedTime ? `Logged ${stagedTime} ✓` : tone.logged}
                onConfirm={() => {}} />
              <div style={{
                marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
              }}>
                <HeroEditLabel time={stagedTime} onClick={onLabelClick} />
                <span aria-hidden="true" style={{
                  width: 3, height: 3, borderRadius: 2, background: t.inkFaint, opacity: 0.6,
                }} />
                <button style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
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
            </div>
          </div>
        </div>

        {/* Compact teaser of the queue so the hero doesn't float */}
        <div style={{ padding: `0 ${d.screenPad}px` }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginBottom: 12,
          }}>
            <div style={{
              font: `500 11px/1 ${SANS}`, letterSpacing: 1.8,
              color: t.inkSoft, textTransform: 'uppercase',
            }}>{tone.theQueue}</div>
            <div style={{ font: `400 11px ${SANS}`, color: t.inkFaint }}>
              Swipe a row to log it
            </div>
          </div>
        </div>
        <div style={{ padding: `0 ${d.screenPad - 6}px 24px` }}>
          <div style={{ background: t.card, borderRadius: 18, overflow: 'hidden' }}>
            {queue.slice(0, 3).map((h, i) => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: t.card,
                borderTop: i ? `1px solid ${t.rule}` : 'none',
              }}>
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
                  flex: 1, font: `400 16px/1.3 ${SERIF}`,
                  color: i === 0 ? t.ink : t.inkSoft,
                }}>{h.name}</div>
                {i === 0 && (
                  <div style={{
                    font: `500 10px/1 ${SANS}`, color: t.accent,
                    letterSpacing: 1, textTransform: 'uppercase',
                  }}>NOW</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <TabBar active="groups" onTab={() => {}} />
    </div>
  );
}

function HeroLabelDefaultHost() {
  return <GroupHeroWithEditLabel stagedTime={null} onLabelClick={() => {}} />;
}
function HeroLabelStagedHost() {
  return <GroupHeroWithEditLabel stagedTime="13:04" onLabelClick={() => {}} />;
}

// ────────────────────────────────────────────────────────────────────
// Artboards 4–6 — Picker over Today (interactive stage navigation)
// ────────────────────────────────────────────────────────────────────

function PickerHost({ initialStage }) {
  const [stage, setStage] = useEth(initialStage);
  const habitName = 'Hollow hold';
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PinnedTodayInner />
      </div>
      <TabBar active="home" onTab={() => {}} />
      <SheetBackdrop onDismiss={() => {}} />
      {stage === 1 && (
        <BottomSheet height={460}>
          <PickerStage1
            habitName={habitName}
            onPickRelative={() => {}}
            onEarlier={() => setStage(2)} />
        </BottomSheet>
      )}
      {stage === 2 && (
        <BottomSheet height={560}>
          <PickerStage2
            habitName={habitName}
            time="13:04"
            relativeLabel="30 minutes ago"
            thumbPct={94}
            onBack={() => setStage(1)}
            onPickDate={() => setStage(3)}
            onConfirm={() => {}} />
        </BottomSheet>
      )}
      {stage === 3 && (
        <BottomSheet height={750}>
          <PickerStage3
            habitName={habitName}
            dayLabel="Tue · May 13"
            time="21:30"
            thumbPct={89.6}
            onBack={() => setStage(2)}
            onConfirm={() => {}} />
        </BottomSheet>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Artboards 7 + 8 — Log sheet over Today
// ────────────────────────────────────────────────────────────────────

function LogSheetHost({ startIdx }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PinnedTodayInner />
      </div>
      <TabBar active="home" onTab={() => {}} />
      <SheetBackdrop onDismiss={() => {}} />
      <LogSheet startIdx={startIdx} onRow={() => {}} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Artboard 9 — Insights with a tappable heatmap cell highlighted
// ────────────────────────────────────────────────────────────────────

function InsightsEntryHost() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <StatsScreen groups={SAMPLE_GROUPS} />
      </div>
      <TabBar active="stats" onTab={() => {}} />
      {/* Floating annotation pointing at the heatmap */}
      <InsightsHeatmapAnnotation />
    </div>
  );
}

// Position a focus ring + small "Tap → see the day" annotation over the
// heatmap area. Coordinates are tuned to the StatsScreen layout at 412px.
function InsightsHeatmapAnnotation() {
  const { t } = useTokens();
  // The heatmap card sits ~318px from top in the Insights screen.
  // We highlight a cell near the right edge (recent) on a middle row.
  return (
    <>
      {/* highlight ring around one cell */}
      <div style={{
        position: 'absolute',
        right: 38, top: 412,
        width: 26, height: 26, borderRadius: 8,
        border: `2px solid ${t.accent}`,
        boxShadow: `0 0 0 4px ${t.bg}, 0 0 0 6px ${t.accent}`,
        pointerEvents: 'none',
      }} />
      {/* tooltip */}
      <div style={{
        position: 'absolute',
        right: 22, top: 446,
        background: t.ink, color: t.card,
        padding: '8px 12px', borderRadius: 100,
        font: `400 11px ${SERIF}`,
        boxShadow: t.shadow,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ opacity: 0.8 }}>Tap any cell</span>
        <span style={{
          font: `500 10px/1 ${SANS}`, color: t.accent,
          letterSpacing: 1.2, textTransform: 'uppercase',
        }}>see day's log</span>
      </div>
    </>
  );
}

Object.assign(window, {
  PinnedToday, PinnedTodayInner,
  ToastDemoHost,
  GroupHeroWithEditLabel, HeroLabelDefaultHost, HeroLabelStagedHost,
  PickerHost,
  LogSheetHost,
  InsightsEntryHost,
});

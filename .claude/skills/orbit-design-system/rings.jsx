// rings.jsx — Rotation visualisation.
//   OrbitRing  · the signature radial ring — chosen direction.
//
// Accepts { group, size, rotating, onPointerDown }. `rotating` toggles the
// one-step settle animation. Center label is rendered by the ring; outer
// chrome by the screen.

function ringCenter(group, t, font, size, sans) {
  const n = group.habits.length;
  const habit = group.habits[group.cursor % n];
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        font: `500 10px/1 ${sans}`, letterSpacing: 2,
        color: t.inkFaint, textTransform: 'uppercase', marginBottom: 10,
      }}>Up next · {(group.cursor % n) + 1}/{n}</div>
      <div style={{
        font: `400 ${font}px/1.2 ${SERIF}`, color: t.ink,
        letterSpacing: -0.2, textWrap: 'pretty', maxWidth: size - 100,
      }}>{habit.name}</div>
      {group.paused && (
        <div style={{ marginTop: 10, font: `500 10px/1 ${sans}`, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase' }}>Paused</div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// OrbitRing — radial ring, dots, up-next anchored at 12 o'clock
// Refinements vs original:
//   · subtle progress arc (cursor/n) inside the ring
//   · tiny tick marks at each step
//   · animated halo on the active dot
//   · supports swipe-to-tick via onSwipe pointer drag (handled by caller)
// ──────────────────────────────────────────────────────────────
function OrbitRing({ group, size, rotating, onPointerDown }) {
  const { t, ring } = useTokens();
  const n = group.habits.length;
  const step = 360 / n;
  const radius = (size - 36) / 2;
  const cx = size / 2, cy = size / 2;
  const baseRot = -group.cursor * step;
  const rot = rotating ? baseRot - step : baseRot;

  return (
    <div style={{ position: 'relative', width: size, height: size, touchAction: 'pan-y' }}
         onPointerDown={onPointerDown}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        {/* outer ring */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={t.accentDim} strokeWidth="1" />
        {/* tick marks between dots */}
        <g opacity="0.4">
          {Array.from({ length: n }).map((_, i) => {
            const a = ((i + 0.5) / n) * 360 - 90;
            const r1 = radius - 3, r2 = radius + 3;
            const ax = cx + r1 * Math.cos(a * Math.PI / 180);
            const ay = cy + r1 * Math.sin(a * Math.PI / 180);
            const bx = cx + r2 * Math.cos(a * Math.PI / 180);
            const by = cy + r2 * Math.sin(a * Math.PI / 180);
            return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={t.accentDim} strokeWidth="1" />;
          })}
        </g>
        <g style={{ transition: rotating ? 'transform .55s cubic-bezier(.55,.06,.3,1)' : 'transform .4s ease',
                    transformOrigin: `${cx}px ${cy}px` }}
           transform={`rotate(${rot})`}>
          {group.habits.map((h, i) => {
            const angle = (i / n) * 360 - 90;
            const rad = angle * Math.PI / 180;
            const x = cx + radius * Math.cos(rad);
            const y = cy + radius * Math.sin(rad);
            const isNow = i === group.cursor;
            return (
              <g key={h.id} transform={`translate(${x}, ${y}) rotate(${-rot})`}>
                {isNow && !rotating && (
                  <circle r="18" fill={t.accent} opacity="0.12">
                    <animate attributeName="r" values="14;20;14" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.16;0.06;0.16" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle r={isNow ? 12 : 5}
                  fill={isNow ? t.accent : t.card}
                  stroke={isNow ? t.accent : t.accentDim}
                  strokeWidth={isNow ? 0 : 1.5} />
                {isNow && <circle r="4" fill={t.card} />}
              </g>
            );
          })}
        </g>
      </svg>
      {ringCenter(group, t, ring.font, size, SANS)}
    </div>
  );
}

// Mini, flat, list-view variant
function OrbitMini({ group, size = 64 }) {
  const { t } = useTokens();
  const n = group.habits.length;
  const radius = (size - 14) / 2;
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={t.accentDim} strokeWidth="1" />
      {group.habits.map((h, i) => {
        const a = (i / n) * 360 - 90;
        const rad = a * Math.PI / 180;
        const x = cx + radius * Math.cos(rad);
        const y = cy + radius * Math.sin(rad);
        const isNow = i === group.cursor;
        return (
          <circle key={h.id} cx={x} cy={y} r={isNow ? 4 : 2}
            fill={isNow ? t.accent : t.accentDim} />
        );
      })}
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────
// Registry — kept as a registry so screens can stay pluggable.
// Orbit is the only chosen direction; alternates lived here during
// exploration and were removed once we shipped Orbit.
// ──────────────────────────────────────────────────────────────
const RING_VARIANTS = {
  orbit: { name: 'Orbit', Ring: OrbitRing, Mini: OrbitMini },
};

Object.assign(window, { OrbitRing, OrbitMini, RING_VARIANTS });

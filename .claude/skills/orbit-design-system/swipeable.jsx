// swipeable.jsx — slide-to-act gestures, modelled on react-native-gesture-
// handler's <ReanimatedSwipeable>. Two flavors, one mental model:
//
//   <Swipeable onTrigger>row</Swipeable>
//     Drag a row horizontally. A colored "DONE" pane is revealed behind it.
//     Past threshold (default 45% of width), release fires onTrigger and
//     the row glides off-screen. Under threshold, the row springs back.
//     Vertical drags bail out so list scrolling still works.
//
//   <SlideToConfirm onConfirm label />
//     A pill with a draggable handle. Drag past ~90% to fire. Used as the
//     primary "Mark done" CTA — replaces the tap button on hero rings.
//
// Both use the same pointer protocol: capture pointer-down, attach window-
// level move/up listeners so dragging works even when the pointer leaves
// the element (the row itself moves out from under it).

const { useState: useSt, useRef: useRf, useEffect: useEf, useCallback: useCb } = React;

function Swipeable({
  children,
  onTrigger,                  // (dir: 'right' | 'left') => void
  threshold = 0.42,           // fraction of width that arms the trigger
  direction = 'right',        // 'right' | 'left' | 'both'
  rightBackground,            // {color, label, icon}  shown while swiping right
  leftBackground,             // {color, label, icon}  shown while swiping left
  disabled = false,
  style,
  height,
}) {
  const wrapRef = useRf(null);
  const txRef = useRf(0);
  const widthRef = useRf(0);
  const [tx, setTx] = useSt(0);
  const [dragging, setDragging] = useSt(false);
  const [armed, setArmed] = useSt(false);
  const [exiting, setExiting] = useSt(false);
  const cleanupRef = useRf(null);

  const allowRight = direction === 'right' || direction === 'both';
  const allowLeft  = direction === 'left'  || direction === 'both';

  const setX = (v) => { txRef.current = v; setTx(v); };

  const onPointerDown = (e) => {
    if (disabled || exiting) return;
    // Ignore mouse right-click / middle-click; allow primary mouse + all touch.
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    widthRef.current = wrapRef.current?.offsetWidth || 1;
    const startX = e.clientX;
    const startY = e.clientY;
    let captured = false;

    const onMove = (ev) => {
      let dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!captured) {
        // Hold off until movement clearly committed to one axis.
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) { cleanup(); return; }
        captured = true;
        setDragging(true);
      }
      if (!allowRight && dx > 0) dx = 0;
      if (!allowLeft  && dx < 0) dx = 0;
      // Rubber-band past 90% of width
      const w = widthRef.current;
      const cap = w * 0.9;
      if (Math.abs(dx) > cap) {
        const over = Math.abs(dx) - cap;
        dx = Math.sign(dx) * (cap + over * 0.25);
      }
      setX(dx);
      setArmed(Math.abs(dx) / w >= threshold);
    };

    const onUp = () => {
      cleanupListeners();
      const w = widthRef.current;
      const past = Math.abs(txRef.current) / w >= threshold;
      setDragging(false);
      if (past && onTrigger) {
        setExiting(true);
        const dir = Math.sign(txRef.current) || 1;
        setX(dir * w);            // fly off-screen
        setTimeout(() => {
          onTrigger(dir > 0 ? 'right' : 'left');
          // If host left us mounted, snap back invisibly.
          setExiting(false);
          setArmed(false);
          setX(0);
        }, 220);
      } else {
        setX(0);
        setArmed(false);
      }
    };

    const cleanupListeners = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      cleanupRef.current = null;
    };
    const cleanup = () => {
      cleanupListeners();
      setDragging(false);
      setArmed(false);
      setX(0);
    };

    cleanupRef.current = cleanupListeners;
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  };

  useEf(() => () => { cleanupRef.current?.(); }, []);

  const w = widthRef.current;
  const progress = w ? Math.min(1, Math.abs(tx) / w) : 0;
  const side = tx >= 0 ? 'right' : 'left';
  const bg = side === 'right' ? rightBackground : leftBackground;

  return (
    <div ref={wrapRef} style={{
      position: 'relative',
      overflow: 'hidden',
      height,
      ...(style || {}),
    }}>
      {bg && (
        <SwipeReveal
          progress={progress}
          armed={armed}
          side={side}
          config={bg} />
      )}
      <div
        onPointerDown={onPointerDown}
        style={{
          transform: `translate3d(${tx}px,0,0)`,
          transition: dragging
            ? 'none'
            : exiting
              ? 'transform .22s ease-out'
              : 'transform .34s cubic-bezier(.2,.85,.25,1)',
          willChange: 'transform',
          touchAction: 'pan-y',
          userSelect: dragging ? 'none' : 'auto',
        }}>
        {children}
      </div>
    </div>
  );
}

function SwipeReveal({ progress, armed, side, config }) {
  const { color, fg = '#fff', label = 'DONE', icon = '✓' } = config || {};
  const isRight = side === 'right';
  // Keep the colored pane fully opaque so the white label always sits on a
  // solid background (was: opacity 0.45 → 1 on the whole pane, which let the
  // row surface beneath bleed through and crushed text contrast). Ramp the
  // inner content's opacity instead — the pane is hidden by the row anyway
  // until it slides aside, so the "fade in" effect still reads naturally.
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: color,
      display: 'flex', alignItems: 'center',
      justifyContent: isRight ? 'flex-start' : 'flex-end',
      paddingLeft: isRight ? 22 : 0,
      paddingRight: isRight ? 0 : 22,
      color: fg,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        transform: `scale(${armed ? 1.08 : 0.92 + progress * 0.12})`,
        transition: 'transform .14s ease-out',
        opacity: Math.min(1, 0.6 + progress * 0.8),
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'rgba(255,255,255,0.28)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          font: '600 12px/1 system-ui',
        }}>{icon}</span>
        <span style={{
          font: `600 11px/1 ${SANS}`, letterSpacing: 1.8,
          textTransform: 'uppercase',
        }}>{label}</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// SlideToConfirm — pill track with a draggable handle. The handle is
// the only thing that captures the pointer; the rest of the track is
// just decoration. Past ~90% travel on release, fires onConfirm.
// ────────────────────────────────────────────────────────────────────
function SlideToConfirm({
  label = 'Slide to log',
  doneLabel = 'Logged',
  onConfirm,
  disabled = false,
  trackColor,
  fillColor,
  handleColor = '#fff',
  textColor,
  height = 56,
  resetMs = 700,
}) {
  const trackRef = useRf(null);
  const posRef = useRf(0);
  const travelRef = useRf(0);
  const [pos, setPos] = useSt(0);
  const [dragging, setDragging] = useSt(false);
  const [done, setDone] = useSt(false);
  const cleanupRef = useRf(null);

  const handle = height - 8;

  const setP = (v) => { posRef.current = v; setPos(v); };

  const onDown = (e) => {
    if (disabled || done) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const tw = trackRef.current?.offsetWidth || 1;
    travelRef.current = tw - handle - 8;
    const startX = e.clientX;
    const startPos = posRef.current;
    setDragging(true);
    e.stopPropagation();

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const v = Math.max(0, Math.min(travelRef.current, startPos + dx));
      setP(v);
    };
    const onUp = () => {
      cleanupListeners();
      setDragging(false);
      const past = posRef.current >= travelRef.current * 0.9;
      if (past) {
        setP(travelRef.current);
        setDone(true);
        // Fire immediately so the host can update; reset slider after a beat
        // so the "Logged" state is visible before snapping back.
        onConfirm?.();
        setTimeout(() => { setDone(false); setP(0); }, resetMs);
      } else {
        setP(0);
      }
    };
    const cleanupListeners = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      cleanupRef.current = null;
    };
    cleanupRef.current = cleanupListeners;
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  };

  useEf(() => () => { cleanupRef.current?.(); }, []);

  const { t } = useTokens();
  const trackBg = trackColor || t.accent;
  const fill    = fillColor  || t.ink;
  const fg      = textColor  || 'rgba(255,255,255,0.95)';
  const handleBg = handleColor || '#fff';
  const handleFg = trackBg;
  const travel  = travelRef.current || 1;
  const progress = Math.min(1, pos / travel);

  return (
    <div ref={trackRef} style={{
      position: 'relative',
      width: '100%',
      height,
      borderRadius: 100,
      background: trackBg,
      overflow: 'hidden',
      opacity: disabled ? 0.45 : 1,
      userSelect: 'none',
      touchAction: 'pan-y',
    }}>
      {/* Fill trail */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: pos + handle / 2 + 4,
        background: fill,
        transition: dragging ? 'none' : 'width .32s cubic-bezier(.2,.85,.25,1)',
        opacity: done ? 1 : 0.92,
      }} />
      {/* Label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        font: `600 12px/1 ${SANS}`, letterSpacing: 1.8,
        color: fg,
        textTransform: 'uppercase',
        pointerEvents: 'none',
        opacity: done ? 1 : Math.max(0.35, 1 - progress * 0.6),
        transition: 'opacity .2s',
        whiteSpace: 'nowrap',
      }}>
        {!done && (
          <span style={{
            display: 'inline-flex', marginRight: 8, fontSize: 16,
            opacity: 0.75, transform: 'translateY(-1px)',
          }}>›››</span>
        )}
        <span>{done ? doneLabel : label}</span>
      </div>
      {/* Handle */}
      <div
        onPointerDown={onDown}
        style={{
          position: 'absolute', top: 4, left: 4 + pos,
          width: handle, height: handle, borderRadius: '50%',
          background: handleBg,
          color: done ? fill : handleFg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(26,24,20,0.28), 0 1px 2px rgba(26,24,20,0.16)',
          transition: dragging ? 'none' : 'left .32s cubic-bezier(.2,.85,.25,1), color .2s',
          cursor: disabled ? 'default' : (dragging ? 'grabbing' : 'grab'),
          font: '600 17px/1 system-ui',
          touchAction: 'none',
        }}>
        {done ? '✓' : '›'}
      </div>
    </div>
  );
}

Object.assign(window, { Swipeable, SlideToConfirm });

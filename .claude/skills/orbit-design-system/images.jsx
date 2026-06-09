// hi-images.jsx — Image primitives + overlays for the "habit images" feature.
// Surfaces: create-form thumb strip (Option A), hero strip (Option A),
// queue mosaic (Option D), add-source sheet (formSheet/modal/fullScreenModal),
// lightbox viewer (transparentModal).
// Reads tokens from useTokens(); shape/presentation come from props (tweaks).

const { useState: useIS, useEffect: useIE, useRef: useIR } = React;

const IMG_POOL = Array.from({ length: 9 }, (_, i) => `assets/img/ref-${i + 1}.png`);

// ── single thumbnail ────────────────────────────────────────────────
function Thumb({ src, size = 44, h, shape = 'rounded', radius = 10, onClick, removable, onRemove, dim }) {
  const { t } = useTokens();
  const br = shape === 'circle' ? '50%' : radius;
  const height = h || size;
  return (
    <div style={{ position: 'relative', width: size, height, flexShrink: 0 }}>
      <div onClick={onClick} style={{
        width: '100%', height: '100%', borderRadius: br, overflow: 'hidden',
        border: `1px solid ${t.rule}`, cursor: onClick ? 'pointer' : 'default',
        background: t.accentSoft, transition: 'opacity .2s',
        opacity: dim ? 0.5 : 1,
      }}>
        <img src={src} alt="" draggable="false" style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
        }} />
      </div>
      {removable && (
        <button onClick={(e) => { e.stopPropagation(); onRemove?.(); }} aria-label="Remove image" style={{
          position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%',
          border: `1.5px solid ${t.card}`, background: t.ink, color: t.card, cursor: 'pointer',
          font: '600 11px/1 system-ui', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, boxShadow: t.shadow,
        }}>×</button>
      )}
    </div>
  );
}

// ── overflow / count tile (e.g. "+2") ───────────────────────────────
function CountTile({ n, size = 44, h, shape = 'rounded', radius = 10, onClick }) {
  const { t } = useTokens();
  const br = shape === 'circle' ? '50%' : radius;
  return (
    <div onClick={onClick} style={{
      width: size, height: h || size, borderRadius: br, flexShrink: 0,
      background: t.accentSoft, border: `1px solid ${t.rule}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      font: `500 12px/1 ${SANS}`, color: t.accent, cursor: onClick ? 'pointer' : 'default',
      letterSpacing: 0.2,
    }}>+{n}</div>
  );
}

// ── HERO strip (Option A) — centered row beneath the ring ────────────
// Up to `max` thumbs for the up-next habit; overflow folds into +N.
function HeroStrip({ images, shape, onOpen, max = 4 }) {
  const { t } = useTokens();
  if (!images || images.length === 0) return null;
  const shown = images.slice(0, max);
  const extra = images.length - shown.length;
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 18 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {shown.map((im, i) => (
          <Thumb key={im.id} src={im.src} size={38} shape={shape} radius={9}
                 onClick={() => onOpen(i)} />
        ))}
        {extra > 0 && <CountTile n={extra} size={38} shape={shape} radius={9} onClick={() => onOpen(max)} />}
      </div>
      <div style={{
        marginTop: 9, font: `500 9px/1 ${SANS}`, letterSpacing: 1.6,
        color: t.inkFaint, textTransform: 'uppercase',
      }}>{images.length} {images.length === 1 ? 'image' : 'images'} · tap to view</div>
    </div>
  );
}

// ── QUEUE mosaic (Option D) — landscape strip indented under the name ─
function QueueMosaic({ images, shape, onOpen, indent = 40 }) {
  if (!images || images.length === 0) return null;
  const shown = images.slice(0, 3);
  const extra = images.length - shown.length;
  const br = shape === 'circle' ? 14 : 8;
  return (
    <div style={{ display: 'flex', gap: 4, paddingLeft: indent, paddingTop: 8, paddingRight: 2 }}>
      {shown.map((im, i) => {
        const isLast = i === shown.length - 1;
        const overlay = isLast && extra > 0;
        return (
          <div key={im.id} onClick={(e) => { e.stopPropagation(); onOpen(i); }}
               style={{ position: 'relative', flex: 1, minWidth: 0, cursor: 'pointer' }}>
            <Thumb src={im.src} size={'100%'} h={44} shape="rounded" radius={br} />
            {overlay && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: br,
                background: 'rgba(20,16,12,0.52)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: `500 13px/1 ${SANS}`, letterSpacing: 0.3,
              }}>+{extra}</div>
            )}
          </div>
        );
      })}
      {/* keep the strip from stretching tiles too wide when only 1-2 images */}
      {shown.length < 3 && <div style={{ flex: 3 - shown.length }} aria-hidden="true" />}
    </div>
  );
}

// ── CREATE-form strip — thumbs + remove + dashed add tile ────────────
function CreateStrip({ images, shape, onOpenViewer, onRemove, onAdd }) {
  const { t } = useTokens();
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {images.map((im, i) => (
        <Thumb key={im.id} src={im.src} size={48} shape={shape} radius={11}
               removable onRemove={() => onRemove(im.id)}
               onClick={() => onOpenViewer(i)} />
      ))}
      <button onClick={onAdd} aria-label="Add image" style={{
        width: 48, height: 48, flexShrink: 0,
        borderRadius: shape === 'circle' ? '50%' : 11,
        border: `1.5px dashed ${t.accentDim}`, background: 'transparent', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: t.accent, font: `300 22px/1 ${SANS}`,
      }}>+</button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// LIGHTBOX — transparentModal: dimmed scrim, underlying screen visible.
// ════════════════════════════════════════════════════════════════════
function Lightbox({ images, index, habitName, onClose, onIndex }) {
  const { t } = useTokens();
  useIE(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex(Math.min(images.length - 1, index + 1));
      if (e.key === 'ArrowLeft') onIndex(Math.max(0, index - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, images.length]);

  if (!images || images.length === 0) return null;
  const im = images[index];

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(18,14,10,0.72)', backdropFilter: 'blur(3px)',
      WebkitBackdropFilter: 'blur(3px)',
      display: 'flex', flexDirection: 'column',
      animation: 'oiFade .2s ease',
    }}>
      {/* top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 18px', color: 'rgba(255,255,255,0.92)',
      }}>
        <div style={{ font: `500 10px/1.3 ${SANS}`, letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.85 }}>
          {habitName}<br />
          <span style={{ opacity: 0.7 }}>{index + 1} / {images.length}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close" style={{
          width: 34, height: 34, borderRadius: '50%', border: 'none',
          background: 'rgba(255,255,255,0.14)', color: '#fff', cursor: 'pointer',
          font: '400 18px/1 system-ui',
        }}>×</button>
      </div>

      {/* image */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 14px' }}
           onClick={(e) => e.stopPropagation()}>
        <img src={im.src} alt="" style={{
          maxWidth: '100%', maxHeight: '100%', borderRadius: 14,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)', objectFit: 'contain',
        }} />
        {index > 0 && (
          <button onClick={() => onIndex(index - 1)} aria-label="Previous" style={navBtn('left')}>‹</button>
        )}
        {index < images.length - 1 && (
          <button onClick={() => onIndex(index + 1)} aria-label="Next" style={navBtn('right')}>›</button>
        )}
      </div>

      {/* dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '18px 0 26px' }}
           onClick={(e) => e.stopPropagation()}>
        {images.map((_, i) => (
          <button key={i} onClick={() => onIndex(i)} aria-label={`Image ${i + 1}`} style={{
            width: i === index ? 18 : 6, height: 6, borderRadius: 6, border: 'none', cursor: 'pointer',
            background: i === index ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'width .2s',
            padding: 0,
          }} />
        ))}
      </div>
    </div>
  );
}
function navBtn(side) {
  return {
    position: 'absolute', top: '50%', [side]: 18, transform: 'translateY(-50%)',
    width: 40, height: 40, borderRadius: '50%', border: 'none',
    background: 'rgba(255,255,255,0.16)', color: '#fff', cursor: 'pointer',
    font: '300 22px/1 system-ui', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

// ════════════════════════════════════════════════════════════════════
// ADD-SOURCE SHEET — presentation: formSheet | modal | fullScreenModal
//   formSheet  · partial height, detents (medium/large), peek + grabber
//   modal      · ~92% height, slide-up, Cancel/Add header, status peek
//   fullScreen · 100% takeover, no peek
// ════════════════════════════════════════════════════════════════════
function AddSheet({ habit, presentation = 'formSheet', shape, onAdd, onClose }) {
  const { t, tone } = useTokens();
  const [detent, setDetent] = useIS('medium');      // formSheet only
  const [sel, setSel] = useIS([]);                  // selected pool srcs
  const [pasted, setPasted] = useIS([]);            // simulated pasted srcs
  const grabRef = useIR(null);

  const toggle = (src) => setSel((s) => s.includes(src) ? s.filter((x) => x !== src) : [...s, src]);

  const simulatePaste = () => {
    // Stand-in for ⌘V: pull the next unused pool image.
    const used = new Set([...sel, ...pasted]);
    const next = IMG_POOL.find((s) => !used.has(s)) || IMG_POOL[(pasted.length) % IMG_POOL.length];
    setPasted((p) => [...p, next]);
  };

  const chosen = [...pasted, ...sel];
  const commit = () => {
    if (chosen.length === 0) { onClose(); return; }
    onAdd(chosen);
    onClose();
  };

  // listen for real paste while open (works if clipboard has an image)
  useIE(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.items || [];
      for (const it of items) {
        if (it.type && it.type.startsWith('image/')) {
          const f = it.getAsFile();
          if (f) setPasted((p) => [...p, URL.createObjectURL(f)]);
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  // grabber drag to switch detents (formSheet)
  const onGrab = (e) => {
    if (presentation !== 'formSheet') return;
    const startY = e.clientY;
    const move = (ev) => {
      const dy = ev.clientY - startY;
      if (dy < -40) setDetent('large');
      if (dy > 40) setDetent('medium');
    };
    const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };

  // geometry per presentation
  let topOffset, radiusTop, showGrabber, headerStyle;
  if (presentation === 'fullScreenModal') {
    topOffset = 0; radiusTop = 0; showGrabber = false; headerStyle = 'modal';
  } else if (presentation === 'modal') {
    topOffset = 46; radiusTop = 22; showGrabber = false; headerStyle = 'modal';
  } else { // formSheet
    topOffset = detent === 'large' ? 70 : 300; radiusTop = 24; showGrabber = true; headerStyle = 'sheet';
  }

  const dimAbove = presentation !== 'fullScreenModal';

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      {/* scrim — only over the peek area (above the sheet) */}
      {dimAbove && (
        <div onClick={onClose} style={{
          position: 'absolute', left: 0, right: 0, top: 0, height: topOffset,
          background: 'rgba(18,14,10,0.34)', animation: 'oiFade .2s ease',
        }} />
      )}
      {/* sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, top: topOffset,
        background: t.bg, borderTopLeftRadius: radiusTop, borderTopRightRadius: radiusTop,
        boxShadow: '0 -12px 40px rgba(18,14,10,0.22)',
        display: 'flex', flexDirection: 'column',
        animation: 'oiSlideUp .28s cubic-bezier(.2,.85,.25,1)',
        overflow: 'hidden',
      }}>
        {showGrabber && (
          <div onPointerDown={onGrab} style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center', cursor: 'grab', touchAction: 'none' }}>
            <div style={{ width: 38, height: 4, borderRadius: 4, background: t.accentDim }} />
          </div>
        )}

        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: headerStyle === 'modal' ? '16px 20px 10px' : '8px 20px 10px',
        }}>
          {headerStyle === 'modal' ? (
            <button onClick={onClose} style={ghostBtn(t)}>Cancel</button>
          ) : (
            <div style={{ font: `500 10px/1 ${SANS}`, letterSpacing: 1.6, color: t.inkFaint, textTransform: 'uppercase' }}>
              Add images
            </div>
          )}
          <div style={{ flex: 1, textAlign: 'center', font: `400 16px/1.2 ${SERIF}`, color: t.ink, minWidth: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        display: headerStyle === 'modal' ? 'block' : 'none' }}>
            {habit?.name}
          </div>
          {headerStyle === 'modal' ? (
            <button onClick={commit} style={{ ...ghostBtn(t), color: chosen.length ? t.accent : t.inkFaint, fontWeight: 600 }}>
              Add{chosen.length ? ` ${chosen.length}` : ''}
            </button>
          ) : (
            <button onClick={onClose} aria-label="Close" style={{
              width: 28, height: 28, borderRadius: '50%', border: 'none', background: t.card,
              color: t.inkSoft, cursor: 'pointer', font: '400 16px/1 system-ui', boxShadow: t.shadow,
            }}>×</button>
          )}
        </div>

        {headerStyle === 'sheet' && (
          <div style={{ padding: '0 20px 10px', font: `400 15px/1.3 ${SERIF}`, color: t.ink }}>
            Add to <span style={{ fontStyle: 'italic' }}>{habit?.name}</span>
          </div>
        )}

        {/* scroll body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 16px' }}>
          {/* paste target */}
          <button onClick={simulatePaste} style={{
            width: '100%', border: `1.5px dashed ${t.accentDim}`, background: t.card,
            borderRadius: 16, padding: '16px', cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: t.accentSoft, color: t.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center', font: '400 18px/1 system-ui', flexShrink: 0,
            }}>⎘</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: `500 13px/1.2 ${SANS}`, color: t.ink }}>Paste an image</div>
              <div style={{ font: `400 12px/1.3 ${SANS}`, color: t.inkSoft, marginTop: 3 }}>
                ⌘V here, or long-press → Paste{pasted.length ? ` · ${pasted.length} pasted` : ''}
              </div>
            </div>
            {pasted.length > 0 && (
              <div style={{ display: 'flex' }}>
                {pasted.slice(-3).map((s, i) => (
                  <img key={i} src={s} alt="" style={{
                    width: 30, height: 30, borderRadius: 7, objectFit: 'cover',
                    border: `2px solid ${t.card}`, marginLeft: i ? -10 : 0,
                  }} />
                ))}
              </div>
            )}
          </button>

          {/* source chips */}
          <div style={{ display: 'flex', gap: 8, margin: '8px 0 16px' }}>
            <SourceChip icon="▦" label="Gallery" active onClick={() => setDetent('large')} t={t} />
            <SourceChip icon="◉" label="Camera" t={t} />
            <SourceChip icon="⁝⁝" label="Files" t={t} />
          </div>

          {/* library grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ font: `500 11px/1 ${SANS}`, letterSpacing: 1.5, color: t.inkSoft, textTransform: 'uppercase' }}>
              Recent
            </div>
            <div style={{ font: `400 11px/1 ${SANS}`, color: t.inkFaint }}>
              {sel.length ? `${sel.length} selected` : 'Tap to select · multiple'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {IMG_POOL.map((src) => {
              const on = sel.includes(src);
              return (
                <button key={src} onClick={() => toggle(src)} style={{
                  position: 'relative', aspectRatio: '1', border: 'none', padding: 0, cursor: 'pointer',
                  borderRadius: 12, overflow: 'hidden', background: t.accentSoft,
                  outline: on ? `2.5px solid ${t.accent}` : `1px solid ${t.rule}`, outlineOffset: on ? -2 : -1,
                }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: on ? 0.82 : 1 }} />
                  <div style={{
                    position: 'absolute', top: 7, right: 7, width: 20, height: 20, borderRadius: '50%',
                    border: on ? 'none' : '1.5px solid rgba(255,255,255,0.85)',
                    background: on ? t.accent : 'rgba(20,16,12,0.18)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 11px/1 system-ui',
                    boxShadow: on ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                  }}>{on ? '✓' : ''}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* sheet footer CTA (sheet style only; modal uses header Add) */}
        {headerStyle === 'sheet' && (
          <div style={{ padding: '12px 20px 22px', borderTop: `1px solid ${t.rule}`, background: t.bg }}>
            <button onClick={commit} disabled={chosen.length === 0} style={{
              width: '100%', border: 'none', borderRadius: 100, padding: '15px',
              background: chosen.length ? t.ink : t.accentDim, color: t.card,
              cursor: chosen.length ? 'pointer' : 'default',
              font: `500 13px/1 ${SANS}`, letterSpacing: 1.2, textTransform: 'uppercase',
            }}>
              {chosen.length ? `Add ${chosen.length} ${chosen.length === 1 ? 'image' : 'images'}` : 'Select images to add'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceChip({ icon, label, active, onClick, t }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 100,
      border: active ? 'none' : `1px solid ${t.rule}`, background: active ? t.ink : t.card,
      color: active ? t.card : t.inkSoft, cursor: 'pointer', font: `500 12px/1 ${SANS}`,
    }}>
      <span style={{ font: '400 13px/1 system-ui' }}>{icon}</span>{label}
    </button>
  );
}
function ghostBtn(t) {
  return { border: 'none', background: 'transparent', color: t.inkSoft, cursor: 'pointer',
           font: `500 14px/1 ${SANS}`, padding: '4px 2px' };
}

Object.assign(window, {
  IMG_POOL, Thumb, CountTile, HeroStrip, QueueMosaic, CreateStrip, Lightbox, AddSheet,
});

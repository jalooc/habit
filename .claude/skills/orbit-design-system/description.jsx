// description.jsx — Hi-fi components for the "habit description" feature.
// Surfaces (per wireframes):
//   Sheet A · Form    — Add + Edit unified. Same fields, same Save/Cancel pair.
//                       Title and primary CTA flip with mode. Edit adds Remove.
//   Sheet B · Reader  — Read-only sheet. Close · Edit ✎ → opens A in edit.
//   HabitNoteCard     — Quiet card rendered under the hero when up-next has a note.
//
// Reuses BottomSheet + SheetBackdrop + SheetHeader from edit-time.jsx.
// Reuses Thumb + CountTile from images.jsx for the image strip.

const { useState: useDs, useEffect: useDe, useRef: useDr, useMemo: useDm } = React;

// ─────────────────────────────────────────────────────────────────────
// Markdown · tiny renderer + parser
// Handles: # heading, - bullet, **bold**, *italic*, [text](url), bare URL.
// Not a full md spec — enough for the contemplative notes this app holds.
// ─────────────────────────────────────────────────────────────────────

const URL_RE = /\bhttps?:\/\/\S+/g;

function mdInline(text, t) {
  // Order matters: tokenize bold, italic, links, then bare urls.
  const out = [];
  let buf = text;

  // 1) [label](url) links
  const linkParts = [];
  let lastIdx = 0;
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = linkRe.exec(buf)) !== null) {
    if (m.index > lastIdx) linkParts.push({ kind: 'text', v: buf.slice(lastIdx, m.index) });
    linkParts.push({ kind: 'link', label: m[1], url: m[2] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < buf.length) linkParts.push({ kind: 'text', v: buf.slice(lastIdx) });

  let key = 0;
  for (const p of linkParts) {
    if (p.kind === 'link') {
      out.push(
        <a key={key++} href={p.url} target="_blank" rel="noreferrer" style={{
          color: t.accent, textDecoration: 'underline', textDecorationThickness: 1.5,
          textUnderlineOffset: 2,
        }}>{p.label}</a>
      );
      continue;
    }
    // bold / italic / bare url on plain text segments
    let s = p.v;
    // Tokenize bold first
    const boldParts = s.split(/(\*\*[^*]+\*\*)/g);
    boldParts.forEach((bp) => {
      if (bp.startsWith('**') && bp.endsWith('**')) {
        out.push(<strong key={key++} style={{ fontWeight: 600, color: t.ink }}>{bp.slice(2, -2)}</strong>);
      } else {
        // italic
        const itParts = bp.split(/(\*[^*]+\*)/g);
        itParts.forEach((ip) => {
          if (ip.startsWith('*') && ip.endsWith('*') && ip.length > 2) {
            out.push(<em key={key++} style={{ fontStyle: 'italic' }}>{ip.slice(1, -1)}</em>);
          } else {
            // bare URLs
            const urlParts = ip.split(URL_RE);
            const urls = ip.match(URL_RE) || [];
            urlParts.forEach((up, i) => {
              if (up) out.push(<React.Fragment key={key++}>{up}</React.Fragment>);
              if (urls[i]) {
                const url = urls[i];
                out.push(
                  <a key={key++} href={url} target="_blank" rel="noreferrer" style={{
                    color: t.accent, textDecoration: 'underline', textDecorationThickness: 1.5,
                    textUnderlineOffset: 2,
                  }}>{url.replace(/^https?:\/\//, '')}</a>
                );
              }
            });
          }
        });
      }
    });
  }
  return out;
}

function MarkdownView({ source, dim = false, compact = false }) {
  const { t } = useTokens();
  const lines = (source || '').split('\n');
  const blocks = [];
  let listBuf = [];
  const flushList = () => {
    if (!listBuf.length) return;
    blocks.push(
      <ul key={`ul${blocks.length}`} style={{
        margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {listBuf.map((ln, i) => (
          <li key={i} style={{
            font: `400 ${compact ? 13 : 14}px/1.5 ${SERIF}`, color: dim ? t.inkSoft : t.ink,
          }}>{mdInline(ln, t)}</li>
        ))}
      </ul>
    );
    listBuf = [];
  };

  lines.forEach((ln, i) => {
    if (/^\s*[-•]\s+/.test(ln)) {
      listBuf.push(ln.replace(/^\s*[-•]\s+/, ''));
      return;
    }
    flushList();
    if (/^#\s+/.test(ln)) {
      blocks.push(
        <div key={i} style={{
          font: `600 ${compact ? 15 : 16}px/1.25 ${SERIF}`, color: t.ink, letterSpacing: -0.2,
        }}>{mdInline(ln.replace(/^#\s+/, ''), t)}</div>
      );
    } else if (ln.trim() === '') {
      blocks.push(<div key={i} style={{ height: compact ? 4 : 6 }} />);
    } else {
      blocks.push(
        <div key={i} style={{
          font: `400 ${compact ? 13 : 14}px/1.55 ${SERIF}`, color: dim ? t.inkSoft : t.ink,
        }}>{mdInline(ln, t)}</div>
      );
    }
  });
  flushList();

  return <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 8 }}>{blocks}</div>;
}

// ─────────────────────────────────────────────────────────────────────
// MarkdownEditor — minimal source-editing textarea.
// (Production version drops in a WYSIWYG md library; this stand-in keeps
// the design honest about font + spacing.)
// ─────────────────────────────────────────────────────────────────────

function MarkdownEditor({ value, onChange, placeholder, minHeight = 140, autoFocus = false }) {
  const { t } = useTokens();
  const ref = useDr(null);
  useDe(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', minHeight, resize: 'none', boxSizing: 'border-box',
        background: t.bg, border: `1px solid ${t.rule}`, borderRadius: 12,
        padding: '12px 14px',
        font: `400 14px/1.55 ${SERIF}`,
        color: t.ink, outline: 'none',
        transition: 'border-color .15s',
      }}
      onFocus={(e) => { e.target.style.borderColor = t.accent; }}
      onBlur={(e) => { e.target.style.borderColor = t.rule; }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// Image strip · in-form
// ─────────────────────────────────────────────────────────────────────

function ImageStripEdit({ images, onAdd, onRemove }) {
  const { t, thumbShape } = useTokens();
  const br = thumbShape === 'circle' ? '50%' : 10;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {(images || []).map((im) => (
        <Thumb key={im.id} src={im.src} size={40} shape={thumbShape} radius={br}
               removable onRemove={() => onRemove(im.id)} />
      ))}
      <button onClick={onAdd} aria-label="Add image" style={{
        width: 40, height: 40, borderRadius: br, flexShrink: 0,
        background: 'transparent', border: `1.5px dashed ${t.accentDim}`,
        color: t.inkSoft, cursor: 'pointer',
        font: `400 18px/1 ${SANS}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>+</button>
    </div>
  );
}

function ImageStripRead({ images, onOpen }) {
  const { t, thumbShape } = useTokens();
  const br = thumbShape === 'circle' ? '50%' : 10;
  if (!images || images.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {images.map((im, i) => (
        <Thumb key={im.id} src={im.src} size={48} shape={thumbShape} radius={br}
               onClick={() => onOpen?.(i)} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sheet A · Form — Add + Edit (same component, mode flips chrome)
// ─────────────────────────────────────────────────────────────────────

function HabitFormSheet({ habit, mode = 'edit', usedInOtherGroups = false,
                          onSave, onCancel, onRemove }) {
  const { t } = useTokens();
  const [name, setName] = useDs(habit?.name || '');
  const [images, setImages] = useDs(habit?.images || []);
  const [note, setNote] = useDs(habit?.note || '');
  const [whisper, setWhisper] = useDs(habit?.whisper || '');
  const isEdit = mode === 'edit';
  const canSave = name.trim().length > 0;

  const addPlaceholderImg = () => {
    const next = IMG_POOL[(images.length + 2) % IMG_POOL.length];
    setImages([...images, { id: `ni${Date.now()}`, src: next }]);
  };
  const removeImg = (id) => setImages(images.filter((x) => x.id !== id));

  const commit = () => {
    if (!canSave) return;
    onSave?.({
      ...(habit || {}),
      id: habit?.id || `nh${Date.now()}`,
      name: name.trim(),
      images, note,
      whisper: whisper.trim() || undefined,
    });
  };

  return (
    <>
      <SheetBackdrop onDismiss={onCancel} />
      <BottomSheet height={620}>
        {/* Header — title centered, no buttons (CTAs live at the bottom) */}
        <div style={{
          padding: '0 22px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 28, flexShrink: 0,
        }}>
          <span style={{
            font: `500 10px/1 ${SANS}`, letterSpacing: 1.8,
            color: t.inkSoft, textTransform: 'uppercase',
          }}>{isEdit ? 'Edit habit' : 'New habit'}</span>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '14px 22px 0',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hollow hold"
              autoFocus={!isEdit}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: t.bg, border: `1px solid ${t.rule}`, borderRadius: 12,
                padding: '12px 14px',
                font: `400 16px/1.3 ${SERIF}`, color: t.ink, outline: 'none',
              }}
              onFocus={(e) => { e.target.style.borderColor = t.accent; }}
              onBlur={(e) => { e.target.style.borderColor = t.rule; }}
            />
          </Field>

          <Field label="Images" optional>
            <ImageStripEdit images={images} onAdd={addPlaceholderImg} onRemove={removeImg} />
          </Field>

          <Field label="Note" optional>
            <MarkdownEditor
              value={note}
              onChange={setNote}
              placeholder="A note for this habit. Form cues, why it matters, a link you keep returning to."
              minHeight={140}
            />
          </Field>

          {/* Whisper for next time — ephemeral, consumed on tick */}
          <WhisperFormField
            value={whisper}
            onChange={setWhisper}
            onDiscard={() => setWhisper('')}
          />
        </div>

        {/* Footer — Save / Cancel + Remove (edit only) */}
        <div style={{
          padding: '12px 22px 16px',
          borderTop: `1px solid ${t.rule}`, background: t.card, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} style={{
              flex: 1,
              border: `1px solid ${t.accentDim}`, background: 'transparent',
              color: t.inkSoft, borderRadius: 100, padding: '12px 16px',
              font: `500 13px/1 ${SANS}`, letterSpacing: 0.3, cursor: 'pointer',
            }}>Cancel</button>
            <button onClick={commit} disabled={!canSave} style={{
              flex: 1.3,
              border: 'none',
              background: canSave ? t.ink : t.accentDim,
              color: canSave ? t.card : t.inkFaint,
              borderRadius: 100, padding: '12px 16px',
              font: `600 13px/1 ${SANS}`, letterSpacing: 0.3,
              cursor: canSave ? 'pointer' : 'default',
            }}>{isEdit ? 'Save' : 'Add'}</button>
          </div>
          {isEdit && (
            <div style={{
              marginTop: 12, display: 'flex', justifyContent: 'center',
            }}>
              <button onClick={() => onRemove?.({ usedInOtherGroups })} style={{
                border: 'none', background: 'transparent',
                color: t.accent, cursor: 'pointer',
                padding: '6px 10px',
                font: `500 11px/1 ${SANS}`, letterSpacing: 1.4, textTransform: 'uppercase',
              }}>
                {usedInOtherGroups ? 'Remove from this group' : 'Delete habit'} ›
              </button>
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sheet B · Reader — read-only, opens A on Edit ✎
// ─────────────────────────────────────────────────────────────────────

function HabitReaderSheet({ habit, onClose, onEdit, onOpenImage }) {
  const { t } = useTokens();
  return (
    <>
      <SheetBackdrop onDismiss={onClose} />
      <BottomSheet height={520}>
        {/* Header — Close · Edit ✎ */}
        <div style={{
          padding: '0 18px 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            font: `500 11px/1 ${SANS}`, letterSpacing: 1, textTransform: 'uppercase',
            color: t.inkSoft, padding: '8px 6px',
          }}>Close</button>
          <span style={{
            font: `500 10px/1 ${SANS}`, letterSpacing: 1.8,
            color: t.inkFaint, textTransform: 'uppercase',
          }}>Habit</span>
          <button onClick={onEdit} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            font: `500 11px/1 ${SANS}`, letterSpacing: 1, textTransform: 'uppercase',
            color: t.accent, padding: '8px 6px',
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>Edit <span aria-hidden="true" style={{ font: `400 13px/1 ${SERIF}` }}>✎</span></button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '10px 22px 22px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{
            font: `500 22px/1.2 ${SERIF}`, color: t.ink, letterSpacing: -0.3,
          }}>{habit?.name}</div>

          {habit?.images?.length > 0 && (
            <ImageStripRead images={habit.images} onOpen={onOpenImage} />
          )}

          {habit?.note ? (
            <MarkdownView source={habit.note} />
          ) : (
            <div style={{
              font: `400 13px/1.5 ${SERIF}`, fontStyle: 'italic',
              color: t.inkFaint,
            }}>No note yet.</div>
          )}

          {habit?.whisper && (
            <WhisperHeroCard note={habit.whisper} subtle kickerCopy="Waiting for next pickup" />
          )}
        </div>
      </BottomSheet>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// HabitNoteCard — quiet card under the hero when up-next has a note
// ─────────────────────────────────────────────────────────────────────

function HabitNoteCard({ note, onTap }) {
  const { t, d } = useTokens();
  if (!note) return null;
  return (
    <button
      onClick={onTap}
      style={{
        textAlign: 'left',
        width: '100%', border: 'none',
        background: t.card, borderRadius: 18,
        padding: d.cardPad + 2,
        cursor: onTap ? 'pointer' : 'default',
        boxShadow: t.shadow,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{
        font: `500 10px/1 ${SANS}`, letterSpacing: 1.8,
        color: t.inkFaint, textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>Note</span>
        {onTap && <span style={{ color: t.accent, fontSize: 11 }}>Open ↗</span>}
      </div>
      <MarkdownView source={note} compact />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Field — labeled form row
// ─────────────────────────────────────────────────────────────────────

function Field({ label, optional, children }) {
  const { t } = useTokens();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        font: `500 10px/1 ${SANS}`, letterSpacing: 1.8,
        color: t.inkSoft, textTransform: 'uppercase',
        display: 'flex', alignItems: 'baseline', gap: 8,
      }}>
        <span>{label}</span>
        {optional && (
          <span style={{
            font: `400 9px/1 ${SANS}`, letterSpacing: 1.2,
            color: t.inkFaint, textTransform: 'uppercase',
          }}>· optional</span>
        )}
      </div>
      {children}
    </div>
  );
}

Object.assign(window, {
  HabitFormSheet, HabitReaderSheet, HabitNoteCard,
  MarkdownView, MarkdownEditor,
});

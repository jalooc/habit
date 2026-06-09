// whisper.jsx — Hi-fi components for "a note for next time"
// A one-shot, ephemeral note past-you leaves for future-you at tick time.
// Lives on the habit, read on next pickup, cleared on tick.
//
//   QuillGlyph        — the indicator icon (also used inside the cards)
//   WhisperHeroCard   — the receive-state card on the hero (above the CTA)
//   WhisperComposer   — collapsed pill + expanded composer (write at tick time)
//   WhisperFormField  — field on the habit form sheet (edit / discard)
//   WhisperRowMark    — small indicator next to queue rows
//
// All chrome reads from useTokens() so it inherits dark / light / density.

const { useState: useWS, useRef: useWR, useEffect: useWE } = React;

// ─────────────────────────────────────────────────────────────────────
// QuillGlyph — the canonical mark for the feature.
// A simple feather + nib. Reads at 11–16px without losing the shape.
// Toggle via `variant` to swap in the fallback marks (dot / quote / chip).
// ─────────────────────────────────────────────────────────────────────

function QuillGlyph({ size = 14, color = 'currentColor', variant = 'quill' }) {
  if (variant === 'dot') {
    return (
      <span aria-hidden="true" style={{
        display: 'inline-block', width: size * 0.5, height: size * 0.5,
        borderRadius: '50%', background: color,
      }} />
    );
  }
  if (variant === 'quote') {
    return (
      <span aria-hidden="true" style={{
        font: `italic 600 ${Math.round(size * 1.4)}px/${size}px "Fraunces", Georgia, serif`,
        color, lineHeight: `${size}px`, display: 'inline-block',
        height: size, transform: 'translateY(2px)',
      }}>“</span>
    );
  }
  if (variant === 'chip') {
    return (
      <span aria-hidden="true" style={{
        font: `500 ${Math.max(8, size - 5)}px/1 "Inter", sans-serif`,
        letterSpacing: 1.2, textTransform: 'uppercase',
        color, border: `1px solid ${color}`, borderRadius: 100,
        padding: '2px 6px',
      }}>note</span>
    );
  }
  // default: quill
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}
         aria-hidden="true" focusable="false"
         style={{ display: 'inline-block', verticalAlign: '-0.18em' }}>
      {/* feather body */}
      <path d="M3.2 12.8 C 4.6 7.4, 9 3.6, 14.2 2.6 C 13.4 7.8, 9.6 11.6, 4.4 12.7 Z"
            fill={color} />
      {/* vein */}
      <path d="M4 12.5 L 12.5 4.2"
            stroke="#fff" strokeWidth="0.7" strokeLinecap="round"
            opacity="0.55" />
      {/* nib tail */}
      <path d="M3.2 12.8 L 1.6 14.7"
            stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* ink dot */}
      <circle cx="1.4" cy="15" r="0.7" fill={color} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// WhisperHeroCard — display state (2C, above the slide-CTA on the hero)
// "FROM LAST TIME" kicker · italic Fraunces body · soft coral surface.
// ─────────────────────────────────────────────────────────────────────

function WhisperHeroCard({ note, kickerCopy = 'From last time', glyph = 'quill', subtle = false }) {
  const { t } = useWTokens();
  if (!note) return null;
  return (
    <div role="note" style={{
      width: '100%', borderRadius: 18, boxSizing: 'border-box',
      background: subtle ? 'transparent' : t.accentSoft,
      border: `1px solid ${subtle ? t.accent + '55' : t.accent}`,
      padding: '13px 16px 14px',
      display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: subtle ? 'none' : '0 1px 2px rgba(201,100,66,0.06), 0 8px 28px rgba(201,100,66,0.10)',
    }}>
      <div style={{
        font: `500 10px/1 ${SANS}`, letterSpacing: 1.8,
        color: t.accent, textTransform: 'uppercase',
        display: 'inline-flex', alignItems: 'center', gap: 7,
      }}>
        <QuillGlyph size={13} color={t.accent} variant={glyph} />
        <span>{kickerCopy}</span>
      </div>
      <div style={{
        font: `400 italic 17px/1.4 ${SERIF}`,
        color: t.ink, letterSpacing: -0.1,
      }}>{note}</div>
      <div style={{
        font: `500 9px/1 ${SANS}`, letterSpacing: 1.4,
        color: t.accent, opacity: 0.65, textTransform: 'uppercase',
        marginTop: 2, whiteSpace: 'nowrap',
      }}>Clears on tick</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// WhisperComposer — insertion (1B). Collapsed = dashed pill. Expanded =
// soft coral card with a single italic line, char counter, and a one-tap
// dismiss. The whisper rides along when the user slides to confirm.
// ─────────────────────────────────────────────────────────────────────

function WhisperComposer({
  value, onChange,
  expanded, onExpand, onCollapse,
  placeholder = 'e.g. Do 11 next time',
  glyph = 'quill',
  maxLen = 140,
}) {
  const { t } = useWTokens();
  const ref = useWR(null);

  useWE(() => {
    if (expanded && ref.current) {
      const node = ref.current;
      // Defer to ensure layout settled before focus.
      const id = requestAnimationFrame(() => node.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [expanded]);

  if (!expanded) {
    return (
      <button onClick={onExpand} style={{
        width: '100%', boxSizing: 'border-box',
        background: 'transparent',
        border: `1.3px dashed ${t.accent}`,
        borderRadius: 100,
        padding: '11px 16px',
        color: t.accent, cursor: 'pointer',
        font: `400 italic 13.5px/1 ${SERIF}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
        letterSpacing: 0.1, whiteSpace: 'nowrap',
        transition: 'background .15s',
      }}
      onMouseDown={(e) => e.currentTarget.style.background = t.accentSoft}
      onMouseUp={(e) => e.currentTarget.style.background = 'transparent'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <QuillGlyph size={13} color={t.accent} variant={glyph} />
        <span>a note for next time</span>
      </button>
    );
  }

  return (
    <div style={{
      width: '100%', borderRadius: 18, boxSizing: 'border-box',
      background: t.accentSoft,
      border: `1px solid ${t.accent}`,
      padding: '12px 14px 11px',
      display: 'flex', flexDirection: 'column', gap: 7,
      boxShadow: '0 1px 2px rgba(201,100,66,0.06), 0 8px 28px rgba(201,100,66,0.10)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          font: `500 10px/1 ${SANS}`, letterSpacing: 1.8,
          color: t.accent, textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 7,
        }}>
          <QuillGlyph size={13} color={t.accent} variant={glyph} />
          <span>For next time</span>
        </div>
        <button onClick={onCollapse} aria-label="Discard note" style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: t.accent, opacity: 0.65,
          font: `400 16px/1 system-ui`, padding: '0 2px',
          lineHeight: 1,
        }}>×</button>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLen))}
        placeholder={placeholder}
        rows={1}
        style={{
          width: '100%', resize: 'none', boxSizing: 'border-box',
          background: 'transparent', border: 'none', outline: 'none',
          font: `400 italic 16px/1.4 ${SERIF}`,
          color: t.ink, padding: '2px 0',
          caretColor: t.accent,
          minHeight: 22,
        }}
      />
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
        font: `500 9px/1 ${SANS}`, letterSpacing: 1.4,
        color: t.accent, opacity: 0.7, textTransform: 'uppercase',
      }}>
        <span style={{ whiteSpace: 'nowrap' }}>Rides with the tick</span>
        <span style={{ whiteSpace: 'nowrap' }}>{value.length}/{maxLen}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// WhisperFormField — habit form sheet field. Blends with the existing
// Name / Images / Note fields. Edit and discard live here.
// ─────────────────────────────────────────────────────────────────────

function WhisperFormField({ value, onChange, onDiscard, glyph = 'quill', maxLen = 140 }) {
  const { t } = useWTokens();
  const filled = !!(value || '').trim();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        font: `500 10px/1 ${SANS}`, letterSpacing: 1.8,
        color: t.inkSoft, textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
          <QuillGlyph size={11} color={t.accent} variant={glyph} />
          <span>Note for next time</span>
        </span>
        <span style={{ font: `400 9px/1 ${SANS}`, letterSpacing: 1.2, color: t.inkFaint, whiteSpace: 'nowrap' }}>
          · optional · one-shot
        </span>
      </div>
      <div style={{
        background: filled ? t.accentSoft : t.bg,
        border: `1px solid ${filled ? t.accent : t.rule}`,
        borderRadius: 12, padding: '10px 12px 8px',
        transition: 'background .15s, border-color .15s',
      }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLen))}
          placeholder="A whisper to future you, e.g. Do 11 next time."
          rows={2}
          style={{
            width: '100%', resize: 'none', boxSizing: 'border-box',
            background: 'transparent', border: 'none', outline: 'none',
            font: `400 italic 14px/1.45 ${SERIF}`,
            color: t.ink, padding: 0,
            caretColor: t.accent,
            minHeight: 38,
          }}
        />
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
          marginTop: 4,
          font: `500 9px/1 ${SANS}`, letterSpacing: 1.4,
          color: t.inkFaint, textTransform: 'uppercase',
        }}>
          <span style={{ whiteSpace: 'nowrap' }}>Reads once · clears on tick</span>
          {filled && (
            <button onClick={onDiscard} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: t.accent, font: `500 9px/1 ${SANS}`, letterSpacing: 1.4,
              textTransform: 'uppercase', padding: 0, whiteSpace: 'nowrap',
            }}>Discard</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// WhisperRowMark — small inline indicator for queue rows / list rows.
// Read-only. To read the whisper, the user opens the habit sheet.
// ─────────────────────────────────────────────────────────────────────

function WhisperRowMark({ glyph = 'quill', size = 14 }) {
  const { t } = useWTokens();
  return (
    <span title="A note is waiting" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: t.accent,
      width: size + 4, height: size + 4,
      borderRadius: 100,
      background: glyph === 'chip' ? 'transparent' : t.accentSoft,
      flexShrink: 0,
    }}>
      <QuillGlyph size={size} color={t.accent} variant={glyph} />
    </span>
  );
}

// useWTokens — defensive wrapper so this file works whether or not
// TokenProvider is mounted (default to the light palette).
function useWTokens() {
  const ctx = React.useContext(TokenCtx);
  if (ctx) return ctx;
  const fallback = PALETTES.light;
  return {
    t: fallback, d: { screenPad: 18, cardPad: 14 },
    tone: {}, ring: { hero: 220 }, thumbShape: 'rounded', heroStrip: true,
  };
}

Object.assign(window, {
  QuillGlyph,
  WhisperHeroCard,
  WhisperComposer,
  WhisperFormField,
  WhisperRowMark,
});

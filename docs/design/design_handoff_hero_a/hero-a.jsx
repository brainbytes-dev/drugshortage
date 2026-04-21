/* eslint-disable */
// Hero A — "Live-Zahl"
// Idea: The single most-loaded fact owns the page. Big number,
// delta vs. last week, live source indicators. Search input is the
// primary CTA, not a button. Everything else earns its pixels.

function HeroA() {
  const C = ER_COLORS;
  return (
    <div className="er-root" style={{ background: C.bg, width: '100%', minHeight: 820 }}>
      <ERHeader />

      <main style={{ padding: '72px 56px 88px', maxWidth: 1280, margin: '0 auto' }}>

        {/* eyebrow: source freshness */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontSize: 12, color: C.muted, letterSpacing: '0.04em',
          textTransform: 'uppercase', marginBottom: 44,
        }}>
          <ERPulse/>
          <span className="er-mono">
            Abgleich heute · drugshortage.ch · BWL · USB Basel · ODDB
          </span>
        </div>

        {/* THE NUMBER */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 72, alignItems: 'end' }}>
          <div>
            <div className="er-num" style={{
              fontSize: 184, fontWeight: 600, letterSpacing: '-0.055em',
              lineHeight: 0.88, color: C.fg, marginBottom: 20,
            }}>712</div>
            <h1 style={{
              fontSize: 34, fontWeight: 500, letterSpacing: '-0.02em',
              lineHeight: 1.15, margin: 0, color: C.fg, maxWidth: 720,
            }}>
              Medikamente in der Schweiz sind aktuell als nicht lieferbar gemeldet.
            </h1>
            <p style={{
              fontSize: 16, color: C.muted, marginTop: 18, maxWidth: 580, lineHeight: 1.55,
            }}>
              Aggregiert aus drugshortage.ch, BWL-Pflichtlager und der
              USB-Basel-Liste. Täglich abgeglichen, öffentlich zugänglich.
            </p>
          </div>

          {/* deltas column */}
          <div style={{
            borderLeft: `1px solid ${C.border}`, paddingLeft: 32,
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            <DeltaRow label="Neu seit KW 15" value="+5" dir="up" tone="neutral"/>
            <DeltaRow label="Beendet seit KW 15" value="−12" dir="down" tone="good"/>
            <DeltaRow label="≥ 6 Monate aktiv" value="207" suffix="29 %"/>
            <DeltaRow label="Historische Fälle" value="8 642" suffix="seit 2018"/>
          </div>
        </div>

        {/* search */}
        <div style={{ marginTop: 64, maxWidth: 760 }}>
          <label style={{ fontSize: 12, color: C.muted, fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            Suchen
          </label>
          <div style={{
            marginTop: 10, display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 20px', background: C.bgAlt,
            border: `1px solid ${C.border2}`, borderRadius: 8,
          }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={C.muted} strokeWidth="1.7">
              <circle cx="9" cy="9" r="6"/><path d="M14 14l4 4" strokeLinecap="round"/>
            </svg>
            <input placeholder="Wirkstoff, Handelsname, ATC-Code oder Firma"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: 'inherit', fontSize: 16, color: C.fg }}/>
            <span className="er-mono" style={{ fontSize: 11, color: C.muted2,
              padding: '3px 7px', border: `1px solid ${C.border2}`, borderRadius: 4 }}>↵</span>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['Amoxicillin', 'Metformin', 'ATC · J01', 'Insulin', 'Tamoxifen'].map(t => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

function DeltaRow({ label, value, dir, tone = 'neutral', suffix }) {
  const C = ER_COLORS;
  const toneColor = tone === 'good' ? C.success : tone === 'bad' ? C.destructive : C.fg;
  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, letterSpacing: '0.02em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className="er-num" style={{
          fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em',
          color: toneColor,
        }}>{value}</span>
        {suffix && <span style={{ fontSize: 13, color: C.muted }}>{suffix}</span>}
      </div>
    </div>
  );
}

function Chip({ children }) {
  const C = ER_COLORS;
  return (
    <span style={{
      fontSize: 13, color: C.muted, padding: '6px 12px',
      border: `1px solid ${C.border}`, borderRadius: 999,
      background: C.bg, cursor: 'pointer',
    }}>{children}</span>
  );
}

window.HeroA = HeroA;

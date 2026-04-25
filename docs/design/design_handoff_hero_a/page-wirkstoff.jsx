// Wirkstoff-Übersichtsseite — /wirkstoff/amoxicillin
// ATC-Gruppe → alle betroffenen Produkte. Tabellen-Vokabular, dicht.

function PageWirkstoff() {
  const w = {
    name: 'Amoxicillin',
    atc: 'J01CA04',
    klasse: 'Penicilline mit erweitertem Spektrum',
    indikationen: ['Atemwegsinfekte', 'HNO-Infekte', 'Harnwegsinfekte', 'Helicobacter-Eradikation'],
    aktiv: 7,
    historisch: 23,
    avgDays: 84,
  };

  const products = [
    { name: 'Amoxicillin Sandoz 500 mg, 20 Kaps.',  firma: 'Sandoz Pharmaceuticals AG', dose: '500 mg · 20',  status: 4, days: 94, score: 82, bwl: true,  cur: true,  alt: false },
    { name: 'Amoxi-Mepha 500 mg, 20 Kaps.',         firma: 'Mepha Pharma AG',           dose: '500 mg · 20',  status: null,days: null,score: null,bwl: true, cur: false, alt: true },
    { name: 'Clamoxyl 500 mg, 16 Kaps.',            firma: 'GSK',                        dose: '500 mg · 16',  status: 2,   days: 41, score: 58, bwl: false, cur: true,  alt: false },
    { name: 'Amoxicillin Sandoz 250 mg/5 ml Susp.', firma: 'Sandoz Pharmaceuticals AG', dose: '250 mg/5 ml',  status: 3,   days: 28, score: 47, bwl: true,  cur: true,  alt: false },
    { name: 'Amoxi-Mepha 250 mg/5 ml Susp.',        firma: 'Mepha Pharma AG',           dose: '250 mg/5 ml',  status: null,days: null,score: null,bwl: true,  cur: false, alt: true },
    { name: 'Amoxicillin Sandoz 1 g, 20 Kaps.',     firma: 'Sandoz Pharmaceuticals AG', dose: '1 g · 20',     status: 4,   days: 67, score: 74, bwl: false, cur: true,  alt: false },
    { name: 'Clamoxyl 1 g, 16 Kaps.',               firma: 'GSK',                        dose: '1 g · 16',     status: null,days: null,score: null,bwl: false, cur: false, alt: true },
    { name: 'Amoxi-Mepha 1 g, 20 Kaps.',            firma: 'Mepha Pharma AG',           dose: '1 g · 20',     status: 1,   days: 12, score: 32, bwl: false, cur: true,  alt: false },
    { name: 'Augmentin 625 mg, 20 Filmtabl.',       firma: 'GSK',                        dose: '500/125 mg',   status: null,days: null,score: null,bwl: false, cur: false, alt: true, combo: true },
    { name: 'Co-Amoxi Mepha 625 mg, 20 Filmtabl.',  firma: 'Mepha Pharma AG',           dose: '500/125 mg',   status: 2,   days: 19, score: 44, bwl: false, cur: true,  alt: false, combo: true },
  ];

  return (
    <PageShell active="wirkstoff" crumbs={['DASHBOARD', 'WIRKSTOFFE', 'AMOXICILLIN · J01CA04']}>
      {/* Hero */}
      <section style={{ padding: '36px 48px 32px', borderBottom: `1px solid ${PC.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 56, alignItems: 'flex-end' }}>
          <div>
            <PageEyebrow>Wirkstoff-Übersicht · ATC J01CA04</PageEyebrow>
            <h1 style={{
              margin: '14px 0 8px',
              fontSize: 88, lineHeight: 0.98, fontWeight: 500,
              letterSpacing: '-0.04em',
            }}>{w.name}</h1>
            <div style={{ fontSize: 18, color: PC.muted, letterSpacing: '-0.005em', maxWidth: 620 }}>
              {w.klasse} · ATC <span style={{ fontFamily: PF.mono, color: PC.fg }}>{w.atc}</span>
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {w.indikationen.map((i) => (
                <span key={i} style={{
                  fontSize: 12.5, fontFamily: PF.mono,
                  padding: '5px 10px', border: `1px solid ${PC.border2}`,
                  color: PC.muted, letterSpacing: '0.02em',
                }}>{i}</span>
              ))}
            </div>
          </div>
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
            border: `1px solid ${PC.border}` }}>
            {[
              { l: 'Aktive Engpässe', v: w.aktiv,      s: 'von 10 Produkten' },
              { l: 'Historisch',      v: w.historisch, s: 'seit 2021' },
              { l: 'Ø Dauer',         v: w.avgDays,    s: 'Tage bis Auflösung' },
            ].map((k, i) => (
              <div key={i} style={{
                padding: 18,
                borderRight: i < 2 ? `1px solid ${PC.border}` : 'none',
              }}>
                <div style={{
                  fontFamily: PF.mono, fontSize: 10,
                  color: PC.muted, letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>{k.l}</div>
                <div style={{
                  fontFamily: PF.mono, fontSize: 36, fontWeight: 600, marginTop: 6,
                  fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                  color: i === 0 ? PC.destructive : PC.fg,
                }}>{k.v}</div>
                <div style={{ fontSize: 11.5, color: PC.muted, marginTop: 2 }}>{k.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section style={{
        padding: '14px 48px',
        borderBottom: `1px solid ${PC.border}`,
        background: PC.bgAlt,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {['Alle (10)', 'Nur aktive Engpässe (7)', 'Verfügbar (3)', 'Pflichtlager (4)'].map((f, i) => (
            <button key={f} style={{
              padding: '8px 16px', fontSize: 13,
              border: `1px solid ${PC.border2}`,
              borderLeft: i === 0 ? `1px solid ${PC.border2}` : 'none',
              background: i === 0 ? PC.fg : PC.bg,
              color: i === 0 ? PC.fgOnDark : PC.fg,
              cursor: 'pointer', fontFamily: PF.sans,
            }}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12.5, color: PC.muted }}>
          <span>Sortierung:</span>
          <span style={{ fontFamily: PF.mono, color: PC.fg }}>Score ↓</span>
          <span style={{ color: PC.border2 }}>·</span>
          <span style={{ textDecoration: 'underline' }}>CSV</span>
          <span style={{ textDecoration: 'underline' }}>API</span>
        </div>
      </section>

      {/* Data table */}
      <section style={{ padding: '0 48px' }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse',
          fontFamily: PF.sans, fontSize: 14,
        }}>
          <thead>
            <tr style={{ background: PC.bg }}>
              {[
                ['Produkt', 'left', '32%'],
                ['Firma', 'left', '20%'],
                ['Dosierung', 'left', '12%'],
                ['Status', 'left', '14%'],
                ['Tage', 'right', '8%'],
                ['Score', 'right', '8%'],
                ['', 'right', '6%'],
              ].map(([l, a, w]) => (
                <th key={l} style={{
                  padding: '14px 12px', textAlign: a, width: w,
                  borderBottom: `1px solid ${PC.fg}`,
                  fontFamily: PF.mono, fontSize: 10.5, color: PC.muted,
                  letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                }}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => {
              const isAlt = p.alt;
              return (
                <tr key={i} style={{
                  borderBottom: `1px solid ${PC.border}`,
                  background: isAlt ? PC.bgAlt : PC.bg,
                  opacity: isAlt ? 0.85 : 1,
                }}>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontWeight: 500, letterSpacing: '-0.005em' }}>{p.name}</span>
                      {p.combo && (
                        <span style={{
                          fontFamily: PF.mono, fontSize: 9.5,
                          padding: '2px 5px', background: PC.primarySoft, color: PC.primaryInk,
                          letterSpacing: '0.06em',
                        }}>+ CLAVULAN</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px', color: PC.muted }}>{p.firma}</td>
                  <td style={{ padding: '14px 12px', fontFamily: PF.mono, fontSize: 13, color: PC.fg }}>
                    {p.dose}
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    {p.status != null ? <StatusPill code={p.status} /> :
                      <span style={{
                        fontFamily: PF.mono, fontSize: 11.5, color: PC.success,
                        letterSpacing: '0.04em',
                      }}>✓ VERFÜGBAR</span>}
                    {p.bwl && (
                      <span style={{
                        marginLeft: 6, fontFamily: PF.mono, fontSize: 9.5,
                        padding: '2px 5px',
                        background: 'oklch(0.72 0.15 75 / 0.12)',
                        color: 'oklch(0.45 0.12 75)',
                        letterSpacing: '0.06em',
                      }}>BWL</span>
                    )}
                  </td>
                  <td style={{
                    padding: '14px 12px', textAlign: 'right',
                    fontFamily: PF.mono, fontVariantNumeric: 'tabular-nums',
                    color: p.days ? PC.fg : PC.muted2,
                  }}>{p.days ?? '—'}</td>
                  <td style={{
                    padding: '14px 12px', textAlign: 'right',
                    fontFamily: PF.mono, fontVariantNumeric: 'tabular-nums',
                    fontWeight: 600,
                    color: p.score == null ? PC.muted2 :
                           p.score >= 75 ? PC.destructive :
                           p.score >= 50 ? PC.warning :
                           p.score >= 25 ? 'oklch(0.65 0.14 130)' : PC.success,
                  }}>{p.score ?? '—'}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: PC.muted2 }}>→</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Insight strip */}
      <section style={{ padding: '40px 48px', borderTop: `1px solid ${PC.fg}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56 }}>
          <div>
            <PageEyebrow>Muster im Wirkstoff</PageEyebrow>
            <h2 style={{ margin: '8px 0 16px', fontSize: 32, fontWeight: 500, letterSpacing: '-0.025em', maxWidth: 620 }}>
              Sandoz dominiert Engpässe. Mepha hält Suspensionen stabil.
            </h2>
            <div style={{ fontSize: 15, color: PC.muted, lineHeight: 1.55, maxWidth: 520 }}>
              5 von 7 aktiven Engpässen kommen von Sandoz. Mepha-Produkte sind
              durchgängig verfügbar — auch dort, wo Sandoz ausfällt. Für
              Spitalapotheken: Mepha als Default-Substitution prüfen.
            </div>
          </div>

          <div style={{
            padding: 24, border: `1px solid ${PC.border}`,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <PageEyebrow>Ausfälle nach Hersteller</PageEyebrow>
            {[
              { f: 'Sandoz Pharmaceuticals AG', n: 5, p: 71 },
              { f: 'Mepha Pharma AG',           n: 1, p: 14 },
              { f: 'GSK',                       n: 1, p: 14 },
            ].map((row) => (
              <div key={row.f}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 6 }}>
                  <span>{row.f}</span>
                  <span style={{ fontFamily: PF.mono, color: PC.muted }}>
                    {row.n} · <span style={{ color: PC.fg }}>{row.p}%</span>
                  </span>
                </div>
                <div style={{ height: 6, background: PC.border }}>
                  <div style={{ width: row.p + '%', height: '100%', background: PC.fg }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

window.PageWirkstoff = PageWirkstoff;

// Firmen-Profil — /firma/sandoz-pharmaceuticals-ag
// Hersteller-Sicht: aktuelle + historische Engpässe, Meldeverhalten, Track Record.
// Designziel: für Journalist:innen scannbar, mit Story.

function PageFirma() {
  const f = {
    name: 'Sandoz Pharmaceuticals AG',
    parent: 'Sandoz International GmbH · Holzkirchen (DE)',
    sitz: 'Risch-Rotkreuz · ZG',
    swissPortfolio: 487,
    aktiv: 23,
    historisch: 142,
    avgScore: 71,
    noInfoPct: 48,
    track: 'Hoch-Risiko-Profil',
  };

  const status = [
    { c: 1, l: 'Direkt gemeldet',  n: 2,  pct: 9 },
    { c: 2, l: 'Gemeldet',         n: 4,  pct: 17 },
    { c: 3, l: 'Sporadisch',       n: 6,  pct: 26 },
    { c: 4, l: 'Keine Information',n: 11, pct: 48 },
  ];

  const shortages = [
    { name: 'Amoxicillin Sandoz 500 mg', dose: '500 mg · 20', atc: 'J01CA04', status: 4, days: 94, score: 82, bwl: true },
    { name: 'Amoxicillin Sandoz 1 g',    dose: '1 g · 20',    atc: 'J01CA04', status: 4, days: 67, score: 74, bwl: false },
    { name: 'Methylphenidat Sandoz 18 mg ret.', dose: '18 mg · 30', atc: 'N06BA04', status: 4, days: 121, score: 88, bwl: false },
    { name: 'Methylphenidat Sandoz 36 mg ret.', dose: '36 mg · 30', atc: 'N06BA04', status: 4, days: 121, score: 86, bwl: false },
    { name: 'Tamoxifen Sandoz 20 mg',    dose: '20 mg · 100', atc: 'L02BA01', status: 3, days: 54, score: 68, bwl: true },
    { name: 'Furosemid Sandoz 40 mg',    dose: '40 mg · 50',  atc: 'C03CA01', status: 2, days: 19, score: 38, bwl: false },
    { name: 'Pantoprazol Sandoz 40 mg',  dose: '40 mg · 30',  atc: 'A02BC02', status: 4, days: 78, score: 76, bwl: false },
    { name: 'Atorvastatin Sandoz 40 mg', dose: '40 mg · 100', atc: 'C10AA05', status: 1, days: 8,  score: 22, bwl: false },
  ];

  const months = [3,5,8,11,9,14,18,12,9,7,11,15,18,17,16,21,19,17,22,23,21,19,23,23];

  return (
    <PageShell active="firma" crumbs={['DASHBOARD', 'FIRMEN', 'SANDOZ PHARMACEUTICALS AG']}>
      {/* Hero */}
      <section style={{ padding: '36px 48px 32px', borderBottom: `1px solid ${PC.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 56, alignItems: 'flex-end' }}>
          <div>
            <PageEyebrow>Hersteller-Profil</PageEyebrow>
            <h1 style={{ margin: '14px 0 10px', fontSize: 64, lineHeight: 1.02, fontWeight: 500, letterSpacing: '-0.035em' }}>
              {f.name}
            </h1>
            <div style={{ fontSize: 16, color: PC.muted, lineHeight: 1.5 }}>
              {f.parent}<br/>
              CH-Niederlassung: <span style={{ color: PC.fg }}>{f.sitz}</span>
              {' · '}
              <span style={{ fontFamily: PF.mono, color: PC.fg }}>{f.swissPortfolio}</span> Produkte im Schweizer Markt
            </div>
          </div>
          <div style={{
            padding: '20px 24px', border: `1px solid ${PC.destructive}`,
            background: 'oklch(0.58 0.21 27 / 0.06)',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <PageEyebrow>Track-Record-Einstufung</PageEyebrow>
            <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', color: PC.destructive }}>
              {f.track}
            </div>
            <div style={{ fontSize: 13, color: PC.muted, lineHeight: 1.5 }}>
              Hoher „Keine-Info"-Anteil und überdurchschnittliche Score-Verteilung.
              Algorithmische Einstufung — keine Bewertung.
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section style={{
        padding: 0, borderBottom: `1px solid ${PC.border}`,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      }}>
        {[
          { l: 'Aktive Engpässe',    v: f.aktiv,        s: '24. Apr · live',          tone: 'destr' },
          { l: 'Historisch',          v: f.historisch,   s: 'seit 2021 · 4.2 Jahre' },
          { l: 'Ø Severity Score',    v: f.avgScore,     s: 'Branchen-Median: 52',     tone: 'destr' },
          { l: 'Keine-Info-Anteil',   v: f.noInfoPct + '%', s: 'Status 4 · Branche: 18%', tone: 'destr' },
        ].map((k, i) => (
          <div key={i} style={{
            padding: '28px 32px',
            borderRight: i < 3 ? `1px solid ${PC.border}` : 'none',
          }}>
            <div style={{
              fontFamily: PF.mono, fontSize: 10.5, color: PC.muted,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>{k.l}</div>
            <div style={{
              fontFamily: PF.mono, fontSize: 56, fontWeight: 600,
              letterSpacing: '-0.03em', marginTop: 8, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              color: k.tone === 'destr' ? PC.destructive : PC.fg,
            }}>{k.v}</div>
            <div style={{ fontSize: 12.5, color: PC.muted, marginTop: 8 }}>{k.s}</div>
          </div>
        ))}
      </section>

      {/* Meldeverhalten + 24-Monate-Sparkline */}
      <section style={{ padding: '40px 48px', borderBottom: `1px solid ${PC.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 56 }}>
          <div>
            <PageEyebrow>Meldeverhalten · alle 23 aktiven Engpässe</PageEyebrow>
            <h2 style={{ margin: '8px 0 18px', fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>
              Fast die Hälfte ohne Update.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {status.map((s) => (
                <div key={s.c}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    fontSize: 13.5, marginBottom: 6,
                  }}>
                    <span>
                      <span style={{
                        fontFamily: PF.mono, fontSize: 11, color: PC.muted,
                        marginRight: 8, letterSpacing: '0.04em',
                      }}>STATUS {s.c}</span>
                      {s.l}
                    </span>
                    <span style={{ fontFamily: PF.mono, color: PC.muted }}>
                      {s.n} · <span style={{ color: PC.fg }}>{s.pct}%</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: PC.border }}>
                    <div style={{
                      width: s.pct + '%', height: '100%',
                      background: s.c === 4 ? PC.destructive :
                                  s.c === 3 ? PC.warning :
                                  s.c === 2 ? 'oklch(0.65 0.14 130)' : PC.success,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <PageEyebrow>Aktive Engpässe pro Monat · 2024 → 2026</PageEyebrow>
            <h2 style={{ margin: '8px 0 18px', fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>
              Trend zeigt nach oben.
            </h2>
            {/* Bar chart */}
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 4,
              height: 160, padding: '0 0 8px', borderBottom: `1px solid ${PC.fg}`,
            }}>
              {months.map((v, i) => (
                <div key={i} style={{
                  flex: 1,
                  height: `${(v / 25) * 100}%`,
                  background: i === months.length - 1 ? PC.destructive : PC.fg,
                  opacity: i === months.length - 1 ? 1 : 0.85 - (months.length - i) * 0.015,
                }} title={`${v}`} />
              ))}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: PF.mono, fontSize: 10.5, color: PC.muted,
              marginTop: 10, letterSpacing: '0.04em',
            }}>
              <span>MAI 2024</span>
              <span>MAI 2025</span>
              <span style={{ color: PC.fg }}>APR 2026 · 23</span>
            </div>
          </div>
        </div>
      </section>

      {/* Active shortages table */}
      <section style={{ padding: '40px 48px 0', borderBottom: `1px solid ${PC.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <div>
            <PageEyebrow>Top-8 nach Score · von 23 aktiven</PageEyebrow>
            <h2 style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>
              Aktive Engpässe
            </h2>
          </div>
          <div style={{ fontSize: 13, color: PC.muted }}>
            <span style={{ textDecoration: 'underline', color: PC.fg }}>Alle 23 anzeigen →</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {[
                ['Bezeichnung', 'left'],
                ['Dosierung', 'left'],
                ['ATC', 'left'],
                ['Status', 'left'],
                ['Tage', 'right'],
                ['Score', 'right'],
              ].map(([l, a]) => (
                <th key={l} style={{
                  padding: '12px 12px', textAlign: a,
                  borderBottom: `1px solid ${PC.fg}`,
                  fontFamily: PF.mono, fontSize: 10.5, color: PC.muted,
                  letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                }}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shortages.map((s, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${PC.border}` }}>
                <td style={{ padding: '14px 12px', fontWeight: 500 }}>
                  {s.name}
                  {s.bwl && (
                    <span style={{
                      marginLeft: 8, fontFamily: PF.mono, fontSize: 9.5,
                      padding: '2px 5px',
                      background: 'oklch(0.72 0.15 75 / 0.12)',
                      color: 'oklch(0.45 0.12 75)', letterSpacing: '0.06em',
                    }}>BWL</span>
                  )}
                </td>
                <td style={{ padding: '14px 12px', fontFamily: PF.mono, fontSize: 13, color: PC.muted }}>
                  {s.dose}
                </td>
                <td style={{ padding: '14px 12px', fontFamily: PF.mono, fontSize: 13, color: PC.fg }}>
                  {s.atc}
                </td>
                <td style={{ padding: '14px 12px' }}>
                  <StatusPill code={s.status} />
                </td>
                <td style={{
                  padding: '14px 12px', textAlign: 'right',
                  fontFamily: PF.mono, fontVariantNumeric: 'tabular-nums', color: PC.fg,
                }}>{s.days}</td>
                <td style={{
                  padding: '14px 12px', textAlign: 'right',
                  fontFamily: PF.mono, fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                  color: s.score >= 75 ? PC.destructive :
                         s.score >= 50 ? PC.warning :
                         s.score >= 25 ? 'oklch(0.65 0.14 130)' : PC.success,
                }}>{s.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Press / Kontakt */}
      <section style={{ padding: '40px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56 }}>
          <div>
            <PageEyebrow>Für Journalist:innen</PageEyebrow>
            <h2 style={{ margin: '8px 0 14px', fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>
              Recherche-Material
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'CSV-Export · alle 142 historischen Engpässe',
                'Zeitreihe seit 2021 · JSON via API',
                'Wiederholte Wirkstoffe · Top-Liste',
                'Vergleich mit Mepha & GSK im selben ATC',
              ].map((l, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 0', borderBottom: `1px solid ${PC.border}`,
                  fontSize: 14,
                }}>
                  <span style={{ fontFamily: PF.mono, fontSize: 11, color: PC.muted }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ flex: 1 }}>{l}</span>
                  <span style={{ fontFamily: PF.mono, fontSize: 11, color: PC.muted }}>↓</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <PageEyebrow>Offizielle Pressestelle</PageEyebrow>
            <h2 style={{ margin: '8px 0 14px', fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>
              Kontakt der Firma
            </h2>
            <div style={{
              padding: 24, border: `1px solid ${PC.border}`,
              display: 'flex', flexDirection: 'column', gap: 10,
              fontSize: 14, lineHeight: 1.6,
            }}>
              <div>Sandoz Pharmaceuticals AG</div>
              <div style={{ color: PC.muted }}>Suurstoffi 14 · 6343 Risch-Rotkreuz</div>
              <div style={{ fontFamily: PF.mono, fontSize: 13 }}>+41 41 763 71 11</div>
              <div style={{ fontFamily: PF.mono, fontSize: 13, color: PC.primary }}>
                medinfo.suisse@sandoz.com
              </div>
              <div style={{
                fontFamily: PF.mono, fontSize: 11, color: PC.muted2,
                letterSpacing: '0.04em', marginTop: 8,
                paddingTop: 12, borderTop: `1px solid ${PC.border}`,
              }}>
                Quelle: Impressum sandoz.com/ch · zuletzt geprüft 24. Apr 2026
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

window.PageFirma = PageFirma;

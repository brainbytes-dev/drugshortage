// Medikament-Detailseite — /medikament/amoxicillin-500-20-kaps
// SEO-Hauptseite für jede Suche „<Medikament> Engpass". Datenreich, kein Deko.

function PageMedikament() {
  // Mock data shaped like real DB rows from the Next.js app
  const drug = {
    bezeichnung: 'Amoxicillin Sandoz 500 mg, Filmtabl.',
    firma: 'Sandoz Pharmaceuticals AG',
    firmaSlug: 'sandoz-pharmaceuticals-ag',
    atc: 'J01CA04',
    atcLabel: 'Amoxicillin · Penicilline mit erweitertem Spektrum',
    wirkstoff: 'Amoxicillin',
    wirkstoffSlug: 'amoxicillin',
    dose: '500 mg · 20 Filmtabletten',
    swissmedic: '54’321 (Mat.-Nr. 7680543210011)',
    gtin: '7680543210011',
    statusCode: 4,
    statusText: 'Keine Information',
    tageSeitMeldung: 94,
    erstmeldung: '21. Jan 2026',
    voraussichtlich: 'unbekannt',
    bwlPflichtlager: true,
    score: 82,
    breakdown: { transparency: 35, duration: 22, noAlt: 14, critical: 11 },
    ppub: 14.85,
    pexf: 7.20,
    zusammensetzung: 'Amoxicillin trihydricum corresp. Amoxicillinum 500 mg, Excip. pro compressi obducti.',
  };

  const timeline = [
    { d: '21. Jan',  m: 'Erstmeldung von Sandoz', s: 'Status 1', kind: 'meld' },
    { d: '02. Feb',  m: 'BWL bestätigt — Pflichtlager-Freigabe Tranche 1', s: '', kind: 'bwl' },
    { d: '14. Feb',  m: 'Status auf 2 herabgestuft (verzögerte Updates)', s: 'Status 2', kind: 'down' },
    { d: '08. Mär',  m: 'USB Basel meldet Engpass im hauseigenen Kanal', s: '', kind: 'src' },
    { d: '02. Apr',  m: 'Sandoz übermittelt keine neuen Updates → Status 4', s: 'Status 4', kind: 'down' },
    { d: '24. Apr',  m: 'Letzter Sync · keine Statusänderung', s: '', kind: 'sync' },
  ];

  const alternatives = [
    { name: 'Amoxi-Mepha 500', firma: 'Mepha Pharma AG',         status: '✓ verfügbar',  same: true,  note: 'wirkstoffgleich · Pflichtlager' },
    { name: 'Clamoxyl 500',    firma: 'GSK',                      status: '⚠ ebenfalls Engpass', same: true,  note: 'Status 2 · seit 41 Tagen' },
    { name: 'Augmentin 625',   firma: 'GSK',                      status: '✓ verfügbar',  same: false, note: 'Amoxi + Clavulansäure · breitere Wirkung' },
    { name: 'Ospen 1500',      firma: 'Sandoz Pharmaceuticals AG',status: '✓ verfügbar',  same: false, note: 'Phenoxymethylpenicillin · enger Spektrum' },
  ];

  const history = [
    { y: '2024',   d: '67 Tage',  v: 'Sandoz · Amoxicillin 500 mg' },
    { y: '2023',   d: '142 Tage', v: 'Mepha · Amoxi-Mepha 500' },
    { y: '2022',   d: '38 Tage',  v: 'Sandoz · Amoxicillin 250 mg/5 ml' },
    { y: '2021',   d: '89 Tage',  v: 'Sandoz · Amoxicillin 500 mg' },
  ];

  return (
    <PageShell
      active="dashboard"
      crumbs={['DASHBOARD', 'WIRKSTOFF · J01CA04', 'AMOXICILLIN SANDOZ 500 MG']}
    >
      {/* ─── Hero / Status ──────────────────────────────────────────── */}
      <section style={{
        padding: '36px 48px 40px',
        borderBottom: `1px solid ${PC.border}`,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 56 }}>
          <div>
            <PageEyebrow>Lieferengpass · aktiv seit 94 Tagen</PageEyebrow>
            <h1 style={{
              margin: '14px 0 8px',
              fontSize: 56, lineHeight: 1.04, fontWeight: 500,
              letterSpacing: '-0.03em',
            }}>
              {drug.bezeichnung}
            </h1>
            <div style={{ fontSize: 18, color: PC.muted, letterSpacing: '-0.005em' }}>
              {drug.dose} · <span style={{ color: PC.fg }}>{drug.firma}</span>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <StatusPill code={drug.statusCode} big />
              {drug.bwlPflichtlager && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', fontSize: 14,
                  border: `1px solid ${PC.warning}`,
                  background: 'oklch(0.72 0.15 75 / 0.08)', color: 'oklch(0.45 0.12 75)',
                }}>
                  <span style={{ fontFamily: PF.mono, fontSize: 11, opacity: 0.8 }}>BWL</span>
                  <span>·</span>
                  <span>Pflichtlager freigegeben</span>
                </div>
              )}
            </div>

            {/* Watchlist CTA inline */}
            <div style={{
              marginTop: 32, padding: 20,
              border: `1px solid ${PC.border}`, background: PC.bgAlt,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em' }}>
                  Benachrichtigt werden, wenn sich der Status ändert
                </div>
                <div style={{ fontSize: 13.5, color: PC.muted, marginTop: 4 }}>
                  Eine Mail. Pro Statuswechsel. Keine Werbung.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 0, border: `1px solid ${PC.fg}` }}>
                <input placeholder="ihre@apotheke.ch" style={{
                  border: 'none', outline: 'none', padding: '12px 16px',
                  fontSize: 14, width: 240, background: PC.bg, color: PC.fg,
                  fontFamily: PF.sans,
                }} />
                <button style={{
                  border: 'none', padding: '12px 18px', cursor: 'pointer',
                  background: PC.fg, color: PC.fgOnDark,
                  fontSize: 14, fontWeight: 500,
                }}>Watchlist →</button>
              </div>
            </div>
          </div>

          {/* Score panel */}
          <aside style={{
            padding: 28, border: `1px solid ${PC.border}`,
            display: 'flex', flexDirection: 'column', gap: 20,
            background: PC.bg,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <PageEyebrow>engpass.radar Score</PageEyebrow>
                <div style={{ fontSize: 13, color: PC.muted, marginTop: 6, lineHeight: 1.5 }}>
                  Höher = schwerwiegender. Kombiniert vier Faktoren.
                </div>
              </div>
              <div style={{
                fontFamily: PF.mono, fontVariantNumeric: 'tabular-nums',
                fontSize: 64, fontWeight: 600, color: PC.destructive,
                letterSpacing: '-0.03em', lineHeight: 1,
              }}>
                {drug.score}
                <span style={{
                  fontSize: 18, color: PC.muted, fontWeight: 400, marginLeft: 4,
                }}>/100</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { l: 'Transparenz',         v: drug.breakdown.transparency, max: 35 },
                { l: 'Dauer',               v: drug.breakdown.duration,     max: 30 },
                { l: 'Keine Alternativen',  v: drug.breakdown.noAlt,        max: 20 },
                { l: 'Pflichtlager / BWL',  v: drug.breakdown.critical,     max: 15 },
              ].map((row) => (
                <div key={row.l}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 12.5, color: PC.muted, marginBottom: 4,
                  }}>
                    <span>{row.l}</span>
                    <span style={{ fontFamily: PF.mono, color: PC.fg }}>
                      {row.v} / {row.max}
                    </span>
                  </div>
                  <div style={{ height: 6, background: PC.border, position: 'relative' }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      width: `${(row.v / row.max) * 100}%`,
                      background: PC.fg,
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              fontSize: 11.5, color: PC.muted, lineHeight: 1.5,
              borderTop: `1px solid ${PC.border}`, paddingTop: 14,
            }}>
              Score-Methodik · proprietärer Index ·{' '}
              <span style={{ textDecoration: 'underline', color: PC.fg }}>methodik →</span>
            </div>
          </aside>
        </div>
      </section>

      {/* ─── Timeline ───────────────────────────────────────────────── */}
      <section style={{ padding: '40px 48px', borderBottom: `1px solid ${PC.border}` }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <div>
            <PageEyebrow>Verlauf · 6 Ereignisse</PageEyebrow>
            <h2 style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>
              Was bisher geschah
            </h2>
          </div>
          <div style={{ fontSize: 13, color: PC.muted, fontFamily: PF.mono }}>
            21. Jan 2026 → heute
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {timeline.map((ev, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '90px 24px 1fr 160px',
              gap: 16, padding: '18px 0',
              borderTop: i === 0 ? `1px solid ${PC.border}` : 'none',
              borderBottom: `1px solid ${PC.border}`,
              alignItems: 'flex-start',
            }}>
              <div style={{
                fontFamily: PF.mono, fontSize: 13, color: PC.muted,
                letterSpacing: '0.02em',
              }}>{ev.d}</div>
              <div style={{ position: 'relative', height: 20 }}>
                <div style={{
                  position: 'absolute', top: 6, left: 7,
                  width: 10, height: 10,
                  background: ev.kind === 'down' ? PC.destructive :
                              ev.kind === 'bwl'  ? PC.warning :
                              ev.kind === 'sync' ? PC.muted2 : PC.fg,
                  borderRadius: ev.kind === 'sync' ? 999 : 0,
                }} />
              </div>
              <div style={{ fontSize: 15.5, color: PC.fg, lineHeight: 1.45 }}>
                {ev.m}
              </div>
              <div style={{
                fontFamily: PF.mono, fontSize: 11, color: PC.muted,
                letterSpacing: '0.06em', textAlign: 'right',
              }}>{ev.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Alternativen ───────────────────────────────────────────── */}
      <section style={{ padding: '40px 48px', borderBottom: `1px solid ${PC.border}` }}>
        <div style={{ marginBottom: 20 }}>
          <PageEyebrow>Alternativen · 4 Kandidaten</PageEyebrow>
          <h2 style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>
            Was Sie stattdessen abgeben können
          </h2>
          <div style={{ fontSize: 14, color: PC.muted, marginTop: 6 }}>
            Sortiert nach: gleicher Wirkstoff zuerst. Verfügbarkeit aus tagesaktuellem Index.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {alternatives.map((a) => (
            <div key={a.name} style={{
              padding: 20, border: `1px solid ${PC.border}`,
              display: 'flex', flexDirection: 'column', gap: 8,
              background: PC.bg,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>
                  {a.name}
                </div>
                <div style={{
                  fontFamily: PF.mono, fontSize: 11.5,
                  color: a.status.startsWith('✓') ? PC.success : PC.warning,
                  letterSpacing: '0.04em',
                }}>{a.status}</div>
              </div>
              <div style={{ fontSize: 13.5, color: PC.muted }}>
                {a.firma}
              </div>
              <div style={{
                fontSize: 13, color: PC.fg,
                paddingTop: 8, borderTop: `1px solid ${PC.border}`,
                marginTop: 4,
              }}>
                {a.same && (
                  <span style={{
                    display: 'inline-block', marginRight: 8,
                    fontFamily: PF.mono, fontSize: 10,
                    color: PC.primaryInk, background: PC.primarySoft,
                    padding: '2px 6px', letterSpacing: '0.06em',
                  }}>WIRKSTOFFGLEICH</span>
                )}
                {a.note}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Details / Stammdaten ───────────────────────────────────── */}
      <section style={{ padding: '40px 48px', borderBottom: `1px solid ${PC.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 56 }}>
          <div>
            <PageEyebrow>Stammdaten</PageEyebrow>
            <h2 style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>
              Was Sie wissen müssen
            </h2>
          </div>
          <dl style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
            {[
              ['ATC-Code',           <span><span style={{ fontFamily: PF.mono }}>{drug.atc}</span> <span style={{ color: PC.muted }}> · {drug.atcLabel}</span></span>],
              ['Wirkstoff',          drug.wirkstoff],
              ['Swissmedic-Nr',      <span style={{ fontFamily: PF.mono, fontSize: 14 }}>{drug.swissmedic}</span>],
              ['GTIN',               <span style={{ fontFamily: PF.mono, fontSize: 14 }}>{drug.gtin}</span>],
              ['Erstmeldung',        drug.erstmeldung + ' · von ' + drug.firma],
              ['Voraussichtlich verfügbar', <span style={{ color: PC.destructive }}>{drug.voraussichtlich}</span>],
              ['Publikumspreis',     <span><span style={{ fontFamily: PF.mono }}>CHF {drug.ppub.toFixed(2)}</span> <span style={{ color: PC.muted }}> · PPUB</span></span>],
              ['Fabrikabgabepreis',  <span><span style={{ fontFamily: PF.mono }}>CHF {drug.pexf.toFixed(2)}</span> <span style={{ color: PC.muted }}> · PEXF</span></span>],
              ['Zusammensetzung',    <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>{drug.zusammensetzung}</span>],
              ['Fachinformation',    <span style={{ textDecoration: 'underline' }}>swissmedicinfo.ch · AIPS →</span>],
            ].map(([l, v], i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '220px 1fr',
                padding: '14px 0',
                borderTop: i === 0 ? `1px solid ${PC.border}` : 'none',
                borderBottom: `1px solid ${PC.border}`,
                alignItems: 'baseline',
              }}>
                <dt style={{
                  fontFamily: PF.mono, fontSize: 11.5, color: PC.muted,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>{l}</dt>
                <dd style={{ margin: 0, fontSize: 14.5, color: PC.fg }}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── History ────────────────────────────────────────────────── */}
      <section style={{ padding: '40px 48px', borderBottom: `1px solid ${PC.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 56 }}>
          <div>
            <PageEyebrow>Wiederholungs-Muster · seit 2021</PageEyebrow>
            <h2 style={{ margin: '8px 0 14px', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>
              Schon das 5. Mal
            </h2>
            <div style={{ fontSize: 14, color: PC.muted, lineHeight: 1.55, maxWidth: 320 }}>
              Wirkstoffgleiche Produkte (ATC J01CA04) waren bereits 4× im Engpass.
              Im Schnitt 84 Tage bis Auflösung.
            </div>
          </div>
          <div>
            {history.map((h, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '80px 100px 1fr',
                gap: 24, padding: '14px 0',
                borderTop: i === 0 ? `1px solid ${PC.border}` : 'none',
                borderBottom: `1px solid ${PC.border}`,
                alignItems: 'baseline',
              }}>
                <div style={{
                  fontFamily: PF.mono, fontSize: 16, color: PC.fg,
                  fontVariantNumeric: 'tabular-nums',
                }}>{h.y}</div>
                <div style={{
                  fontFamily: PF.mono, fontSize: 13, color: PC.muted,
                  fontVariantNumeric: 'tabular-nums',
                }}>{h.d}</div>
                <div style={{ fontSize: 14.5, color: PC.fg }}>{h.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Quellen-Footer ────────────────────────────────────────── */}
      <section style={{ padding: '32px 48px', background: PC.bgAlt }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32 }}>
          <div>
            <PageEyebrow>Quellen für diesen Eintrag</PageEyebrow>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['drugshortage.ch',  '24. Apr · 03:14',  'BAG-Meldestelle · Status-Tracking'],
                ['bwl.admin.ch',     '24. Apr · 03:16',  'Pflichtlager-Status XLSX'],
                ['oddb.org',         '24. Apr · 03:11',  'Stammdaten · Preise · Zusammensetzung'],
                ['unispital-basel.ch','22. Apr · 14:02', 'USB Spitalpharmazie PDF'],
              ].map(([src, ts, what]) => (
                <div key={src} style={{
                  display: 'grid', gridTemplateColumns: '200px 140px 1fr',
                  gap: 24, fontSize: 13.5,
                }}>
                  <span style={{ fontFamily: PF.mono, color: PC.fg }}>{src}</span>
                  <span style={{ fontFamily: PF.mono, color: PC.muted }}>{ts}</span>
                  <span style={{ color: PC.muted }}>{what}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            fontSize: 11.5, color: PC.muted, fontFamily: PF.mono,
            letterSpacing: '0.06em', textAlign: 'right', maxWidth: 280, lineHeight: 1.6,
          }}>
            KEINE GEWÄHR AUF VOLLSTÄNDIGKEIT.<br/>
            BEI KLINISCHER ENTSCHEIDUNG IMMER<br/>
            ORIGINAL-QUELLE PRÜFEN.
          </div>
        </div>
      </section>
    </PageShell>
  );
}

window.PageMedikament = PageMedikament;

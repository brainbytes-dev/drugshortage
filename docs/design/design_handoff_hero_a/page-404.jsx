// 404-Seite — bessere Variante als die im Repo.
// Statt "Seite nicht gefunden" → "Dieses Medikament ist nicht im Engpass-Register".
// Bietet konkrete nächste Schritte und macht den Fehler nützlich.

function PageNotFound() {
  const suggestions = [
    { name: 'Amoxicillin Sandoz 500 mg', match: 'Wirkstoff-Match',  status: 4, days: 94 },
    { name: 'Amoxi-Mepha 500 mg',         match: 'Substanz-Alias',  status: null, days: null },
    { name: 'Augmentin 625',              match: 'ATC J01CR02 nahe', status: null, days: null },
  ];

  return (
    <PageShell active="dashboard" crumbs={['DASHBOARD', '404']}>
      {/* Hero */}
      <section style={{
        padding: '64px 48px 48px',
        borderBottom: `1px solid ${PC.border}`,
        background: PC.bg,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Big mono 404 as background mark */}
        <div aria-hidden style={{
          position: 'absolute',
          right: 48, top: 24,
          fontFamily: PF.mono, fontSize: 320, fontWeight: 600,
          color: PC.bgAlt,
          letterSpacing: '-0.06em', lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          userSelect: 'none', pointerEvents: 'none',
        }}>404</div>

        <div style={{ position: 'relative', maxWidth: 720 }}>
          <PageEyebrow>Eintrag nicht gefunden · /medikament/amoxicilin-500</PageEyebrow>
          <h1 style={{
            margin: '20px 0 16px',
            fontSize: 80, lineHeight: 0.98, fontWeight: 500,
            letterSpacing: '-0.04em',
          }}>
            Diesen Engpass<br/>
            <span style={{ color: PC.muted }}>kennen wir nicht.</span>
          </h1>
          <div style={{ fontSize: 19, color: PC.muted, lineHeight: 1.55, maxWidth: 580 }}>
            Drei mögliche Gründe — und drei, was Sie als Nächstes tun können.
          </div>
        </div>
      </section>

      {/* Three reasons */}
      <section style={{ padding: '40px 48px', borderBottom: `1px solid ${PC.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
          border: `1px solid ${PC.border}` }}>
          {[
            {
              n: '01',
              t: 'Tippfehler in der URL',
              d: 'Wir korrigieren keine Slugs automatisch. „amoxicilin" ≠ „amoxicillin".',
              a: 'Suche nutzen',
            },
            {
              n: '02',
              t: 'Engpass wurde aufgelöst',
              d: 'Sobald drugshortage.ch ein Produkt entfernt, verschwindet auch unsere Seite — bewusst, damit nichts Veraltetes herumsteht.',
              a: 'Historie ansehen',
            },
            {
              n: '03',
              t: 'Produkt war nie im Engpass',
              d: 'Wir tracken nur Schweizer Lieferengpässe. Stammdaten zu allen 128k Produkten finden Sie bei Swissmedic / ODDB.',
              a: 'Zu swissmedicinfo.ch',
            },
          ].map((r, i) => (
            <div key={i} style={{
              padding: 28,
              borderRight: i < 2 ? `1px solid ${PC.border}` : 'none',
              display: 'flex', flexDirection: 'column', gap: 12,
              minHeight: 240,
            }}>
              <div style={{
                fontFamily: PF.mono, fontSize: 13, color: PC.muted,
                fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em',
              }}>{r.n}</div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em' }}>
                {r.t}
              </div>
              <div style={{ fontSize: 14, color: PC.muted, lineHeight: 1.55, flex: 1 }}>
                {r.d}
              </div>
              <div style={{
                fontFamily: PF.mono, fontSize: 12.5, color: PC.fg,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                paddingTop: 12, borderTop: `1px solid ${PC.border}`,
              }}>
                {r.a} →
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Best guess */}
      <section style={{ padding: '40px 48px', borderBottom: `1px solid ${PC.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 56 }}>
          <div>
            <PageEyebrow>Falls Sie suchten · Beste Treffer</PageEyebrow>
            <h2 style={{ margin: '8px 0 14px', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>
              Meinten Sie das?
            </h2>
            <div style={{ fontSize: 14, color: PC.muted, lineHeight: 1.55, maxWidth: 320 }}>
              Auf Basis von Wirkstoff-Aliassen und ATC-Nähe. Klicken führt direkt
              auf die Detailseite — keine weitere Suche nötig.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 180px 140px 24px',
                gap: 20, padding: '18px 0',
                borderTop: i === 0 ? `1px solid ${PC.border}` : 'none',
                borderBottom: `1px solid ${PC.border}`,
                alignItems: 'center',
              }}>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{s.name}</div>
                <div style={{
                  fontFamily: PF.mono, fontSize: 11, color: PC.muted,
                  letterSpacing: '0.04em',
                }}>{s.match}</div>
                <div>
                  {s.status != null
                    ? <StatusPill code={s.status} />
                    : <span style={{
                        fontFamily: PF.mono, fontSize: 11.5, color: PC.success,
                        letterSpacing: '0.04em',
                      }}>✓ VERFÜGBAR</span>}
                </div>
                <div style={{ fontFamily: PF.mono, color: PC.muted, textAlign: 'right' }}>→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search & report */}
      <section style={{ padding: '40px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{
            padding: 28, background: PC.bgInverse, color: PC.fgOnDark,
          }}>
            <PageEyebrow>
              <span style={{ color: 'oklch(0.75 0.01 240)' }}>Suchen</span>
            </PageEyebrow>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: '12px 0 18px' }}>
              Direkt im Register suchen
            </div>
            <div style={{ display: 'flex', border: `1px solid oklch(1 0 0 / 0.2)` }}>
              <input placeholder="Wirkstoff, Marke oder GTIN" style={{
                border: 'none', outline: 'none', padding: '14px 18px',
                background: 'transparent', color: PC.fgOnDark,
                fontSize: 15, fontFamily: PF.sans, flex: 1,
              }} />
              <button style={{
                border: 'none', padding: '14px 22px', cursor: 'pointer',
                background: PC.primary, color: PC.fgOnDark,
                fontSize: 14, fontWeight: 500, fontFamily: PF.sans,
              }}>Suchen →</button>
            </div>
            <div style={{ fontSize: 13, color: 'oklch(0.65 0.01 240)', marginTop: 14, lineHeight: 1.5 }}>
              728 aktive Engpässe · 12'400 historische · 128k Stammdaten-Produkte
            </div>
          </div>

          <div style={{ padding: 28, border: `1px solid ${PC.border}` }}>
            <PageEyebrow>Etwas gemeldet, das fehlt?</PageEyebrow>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: '12px 0 12px' }}>
              Datenlücke melden
            </div>
            <div style={{ fontSize: 14, color: PC.muted, lineHeight: 1.55, marginBottom: 18 }}>
              Sie wissen von einem Engpass, der hier fehlt? Eine Mail genügt —
              wir prüfen es manuell und ergänzen die Quelle.
            </div>
            <div style={{
              fontFamily: PF.mono, fontSize: 14, color: PC.primary,
              padding: '12px 16px', border: `1px solid ${PC.border}`,
              background: PC.bgAlt,
            }}>
              luecke@engpassradar.ch
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

window.PageNotFound = PageNotFound;

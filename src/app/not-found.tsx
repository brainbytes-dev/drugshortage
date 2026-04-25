import Link from 'next/link'
import { ErEyebrow } from '@/components/er-primitives'

const MONO = 'var(--font-mono, "JetBrains Mono", ui-monospace, monospace)'
const BORDER = 'oklch(0.91 0.005 240)'
const MUTED = 'oklch(0.45 0.01 240)'
const FG = 'oklch(0.18 0.01 240)'
const BG_ALT = 'oklch(0.985 0.002 240)'
const BG_INVERSE = 'oklch(0.18 0.01 240)'
const FG_ON_DARK = 'oklch(0.97 0.005 240)'
const PRIMARY = 'oklch(0.52 0.09 200)'

const REASONS = [
  {
    n: '01',
    t: 'Tippfehler in der URL',
    d: 'Wir korrigieren keine Slugs automatisch. Kleiner Unterschied — andere Seite.',
    a: 'Suche nutzen',
  },
  {
    n: '02',
    t: 'Engpass wurde aufgelöst',
    d: 'Sobald drugshortage.ch ein Produkt entfernt, verschwindet auch unsere Seite — damit nichts Veraltetes herumsteht.',
    a: 'Übersicht ansehen',
  },
  {
    n: '03',
    t: 'Produkt war nie im Engpass',
    d: 'Wir tracken nur Schweizer Lieferengpässe. Stammdaten zu allen Produkten finden Sie bei Swissmedic / ODDB.',
    a: 'Zu swissmedicinfo.ch',
  },
]

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background">
      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 0 48px', borderBottom: `1px solid ${BORDER}`, position: 'relative', overflow: 'hidden' }}>
        {/* Background 404 */}
        <div aria-hidden style={{
          position: 'absolute', right: 48, top: 24,
          fontFamily: MONO, fontSize: 280, fontWeight: 600,
          color: BG_ALT, letterSpacing: '-0.06em', lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          userSelect: 'none', pointerEvents: 'none',
        }}>404</div>

        <div className="max-w-7xl mx-auto" style={{ paddingLeft: 48, paddingRight: 48, position: 'relative' }}>
          <ErEyebrow>Eintrag nicht gefunden</ErEyebrow>
          <h1 style={{ margin: '20px 0 16px', fontSize: 72, lineHeight: 0.98, fontWeight: 500, letterSpacing: '-0.04em', maxWidth: 720 }}>
            Diesen Engpass<br />
            <span style={{ color: MUTED }}>kennen wir nicht.</span>
          </h1>
          <div style={{ fontSize: 19, color: MUTED, lineHeight: 1.55, maxWidth: 580 }}>
            Drei mögliche Gründe — und was Sie als Nächstes tun können.
          </div>
        </div>
      </section>

      {/* ─── Three reasons ───────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto" style={{ padding: '40px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${BORDER}` }}>
            {REASONS.map((r, i) => (
              <div key={r.n} style={{
                padding: 28, borderRight: i < 2 ? `1px solid ${BORDER}` : 'none',
                display: 'flex', flexDirection: 'column', gap: 12, minHeight: 220,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 13, color: MUTED, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em' }}>
                  {r.n}
                </div>
                <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em' }}>{r.t}</div>
                <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.55, flex: 1 }}>{r.d}</div>
                <div style={{
                  fontFamily: MONO, fontSize: 12.5, color: FG,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  paddingTop: 12, borderTop: `1px solid ${BORDER}`,
                }}>
                  {r.a} →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Search + Report ─────────────────────────────────────── */}
      <section>
        <div className="max-w-7xl mx-auto" style={{ padding: '40px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Search — dark */}
            <div style={{ padding: 28, background: BG_INVERSE, color: FG_ON_DARK }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: 'oklch(0.75 0.01 240)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Suchen
              </div>
              <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: '12px 0 18px' }}>
                Direkt im Register suchen
              </div>
              <Link href="/" style={{
                display: 'inline-flex', alignItems: 'center', gap: 0,
                border: '1px solid oklch(1 0 0 / 0.2)',
                textDecoration: 'none', width: '100%',
              }}>
                <span style={{
                  flex: 1, padding: '14px 18px',
                  fontSize: 15, color: 'oklch(0.65 0.01 240)',
                  fontFamily: 'inherit',
                }}>
                  Wirkstoff, Marke oder ATC-Code
                </span>
                <span style={{
                  padding: '14px 22px', background: PRIMARY, color: FG_ON_DARK,
                  fontSize: 14, fontWeight: 500,
                }}>Suchen →</span>
              </Link>
              <div style={{ fontSize: 13, color: 'oklch(0.65 0.01 240)', marginTop: 14, lineHeight: 1.5 }}>
                Täglich aktualisiertes Register aller gemeldeten Engpässe.
              </div>
            </div>

            {/* Report */}
            <div style={{ padding: 28, border: `1px solid ${BORDER}` }}>
              <ErEyebrow>Etwas gemeldet, das fehlt?</ErEyebrow>
              <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: '12px 0 12px' }}>
                Datenlücke melden
              </div>
              <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.55, marginBottom: 18 }}>
                Sie wissen von einem Engpass, der hier fehlt? Eine Mail genügt —
                wir prüfen es manuell und ergänzen die Quelle.
              </div>
              <div style={{ fontFamily: MONO, fontSize: 14, color: PRIMARY, padding: '12px 16px', border: `1px solid ${BORDER}`, background: BG_ALT }}>
                kontakt@engpassradar.ch
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

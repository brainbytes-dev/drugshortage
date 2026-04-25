import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFirmaBySlug, getFirmaActiveShortages, getFirmaHistoricalCount, getBwlGtins, getAllFirmaSlugs } from '@/lib/db'
import { toSlug } from '@/lib/slug'
import { calculateScore } from '@/lib/score'
import { StatusPill, ErEyebrow, ErCrumbs, erScoreColor } from '@/components/er-primitives'

export const revalidate = 3600

const MONO = 'var(--font-mono, "JetBrains Mono", ui-monospace, monospace)'
const BORDER = 'oklch(0.91 0.005 240)'
const MUTED = 'oklch(0.45 0.01 240)'
const FG = 'oklch(0.18 0.01 240)'
const BG_ALT = 'oklch(0.985 0.002 240)'

export async function generateStaticParams() {
  const firms = await getAllFirmaSlugs()
  return firms.map(f => ({ slug: f.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const firma = await getFirmaBySlug(slug)
  if (!firma) return { title: 'Firma nicht gefunden | engpass.radar' }
  return {
    title: `${firma} | engpass.radar`,
    description: `Lieferengpass-Profil von ${firma}: aktuelle Engpässe, Meldeverhalten und Severity Score.`,
  }
}

const STATUS_LABELS: Record<number, string> = { 1: 'Direkt gemeldet', 2: 'Gemeldet', 3: 'Sporadisch', 4: 'Keine Information', 5: 'Verhandlung' }
const STATUS_COLORS: Record<number, string> = {
  1: 'oklch(0.58 0.13 150)',
  2: 'oklch(0.65 0.14 130)',
  3: 'oklch(0.72 0.15 75)',
  4: 'oklch(0.58 0.21 27)',
  5: 'oklch(0.65 0.16 60)',
}

export default async function FirmaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [firma, bwlGtins] = await Promise.all([getFirmaBySlug(slug), getBwlGtins()])
  if (!firma) notFound()

  const [shortages, historicalCount] = await Promise.all([
    getFirmaActiveShortages(firma),
    getFirmaHistoricalCount(firma),
  ])

  const bwlSet = new Set(bwlGtins)
  const statusBreakdown = shortages.reduce<Record<number, number>>((acc, s) => {
    acc[s.statusCode] = (acc[s.statusCode] ?? 0) + 1
    return acc
  }, {})

  const scores = shortages.map(s => calculateScore(s, bwlSet.has(s.gtin)).total)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const noInfoCount = statusBreakdown[4] ?? 0
  const noInfoPct = shortages.length > 0 ? Math.round((noInfoCount / shortages.length) * 100) : 0

  const trackRecord = avgScore >= 70 ? 'Hoch-Risiko-Profil' : avgScore >= 50 ? 'Erhöhtes Risiko' : avgScore >= 30 ? 'Mittleres Profil' : 'Niedriges Risiko'
  const trackColor = avgScore >= 70 ? 'oklch(0.58 0.21 27)' : avgScore >= 50 ? 'oklch(0.72 0.15 75)' : avgScore >= 30 ? 'oklch(0.65 0.14 130)' : 'oklch(0.58 0.13 150)'

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'WebPage', '@id': `https://www.engpassradar.ch/firma/${slug}`, url: `https://www.engpassradar.ch/firma/${slug}`, name: `${firma} | engpass.radar`, isPartOf: { '@id': 'https://www.engpassradar.ch' } },
            { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.engpassradar.ch' }, { '@type': 'ListItem', position: 2, name: firma, item: `https://www.engpassradar.ch/firma/${slug}` }] },
          ],
        }).replace(/</g, '<'),
      }} />

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto" style={{ padding: '36px 48px 32px' }}>
          <ErCrumbs items={['DASHBOARD', 'FIRMEN', firma.toUpperCase()]} />

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 56, alignItems: 'flex-end' }}>
            <div>
              <ErEyebrow>Hersteller-Profil</ErEyebrow>
              <h1 style={{ margin: '14px 0 10px', fontSize: 56, lineHeight: 1.02, fontWeight: 500, letterSpacing: '-0.03em' }}>
                {firma}
              </h1>
              <div style={{ fontSize: 16, color: MUTED, lineHeight: 1.5 }}>
                <span style={{ fontFamily: MONO, color: FG }}>{shortages.length}</span> aktive Engpässe ·{' '}
                <span style={{ fontFamily: MONO, color: FG }}>{historicalCount}</span> historische
              </div>
            </div>

            {/* Track record panel */}
            <div style={{
              padding: '20px 24px', border: `1px solid ${trackColor}`,
              background: `color-mix(in oklch, ${trackColor} 6%, transparent)`,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <ErEyebrow>Track-Record-Einstufung</ErEyebrow>
              <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', color: trackColor }}>
                {trackRecord}
              </div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                Ø Score {avgScore} · {noInfoPct}% ohne Update. Algorithmische Einstufung — keine Bewertung.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── KPIs ────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { l: 'Aktive Engpässe',   v: String(shortages.length), s: 'aktuell gemeldet',   red: true },
          { l: 'Historisch',         v: String(historicalCount),  s: 'seit 2021' },
          { l: 'Ø Severity Score',   v: String(avgScore),         s: 'von 100', red: avgScore >= 60 },
          { l: 'Keine-Info-Anteil',  v: `${noInfoPct}%`,          s: 'Status 4', red: noInfoPct >= 40 },
        ].map((k, i) => (
          <div key={i} style={{
            padding: '28px 32px',
            borderRight: i < 3 ? `1px solid ${BORDER}` : 'none',
          }}>
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k.l}</div>
            <div style={{ fontFamily: MONO, fontSize: 48, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 8, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: k.red ? 'oklch(0.58 0.21 27)' : FG }}>{k.v}</div>
            <div style={{ fontSize: 12.5, color: MUTED, marginTop: 8 }}>{k.s}</div>
          </div>
        ))}
      </section>

      {/* ─── Meldeverhalten ──────────────────────────────────────── */}
      {shortages.length > 0 && (
        <section style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="max-w-7xl mx-auto" style={{ padding: '40px 48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 56 }}>
              <div>
                <ErEyebrow>Meldeverhalten · {shortages.length} aktive Engpässe</ErEyebrow>
                <h2 style={{ margin: '8px 0 18px', fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>
                  {noInfoPct >= 40 ? 'Fast die Hälfte ohne Update.' : noInfoPct >= 20 ? 'Mässige Transparenz.' : 'Gute Kommunikation.'}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {([1, 2, 3, 4, 5] as const).map(code => {
                    const n = statusBreakdown[code] ?? 0
                    if (n === 0) return null
                    const pct = Math.round((n / shortages.length) * 100)
                    return (
                      <div key={code}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13.5, marginBottom: 6 }}>
                          <span>
                            <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginRight: 8, letterSpacing: '0.04em' }}>STATUS {code}</span>
                            {STATUS_LABELS[code]}
                          </span>
                          <span style={{ fontFamily: MONO, color: MUTED }}>
                            {n} · <span style={{ color: FG }}>{pct}%</span>
                          </span>
                        </div>
                        <div style={{ height: 6, background: BORDER }}>
                          <div style={{ width: pct + '%', height: '100%', background: STATUS_COLORS[code] ?? FG }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Rechts: Kurz-Info */}
              <div>
                <ErEyebrow>Profil</ErEyebrow>
                <h2 style={{ margin: '8px 0 18px', fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>
                  Kurzprofil
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    ['Aktive Engpässe', String(shortages.length)],
                    ['Historische Fälle', String(historicalCount)],
                    ['Ø Score aktiv', String(avgScore) + ' / 100'],
                    ['Status-4-Anteil', noInfoPct + '%'],
                  ].map(([l, v], i) => (
                    <div key={l} style={{
                      display: 'grid', gridTemplateColumns: '200px 1fr', padding: '12px 0',
                      borderBottom: `1px solid ${BORDER}`,
                      borderTop: i === 0 ? `1px solid ${BORDER}` : 'none',
                    }}>
                      <dt style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</dt>
                      <dd style={{ margin: 0, fontFamily: MONO, fontSize: 14, color: FG, fontVariantNumeric: 'tabular-nums' }}>{v}</dd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Active shortages table ──────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto" style={{ padding: '40px 48px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <div>
              <ErEyebrow>Top-{Math.min(shortages.length, 20)} nach Score · von {shortages.length} aktiven</ErEyebrow>
              <h2 style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>Aktive Engpässe</h2>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {[['Bezeichnung', 'left'], ['ATC', 'left'], ['Status', 'left'], ['Tage', 'right'], ['Score', 'right']].map(([l, a]) => (
                  <th key={l} style={{
                    padding: '12px 12px', textAlign: a as 'left' | 'right',
                    borderBottom: `1px solid ${FG}`,
                    fontFamily: MONO, fontSize: 10.5, color: MUTED,
                    letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                  }}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shortages.slice(0, 20).map((s, i) => {
                const sc = calculateScore(s, bwlSet.has(s.gtin))
                const col = erScoreColor(sc.total)
                return (
                  <tr key={s.gtin} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '14px 12px', fontWeight: 500 }}>
                      <Link href={`/medikament/${s.slug ?? toSlug(s.bezeichnung)}`} style={{ color: FG, textDecoration: 'none' }} className="hover:underline">
                        {s.bezeichnung}
                      </Link>
                      {bwlSet.has(s.gtin) && (
                        <span style={{ marginLeft: 8, fontFamily: MONO, fontSize: 9.5, padding: '2px 5px', background: 'oklch(0.72 0.15 75 / 0.12)', color: 'oklch(0.45 0.12 75)', letterSpacing: '0.06em' }}>BWL</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 12px', fontFamily: MONO, fontSize: 13, color: FG }}>
                      {s.atcCode ? (
                        <Link href={`/wirkstoff/${s.atcCode}`} style={{ color: FG, textDecoration: 'none' }} className="hover:underline">
                          {s.atcCode}
                        </Link>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '14px 12px' }}><StatusPill code={s.statusCode} /></td>
                    <td style={{ padding: '14px 12px', textAlign: 'right', fontFamily: MONO, fontVariantNumeric: 'tabular-nums', color: FG }}>{s.tageSeitMeldung}</td>
                    <td style={{ padding: '14px 12px', textAlign: 'right', fontFamily: MONO, fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: col }}>{sc.total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto" style={{ padding: '24px 48px' }}>
        <p style={{ fontSize: 12, color: MUTED, fontFamily: MONO }}>
          Daten aus <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: FG }}>drugshortage.ch</a>
          {' · '}
          <Link href="/methodik" style={{ textDecoration: 'underline', color: FG }}>Score-Methodik</Link>
        </p>
      </div>
    </main>
  )
}

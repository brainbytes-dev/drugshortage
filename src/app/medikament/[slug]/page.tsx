import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getShortageBySlug, getOddbByGtin, getHistoricalByGengrp, getBwlGtins } from '@/lib/db'
import { calculateScore } from '@/lib/score'
import { StatusPill, ErEyebrow, ErCrumbs, erScoreColor } from '@/components/er-primitives'

interface PageProps { params: Promise<{ slug: string }> }

export const revalidate = 3600

const MONO = 'var(--font-mono, "JetBrains Mono", ui-monospace, monospace)'
const BORDER = 'oklch(0.91 0.005 240)'
const MUTED = 'oklch(0.45 0.01 240)'
const FG = 'oklch(0.18 0.01 240)'
const BG_ALT = 'oklch(0.985 0.002 240)'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const shortage = await getShortageBySlug(slug)
  if (!shortage) return { title: 'Kein Lieferengpass gefunden | engpass.radar' }
  const oddb = await getOddbByGtin(shortage.gtin).catch(() => null)
  const substanz = oddb?.substanz ? ` — ${oddb.substanz}` : ''
  return {
    title: `${shortage.bezeichnung} Lieferengpass Schweiz${substanz} | engpass.radar`,
    description: `${shortage.bezeichnung} Lieferengpass Schweiz${oddb?.substanz ? ` (${oddb.substanz})` : ''} von ${shortage.firma}. Aktueller Status, Alternativen und Verlauf auf engpassradar.ch.`,
  }
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: MUTED, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontFamily: MONO, color: FG }}>{value} / {max}</span>
      </div>
      <div style={{ height: 6, background: BORDER, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${(value / max) * 100}%`, background: FG }} />
      </div>
    </div>
  )
}

function DlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', padding: '14px 0', borderBottom: `1px solid ${BORDER}`, alignItems: 'baseline' }}>
      <dt style={{ fontFamily: MONO, fontSize: 11.5, color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: 14.5, color: FG }}>{children}</dd>
    </div>
  )
}

export default async function MedikamentPage({ params }: PageProps) {
  const { slug } = await params
  const shortage = await getShortageBySlug(slug)
  if (!shortage) notFound()

  const [oddb, historical, bwlGtins] = await Promise.all([
    getOddbByGtin(shortage.gtin).catch(() => null),
    getHistoricalByGengrp(shortage.gengrp, shortage.gtin).catch(() => []),
    getBwlGtins().catch(() => [] as string[]),
  ])
  const isBwl = bwlGtins.includes(shortage.gtin)
  const score = calculateScore(shortage, isBwl)
  const scoreCol = erScoreColor(score.total)

  const crumbs = [
    'DASHBOARD',
    ...(shortage.atcCode ? [`ATC · ${shortage.atcCode}`] : []),
    shortage.bezeichnung.toUpperCase(),
  ]

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'MedicalWebPage',
              '@id': `https://www.engpassradar.ch/medikament/${slug}`,
              url: `https://www.engpassradar.ch/medikament/${slug}`,
              name: `${shortage.bezeichnung} — Lieferengpass Schweiz`,
              about: {
                '@type': 'MedicalEntity',
                name: shortage.bezeichnung,
                manufacturer: { '@type': 'Organization', name: shortage.firma },
                ...(shortage.atcCode ? { code: { '@type': 'MedicalCode', code: shortage.atcCode, codingSystem: 'ATC' } } : {}),
              },
              isPartOf: { '@id': 'https://www.engpassradar.ch' },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.engpassradar.ch' },
                { '@type': 'ListItem', position: 2, name: shortage.bezeichnung, item: `https://www.engpassradar.ch/medikament/${slug}` },
              ],
            },
          ],
        }).replace(/</g, '<'),
      }} />

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto" style={{ padding: '36px 48px 40px' }}>
          <ErCrumbs items={crumbs} />

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 56 }}>
            {/* Left */}
            <div>
              <ErEyebrow>
                Lieferengpass · {shortage.isActive ? `aktiv seit ${shortage.tageSeitMeldung} Tagen` : 'aufgelöst — historischer Eintrag'}
              </ErEyebrow>
              <h1 style={{ margin: '14px 0 8px', fontSize: 52, lineHeight: 1.06, fontWeight: 500, letterSpacing: '-0.03em' }}>
                {shortage.bezeichnung}
              </h1>
              <div style={{ fontSize: 18, letterSpacing: '-0.005em' }}>
                <span style={{ color: MUTED }}>{shortage.firma}</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
                <StatusPill code={shortage.statusCode} big />
                {isBwl && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 14,
                    border: '1px solid oklch(0.72 0.15 75)',
                    background: 'oklch(0.72 0.15 75 / 0.08)', color: 'oklch(0.45 0.12 75)',
                  }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.8 }}>BWL</span>
                    <span>·</span>
                    <span>Pflichtlager freigegeben</span>
                  </span>
                )}
                {oddb?.authStatus && oddb.authStatus !== 'A' && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 14,
                    border: '1px solid oklch(0.58 0.21 27)',
                    background: 'oklch(0.58 0.21 27 / 0.08)', color: 'oklch(0.58 0.21 27)',
                  }}>
                    Zulassung erloschen ({oddb.authStatus})
                  </span>
                )}
              </div>

              {/* Watchlist CTA */}
              <div style={{
                marginTop: 32, padding: 20,
                border: `1px solid ${BORDER}`, background: BG_ALT,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
              }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em' }}>
                    Benachrichtigt werden, wenn sich der Status ändert
                  </div>
                  <div style={{ fontSize: 13.5, color: MUTED, marginTop: 4 }}>
                    Eine Mail. Pro Statuswechsel. Keine Werbung.
                  </div>
                </div>
                {shortage.atcCode && (
                  <Link
                    href={`/wirkstoff/${shortage.atcCode}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '11px 18px', fontFamily: MONO, fontSize: 12,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      background: FG, color: 'oklch(0.97 0.005 240)',
                      textDecoration: 'none', whiteSpace: 'nowrap',
                    }}
                  >
                    Watchlist →
                  </Link>
                )}
              </div>
            </div>

            {/* Right — Score panel */}
            <aside style={{ padding: 28, border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <ErEyebrow>engpass.radar Score</ErEyebrow>
                  <div style={{ fontSize: 13, color: MUTED, marginTop: 6, lineHeight: 1.5 }}>
                    Höher = schwerwiegender. Kombiniert vier Faktoren.
                  </div>
                </div>
                <div style={{
                  fontFamily: MONO, fontVariantNumeric: 'tabular-nums',
                  fontSize: 64, fontWeight: 600, color: scoreCol,
                  letterSpacing: '-0.03em', lineHeight: 1,
                }}>
                  {score.total}
                  <span style={{ fontSize: 18, color: MUTED, fontWeight: 400, marginLeft: 4 }}>/100</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ScoreBar label="Transparenz" value={score.transparency} max={35} />
                <ScoreBar label="Dauer" value={score.duration} max={30} />
                <ScoreBar label="Keine Alternativen" value={score.noAlternatives} max={20} />
                <ScoreBar label="Pflichtlager / BWL" value={score.critical} max={15} />
              </div>

              <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
                Score-Methodik · proprietärer Index ·{' '}
                <Link href="/methodik" style={{ textDecoration: 'underline', color: FG }}>methodik →</Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── Stammdaten ──────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto" style={{ padding: '40px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 56 }}>
            <div>
              <ErEyebrow>Stammdaten</ErEyebrow>
              <h2 style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>
                Was Sie wissen müssen
              </h2>
            </div>
            <dl style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
              {[
                shortage.atcCode && [
                  'ATC-Code',
                  <span key="atc">
                    <Link href={`/wirkstoff/${shortage.atcCode}`} style={{ fontFamily: MONO, color: FG, textDecoration: 'underline' }}>{shortage.atcCode}</Link>
                    {oddb?.substanz && <span style={{ color: MUTED }}> · {oddb.substanz}</span>}
                  </span>,
                ],
                oddb?.substanz && ['Wirkstoff', <Link key="ws" href={`/wirkstoff/${shortage.atcCode}`} style={{ color: FG, textDecoration: 'underline' }}>{oddb.substanz}</Link>],
                ['Status', <span key="st">{shortage.statusText}</span>],
                ['Seit', <span key="tage" style={{ fontFamily: MONO }}>{shortage.tageSeitMeldung} Tage</span>],
                shortage.datumLieferfahigkeit && ['Voraussichtl. verfügbar', <span key="vl" style={{ color: shortage.datumLieferfahigkeit === 'unbekannt' || shortage.datumLieferfahigkeit === 'offen' ? 'oklch(0.58 0.21 27)' : FG }}>{shortage.datumLieferfahigkeit}</span>],
                shortage.ersteMeldung && ['Erste Meldung', <span key="em">{shortage.ersteMeldung}{shortage.ersteMeldungDurch ? ` · von ${shortage.ersteMeldungDurch}` : ''}</span>],
                oddb?.prodno && ['Swissmedic-Nr', <span key="sm" style={{ fontFamily: MONO, fontSize: 14 }}>{oddb.prodno}</span>],
                shortage.gtin && ['GTIN', <span key="gtin" style={{ fontFamily: MONO, fontSize: 14 }}>{shortage.gtin}</span>],
                oddb?.ppub != null && ['Publikumspreis', <span key="pp"><span style={{ fontFamily: MONO }}>CHF {oddb.ppub.toFixed(2)}</span><span style={{ color: MUTED }}> · PPUB</span></span>],
                oddb?.pexf != null && ['Fabrikabgabepreis', <span key="pf"><span style={{ fontFamily: MONO }}>CHF {oddb.pexf.toFixed(2)}</span><span style={{ color: MUTED }}> · PEXF</span></span>],
                oddb?.zusammensetzung && ['Zusammensetzung', <span key="zs" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{oddb.zusammensetzung}</span>],
                shortage.gtin.startsWith('7680') && ['Fachinformation', <a key="fi" href={`https://swissmedicinfo-pro.ch/showText.aspx?textType=FI&lang=DE&authNr=${parseInt(shortage.gtin.substring(4, 9), 10)}&supportMultipleResults=1`} target="_blank" rel="noopener noreferrer" style={{ color: FG, textDecoration: 'underline' }}>swissmedicinfo.ch · AIPS →</a>],
              ].filter(Boolean).map((row, i) => (
                <DlRow key={i} label={String((row as [string, React.ReactNode])[0])}>
                  {(row as [string, React.ReactNode])[1]}
                </DlRow>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ─── Historischer Verlauf ─────────────────────────────────── */}
      {historical.length > 0 && (
        <section style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="max-w-7xl mx-auto" style={{ padding: '40px 48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 56 }}>
              <div>
                <ErEyebrow>Wiederholungs-Muster</ErEyebrow>
                <h2 style={{ margin: '8px 0 14px', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>
                  Schon das {historical.length + 1}. Mal
                </h2>
                <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.55, maxWidth: 320 }}>
                  Wirkstoffgleiche Produkte{shortage.atcCode ? ` (ATC ${shortage.atcCode})` : ''} waren bereits{' '}
                  <strong style={{ color: FG }}>{historical.length}×</strong> im Engpass.
                </div>
              </div>
              <div>
                {historical.slice(0, 8).map((h, i) => (
                  <div key={h.gtin} style={{
                    display: 'grid', gridTemplateColumns: '100px 1fr',
                    gap: 24, padding: '14px 0',
                    borderTop: i === 0 ? `1px solid ${BORDER}` : 'none',
                    borderBottom: `1px solid ${BORDER}`,
                    alignItems: 'baseline',
                  }}>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: MUTED, fontVariantNumeric: 'tabular-nums' }}>
                      {h.tageSeitMeldung} Tage
                    </div>
                    <div style={{ fontSize: 14.5, color: FG }}>{h.bezeichnung}</div>
                  </div>
                ))}
                {historical.length > 8 && (
                  <div style={{ padding: '10px 0', fontSize: 13, color: MUTED }}>
                    + {historical.length - 8} weitere historische Einträge
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Quellen-Footer ──────────────────────────────────────── */}
      <section style={{ background: BG_ALT }}>
        <div className="max-w-7xl mx-auto" style={{ padding: '32px 48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32 }}>
            <div>
              <ErEyebrow>Quellen für diesen Eintrag</ErEyebrow>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['drugshortage.ch', 'BAG-Meldestelle · Status-Tracking'],
                  ['oddb.org',        'Stammdaten · Preise · Zusammensetzung'],
                  ['bwl.admin.ch',    'Pflichtlager-Liste'],
                ].map(([src, what]) => (
                  <div key={src} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, fontSize: 13.5 }}>
                    <span style={{ fontFamily: MONO, color: FG }}>{src}</span>
                    <span style={{ color: MUTED }}>{what}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: MUTED, fontFamily: MONO, letterSpacing: '0.06em', textAlign: 'right', maxWidth: 280, lineHeight: 1.6 }}>
              KEINE GEWÄHR AUF VOLLSTÄNDIGKEIT.<br />
              BEI KLINISCHER ENTSCHEIDUNG<br />
              IMMER ORIGINAL-QUELLE PRÜFEN.
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

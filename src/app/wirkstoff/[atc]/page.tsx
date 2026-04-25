import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getShortagesByAtc, getSubstanzByAtc } from '@/lib/db'
import { toSlug } from '@/lib/slug'
import { WatchlistForm } from '@/components/watchlist-form'
import { StatusPill, ErEyebrow, ErCrumbs, erScoreColor } from '@/components/er-primitives'
import { calculateScore } from '@/lib/score'

interface PageProps { params: Promise<{ atc: string }> }

export const revalidate = 3600

const MONO = 'var(--font-mono, "JetBrains Mono", ui-monospace, monospace)'
const BORDER = 'oklch(0.91 0.005 240)'
const BORDER2 = 'oklch(0.84 0.005 240)'
const MUTED = 'oklch(0.45 0.01 240)'
const FG = 'oklch(0.18 0.01 240)'
const BG_ALT = 'oklch(0.985 0.002 240)'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { atc } = await params
  const [shortages, substanz] = await Promise.all([
    getShortagesByAtc(atc),
    getSubstanzByAtc(atc).catch(() => null),
  ])
  return {
    title: `${substanz ? `${substanz} (${atc})` : `ATC ${atc}`} — Lieferengpässe Schweiz | engpass.radar`,
    description: shortages.length > 0 ? `Alle Lieferengpässe für ${substanz ?? atc} in der Schweiz. ATC-Code ${atc}. Täglich aktualisiert.` : undefined,
  }
}

export default async function WirkstoffPage({ params }: PageProps) {
  const { atc } = await params
  const [shortages, substanz] = await Promise.all([
    getShortagesByAtc(atc),
    getSubstanzByAtc(atc).catch(() => null),
  ])

  if (shortages.length === 0) notFound()

  const count = shortages.length
  const avgTage = Math.round(shortages.reduce((s, x) => s + (x.tageSeitMeldung ?? 0), 0) / count)
  const firmen = [...new Set(shortages.map(s => s.firma).filter(Boolean))]

  // Firm breakdown for insight
  const firmCount = firmen.reduce<Record<string, number>>((acc, f) => {
    acc[f] = (acc[f] ?? 0) + 1
    return acc
  }, {})
  const firmRanking = shortages.reduce<Record<string, number>>((acc, s) => {
    if (s.firma) acc[s.firma] = (acc[s.firma] ?? 0) + 1
    return acc
  }, {})
  const topFirms = Object.entries(firmRanking).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        '@id': `https://www.engpassradar.ch/wirkstoff/${atc}`,
        url: `https://www.engpassradar.ch/wirkstoff/${atc}`,
        name: `${substanz ? `${substanz} (${atc})` : `ATC ${atc}`} Lieferengpass Schweiz | engpass.radar`,
        about: { '@type': 'MedicalEntity', name: substanz ?? atc, code: { '@type': 'MedicalCode', code: atc, codingSystem: 'ATC' } },
        isPartOf: { '@id': 'https://www.engpassradar.ch' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.engpassradar.ch' },
          { '@type': 'ListItem', position: 2, name: substanz ?? `ATC ${atc}`, item: `https://www.engpassradar.ch/wirkstoff/${atc}` },
        ],
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '<') }} />

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto" style={{ padding: '36px 48px 32px' }}>
          <ErCrumbs items={['DASHBOARD', 'WIRKSTOFFE', (substanz ?? `ATC ${atc}`).toUpperCase()]} />

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 56, alignItems: 'flex-end' }}>
            <div>
              <ErEyebrow>Wirkstoff-Übersicht · ATC {atc}</ErEyebrow>
              <h1 style={{ margin: '14px 0 8px', fontSize: 80, lineHeight: 0.98, fontWeight: 500, letterSpacing: '-0.04em' }}>
                {substanz ?? `ATC ${atc}`}
              </h1>
              <div style={{ fontSize: 18, color: MUTED, letterSpacing: '-0.005em' }}>
                ATC <span style={{ fontFamily: MONO, color: FG }}>{atc}</span>
              </div>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${BORDER}` }}>
              {[
                { l: 'Aktive Engpässe', v: count, s: `von ${count} Produkten`, red: true },
                { l: 'Ø Dauer', v: avgTage, s: 'Tage bis Auflösung', red: false },
                { l: 'Hersteller', v: firmen.length, s: 'betroffen', red: false },
              ].map((k, i) => (
                <div key={i} style={{ padding: 18, borderRight: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k.l}</div>
                  <div style={{ fontFamily: MONO, fontSize: 36, fontWeight: 600, marginTop: 6, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: k.red ? 'oklch(0.58 0.21 27)' : FG }}>{k.v}</div>
                  <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>{k.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Filter bar ──────────────────────────────────────────── */}
      <section style={{ padding: '14px 0', borderBottom: `1px solid ${BORDER}`, background: BG_ALT }}>
        <div className="max-w-7xl mx-auto" style={{ paddingLeft: 48, paddingRight: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {[`Alle (${count})`, `Aktive Engpässe (${count})`, `Hersteller (${firmen.length})`].map((f, i) => (
              <div key={f} style={{
                padding: '8px 16px', fontSize: 13,
                border: `1px solid ${BORDER2}`,
                borderLeft: i === 0 ? `1px solid ${BORDER2}` : 'none',
                background: i === 0 ? FG : 'transparent',
                color: i === 0 ? 'oklch(0.97 0.005 240)' : FG,
                cursor: 'default',
              }}>{f}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12.5, color: MUTED }}>
            <span>Sortierung:</span>
            <span style={{ fontFamily: MONO, color: FG }}>Score ↓</span>
          </div>
        </div>
      </section>

      {/* ─── Data table ──────────────────────────────────────────── */}
      <section style={{ padding: '0 0 0' }}>
        <div className="max-w-7xl mx-auto" style={{ paddingLeft: 48, paddingRight: 48 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {[
                  ['Produkt', 'left', '34%'],
                  ['Firma', 'left', '22%'],
                  ['Status', 'left', '20%'],
                  ['Tage', 'right', '8%'],
                  ['Score', 'right', '8%'],
                  ['', 'right', '8%'],
                ].map(([l, a, w]) => (
                  <th key={l} style={{
                    padding: '14px 12px', textAlign: a as 'left' | 'right', width: w,
                    borderBottom: `1px solid ${FG}`,
                    fontFamily: MONO, fontSize: 10.5, color: MUTED,
                    letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                  }}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shortages.map((s) => {
                const sc = calculateScore(s, false)
                const col = erScoreColor(sc.total)
                return (
                  <tr key={s.gtin} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <Link
                          href={`/medikament/${s.slug ?? toSlug(s.bezeichnung)}`}
                          style={{ fontWeight: 500, letterSpacing: '-0.005em', color: FG, textDecoration: 'none' }}
                          className="hover:underline"
                        >
                          {s.bezeichnung}
                        </Link>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', color: MUTED }}>{s.firma}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <StatusPill code={s.statusCode} />
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right', fontFamily: MONO, fontVariantNumeric: 'tabular-nums', color: FG }}>
                      {s.tageSeitMeldung ?? '—'}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right', fontFamily: MONO, fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: col }}>
                      {sc.total}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right', color: MUTED, fontFamily: MONO }}>→</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Insight strip ───────────────────────────────────────── */}
      {topFirms.length > 0 && (
        <section style={{ padding: '40px 0', borderTop: `1px solid ${FG}` }}>
          <div className="max-w-7xl mx-auto" style={{ paddingLeft: 48, paddingRight: 48 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56 }}>
              <div>
                <ErEyebrow>Muster im Wirkstoff</ErEyebrow>
                <h2 style={{ margin: '8px 0 16px', fontSize: 28, fontWeight: 500, letterSpacing: '-0.025em' }}>
                  Ausfälle nach Hersteller
                </h2>
                <div style={{ fontSize: 15, color: MUTED, lineHeight: 1.55 }}>
                  {count} Präparate mit ATC-Code {atc} sind aktuell nicht lieferbar.
                  Ø {avgTage} Tage Engpassdauer.
                </div>
              </div>
              <div style={{ padding: 24, border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <ErEyebrow>Ausfälle nach Hersteller</ErEyebrow>
                {topFirms.map(([f, n]) => {
                  const pct = Math.round((n / count) * 100)
                  return (
                    <div key={f}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 6 }}>
                        <span style={{ color: FG }}>{f}</span>
                        <span style={{ fontFamily: MONO, color: MUTED }}>
                          {n} · <span style={{ color: FG }}>{pct}%</span>
                        </span>
                      </div>
                      <div style={{ height: 6, background: BORDER }}>
                        <div style={{ width: pct + '%', height: '100%', background: FG }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Watchlist ───────────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${BORDER}`, background: BG_ALT }}>
        <div className="max-w-7xl mx-auto" style={{ padding: '40px 48px' }}>
          <WatchlistForm atcCode={atc} atcName={substanz ?? atc} />
        </div>
      </section>

      <div className="max-w-7xl mx-auto" style={{ padding: '20px 48px', borderTop: `1px solid ${BORDER}` }}>
        <p style={{ fontSize: 12, color: MUTED, fontFamily: MONO }}>
          Daten von drugshortage.ch · keine Gewähr auf Vollständigkeit
        </p>
      </div>
    </main>
  )
}

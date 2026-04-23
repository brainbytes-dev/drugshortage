import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'engpass.radar — Schweizer Medikamenten-Lieferengpässe'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const GREEN = '#34a853'
const BG = '#0d1117'
const TEXT = '#e6edf3'
const MUTED = '#8b949e'
const DIM = '#30363d'
const BORDER = '#21262d'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: BG,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top: pulse dot + eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: GREEN }} />
          <span style={{ color: GREEN, fontSize: 14, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Schweizer Medikamenten-Lieferengpässe
          </span>
        </div>

        {/* Center: brand + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: TEXT, fontSize: 84, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              engpass
            </span>
            <span style={{ color: GREEN, fontSize: 84, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              .radar
            </span>
          </div>
          <p style={{ color: MUTED, fontSize: 26, fontWeight: 400, margin: 0, lineHeight: 1.4, maxWidth: 680 }}>
            Tagesaktuelle Engpässe, Severity Scores und Alternativen — aus drugshortage.ch, BWL und ODDB.
          </p>
        </div>

        {/* Bottom: stats + domain */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 48 }}>
            {([
              ['700+', 'aktive Engpässe'],
              ['148+', 'ATC-Gruppen'],
              ['täglich', 'aktualisiert'],
              ['kostenlos', 'ohne Login'],
            ] as [string, string][]).map(([num, label]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ color: TEXT, fontSize: 22, fontWeight: 700 }}>{num}</span>
                <span style={{ color: MUTED, fontSize: 13 }}>{label}</span>
              </div>
            ))}
          </div>
          <span style={{ color: DIM, fontSize: 15, paddingBottom: 2 }}>engpassradar.ch</span>
        </div>
      </div>
    ),
    { ...size }
  )
}

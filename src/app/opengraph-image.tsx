import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'engpass.radar — Schweizer Medikamenten-Lieferengpässe'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PRIMARY   = '#2e7d9a'   // oklch(0.52 0.09 200) — medical teal
const BG        = '#ffffff'
const TEXT      = '#0f172a'   // near-black
const MUTED     = '#64748b'
const SUBTLE    = '#f1f5f9'   // light slate for stat boxes
const BORDER    = '#e2e8f0'

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
          padding: '68px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top: pulse dot + eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: PRIMARY }} />
          <span style={{
            color: PRIMARY, fontSize: 13, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            Schweizer Medikamenten-Lieferengpässe
          </span>
        </div>

        {/* Center: brand + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: TEXT, fontSize: 88, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              engpass
            </span>
            <span style={{ color: PRIMARY, fontSize: 88, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              .radar
            </span>
          </div>
          <p style={{ color: MUTED, fontSize: 26, fontWeight: 400, margin: 0, lineHeight: 1.4, maxWidth: 700 }}>
            Tagesaktuelle Engpässe, Severity Scores und Alternativen — aus drugshortage.ch, BWL und ODDB.
          </p>
        </div>

        {/* Bottom: stat boxes + domain */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {([
              ['148+', 'ATC-Gruppen'],
              ['täglich', 'aktualisiert'],
              ['kostenlos', 'ohne Login'],
            ] as [string, string][]).map(([num, label]) => (
              <div key={label} style={{
                display: 'flex', flexDirection: 'column', gap: 3,
                background: SUBTLE, borderRadius: 8,
                padding: '10px 16px',
                border: `1px solid ${BORDER}`,
              }}>
                <span style={{ color: TEXT, fontSize: 18, fontWeight: 700 }}>{num}</span>
                <span style={{ color: MUTED, fontSize: 12 }}>{label}</span>
              </div>
            ))}
          </div>
          <span style={{ color: BORDER, fontSize: 14, paddingBottom: 4 }}>engpassradar.ch</span>
        </div>
      </div>
    ),
    { ...size }
  )
}

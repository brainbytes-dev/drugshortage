import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'engpass.radar — Schweizer Medikamenten-Lieferengpässe'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0d1117',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top: eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'oklch(0.58 0.13 150)',
          }} />
          <span style={{ color: 'oklch(0.58 0.13 150)', fontSize: 14, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Schweizer Medikamenten-Lieferengpässe
          </span>
        </div>

        {/* Center: headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
            <span style={{ color: '#e6edf3', fontSize: 80, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              engpass
            </span>
            <span style={{ color: 'oklch(0.58 0.13 150)', fontSize: 80, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              .radar
            </span>
          </div>
          <p style={{ color: '#8b949e', fontSize: 26, fontWeight: 400, margin: 0, lineHeight: 1.4, maxWidth: 680 }}>
            Tagesaktuelle Engpässe, Severity Scores und Alternativen — aus drugshortage.ch, BWL und ODDB.
          </p>
        </div>

        {/* Bottom: fact strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          {[
            ['700+', 'aktive Engpässe'],
            ['148+', 'ATC-Gruppen'],
            ['täglich', 'aktualisiert'],
            ['kostenlos', 'ohne Login'],
          ].map(([num, label]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: '#e6edf3', fontSize: 22, fontWeight: 700 }}>{num}</span>
              <span style={{ color: '#8b949e', fontSize: 14 }}>{label}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ color: '#30363d', fontSize: 16 }}>engpassradar.ch</span>
        </div>
      </div>
    ),
    { ...size }
  )
}

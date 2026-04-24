import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const PRIMARY = '#2e7d9a'
const BG      = '#ffffff'
const TEXT    = '#0f172a'
const MUTED   = '#64748b'
const SUBTLE  = '#f1f5f9'
const BORDER  = '#e2e8f0'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: BG,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 64px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          borderBottom: `3px solid ${PRIMARY}`,
        }}
      >
        {/* Left: brand */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: TEXT, fontSize: 52, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              engpass
            </span>
            <span style={{ color: PRIMARY, fontSize: 52, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              .radar
            </span>
          </div>
          <span style={{ color: MUTED, fontSize: 16, fontWeight: 400 }}>
            Schweizer Medikamenten-Lieferengpässe — täglich aktualisiert
          </span>
        </div>

        {/* Right: stat pills */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {([
            ['aktive', 'Engpässe'],
            ['täglich', 'aktualisiert'],
            ['kostenlos', 'ohne Login'],
          ] as [string, string][]).map(([num, label]) => (
            <div key={label} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              background: SUBTLE,
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              padding: '10px 20px',
              minWidth: 110,
            }}>
              <span style={{ color: TEXT, fontSize: 20, fontWeight: 700 }}>{num}</span>
              <span style={{ color: MUTED, fontSize: 11 }}>{label}</span>
            </div>
          ))}

          {/* Pulse dot + URL */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginLeft: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: 4, background: PRIMARY }} />
              <span style={{ color: PRIMARY, fontSize: 13, fontWeight: 600 }}>live</span>
            </div>
            <span style={{ color: MUTED, fontSize: 13 }}>engpassradar.ch</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1128,
      height: 191,
    }
  )
}

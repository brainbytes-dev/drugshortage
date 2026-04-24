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
          padding: '0 128px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          borderBottom: `6px solid ${PRIMARY}`,
        }}
      >
        {/* Left: brand */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: TEXT, fontSize: 104, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              engpass
            </span>
            <span style={{ color: PRIMARY, fontSize: 104, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              .radar
            </span>
          </div>
          <span style={{ color: MUTED, fontSize: 32, fontWeight: 400 }}>
            Schweizer Medikamenten-Lieferengpässe — täglich aktualisiert
          </span>
        </div>

        {/* Center: 2x2 badge grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          {([
            [['aktive', 'Engpässe'], ['ATC-Gruppen', 'filterbar']],
            [['täglich', 'aktualisiert'], ['kostenlos', 'ohne Login']],
          ] as [string, string][][]).map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 16 }}>
              {row.map(([top, bottom]) => (
                <div key={top} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  background: SUBTLE, border: `2px solid ${BORDER}`, borderRadius: 16,
                  padding: '14px 0', width: 224,
                }}>
                  <span style={{ color: TEXT, fontSize: 30, fontWeight: 700 }}>{top}</span>
                  <span style={{ color: MUTED, fontSize: 20 }}>{bottom}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right: domain vertically centered */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: PRIMARY }} />
          <span style={{ color: MUTED, fontSize: 26 }}>engpassradar.ch</span>
        </div>
      </div>
    ),
    {
      width: 2256,
      height: 382,
    }
  )
}

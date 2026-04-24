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

        {/* Right: 2x2 stat grid + domain */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {([
              ['aktive', 'Engpässe'],
              ['ATC-Gruppen', 'filterbar'],
            ] as [string, string][]).map(([num, label]) => (
              <div key={label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                background: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 8,
                padding: '7px 16px', minWidth: 100,
              }}>
                <span style={{ color: TEXT, fontSize: 16, fontWeight: 700 }}>{num}</span>
                <span style={{ color: MUTED, fontSize: 10 }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([
              ['täglich', 'aktualisiert'],
              ['kostenlos', 'ohne Login'],
            ] as [string, string][]).map(([num, label]) => (
              <div key={label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                background: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 8,
                padding: '7px 16px', minWidth: 100,
              }}>
                <span style={{ color: TEXT, fontSize: 16, fontWeight: 700 }}>{num}</span>
                <span style={{ color: MUTED, fontSize: 10 }}>{label}</span>
              </div>
            ))}
          </div>
          {/* Domain */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: PRIMARY }} />
            <span style={{ color: MUTED, fontSize: 12 }}>engpassradar.ch</span>
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

import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#fbfaf6',
          borderRadius: '7px',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '19px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          lineHeight: 1,
          gap: 0,
        }}
      >
        <span style={{ color: '#252420' }}>e</span>
        <span style={{ color: '#3a4dab' }}>.r</span>
      </div>
    ),
    size,
  )
}

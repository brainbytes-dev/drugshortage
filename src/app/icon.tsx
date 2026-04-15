import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#2d8f8f',
          borderRadius: '7px',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '-0.5px',
        }}
      >
        e·r
      </div>
    ),
    size,
  )
}

'use client'

import { useEffect, useRef } from 'react'

interface AdSlotProps {
  slot: string        // AdSense ad unit ID
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  className?: string
}

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID ?? ''

/**
 * Google AdSense ad unit.
 * Only renders when NEXT_PUBLIC_ADSENSE_ID is set.
 * Usage: <AdSlot slot="1234567890" format="horizontal" />
 */
export function AdSlot({ slot, format = 'auto', className }: AdSlotProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (!ADSENSE_ID || initialized.current) return
    initialized.current = true
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).adsbygoogle.push({})
    } catch {
      // AdSense not loaded yet
    }
  }, [])

  if (!ADSENSE_ID) return null

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}

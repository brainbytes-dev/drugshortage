'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'er_visited'

/**
 * On first visit: marks the user as visited.
 * On return visits: skips the hero and jumps straight to the dashboard.
 */
export function HeroAutoSkip() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (localStorage.getItem(STORAGE_KEY)) {
      document.getElementById('dashboard')?.scrollIntoView({ behavior: 'instant' })
    } else {
      localStorage.setItem(STORAGE_KEY, '1')
    }
  }, [])

  return null
}

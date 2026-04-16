'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'

const RADIUS = 18
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  const circleRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    let rafId: number

    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? scrollTop / docHeight : 0

      // Direct DOM mutation — no React re-render, buttery smooth at 60fps
      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - pct))
      }

      setVisible(scrollTop > 200)
    }

    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  if (!visible) return null

  return (
    <button
      onClick={scrollTop}
      aria-label="Zum Seitenanfang scrollen"
      className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-background border border-border shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
    >
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 48 48"
      >
        {/* Track */}
        <circle
          cx="24" cy="24" r={RADIUS}
          fill="none"
          strokeWidth="3"
          className="stroke-muted"
        />
        {/* Progress — updated directly via ref, no state */}
        <circle
          ref={circleRef}
          cx="24" cy="24" r={RADIUS}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
          className="stroke-primary"
          style={{ willChange: 'stroke-dashoffset' }}
        />
      </svg>
      <ArrowUp className="h-4 w-4 text-foreground group-hover:-translate-y-0.5 transition-transform" />
    </button>
  )
}

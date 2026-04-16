'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTop() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? scrollTop / docHeight : 0
      setProgress(pct)
      setVisible(scrollTop > 200)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  if (!visible) return null

  const radius = 18
  const circumference = 2 * Math.PI * radius
  const dashoffset = circumference * (1 - progress)

  return (
    <button
      onClick={scrollTop}
      aria-label="Zum Seitenanfang scrollen"
      className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-background border border-border shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
    >
      {/* SVG progress ring */}
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 48 48"
      >
        {/* Track */}
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          strokeWidth="3"
          className="stroke-muted"
        />
        {/* Progress */}
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          className="stroke-primary transition-all duration-150"
        />
      </svg>
      <ArrowUp className="h-4 w-4 text-foreground group-hover:-translate-y-0.5 transition-transform" />
    </button>
  )
}

'use client'

import dynamic from 'next/dynamic'
import type { WeeklyDataPoint } from '@/lib/db'
import type { AtcGruppeStats } from '@/lib/types'

export const LazyTimelineChart = dynamic(
  () => import('./timeline-chart').then(m => m.TimelineChart),
  { ssr: false }
)

export const LazyAtcTreemap = dynamic(
  () => import('./atc-treemap').then(m => m.AtcTreemap),
  { ssr: false }
)

// Re-export prop types for type safety in page.tsx
export type { WeeklyDataPoint, AtcGruppeStats }

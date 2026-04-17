'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { WeeklyDataPoint } from '@/lib/db'

interface TimelineChartProps {
  initialData: WeeklyDataPoint[]
}

const RANGE_OPTIONS = [
  { label: '3 Mt.', weeks: 13 },
  { label: '6 Mt.', weeks: 26 },
  { label: '1 J.', weeks: 52 },
  { label: '2 J.', weeks: 104 },
  { label: '5 J.', weeks: 260 },
]

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold text-foreground">{payload[0].value} neue Meldungen</p>
    </div>
  )
}

// "2025-KW04" → "Jan '25"
function formatWeekLabel(week: string): string {
  const [yearStr, weekStr] = week.split('-KW')
  const year = parseInt(yearStr)
  const weekNum = parseInt(weekStr)
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const weekStart = new Date(jan4)
  weekStart.setDate(jan4.getDate() - (dayOfWeek - 1) + (weekNum - 1) * 7)
  return weekStart.toLocaleDateString('de-CH', { month: 'short', year: '2-digit' })
}

export function TimelineChart({ initialData }: TimelineChartProps) {
  const [weeks, setWeeks] = useState(52)
  const [data, setData] = useState<WeeklyDataPoint[]>(initialData)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/timeline?weeks=${weeks}`)
      .then(r => r.json())
      .then((d: WeeklyDataPoint[]) => { if (!cancelled) setData(d) })
      .catch(() => {/* keep current data on error */})
    return () => { cancelled = true }
  }, [weeks])

  if (initialData.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4" aria-hidden>
        <p className="text-sm font-medium mb-3">Neue Meldungen pro Woche</p>
        <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
          Wird nach dem nächsten Scrape-Lauf verfügbar
        </div>
      </div>
    )
  }

  const interval = Math.max(1, Math.floor(data.length / 13) - 1)

  return (
    <div className="rounded-lg border bg-card p-4" role="img" aria-label="Neue Meldungen pro Woche">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">Neue Meldungen pro Woche</p>
        <div className="flex items-center gap-0.5">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.weeks}
              onClick={() => setWeeks(opt.weeks)}
              className={[
                'px-2 py-0.5 text-xs rounded transition-colors',
                weeks === opt.weeks
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="week"
              tickFormatter={formatWeekLabel}
              tick={{ fontSize: 10 }}
              interval={interval}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              allowDecimals={false}
              width={32}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              dot={false}
              strokeWidth={2}
              stroke="oklch(0.52 0.09 200)"
            />
          </LineChart>
        </ResponsiveContainer>
    </div>
  )
}

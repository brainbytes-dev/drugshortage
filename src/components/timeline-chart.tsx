'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { WeeklyDataPoint } from '@/lib/db'

interface TimelineChartProps {
  data: WeeklyDataPoint[]
}

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

// "2025-W04" → "Jan '25"
function formatWeekLabel(week: string): string {
  const [yearStr, weekStr] = week.split('-KW')
  const year = parseInt(yearStr)
  const weekNum = parseInt(weekStr)
  // ISO week 1 starts near Jan 4
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const weekStart = new Date(jan4)
  weekStart.setDate(jan4.getDate() - (dayOfWeek - 1) + (weekNum - 1) * 7)
  return weekStart.toLocaleDateString('de-CH', { month: 'short', year: '2-digit' })
}

export function TimelineChart({ data }: TimelineChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4" aria-hidden>
        <p className="text-sm font-medium mb-3">Neue Engpässe pro Woche</p>
        <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
          Wird nach dem nächsten Scrape-Lauf verfügbar
        </div>
      </div>
    )
  }
  return (
    <div className="rounded-lg border bg-card p-4" role="img" aria-label="Neue Engpässe pro Woche">
      <p className="text-sm font-medium mb-3">Neue Engpässe pro Woche</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="week"
            tickFormatter={formatWeekLabel}
            tick={{ fontSize: 10 }}
            interval={3}
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

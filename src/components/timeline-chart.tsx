'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { WeeklyDataPoint } from '@/lib/db'

interface TimelineChartProps {
  data: WeeklyDataPoint[]
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
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10 }}
            interval={3}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            allowDecimals={false}
          />
          <Tooltip />
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

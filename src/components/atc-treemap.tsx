'use client'

import { useMemo } from 'react'
import { Treemap, ResponsiveContainer } from 'recharts'
import { useRouter } from 'next/navigation'
import type { AtcGruppeStats } from '@/lib/types'

interface AtcTreemapProps {
  data: AtcGruppeStats[]
}

// Note: oklch() in SVG fill attributes requires Chrome 111+, Firefox 113+, Safari 15.4+
function getColor(value: number, max: number): { fill: string; textColor: string } {
  if (value > max * 0.5) return { fill: 'oklch(0.52 0.15 25)', textColor: '#fff' }
  if (value > max * 0.2) return { fill: 'oklch(0.72 0.12 55)', textColor: '#1a1a1a' }
  return { fill: 'oklch(0.52 0.09 200)', textColor: '#fff' }
}

// recharts custom content props are not strongly typed
function makeCustomCell(router: ReturnType<typeof useRouter>) {
  return function CustomCell(props: any) {
    const { x, y, width, height, name, value, bezeichnung } = props

    const root = props.root
    const maxVal = root?.children
      ? Math.max(...root.children.map((c: any) => c.value ?? 0))
      : value

    const { fill, textColor } = getColor(value, maxVal)

    const showCode = width > 40 && height > 30
    const showCount = height > 50

    return (
      <g
        onClick={() => router.push(`/?atc=${encodeURIComponent(name)}`)}
        className="cursor-pointer"
        role="button"
        aria-label={`${name}: ${bezeichnung} — ${value} Engpässe`}
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          stroke="#fff"
          strokeWidth={2}
          rx={3}
          opacity={0.9}
        />
        {showCode && (
          <text
            x={x + width / 2}
            y={y + height / 2 - (showCount ? 8 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={textColor}
            fontSize={11}
            fontWeight="bold"
          >
            {name}
          </text>
        )}
        {showCount && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={textColor}
            fontSize={10}
            opacity={0.85}
          >
            {value}
          </text>
        )}
      </g>
    )
  }
}

export function AtcTreemap({ data }: AtcTreemapProps) {
  const router = useRouter()
  const CustomCell = useMemo(() => makeCustomCell(router), [router])

  const treemapData = useMemo(
    () => data.map(d => ({ name: d.atcCode, value: d.anzahl, bezeichnung: d.bezeichnung })),
    [data]
  )

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium mb-3">Engpässe nach Wirkstoffgruppe (ATC)</p>
        <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
          Keine Daten verfügbar
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium mb-3">Engpässe nach Wirkstoffgruppe (ATC)</p>
      <ResponsiveContainer width="100%" height={260}>
        <Treemap
          data={treemapData}
          dataKey="value"
          content={<CustomCell />}
        />
      </ResponsiveContainer>
    </div>
  )
}

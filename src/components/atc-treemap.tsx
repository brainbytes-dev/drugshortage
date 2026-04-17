'use client'

import { useMemo, useCallback, useState } from 'react'
import { Treemap, ResponsiveContainer } from 'recharts'
import { useRouter } from 'next/navigation'
import type { AtcGruppeStats } from '@/lib/types'

interface AtcTreemapProps {
  data: AtcGruppeStats[]
}

interface TreemapCellProps {
  x?: number
  y?: number
  width?: number
  height?: number
  name?: string
  value?: number
  bezeichnung?: string
  root?: { children?: readonly { value?: number }[] | null }
}

interface TooltipState {
  name: string
  bezeichnung: string
  value: number
  x: number
  y: number
}

// Note: oklch() in SVG fill attributes requires Chrome 111+, Firefox 113+, Safari 15.4+
function getColor(value: number, max: number): { fill: string; textColor: string } {
  if (value > max * 0.5) return { fill: 'oklch(0.52 0.15 25)', textColor: '#fff' }
  if (value > max * 0.2) return { fill: 'oklch(0.72 0.12 55)', textColor: '#1a1a1a' }
  return { fill: 'oklch(0.52 0.09 200)', textColor: '#fff' }
}

export function AtcTreemap({ data }: AtcTreemapProps) {
  const router = useRouter()
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const treemapData = useMemo(
    () => data.map(d => ({ name: d.atcCode, value: d.anzahl, bezeichnung: d.bezeichnung })),
    [data]
  )

  const renderCell = useCallback((props: TreemapCellProps) => {
    const { x = 0, y = 0, width = 0, height = 0, name, value = 0, bezeichnung, root } = props

    const maxVal = root?.children
      ? Math.max(...root.children.map(c => c.value ?? 0))
      : value

    const { fill, textColor } = getColor(value, maxVal)
    const showCode = width > 40 && height > 30
    const showCount = height > 50

    return (
      <g
        onClick={() => router.push(`/?atc=${encodeURIComponent(name ?? '')}`, { scroll: false })}
        onMouseEnter={e => setTooltip({ name: name ?? '', bezeichnung: bezeichnung ?? '', value, x: e.clientX, y: e.clientY })}
        onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
        onMouseLeave={() => setTooltip(null)}
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
  }, [router])

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
          content={renderCell}
        />
      </ResponsiveContainer>

      {/* Fixed tooltip — follows cursor via clientX/Y */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border bg-card px-3 py-2 text-sm shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 48 }}
        >
          <p className="font-semibold text-foreground">{tooltip.name}</p>
          {tooltip.bezeichnung && (
            <p className="text-muted-foreground text-xs max-w-[220px] truncate">{tooltip.bezeichnung}</p>
          )}
          <p className="text-primary font-medium mt-0.5">{tooltip.value} Engpässe</p>
        </div>
      )}
    </div>
  )
}

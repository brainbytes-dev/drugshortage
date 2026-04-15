import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  code: number
  text?: string
  showText?: boolean
}

const STATUS_CONFIG: Record<number, { label: string; className: string }> = {
  1: { label: '1 — Direkt gemeldet', className: 'bg-green-100 text-green-800 border-green-200' },
  2: { label: '2 — Gemeldet', className: 'bg-lime-100 text-lime-800 border-lime-200' },
  3: { label: '3 — Sporadisch', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  4: { label: '4 — Nicht informiert', className: 'bg-red-100 text-red-800 border-red-200' },
  5: { label: '5 — Verhandlung', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
}

export function StatusBadge({ code, showText = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[code] ?? { label: String(code), className: 'bg-gray-100 text-gray-800' }
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', config.className)}
    >
      {showText ? config.label : code}
    </Badge>
  )
}

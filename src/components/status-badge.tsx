'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  code: number
  showText?: boolean
}

const STATUS_CLASSES: Record<number, string> = {
  1: 'bg-status-resolved-soft text-status-resolved border-status-resolved/30',
  2: 'bg-status-resolved-soft text-status-resolved border-status-resolved/30',
  3: 'bg-status-longterm-soft text-status-longterm border-status-longterm/30',
  4: 'bg-status-active-soft text-status-active border-status-active/30',
  5: 'bg-status-new-soft text-status-new border-status-new/30',
}

const STATUS_KEYS: Record<number, string> = {
  1: 'status1',
  2: 'status2',
  3: 'status3',
  4: 'status4',
  5: 'status5',
}

export function StatusBadge({ code, showText = false }: StatusBadgeProps) {
  const t = useTranslations('StatusBadge')
  const className = STATUS_CLASSES[code] ?? 'bg-gray-100 text-gray-800'
  const key = STATUS_KEYS[code]
  const label = key ? t(key) : String(code)
  return (
    <Badge variant="outline" className={cn('font-medium', className)}>
      {showText ? label : code}
    </Badge>
  )
}

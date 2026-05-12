'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  code: number
  showText?: boolean
}

const STATUS_CLASSES: Record<number, string> = {
  1: 'bg-green-100 text-green-800 border-green-200',
  2: 'bg-lime-100 text-lime-800 border-lime-200',
  3: 'bg-orange-100 text-orange-800 border-orange-200',
  4: 'bg-red-100 text-red-800 border-red-200',
  5: 'bg-yellow-100 text-yellow-800 border-yellow-200',
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

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FilterBarProps {
  firmaList: string[]
}

const STATUS_OPTIONS = [
  { value: '1', label: '1 — Direkt gemeldet (Grün)' },
  { value: '2', label: '2 — Gemeldet (Gelbgrün)' },
  { value: '3', label: '3 — Sporadisch (Orange)' },
  { value: '4', label: '4 — Nicht informiert (Rot)' },
  { value: '5', label: '5 — Verhandlung (Gelb)' },
]

export function FilterBar({ firmaList }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.replace(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const statusValue = (searchParams.get('status') ?? 'all') as string
  const firmaValue = (searchParams.get('firma') ?? 'all') as string

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={statusValue}
        onValueChange={v => updateParam('status', v ?? 'all')}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Status</SelectItem>
          {STATUS_OPTIONS.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={firmaValue}
        onValueChange={v => updateParam('firma', v ?? 'all')}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Firma" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Firmen</SelectItem>
          {firmaList.map(f => (
            <SelectItem key={f} value={f}>{f}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

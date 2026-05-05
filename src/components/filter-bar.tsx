'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
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

export function FilterBar({ firmaList }: FilterBarProps) {
  const t = useTranslations('Filters')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Translated status options (recomputed when locale changes via t)
  const statusOptions = useMemo(
    () => [
      { value: '1', label: t('status1') },
      { value: '2', label: t('status2') },
      { value: '3', label: t('status3') },
      { value: '4', label: t('status4') },
      { value: '5', label: t('status5') },
    ],
    [t]
  )

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      const query = Object.fromEntries(params.entries())
      router.replace(
        { pathname, query } as Parameters<typeof router.replace>[0],
        { scroll: false }
      )
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
          <SelectValue placeholder={t('statusPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allStatuses')}</SelectItem>
          {statusOptions.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={firmaValue}
        onValueChange={v => updateParam('firma', v ?? 'all')}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder={t('firmaPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allFirmen')}</SelectItem>
          {firmaList.map(f => (
            <SelectItem key={f} value={f}>{f}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

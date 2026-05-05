'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'

const FILTER_PARAMS = ['search', 'status', 'firma', 'atc', 'neu']

export function ResetFiltersButton() {
  const t = useTranslations('ResetFilters')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const hasFilters = FILTER_PARAMS.some(p => searchParams.has(p))
  if (!hasFilters) return null

  return (
    <button
      onClick={() =>
        router.replace(
          pathname as Parameters<typeof router.replace>[0],
          { scroll: false }
        )
      }
      aria-label={t('resetAria')}
      className="flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  )
}

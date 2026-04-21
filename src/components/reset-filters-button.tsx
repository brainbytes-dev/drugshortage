'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { X } from 'lucide-react'

const FILTER_PARAMS = ['search', 'status', 'firma', 'atc', 'neu']

export function ResetFiltersButton() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const hasFilters = FILTER_PARAMS.some(p => searchParams.has(p))
  if (!hasFilters) return null

  return (
    <button
      onClick={() => router.replace(pathname, { scroll: false })}
      aria-label="Filter zurücksetzen"
      className="flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  )
}

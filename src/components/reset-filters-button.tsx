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
      className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
    >
      <X className="h-3.5 w-3.5" />
      Filter zurücksetzen
    </button>
  )
}

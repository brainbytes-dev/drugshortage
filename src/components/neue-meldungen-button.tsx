'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'

export function NeueMeldungenButton() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isActive = searchParams.get('neu') === '1'

  const toggle = () => {
    const p = new URLSearchParams(searchParams.toString())
    if (isActive) {
      p.delete('neu')
    } else {
      p.set('neu', '1')
      p.delete('page') // reset pagination
    }
    router.replace(`${pathname}?${p.toString()}`)
  }

  return (
    <button
      onClick={toggle}
      className={[
        'inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors shrink-0',
        isActive
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted',
      ].join(' ')}
    >
      <Sparkles className="h-3.5 w-3.5" />
      Neue Meldungen
    </button>
  )
}

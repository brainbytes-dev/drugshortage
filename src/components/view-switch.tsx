'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const VIEWS = [
  { key: 'engpaesse', label: 'Engpässe' },
  { key: 'ausser-handel', label: 'Ausser Handel' },
  { key: 'vertriebseinstellung', label: 'Vertriebseinstellung' },
  { key: 'erloschen', label: 'Erlöschungen' },
  { key: 'historisch', label: 'Historisch' },
] as const

type ViewKey = typeof VIEWS[number]['key']

interface ViewSwitchProps {
  active: string
  counts?: { engpaesse: number; ausserHandel: number; vertriebseingestellt: number; erloschen: number; historisch: number }
}

export function ViewSwitch({ active, counts }: ViewSwitchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  function navigate(view: ViewKey) {
    if (view === active) return
    const p = new URLSearchParams(searchParams.toString())
    if (view === 'engpaesse') {
      p.delete('view')
    } else {
      p.set('view', view)
    }
    p.delete('sort')
    // Reset page and search when switching views
    p.delete('page')
    p.delete('search')
    startTransition(() => {
      router.replace(`${pathname}?${p.toString()}`, { scroll: false })
    })
  }

  const countMap: Record<ViewKey, number | undefined> = {
    'engpaesse': counts?.engpaesse,
    'ausser-handel': counts?.ausserHandel,
    'vertriebseinstellung': counts?.vertriebseingestellt,
    'erloschen': counts?.erloschen,
    'historisch': counts?.historisch,
  }

  return (
    <div className="inline-flex items-center rounded-lg border border-border/60 bg-muted/30 p-1 gap-0.5">
      {VIEWS.map(({ key, label }) => {
        const isActive = active === key
        const count = countMap[key]
        return (
          <button
            key={key}
            onClick={() => navigate(key)}
            className={[
              'relative inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
            ].join(' ')}
          >
            {label}
            {count !== undefined && (
              <span
                className={[
                  'tabular-nums text-[11px] font-semibold rounded-full px-1.5 py-0.5 leading-none',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
                ].join(' ')}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

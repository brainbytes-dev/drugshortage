'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Sparkles } from 'lucide-react'

export function NeueMeldungenButton() {
  const t = useTranslations('NeueMeldungen')
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
    const query = Object.fromEntries(p.entries())
    router.replace(
      { pathname, query } as Parameters<typeof router.replace>[0],
      { scroll: false }
    )
  }

  return (
    <button
      onClick={toggle}
      className={[
        'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors shrink-0',
        isActive
          ? 'border-status-new bg-status-new-soft text-status-new'
          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted',
      ].join(' ')}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {t('label')}
    </button>
  )
}

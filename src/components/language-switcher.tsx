'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CircleFlagLanguage } from 'react-circle-flags'
import { Check, ChevronDown } from 'lucide-react'
import { useRouter, usePathname } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'

const LOCALES = routing.locales

export function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher')
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function selectLocale(next: Locale) {
    setOpen(false)
    if (next === locale) return
    // Replace path under the new locale; preserves dynamic segments + search params.
    // @ts-expect-error — pathname is a runtime string here; routing.pathnames typing is strict.
    router.replace(pathname, { locale: next })
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('ariaLabel')} (${t('currentLabel')}: ${t(locale)})`}
        className="inline-flex items-center gap-1.5 h-8 rounded-md border border-border/60 bg-muted/40 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <CircleFlagLanguage
          languageCode={locale}
          className="h-4 w-4 shrink-0"
          alt=""
        />
        <span className="uppercase tracking-wide">{locale}</span>
        <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
      </button>

      {open && (
        <div
          ref={popoverRef}
          role="listbox"
          aria-label={t('ariaLabel')}
          className="absolute right-0 mt-1.5 z-50 min-w-[10rem] overflow-hidden rounded-md border border-border/60 bg-popover text-popover-foreground shadow-md"
        >
          <ul className="py-1">
            {LOCALES.map((code) => {
              const isActive = code === locale
              return (
                <li key={code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => selectLocale(code)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-muted/70 focus:bg-muted/70 focus:outline-none ${
                      isActive ? 'bg-muted/40 font-medium' : ''
                    }`}
                  >
                    <CircleFlagLanguage
                      languageCode={code}
                      className="h-4 w-4 shrink-0"
                      alt=""
                    />
                    <span className="flex-1">{t(code)}</span>
                    {isActive && (
                      <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

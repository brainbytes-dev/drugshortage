'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useCallback, useTransition, useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function SearchBar() {
  const t = useTranslations('Search')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get('search') ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync input when URL changes externally
  useEffect(() => {
    startTransition(() => setValue(searchParams.get('search') ?? ''))
  }, [searchParams])

  // Cmd+K / Ctrl+K → focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ✅ Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue) // ✅ Update local state immediately (no visual lag)

      // ✅ Debounce the navigation by 300ms
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (newValue.trim()) {
          params.set('search', newValue.trim())
        } else {
          params.delete('search')
        }
        params.delete('page')
        const query = Object.fromEntries(params.entries())
        startTransition(() => {
          router.replace(
            { pathname, query } as Parameters<typeof router.replace>[0],
            { scroll: false }
          )
        })
      }, 300) // ✅ Only navigate after 300ms of no typing
    },
    [router, pathname, searchParams]
  )

  const clearSearch = useCallback(() => {
    setValue('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    params.delete('page')
    const query = Object.fromEntries(params.entries())
    startTransition(() => {
      router.replace(
        { pathname, query } as Parameters<typeof router.replace>[0],
        { scroll: false }
      )
    })
  }, [router, pathname, searchParams])

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        placeholder={t('placeholder')}
        value={value}
        onChange={handleChange}
        className={value ? 'pl-9 pr-8' : 'pl-9'}
      />
      {value && (
        <button
          onClick={clearSearch}
          aria-label={t('clearAria')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

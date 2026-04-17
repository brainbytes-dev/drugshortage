'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition, useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function SearchBar() {
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
        startTransition(() => {
          router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        })
      }, 300) // ✅ Only navigate after 300ms of no typing
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder="Suchen… (⌘K)"
        value={value}
        onChange={handleChange}
        className="pl-9"
      />
    </div>
  )
}

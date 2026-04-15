'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get('search') ?? '')

  // Sync input when URL changes externally (back/forward, filter reset)
  useEffect(() => {
    setValue(searchParams.get('search') ?? '')
  }, [searchParams])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      const params = new URLSearchParams(searchParams.toString())
      if (newValue) {
        params.set('search', newValue)
      } else {
        params.delete('search')
      }
      params.delete('page')
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Medikament, Firma oder ATC-Code suchen…"
        value={value}
        onChange={handleChange}
        className="pl-9"
      />
    </div>
  )
}

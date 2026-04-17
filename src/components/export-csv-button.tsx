'use client'

import { useSearchParams } from 'next/navigation'
import { Download } from 'lucide-react'

export function ExportCsvButton() {
  const searchParams = useSearchParams()

  function handleExport() {
    const params = new URLSearchParams()
    for (const key of ['search', 'status', 'firma', 'atc', 'sort']) {
      const value = searchParams.get(key)
      if (value) params.set(key, value)
    }
    const exportUrl = `/api/export/csv${params.size > 0 ? '?' + params.toString() : ''}`
    window.location.href = exportUrl
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
    >
      <Download className="h-3.5 w-3.5" />
      CSV Export
    </button>
  )
}

'use client'

import { useSearchParams } from 'next/navigation'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4" />
      CSV Export
    </Button>
  )
}

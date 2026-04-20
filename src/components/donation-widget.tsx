'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PRESETS = [10, 25, 50]

export function DonationWidget() {
  const [amount, setAmount] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function donate(chf: number) {
    setLoading(true)
    const res = await fetch('/api/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: chf }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <Button
          key={p}
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => donate(p)}
        >
          CHF {p}
        </Button>
      ))}
      <div className="flex gap-1">
        <Input
          type="number"
          min={5}
          placeholder="Betrag"
          className="w-24 h-9 text-sm"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={loading || !amount || Number(amount) < 5}
          onClick={() => donate(Number(amount))}
        >
          Spenden
        </Button>
      </div>
    </div>
  )
}

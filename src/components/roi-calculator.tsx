'use client'

import { useState } from 'react'
import { Calculator } from 'lucide-react'

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">{label}</label>
        <span className="text-xs font-bold text-foreground tabular-nums">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full bg-border accent-primary cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  )
}

export function RoiCalculator() {
  const [employees, setEmployees] = useState(3)
  const [minutesPerDay, setMinutesPerDay] = useState(15)
  const [hourlyRate, setHourlyRate] = useState(90)

  const workingDaysPerMonth = 22
  const monthlyMinutes = employees * minutesPerDay * workingDaysPerMonth
  const monthlyHours = monthlyMinutes / 60
  const monthlyCost = Math.round(monthlyHours * hourlyRate)
  const institutionalPrice = 199
  const savings = monthlyCost - institutionalPrice
  const isPositiveRoi = savings > 0

  return (
    <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-primary shrink-0" />
        <p className="text-[13px] font-semibold text-foreground">
          Was kostet der manuelle Engpass-Check Ihre Institution?
        </p>
      </div>

      <div className="space-y-5">
        <Slider
          label="Mitarbeitende die täglich prüfen"
          value={employees}
          min={1}
          max={10}
          step={1}
          unit="Pers."
          onChange={setEmployees}
        />
        <Slider
          label="Minuten pro Person täglich"
          value={minutesPerDay}
          min={5}
          max={60}
          step={5}
          unit="Min."
          onChange={setMinutesPerDay}
        />
        <Slider
          label="Stundensatz (Apothekenpers.)"
          value={hourlyRate}
          min={60}
          max={150}
          step={10}
          unit="CHF/h"
          onChange={setHourlyRate}
        />
      </div>

      <div className="rounded-xl bg-background border border-border/50 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Personalaufwand/Monat</span>
          <span className="font-semibold text-foreground tabular-nums">
            {monthlyHours.toFixed(1)} h · CHF {monthlyCost.toLocaleString('de-CH')}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Klinik-System Abo</span>
          <span className="font-semibold text-foreground tabular-nums">
            CHF {institutionalPrice}
          </span>
        </div>
        <div className="border-t border-border/40 pt-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Monatliche Ersparnis</span>
          <span className={`text-sm font-extrabold tabular-nums ${
            isPositiveRoi ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
          }`}>
            {isPositiveRoi ? '+' : ''}CHF {savings.toLocaleString('de-CH')}
          </span>
        </div>
      </div>

      {isPositiveRoi && (
        <p className="text-[11px] text-muted-foreground">
          Bei diesen Annahmen amortisiert sich das Abo in{' '}
          <strong className="text-foreground">
            {Math.round((institutionalPrice / monthlyCost) * workingDaysPerMonth)} Arbeitstagen
          </strong>{' '}
          — der Rest ist eingesparte Zeit.
        </p>
      )}
    </div>
  )
}

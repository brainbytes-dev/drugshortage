import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Heart } from 'lucide-react'
import { DonationWidget } from '@/components/donation-widget'

export const metadata: Metadata = {
  title: 'Engpassradar unterstützen',
  description: 'Helfen Sie mit, Engpassradar als unabhängiges Instrument für das Schweizer Gesundheitswesen zu erhalten.',
}

export default function SpendenPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-10">

        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Zur Übersicht
        </Link>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Engpassradar unterstützen</h1>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Engpassradar ist ein unabhängiges, nicht-kommerzielles Instrument für das Schweizer Gesundheitswesen.
            Die Daten sind frei zugänglich — ohne Login, ohne Paywall.
            Mit einer Spende helfen Sie, den Betrieb, die Server und die Weiterentwicklung zu finanzieren.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Betrag wählen</p>
            <p className="text-xs text-muted-foreground">Einmalige Zahlung via Stripe — CHF 5 Minimum</p>
          </div>
          <DonationWidget />
        </div>

        <div className="rounded-xl border bg-muted/30 px-5 py-4 space-y-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground text-sm">Wofür wird gespendet?</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Server- und Datenbankkosten (Supabase, Vercel)</li>
            <li>Tägliche Datenaktualisierung und Scraping</li>
            <li>Weiterentwicklung neuer Features</li>
            <li>Betrieb des kostenlosen API-Zugangs</li>
          </ul>
        </div>

      </div>
    </main>
  )
}

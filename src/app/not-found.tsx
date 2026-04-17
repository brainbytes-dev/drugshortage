import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4 overflow-hidden">

      {/* Gradient blob — matches hero */}
      <div
        aria-hidden
        className="hero-blob pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.06] blur-3xl"
        style={{ background: 'radial-gradient(ellipse, oklch(0.52 0.09 200), oklch(0.62 0.14 225) 60%, transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 w-[350px] h-[250px] rounded-full opacity-[0.03] blur-3xl"
        style={{ background: 'radial-gradient(ellipse, oklch(0.62 0.14 225), transparent)' }}
      />

      <div className="relative z-10 max-w-lg mx-auto space-y-8">

        {/* 404 ghost number */}
        <div className="hero-animate hero-animate-1 relative select-none">
          <span
            aria-hidden
            className="block text-[clamp(7rem,20vw,12rem)] font-black leading-none tabular-nums text-foreground/[0.04] pointer-events-none"
          >
            404
          </span>
          {/* Overlaid label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive/70" />
              Seite nicht gefunden
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="hero-animate hero-animate-2 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Diese Seite{' '}
            <span className="gradient-text">fehlt.</span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Das Präparat oder die URL existiert nicht mehr —
            vielleicht wurde der Engpass aufgelöst oder der Link ist veraltet.
          </p>
        </div>

        {/* Actions */}
        <div className="hero-animate hero-animate-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:shadow-[0_0_0_4px_oklch(0.52_0.09_200/0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Zur Übersicht
          </Link>
          <Link
            href="/?neu=1"
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150"
          >
            <Search className="h-4 w-4" aria-hidden />
            Neue Meldungen
          </Link>
        </div>

        {/* Hint */}
        <p className="hero-animate hero-animate-4 text-xs text-muted-foreground">
          Engpässe werden täglich aktualisiert —{' '}
          <Link href="/" className="underline underline-offset-2 hover:text-foreground transition-colors">
            alle aktiven Meldungen
          </Link>{' '}
          findest du auf der Startseite.
        </p>

      </div>
    </main>
  )
}

import { useTranslations } from 'next-intl'
import { ArrowLeft, Search } from 'lucide-react'
import { Link } from '@/i18n/navigation'

export default function NotFound() {
  const t = useTranslations('NotFound')

  return (
    <main className="relative flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4 overflow-hidden">

      <div className="relative z-10 max-w-lg mx-auto space-y-8">

        {/* 404 ghost number */}
        <div className="relative select-none">
          <span
            aria-hidden
            className="block text-[clamp(7rem,20vw,12rem)] font-black leading-none tabular-nums text-foreground/[0.04] pointer-events-none"
          >
            404
          </span>
          {/* Overlaid label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3.5 py-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-status-active" />
              {t('badge')}
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            {t('headlinePrefix')}{' '}
            <span className="text-primary">{t('headlineHighlight')}</span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {t('body')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('ctaHome')}
          </Link>
          <Link
            href={{ pathname: '/', query: { neu: '1' } }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
          >
            <Search className="h-4 w-4" aria-hidden />
            {t('ctaNew')}
          </Link>
        </div>

        {/* Hint */}
        <p className="text-xs text-muted-foreground">
          {t('hintBefore')}{' '}
          <Link href="/" className="underline underline-offset-2 hover:text-foreground transition-colors">
            {t('hintLink')}
          </Link>{' '}
          {t('hintAfter')}
        </p>

      </div>
    </main>
  )
}

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ApiKeysSuccess')
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  }
}

export default async function ApiKeySuccessPage() {
  const t = await getTranslations('ApiKeysSuccess')
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 text-center">
      <div className="max-w-md space-y-8">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('h1')}</h1>
          <p className="text-muted-foreground leading-relaxed">
            {t.rich('subtitle', {
              bold: () => <strong className="text-foreground">{t('subtitleApiAccess')}</strong>,
            })}
          </p>
        </div>

        {/* Next steps */}
        <ol className="text-left space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
            <div>
              <p className="text-sm font-medium text-foreground">{t('step1Title')}</p>
              <p className="text-sm text-muted-foreground">{t('step1Body')}</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
            <div>
              <p className="text-sm font-medium text-foreground">{t('step2Title')}</p>
              <p className="text-sm text-muted-foreground">
                {t('step2Body')}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
            <div>
              <p className="text-sm font-medium text-foreground">{t('step3Title')}</p>
              <p className="text-sm text-muted-foreground">
                {t('step3Body')}
              </p>
            </div>
          </li>
        </ol>

        <div className="space-y-3">
          <Link
            href="/api-keys"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {t('ctaDashboard')}
          </Link>
          <p className="text-xs text-muted-foreground">
            {t('ctaNote')}
          </p>
          <div>
            <Link
              href="/api-docs"
              className="text-sm text-primary hover:underline transition-colors"
            >
              {t('ctaDocs')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

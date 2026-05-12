import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function WatchlistErrorPage() {
  const t = await getTranslations('WatchlistError')

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground mb-6">{t('description')}</p>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:underline"
        >
          {t('backToDashboard')}
        </Link>
      </div>
    </main>
  )
}

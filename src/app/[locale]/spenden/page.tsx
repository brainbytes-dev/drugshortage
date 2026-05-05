import type { Metadata } from 'next'
import { buildPageAlternates } from '@/lib/i18n-meta'
import type { Locale } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, Heart } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { DonationWidget } from '@/components/donation-widget'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = await getTranslations('Spenden')
  const { locale } = await params
  const { canonical, languages } = buildPageAlternates('/spenden', locale as Locale)
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical, languages },
  }
}

export default async function SpendenPage() {
  const t = await getTranslations('Spenden')
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-10">

        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t('backToOverview')}
        </Link>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{t('h1')}</h1>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t('intro')}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold">{t('amountLabel')}</p>
            <p className="text-xs text-muted-foreground">{t('amountHint')}</p>
          </div>
          <DonationWidget />
        </div>

        <div className="rounded-xl border bg-muted/30 px-5 py-4 space-y-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground text-sm">{t('useOfFundsTitle')}</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>{t('useOfFunds1')}</li>
            <li>{t('useOfFunds2')}</li>
            <li>{t('useOfFunds3')}</li>
            <li>{t('useOfFunds4')}</li>
          </ul>
        </div>

      </div>
    </main>
  )
}

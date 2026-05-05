import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Impressum')
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  }
}

export default async function ImpressumPage() {
  const t = await getTranslations('Impressum')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        name: t('jsonLdContactName'),
        url: 'https://www.engpassradar.ch/impressum',
      },
      {
        '@type': 'Organization',
        name: 'engpass.radar',
        url: 'https://www.engpassradar.ch',
        founder: { '@type': 'Person', name: 'Henrik Rühe' },
        legalName: 'HM Consulting Rühe',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Buchenweg 18',
          postalCode: '5036',
          addressLocality: 'Oberentfelden',
          addressCountry: 'CH',
        },
        email: 'info@engpassradar.ch',
      },
    ],
  }

  return (
    <main className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '<') }}
      />
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-10">
        <div className="space-y-1 border-b pb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t('h1')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('operatorTitle')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            HM Consulting Rühe<br />
            Buchenweg 18<br />
            {t('operatorCity')}
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('operatorResponsible')}
          </p>
          <p className="text-muted-foreground">
            {t('emailLabel')}{' '}
            <a href="mailto:info@engpassradar.ch" className="underline hover:text-foreground">
              info@engpassradar.ch
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('vatTitle')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('vatBody')}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('sourcesTitle')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('sourcesIntro')}
          </p>
          <ul className="text-[15px] text-muted-foreground list-disc list-outside ml-5 space-y-2 leading-relaxed">
            <li>
              <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                drugshortage.ch
              </a>{' '}
              {t('sourceDrugshortageDesc')}
            </li>
            <li>
              <a href="https://www.bwl.admin.ch/de/meldestelle-heilmittel" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                {t('sourceBwlName')}
              </a>{' '}
              {t('sourceBwlDesc')}
            </li>
            <li>
              <a href="https://ch.oddb.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                ODDB / ch.oddb.org
              </a>{' '}
              {t('sourceOddbDesc')}
            </li>
          </ul>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('sourcesDisclaimer')}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('liabilityTitle')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('liabilityBody1')}
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('liabilityBody2')}
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('liabilityBody3')}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('linksTitle')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('linksBody')}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('copyrightTitle')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('copyrightBody')}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('privacyTitle')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('privacyBody1')}
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t.rich('privacyBody2', {
              link: (chunks) => (
                <Link href="/datenschutz" className="underline hover:text-foreground">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>
      </div>
    </main>
  )
}

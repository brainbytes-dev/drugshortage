import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Nutzungsbedingungen')
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  }
}

export default async function NutzungsbedingungenPage() {
  const t = await getTranslations('Nutzungsbedingungen')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('jsonLdName'),
    url: 'https://www.engpassradar.ch/nutzungsbedingungen',
    isPartOf: { '@id': 'https://www.engpassradar.ch' },
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
          <h2 className="text-lg font-semibold">{t('s1Title')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('s1Body')}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('s2Title')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('s2Body1')}
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('s2Body2')}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('s3Title')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t.rich('s3Body', {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('s4Title')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('s4Body1')}
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('s4Body2')}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('s5Title')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('s5Intro')}
          </p>
          <ul className="text-[15px] text-muted-foreground list-disc list-outside ml-5 space-y-2 leading-relaxed">
            <li>{t('s5Item1')}</li>
            <li>{t('s5Item2')}</li>
            <li>{t('s5Item3')}</li>
            <li>{t('s5Item4')}</li>
            <li>{t('s5Item5')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('s6Title')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('s6Intro')}
          </p>
          <ul className="text-[15px] text-muted-foreground list-disc list-outside ml-5 space-y-2 leading-relaxed">
            <li>{t('s6Item1')}</li>
            <li>{t('s6Item2')}</li>
            <li>{t('s6Item3')}</li>
            <li>{t('s6Item4')}</li>
            <li>{t('s6Item5')}</li>
          </ul>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t.rich('s6License', {
              link: (chunks) => (
                <a
                  href="https://www.elastic.co/licensing/elastic-license"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('s7Title')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('s7Body')}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('s8Title')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('s8Body')}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('s9Title')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('s9Body')}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('s10Title')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t.rich('s10Intro', {
              docs: (chunks) => <Link href="/api-docs" className="underline hover:text-foreground">{chunks}</Link>,
              api: (chunks) => <Link href="/api" className="underline hover:text-foreground">{chunks}</Link>,
            })}
          </p>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">{t('s10_1Title')}</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {t('s10_1Body')}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">{t('s10_2Title')}</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {t.rich('s10_2Body', {
                link: (chunks) => (
                  <Link href={{ pathname: '/api-keys', query: { tab: 'research' } }} className="underline hover:text-foreground">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">{t('s10_3Title')}</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {t('s10_3Body')}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">{t('s10_4Title')}</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {t('s10_4Body')}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">{t('s10_5Title')}</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {t.rich('s10_5Body', {
                link: (chunks) => (
                  <a href="mailto:api@engpassradar.ch" className="underline hover:text-foreground">{chunks}</a>
                ),
              })}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">{t('s10_6Title')}</h3>
            <ul className="text-[15px] text-muted-foreground list-disc list-outside ml-5 space-y-2 leading-relaxed">
              <li>{t('s10_6Item1')}</li>
              <li>{t('s10_6Item2')}</li>
              <li>{t('s10_6Item3')}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">{t('s10_7Title')}</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {t('s10_7Body')}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('s11Title')}</h2>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">{t('s11_1Title')}</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {t.rich('s11_1Body', {
                link: (chunks) => (
                  <a href="https://stripe.com/ch/legal/ssa" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">{t('s11_2Title')}</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {t('s11_2Body')}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">{t('s11_3Title')}</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {t('s11_3Body')}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">{t('s11_4Title')}</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {t('s11_4Body')}
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('s12Title')}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {t('s12Body1')}{' '}
            <a href="mailto:info@engpassradar.ch" className="underline hover:text-foreground">
              info@engpassradar.ch
            </a>
            <br />
            {t('s12Body2')}{' '}
            <a href="mailto:api@engpassradar.ch" className="underline hover:text-foreground">
              api@engpassradar.ch
            </a>
          </p>
        </section>


      </div>
    </main>
  )
}

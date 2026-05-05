import { useTranslations, useFormatter } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { KPIStats } from '@/lib/types'

interface KPICardsProps {
  stats: KPIStats
  historicalCount: number
}

export function KPICards({ stats, historicalCount }: KPICardsProps) {
  const t = useTranslations('Kpi')
  const format = useFormatter()

  const cards = [
    {
      title: t('activeShortages'),
      value: format.number(stats.totalActive),
      sub: t('activeShortagesSub'),
    },
    {
      title: t('historicalShortages'),
      value: format.number(historicalCount),
      sub: t('historicalShortagesSub'),
    },
    {
      title: t('affectedSubstances'),
      value: format.number(stats.uniqueAtcGroups),
      sub: t('affectedSubstancesSub'),
    },
    {
      title: t('avgDuration'),
      value: t('avgDurationValue', { days: stats.avgDaysSinceMeldung }),
      sub: t('avgDurationSub'),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map(card => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[2.5rem] flex items-center">
              <p
                className={`font-bold leading-tight ${
                String(card.value).length > 20 ? 'text-sm' :
                String(card.value).length > 12 ? 'text-lg' :
                'text-2xl'
              }`}
              >
                {card.value}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

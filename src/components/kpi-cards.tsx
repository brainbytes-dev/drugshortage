import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { KPIStats } from '@/lib/types'

interface KPICardsProps {
  stats: KPIStats
}

export function KPICards({ stats }: KPICardsProps) {
  const cards = [
    {
      title: 'Aktive Engpässe',
      value: stats.totalActive.toLocaleString('de-CH'),
      sub: 'aktuell gemeldet',
    },
    {
      title: 'Top Firma',
      value: stats.topFirma,
      sub: `${stats.topFirmaCount} Engpässe`,
    },
    {
      title: 'Betroffene ATC-Gruppen',
      value: stats.uniqueAtcGroups.toLocaleString('de-CH'),
      sub: 'verschiedene Wirkstoffe',
    },
    {
      title: 'Ø Dauer',
      value: `${stats.avgDaysSinceMeldung} Tage`,
      sub: 'seit erster Meldung',
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
            <p className="text-2xl font-bold truncate">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { KPIStats } from '@/lib/types'

interface KPICardsProps {
  stats: KPIStats
  historicalCount: number
}

export function KPICards({ stats, historicalCount }: KPICardsProps) {
  const cards = [
    {
      title: 'Aktive Engpässe',
      value: stats.totalActive.toLocaleString('de-CH'),
      sub: 'aktuell gemeldet',
    },
    {
      title: 'Historische Engpässe',
      value: historicalCount.toLocaleString('de-CH'),
      sub: 'abgeschlossen / gelöst',
    },
    {
      title: 'Betroffene Wirkstoffe',
      value: stats.uniqueAtcGroups.toLocaleString('de-CH'),
      sub: 'gemäss ATC-Klassifikation',
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

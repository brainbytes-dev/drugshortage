import Link from 'next/link'

interface Props {
  searchParams: Promise<{ atc?: string }>
}

export default async function WatchlistUnsubscribedPage({ searchParams }: Props) {
  const { atc } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-4xl mb-4">👋</div>
        <h1 className="text-2xl font-bold mb-2">Alert deaktiviert</h1>
        <p className="text-muted-foreground mb-6">
          Sie erhalten keine weiteren Engpass-Alerts{atc ? ` für ${atc}` : ''}.
        </p>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:underline"
        >
          Zurück zum Dashboard
        </Link>
      </div>
    </main>
  )
}

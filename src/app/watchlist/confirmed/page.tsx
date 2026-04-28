import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { robots: { index: false, follow: false } }

interface Props {
  searchParams: Promise<{ atc?: string }>
}

export default async function WatchlistConfirmedPage({ searchParams }: Props) {
  const { atc } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Alert aktiviert</h1>
        <p className="text-muted-foreground mb-6">
          Sie erhalten eine E-Mail, sobald sich die Engpass-Lage
          {atc ? ` für ${atc}` : ''} ändert.
        </p>
        {atc && (
          <Link
            href={`/wirkstoff/${atc}`}
            className="inline-block px-5 py-2.5 bg-[#2d8f8f] text-white rounded-lg font-medium hover:bg-[#267a7a] transition-colors"
          >
            {atc}-Engpässe ansehen
          </Link>
        )}
        <p className="mt-4">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            Zurück zum Dashboard
          </Link>
        </p>
      </div>
    </main>
  )
}

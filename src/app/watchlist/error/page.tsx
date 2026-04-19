import Link from 'next/link'

export default function WatchlistErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">Ungültiger Link</h1>
        <p className="text-muted-foreground mb-6">
          Dieser Link ist abgelaufen oder ungültig. Bitte registrieren Sie sich erneut.
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

export default function DankePage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-2xl font-semibold">Vielen Dank!</h1>
      <p className="text-muted-foreground">
        Ihre Unterstützung hilft, Engpassradar als unabhängiges Instrument für das Schweizer Gesundheitswesen zu betreiben.
      </p>
      <p className="text-sm text-muted-foreground">
        <a href="/" className="underline">Zurück zum Dashboard</a>
      </p>
    </main>
  )
}

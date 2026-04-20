export default function SuccessPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-2xl font-semibold">Vielen Dank!</h1>
      <p className="text-muted-foreground">
        Zahlung erfolgreich. Dein API-Key wird per E-Mail zugestellt — bitte auch den Spam-Ordner prüfen.
      </p>
      <p className="text-sm text-muted-foreground">
        Der Magic-Link im Mail ist 30 Tage gültig und führt direkt zu deinem Dashboard.
      </p>
    </main>
  )
}

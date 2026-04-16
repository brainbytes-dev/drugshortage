'use client'

export function NewsletterForm() {
  return (
    <form
      action="https://buttondown.com/api/emails/embed-subscribe/engpassradar"
      method="post"
      target="popupwindow"
      onSubmit={() => window.open('https://buttondown.com/engpassradar', 'popupwindow')}
      className="flex flex-col sm:flex-row gap-2 justify-center"
    >
      <input
        type="email"
        name="email"
        placeholder="ihre@email.ch"
        required
        className="flex-1 min-w-0 rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        Abonnieren
      </button>
    </form>
  )
}

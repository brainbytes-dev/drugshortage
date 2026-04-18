import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export function SiteHeader() {
  return (
    <header className="bg-background">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="group shrink-0">
          <span className="text-lg font-semibold tracking-tight group-hover:opacity-80 transition-opacity">
            engpass<span className="text-primary">.radar</span>
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
<Link href="/methodik" className="hover:text-foreground transition-colors">Methodik</Link>
          <Link href="/api-docs" className="hover:text-foreground transition-colors">API</Link>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-2">
          <div className="rounded-md border border-border/60 bg-muted/40">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}

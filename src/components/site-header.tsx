import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { Coffee } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="bg-background">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="group">
          <span className="text-lg font-semibold tracking-tight group-hover:opacity-80 transition-opacity">
            engpass<span className="text-primary">.radar</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <a
            href="https://buymeacoffee.com/brainbytes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Coffee className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Unterstützen</span>
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export function SiteHeader() {
  return (
    <header className="bg-background">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="group">
          <span className="text-lg font-semibold tracking-tight group-hover:opacity-80 transition-opacity">
            engpass<span className="text-primary">.radar</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'

const NAV_LINKS = [
  { href: '/', label: 'Home', num: '01' },
  { href: '/methodik', label: 'Methodik', num: '02' },
  { href: '/api-docs', label: 'API', num: '03' },
  { href: '/#faq', label: 'FAQ', num: '04', isFaq: true },
]

export function SiteHeader() {
  const pathname = usePathname()
  void pathname // used for FAQ scroll detection only
  const [open, setOpen] = useState(false)

  function closeMenu() {
    setOpen(false)
    document.body.style.overflow = ''
  }

  function openMenu() {
    setOpen(true)
    document.body.style.overflow = 'hidden'
  }

  // Cleanup body overflow on unmount
  useEffect(() => () => { document.body.style.overflow = '' }, [])

  function handleFaq(e: React.MouseEvent<HTMLAnchorElement>) {
    closeMenu()
    if (pathname === '/') {
      e.preventDefault()
      setTimeout(() => {
        document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })
      }, 360)
    }
  }

  return (
    <>
      <header className="bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="group shrink-0">
            <span className="text-lg font-semibold tracking-tight group-hover:opacity-70 transition-opacity">
              engpass<span className="text-primary">.radar</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            {NAV_LINKS.map(link =>
              link.isFaq ? (
                <a key={link.href} href={link.href} onClick={handleFaq}
                  className="hover:text-foreground transition-colors">
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href}
                  className="hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            <div className="rounded-md border border-border/60 bg-muted/40">
              <ThemeToggle />
            </div>

            {/* Burger — mobile only */}
            <button
              className="sm:hidden relative z-50 flex flex-col justify-center items-center h-9 w-9 gap-[5px] group"
              onClick={() => open ? closeMenu() : openMenu()}
              aria-label={open ? 'Menü schliessen' : 'Menü öffnen'}
            >
              <span className={`block h-px w-5 bg-foreground origin-center transition-all duration-300 ${open ? 'translate-y-[6px] rotate-45' : ''}`} />
              <span className={`block h-px bg-foreground origin-center transition-all duration-300 ${open ? 'w-0 opacity-0' : 'w-4'}`} />
              <span className={`block h-px w-5 bg-foreground origin-center transition-all duration-300 ${open ? '-translate-y-[6px] -rotate-45' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay — rendered even when closed so transitions play */}
      <div
        className="fixed inset-0 z-40 sm:hidden"
        style={{
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 350ms cubic-bezier(0.16,1,0.3,1)',
          opacity: open ? 1 : 0,
        }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-background/97 backdrop-blur-xl" onClick={() => closeMenu()} />

        {/* Content */}
        <div className="relative h-full flex flex-col px-8 pt-24 pb-10">

          {/* Nav items */}
          <nav className="flex-1 flex flex-col justify-center gap-0">
            {NAV_LINKS.map((link, i) => (
              <div
                key={link.href}
                className="border-b border-border/20 overflow-hidden"
                style={{
                  transition: `transform 420ms cubic-bezier(0.16,1,0.3,1) ${i * 60}ms, opacity 420ms ease ${i * 60}ms`,
                  transform: open ? 'translateY(0)' : 'translateY(32px)',
                  opacity: open ? 1 : 0,
                }}
              >
                {link.isFaq ? (
                  <a
                    href={link.href}
                    onClick={handleFaq}
                    className="group flex items-baseline justify-between py-5"
                  >
                    <span className="text-4xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
                      {link.label}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground/40 group-hover:text-primary/50 transition-colors">
                      {link.num}
                    </span>
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    onClick={() => closeMenu()}
                    className="group flex items-baseline justify-between py-5"
                  >
                    <span className="text-4xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
                      {link.label}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground/40 group-hover:text-primary/50 transition-colors">
                      {link.num}
                    </span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div
            className="flex items-center justify-between text-xs text-muted-foreground/50"
            style={{
              transition: `opacity 420ms ease ${NAV_LINKS.length * 60 + 80}ms`,
              opacity: open ? 1 : 0,
            }}
          >
            <span className="font-mono">engpass.radar</span>
            <span>Schweizer Medikamenten-Engpässe</span>
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Heart, X } from 'lucide-react'
import { Link, usePathname } from '@/i18n/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { DonationWidget } from '@/components/donation-widget'
import { LanguageSwitcher } from '@/components/language-switcher'

type NavLink = {
  href: '/' | '/methodik' | '/api'
  labelKey: 'navHome' | 'navMethodik' | 'navApi'
  num: string
}

const NAV_LINKS: NavLink[] = [
  { href: '/', labelKey: 'navHome', num: '01' },
  // FAQ is special: it's a hash on the home page, handled separately
  { href: '/methodik', labelKey: 'navMethodik', num: '03' },
  { href: '/api', labelKey: 'navApi', num: '04' },
]

export function SiteHeader() {
  const t = useTranslations('Header')
  const pathname = usePathname()
  void pathname // used for FAQ scroll detection only
  const [open, setOpen] = useState(false)
  const [donateOpen, setDonateOpen] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#donate'
  )

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === '#donate') setDonateOpen(true)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (donateOpen) {
      window.location.hash = 'donate'
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDonateOpen(false) }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    } else {
      if (window.location.hash === '#donate') {
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }
  }, [donateOpen])

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
      <header className="bg-background sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="group shrink-0">
            <span className="text-lg font-semibold tracking-tight group-hover:opacity-70 transition-opacity">
              engpass<span className="text-primary">.radar</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              {t('navHome')}
            </Link>
            <Link href={{ pathname: '/', hash: 'faq' }} onClick={handleFaq} className="hover:text-foreground transition-colors">
              {t('navFaq')}
            </Link>
            <Link href="/methodik" className="hover:text-foreground transition-colors">
              {t('navMethodik')}
            </Link>
            <Link href="/api" className="hover:text-foreground transition-colors">
              {t('navApi')}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDonateOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 rounded-md border border-border/60 bg-muted/40 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={t('donateAria')}
            >
              <Heart className="h-3.5 w-3.5 text-status-active" />
              <span className="hidden sm:inline">{t('donateButton')}</span>
            </button>
            <LanguageSwitcher />
            <div className="h-8 rounded-md border border-border/60 bg-muted/40">
              <ThemeToggle />
            </div>

            {/* Burger — mobile only, 44px touch target */}
            <button
              className="sm:hidden relative z-50 flex flex-col justify-center items-center h-11 w-11 gap-1.5 group"
              onClick={() => open ? closeMenu() : openMenu()}
              aria-label={open ? t('menuClose') : t('menuOpen')}
            >
              <span className={`block h-px w-5 bg-foreground origin-center transition-all duration-200 ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
              <span className={`block h-px bg-foreground origin-center transition-all duration-200 ${open ? 'w-0 opacity-0' : 'w-4'}`} />
              <span className={`block h-px w-5 bg-foreground origin-center transition-all duration-200 ${open ? '-translate-y-1.5 -rotate-45' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Donation popup */}
      {donateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setDonateOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border bg-card shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-status-active" />
                <h2 className="font-semibold text-sm">{t('donateTitle')}</h2>
              </div>
              <button onClick={() => setDonateOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label={t('donateAria')}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('donateBody')}
            </p>
            <DonationWidget />
          </div>
        </div>
      )}

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
        <div className="absolute inset-0 bg-background" onClick={() => closeMenu()} />

        {/* Content */}
        <div className="relative h-full flex flex-col px-8 pt-24 pb-10">

          {/* Nav items */}
          <nav className="flex-1 flex flex-col justify-center gap-0">
            {[
              { kind: 'link' as const, href: '/' as const, label: t('navHome'), num: '01' },
              { kind: 'faq' as const, href: '/#faq', label: t('navFaq'), num: '02' },
              { kind: 'link' as const, href: '/methodik' as const, label: t('navMethodik'), num: '03' },
              { kind: 'link' as const, href: '/api' as const, label: t('navApi'), num: '04' },
            ].map((link, i) => (
              <div
                key={`${link.href}-${link.label}`}
                className="border-b border-border/20 overflow-hidden"
                style={{
                  transition: `transform 420ms cubic-bezier(0.16,1,0.3,1) ${i * 60}ms, opacity 420ms ease ${i * 60}ms`,
                  transform: open ? 'translateY(0)' : 'translateY(32px)',
                  opacity: open ? 1 : 0,
                }}
              >
                {link.kind === 'faq' ? (
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
            <span>{t('mobileTagline')}</span>
          </div>
        </div>
      </div>
    </>
  )
}

import { readFileSync } from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung — engpass.radar',
  robots: { index: false, follow: false },
}

export default function DatenschutzPage() {
  const html = readFileSync(
    path.join(process.cwd(), 'src/app/datenschutz/vorlage.html'),
    'utf-8',
  )

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </Link>

        <article
          className="prose prose-sm dark:prose-invert max-w-none
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:mb-4
            [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3
            [&_ul]:text-sm [&_ul]:text-muted-foreground [&_ul]:mb-3
            [&_li]:mb-1
            [&_a]:underline [&_a]:hover:text-foreground
            [&_strong]:text-foreground [&_strong]:font-semibold
            [&_.seal]:mt-8 [&_.seal]:pt-4 [&_.seal]:border-t [&_.seal]:border-border [&_.seal]:text-xs [&_.seal]:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </main>
  )
}

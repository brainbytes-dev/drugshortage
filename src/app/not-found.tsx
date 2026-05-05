import { redirect } from 'next/navigation'

// Root-level not-found: catches requests outside any [locale] segment.
// We send the user to the German home (default locale) rather than render
// an un-localized 404 page. The localized 404 lives at app/[locale]/not-found.tsx.
export default function RootNotFound(): never {
  redirect('/')
}

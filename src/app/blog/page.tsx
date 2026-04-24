import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Berichte & Analysen | engpass.radar",
  description:
    "Datenbasierte Berichte zu Medikamenten-Lieferengpässen in der Schweiz — für Fachpersonen in Apotheken, Spitälern und Kliniken.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-14 sm:py-20">
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Berichte &amp; Analysen
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              Analysen &amp; Berichte
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Datenbasierte Einblicke in die Lage bei Medikamenten-Lieferengpässen
              in der Schweiz — für Fachpersonen in Apotheken, Spitälern und Kliniken.
            </p>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card p-12 text-center max-w-md mx-auto">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Bald verfügbar</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-10 py-8 hover:bg-muted/20 -mx-4 px-4 rounded-lg transition-colors duration-150"
              >
                {/* Date column */}
                <div className="shrink-0 sm:w-32 sm:pt-0.5">
                  {post.date && (
                    <time
                      dateTime={post.date}
                      className="text-xs font-mono text-muted-foreground/60 tabular-nums"
                    >
                      {new Date(post.date).toLocaleDateString("de-CH", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {post.category && (
                      <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 font-medium text-foreground/70 text-[11px] uppercase tracking-wide">
                        {post.category}
                      </span>
                    )}
                    {post.readingTime && <span>{post.readingTime} Lesezeit</span>}
                  </div>

                  <h2 className="text-base sm:text-lg font-semibold leading-snug tracking-tight group-hover:text-primary transition-colors duration-200">
                    {post.title}
                  </h2>

                  {post.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {post.description}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex items-center self-center shrink-0">
                  <svg
                    className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

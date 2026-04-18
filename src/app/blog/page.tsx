import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shortage Briefings | engpass.radar",
  description:
    "Monatliche Analysen und Hintergrundberichte zu Medikamenten-Lieferengpässen in der Schweiz — datenbasiert, für Fachpersonen.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Shortage Briefings
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Analysen & Berichte
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            Monatliche Einblicke in die Lage bei Medikamenten-Lieferengpässen
            in der Schweiz — datenbasiert, für Fachpersonen.
          </p>
        </div>

        {/* Post list */}
        {posts.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">Bald verfügbar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block rounded-xl border border-border/60 bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_30px_-8px_oklch(0.52_0.09_200/0.15)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    {/* Category + date row */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {post.category && (
                        <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 font-medium text-foreground/70">
                          {post.category}
                        </span>
                      )}
                      <time dateTime={post.date}>
                        {post.date
                          ? new Date(post.date).toLocaleDateString("de-CH", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : ""}
                      </time>
                      {post.readingTime && (
                        <span>{post.readingTime} Lesezeit</span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-semibold leading-snug tracking-tight group-hover:text-primary transition-colors duration-200">
                      {post.title}
                    </h2>

                    {/* Description */}
                    {post.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {post.description}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <svg
                    className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = getPostBySlug(slug);
    return {
      title: `${post.title} | engpass.radar`,
      description: post.description,
    };
  } catch {
    return { title: "Nicht gefunden | engpass.radar" };
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  // Render content as preformatted paragraphs (MDX files will be
  // compiled via @next/mdx when imported directly; this fallback
  // handles the plain-text content extracted by gray-matter).
  const paragraphs = post.content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Alle Beiträge
        </Link>

        {/* Post header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {post.category && (
              <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 font-medium text-foreground/70">
                {post.category}
              </span>
            )}
            {post.date && (
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("de-CH", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            )}
            {post.readingTime && <span>{post.readingTime} Lesezeit</span>}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
            {post.title}
          </h1>

          {post.description && (
            <p className="text-base text-muted-foreground leading-relaxed">
              {post.description}
            </p>
          )}
        </header>

        {/* Divider */}
        <hr className="border-border/40" />

        {/* Content */}
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          {paragraphs.map((para, i) => {
            if (para.startsWith("## ")) {
              return (
                <h2 key={i} className="text-xl font-bold mt-8 mb-3 tracking-tight">
                  {para.replace(/^## /, "")}
                </h2>
              );
            }
            if (para.startsWith("### ")) {
              return (
                <h3 key={i} className="text-lg font-semibold mt-6 mb-2 tracking-tight">
                  {para.replace(/^### /, "")}
                </h3>
              );
            }
            if (para.startsWith("# ")) {
              return (
                <h1 key={i} className="text-2xl font-bold mt-8 mb-4 tracking-tight">
                  {para.replace(/^# /, "")}
                </h1>
              );
            }
            return (
              <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-4">
                {para}
              </p>
            );
          })}
        </article>

        {/* Footer back link */}
        <div className="pt-4 border-t border-border/40">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    </main>
  );
}

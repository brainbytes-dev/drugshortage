import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

const SITE_URL = "https://engpassradar.ch";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = getPostBySlug(slug);
    const canonicalUrl =
      post.canonical ?? `${SITE_URL}/blog/${slug}`;
    const ogImageUrl =
      post.ogImage?.startsWith("http") ? post.ogImage : undefined;

    return {
      title: `${post.title} | engpassradar.ch`,
      description: post.description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        type: "article",
        title: post.title,
        description: post.description,
        url: canonicalUrl,
        siteName: "engpassradar.ch",
        publishedTime: post.date,
        modifiedTime: post.updatedAt ?? post.date,
        authors: post.author ? [post.author] : undefined,
        ...(ogImageUrl && {
          images: [{ url: ogImageUrl, width: 1200, height: 630, alt: post.coverImageAlt ?? post.title }],
        }),
      },
    };
  } catch {
    return { title: "Nicht gefunden | engpassradar.ch" };
  }
}

function buildJsonLd(post: ReturnType<typeof getPostBySlug>, slug: string): string {
  const postUrl = post.canonical ?? `${SITE_URL}/blog/${slug}`;
  const authorSlug = (post.author ?? "henrik").toLowerCase().replace(/\s+/g, "-");
  const imageId = `${postUrl}#primaryimage`;

  const faqMatches = [...post.content.matchAll(/^### (.+)\n+([^#]+)/gm)];
  const faqEntities = faqMatches
    .filter(([, q]) => q.trim().endsWith("?"))
    .map(([, question, answer]) => ({
      "@type": "Question",
      name: question.trim(),
      acceptedAnswer: { "@type": "Answer", text: answer.trim().replace(/\n+/g, " ") },
    }));

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${postUrl}#article`,
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.updatedAt ?? post.date,
        inLanguage: "de-CH",
        articleSection: post.category,
        ...(post.keywords ? { keywords: post.keywords.join(", ") } : {}),
        author: { "@id": `${SITE_URL}/author/${authorSlug}#person` },
        publisher: { "@id": `${SITE_URL}#organization` },
        image: { "@id": imageId },
        mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/author/${authorSlug}#person`,
        name: post.author ?? "Henrik",
        jobTitle: "Gründer & Analyst",
        url: `${SITE_URL}/author/${authorSlug}`,
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: "engpassradar.ch",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo.png`,
          width: 600,
          height: 60,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${postUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: post.category || "Blog",
            item: `${SITE_URL}/blog`,
          },
          { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
        ],
      },
      {
        "@type": "ImageObject",
        "@id": imageId,
        url: post.coverImage?.startsWith("http") ? post.coverImage : `${SITE_URL}/og-default.png`,
        width: 1200,
        height: 630,
        caption: post.coverImageAlt ?? post.title,
      },
      ...(faqEntities.length >= 2
        ? [{ "@type": "FAQPage", "@id": `${postUrl}#faq`, mainEntity: faqEntities }]
        : []),
    ],
  };

  return JSON.stringify(schema);
}

/** Strip MDX-specific JSX blocks and HTML comments that react-markdown can't handle */
function sanitizeForMarkdown(raw: string): string {
  return raw
    // Remove HTML comments (<!-- ... -->)
    .replace(/<!--[\s\S]*?-->/g, "")
    // Remove JSX-style tags with curlybrace props (e.g. <Component {{...}}>...</Component>)
    // but preserve plain HTML like <figure>, <svg>, <iframe>
    .replace(/<\w+[^>]*\{\{[\s\S]*?\}\}[^>]*>[\s\S]*?<\/\w+>/g, "")
    // Remove [INTERNAL-LINK: ...] placeholders (render as nothing)
    .replace(/\[INTERNAL-LINK:[^\]]+\]/g, "")
    // Clean up excess blank lines left by removals
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  const jsonLd = buildJsonLd(post, slug);
  const cleanContent = sanitizeForMarkdown(post.content);
  const hasCoverImage = post.coverImage && !post.coverImage.includes("[BILD");

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      {/* Article hero header */}
      <section className="border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
          {/* Breadcrumb */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform duration-150" />
            Berichte &amp; Analysen
          </Link>

          <div className="space-y-5">
            {/* Eyebrow row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {post.category && (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {post.category}
                  </span>
                )}
              </div>
              <span className="text-muted-foreground/40 text-xs">—</span>
              {post.date && (
                <time dateTime={post.date} className="text-xs text-muted-foreground">
                  {new Date(post.date).toLocaleDateString("de-CH", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              )}
              {post.readingTime && (
                <span className="text-xs text-muted-foreground">{post.readingTime} Lesezeit</span>
              )}
              {post.dataAsOf && (
                <span className="text-xs text-muted-foreground/60">Datenstand: {post.dataAsOf}</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-snug">
              {post.title}
            </h1>

            {post.description && (
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {post.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Cover image — only if present */}
      {hasCoverImage && (
        <div className="w-full bg-muted border-b border-border/40">
          <div className="max-w-7xl mx-auto">
            <Image
              src={post.coverImage!}
              alt={post.coverImageAlt ?? post.title}
              width={1200}
              height={630}
              className="w-full object-cover max-h-[420px]"
              priority
            />
          </div>
        </div>
      )}

      {/* Article content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div>
          <article className="prose prose-neutral dark:prose-invert max-w-none blog-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                a: ({ href, children, ...props }) => {
                  const isExternal = href?.startsWith("http");
                  return (
                    <a
                      href={href}
                      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {cleanContent}
            </ReactMarkdown>
          </article>

          {/* Author footer */}
          {post.author && (
            <div className="mt-12 pt-6 border-t border-border/40 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                {post.author[0].toUpperCase()}
              </div>
              <div>
                <span className="font-medium text-foreground">{post.author}</span>
                {post.date && (
                  <span> · {new Date(post.date).toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" })}</span>
                )}
              </div>
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-150" />
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

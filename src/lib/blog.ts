import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedAt?: string;
  category: string;
  readingTime: string;
  author?: string;
  canonical?: string;
  coverImage?: string;
  coverImageAlt?: string;
  ogImage?: string;
  dataAsOf?: string;
  keywords?: string[];
}

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

function ensureBlogDir(): boolean {
  return fs.existsSync(BLOG_DIR);
}

export function getAllPosts(): BlogPost[] {
  if (!ensureBlogDir()) return [];

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => (f.endsWith(".mdx") || f.endsWith(".md")) && !f.startsWith("_"));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.(mdx|md)$/, "");
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8");
    const { data } = matter(raw);

    return {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      date: data.date ?? "",
      updatedAt: data.updatedAt,
      category: data.category ?? "",
      readingTime: data.readingTime ?? "",
      author: data.author,
      canonical: data.canonical,
      coverImage: data.coverImage,
      coverImageAlt: data.coverImageAlt,
      ogImage: data.ogImage,
      dataAsOf: data.dataAsOf,
      keywords: data.keywords,
    } satisfies BlogPost;
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost & { content: string } {
  const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
  const mdPath = path.join(BLOG_DIR, `${slug}.md`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : mdPath;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: data.date ?? "",
    updatedAt: data.updatedAt,
    category: data.category ?? "",
    readingTime: data.readingTime ?? "",
    author: data.author,
    canonical: data.canonical,
    coverImage: data.coverImage,
    coverImageAlt: data.coverImageAlt,
    ogImage: data.ogImage,
    dataAsOf: data.dataAsOf,
    keywords: data.keywords,
    content,
  };
}

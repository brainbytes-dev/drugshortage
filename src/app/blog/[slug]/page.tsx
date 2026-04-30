import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage(_props: PageProps) {
  notFound();
}

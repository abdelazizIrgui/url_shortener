import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import InfoPageShell from "../components/InfoPageShell.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useDocumentMeta, SITE_URL } from "../utils/useDocumentMeta.js";
import { ENDPOINTS } from "../config.js";
import { BRAND_NAME } from "../i18n.js";
import { renderMarkdown } from "../utils/markdown.jsx";

// Rough reading-time estimate (words / 200wpm) — a small UX/SEO nicety
// readers and search snippets both like.
function readingTime(text) {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// Injects Article/BlogPosting structured data (JSON-LD) so search engines
// can show rich results (author, published date, image) for the post.
function ArticleJsonLd({ post, slug }) {
  useEffect(() => {
    if (!post) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      image: post.coverImage ? [post.coverImage] : undefined,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt || post.publishedAt,
      mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
      author: { "@type": "Organization", name: BRAND_NAME },
      publisher: { "@type": "Organization", name: BRAND_NAME },
      keywords: post.tags?.join(", "),
    });
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, [post, slug]);
  return null;
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const { t } = useLang();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(ENDPOINTS.post(slug))
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error();
        setPost(data.post);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useDocumentMeta({
    title: post ? `${post.title} — ${BRAND_NAME}` : "Blog",
    description: post?.metaDescription || post?.excerpt,
    path: `/blog/${slug}`,
  });

  if (loading) {
    return (
      <InfoPageShell>
        <div className="dash-empty"><div className="spinner" /></div>
      </InfoPageShell>
    );
  }

  if (notFound || !post) {
    return (
      <InfoPageShell>
        <h1>{t.notFoundTitle}</h1>
        <p>{t.notFoundDesc}</p>
        <Link to="/blog">{t.blogBackToBlog}</Link>
      </InfoPageShell>
    );
  }

  return (
    <InfoPageShell>
      <ArticleJsonLd post={post} slug={slug} />
      <Link to="/blog" style={{ fontSize: 13.5 }}>{t.blogBackToBlog}</Link>

      {/* Exactly one <h1> per page — the post title. Everything inside the
          body (### Heading etc.) renders as h2+ so heading levels never skip
          or duplicate, which matters both for SEO and for screen readers. */}
      <h1 style={{ marginTop: 16, textTransform: "none" }}>{post.title}</h1>
      <p className="info-page-updated">
        {post.publishedAt && `${t.blogPublishedOn} ${new Date(post.publishedAt).toLocaleDateString()}`}
        {post.tags?.length > 0 && ` · ${post.tags.join(", ")}`}
        {` · ${readingTime(post.content)} min read`}
      </p>

      <div className="blog-post-card">
        {post.coverImage && (
          <div className="blog-post-cover">
            <img src={post.coverImage} alt={post.title} />
          </div>
        )}

        {/* Post content is written by an admin in the dashboard as Markdown
            and parsed into real React elements (h2-h6, p, ul/ol, blockquote,
            code, img) by renderMarkdown — never via dangerouslySetInnerHTML,
            so there's no stored-XSS surface even though it's admin-authored. */}
        <div className="blog-post-content">
          {renderMarkdown(post.content)}
        </div>
      </div>
    </InfoPageShell>
  );
}

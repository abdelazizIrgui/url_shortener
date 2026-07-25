import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import TopNav from "../components/TopNav.jsx";
import Footer from "../components/Footer.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useCookieConsent } from "../context/CookieConsentContext.jsx";
import { useDocumentMeta } from "../utils/useDocumentMeta.js";
import { ENDPOINTS } from "../config.js";
import { apiFetch } from "../api.js";
import { AlertCircleIcon } from "../components/Shared.jsx";
import { renderMarkdown } from "../utils/markdown.jsx";

export default function AdminPostEditorPage() {
  const { id } = useParams(); // "new" or a Mongo _id
  const isNew = id === "new";
  const navigate = useNavigate();
  const { t } = useLang();
  const { openPreferences } = useCookieConsent();

  useDocumentMeta({ title: `${isNew ? t.adminNewPost : t.adminEditPost} — Admin`, noindex: true });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [status, setStatus] = useState("draft");

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isNew) return;
    apiFetch(ENDPOINTS.adminPost(id))
      .then(({ post }) => {
        setTitle(post.title);
        setSlug(post.slug);
        setExcerpt(post.excerpt || "");
        setContent(post.content || "");
        setTags((post.tags || []).join(", "));
        setCoverImage(post.coverImage || "");
        setMetaDescription(post.metaDescription || "");
        setStatus(post.status);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setError("Image is too large (max ~1.5 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCoverImage(reader.result);
    reader.readAsDataURL(file);
  };

  const save = async (publishOverride) => {
    if (!title.trim() || !content.trim()) {
      setError(t.adminTitleLabel + " / " + t.adminContentLabel + " required");
      return;
    }
    setSaving(true);
    setError("");
    const body = {
      title,
      slug: slug || undefined,
      excerpt,
      content,
      coverImage,
      metaDescription,
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      status: publishOverride || status,
    };
    try {
      if (isNew) {
        const { post } = await apiFetch(ENDPOINTS.adminPostsCreate, {
          method: "POST",
          body: JSON.stringify(body),
        });
        navigate(`/admin/posts/${post.id}`, { replace: true });
      } else {
        await apiFetch(ENDPOINTS.adminPost(id), {
          method: "PUT",
          body: JSON.stringify(body),
        });
        setStatus(publishOverride || status);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="grid-overlay" />
        <TopNav />
        <main className="main dash-main"><div className="dash-empty"><div className="spinner" /></div></main>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="grid-overlay" />
      <TopNav />

      <main className="main dash-main">
        <Link to="/admin/posts" style={{ fontSize: 13.5 }}>{t.adminBackToList}</Link>

        <div className="dash-head" style={{ marginTop: 12 }}>
          <div className="dash-head-left">
            <h1 className="dash-h1">{isNew ? t.adminNewPost : t.adminEditPost}</h1>
          </div>
        </div>

        <form className="create-card" onSubmit={(e) => e.preventDefault()}>
          <label className="field">
            <span>{t.adminTitleLabel}</span>
            <input className="plain-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>

          <label className="field">
            <span>{t.adminSlugLabel}</span>
            <input
              className="plain-input" dir="ltr"
              value={slug}
              placeholder={isNew ? "auto-generated from title if left blank" : ""}
              onChange={(e) => setSlug(e.target.value)}
            />
          </label>

          <label className="field">
            <span>{t.adminExcerptLabel}</span>
            <textarea
              className="plain-input" rows={2} value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </label>

          <label className="field">
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <span>{t.adminContentLabel}</span>
              <button
                type="button"
                className="link-btn"
                style={{ fontSize: 12.5 }}
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview ? "← Back to editor" : "Preview →"}
              </button>
            </div>

            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "2px 0 8px", lineHeight: 1.6 }}>
              Write in Markdown — the page title is already your one H1, so start
              headings at <code className="inline-code">##</code>: <code className="inline-code">## Heading 2</code>,{" "}
              <code className="inline-code">### Heading 3</code>, down to <code className="inline-code">######</code>.
              Leave a blank line between paragraphs. Also supports{" "}
              <code className="inline-code">**bold**</code>, <code className="inline-code">*italic*</code>,{" "}
              <code className="inline-code">- list item</code>, <code className="inline-code">1. list item</code>,{" "}
              <code className="inline-code">&gt; quote</code>, <code className="inline-code">[link](https://...)</code>,{" "}
              <code className="inline-code">![alt](image-url)</code>, and fenced <code className="inline-code">```code```</code> blocks.
              Use one clear heading per section, keep paragraphs short (2–4 sentences), and
              work your target keyword naturally into the first paragraph and at least one heading — it helps
              both readers scanning the page and search engines understand what it's about.
            </p>

            {showPreview ? (
              <div className="blog-post-card" style={{ marginTop: 0 }}>
                <div className="blog-post-content" style={{ padding: 20 }}>
                  {content.trim() ? renderMarkdown(content) : (
                    <p style={{ color: "var(--text-secondary)" }}>Nothing to preview yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <textarea
                className="plain-input" rows={14} value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ resize: "vertical", fontFamily: "var(--font-mono)", fontSize: 13 }}
                required
              />
            )}
          </label>

          <div className="field-row">
            <label className="field">
              <span>{t.adminTagsLabel}</span>
              <input className="plain-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="qr-codes, marketing" />
            </label>

            <label className="field">
              <span>{t.adminMetaDescLabel}</span>
              <input
                className="plain-input" maxLength={160}
                value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>{t.adminCoverImageLabel}</span>
            <input type="file" accept="image/*" onChange={handleCoverUpload} />
            {coverImage && (
              <img src={coverImage} alt="" style={{ marginTop: 8, maxWidth: 240, borderRadius: "var(--radius-md)" }} />
            )}
          </label>

          {error && (
            <div className="error-box">
              <AlertCircleIcon size={14} />
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="google-btn" disabled={saving} onClick={() => save("draft")}>
              {saving ? "…" : t.adminSaveDraft}
            </button>
            <button type="button" className="submit-btn" disabled={saving} onClick={() => save("published")}>
              {saving ? "…" : (status === "published" && !isNew ? t.adminUpdate : t.adminPublish)}
            </button>
          </div>
        </form>
      </main>

      <Footer onOpenCookiePrefs={openPreferences} />
    </div>
  );
}

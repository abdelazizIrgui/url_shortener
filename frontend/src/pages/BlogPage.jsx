import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InfoPageShell from "../components/InfoPageShell.jsx";
import Pagination from "../components/Pagination.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useDocumentMeta } from "../utils/useDocumentMeta.js";
import { ENDPOINTS } from "../config.js";
import { BRAND_NAME } from "../i18n.js";

// Cycle of accent pairs already defined in the app's palette (index.css),
// used to color the cover-image placeholder + date badge for posts that
// don't have a coverImage, and to vary the date badge color for posts that do.
const ACCENT_PAIRS = [
  ["var(--teal)", "var(--blue)"],
  ["var(--warm)", "var(--pink)"],
  ["var(--gold)", "var(--warm)"],
  ["var(--blue)", "var(--pink)"],
  ["var(--pink)", "var(--gold)"],
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function DateBadge({ date, color }) {
  if (!date) return null;
  const d = new Date(date);
  return (
    <div
      style={{
        position: "absolute", top: 14, left: 14,
        background: color, color: "#fff",
        borderRadius: "var(--radius-sm)", padding: "6px 12px",
        textAlign: "center", lineHeight: 1.1,
        boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>
        {d.getDate()}
      </div>
      <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.4, opacity: 0.9 }}>
        {MONTHS[d.getMonth()]}
      </div>
    </div>
  );
}

function BlogCard({ post, index }) {
  const [hovered, setHovered] = useState(false);
  const [c1, c2] = ACCENT_PAIRS[index % ACCENT_PAIRS.length];

  return (
    <Link
      to={`/blog/${post.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", textDecoration: "none",
        background: "var(--surface-2)", border: `1px solid ${hovered ? "var(--border-light)" : "var(--border)"}`,
        borderRadius: "var(--radius-lg)", overflow: "hidden",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 16px 32px rgba(0,0,0,0.28)" : "0 4px 12px rgba(0,0,0,0.12)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      <div style={{ position: "relative", height: 160, flexShrink: 0 }}>
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%", height: "100%",
              background: `linear-gradient(135deg, ${c1}, ${c2})`,
            }}
          />
        )}
        <DateBadge date={post.publishedAt} color={c1} />
      </div>

      <div style={{ padding: "18px 20px 22px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <h2 style={{
          fontFamily: "var(--font-display)", fontSize: 17, margin: 0,
          color: "var(--text)", textTransform: "none", lineHeight: 1.35,
        }}>
          {post.title}
        </h2>
        {post.excerpt && (
          <p style={{
            color: "var(--text-secondary)", fontSize: 13.5, margin: 0,
            lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {post.excerpt}
          </p>
        )}
        {post.tags?.length > 0 && (
          <div style={{ marginTop: "auto", paddingTop: 4, fontSize: 12, color: "var(--muted)" }}>
            {post.tags.slice(0, 3).join(" · ")}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const { t } = useLang();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useDocumentMeta({
    title: `Blog — ${BRAND_NAME}`,
    description: `Guides and tips on link shortening, QR codes, and campaign tracking from ${BRAND_NAME}.`,
    path: "/blog",
  });

  // Debounce search-as-you-type, and reset to page 1 once it lands.
  useEffect(() => {
    const id = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), sort, limit: "9" });
    if (search.trim()) params.set("search", search.trim());
    fetch(ENDPOINTS.posts(`?${params.toString()}`))
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      })
      .catch(() => { setPosts([]); setTotalPages(1); setTotal(0); })
      .finally(() => setLoading(false));
  }, [search, sort, page]);

  const handleSortChange = (value) => { setSort(value); setPage(1); };

  return (
    <InfoPageShell wide>
      <h1 className="blog-hero-title">
        Guides <span className="blog-hero-highlight">&amp;</span> Tutorials
      </h1>
      <p className="info-page-updated blog-hero-subtitle">Tips, walkthroughs, and product updates to help you get more out of every link</p>

      <div className="list-toolbar" style={{ marginTop: 24 }}>
        <input
          type="text"
          className="plain-input list-toolbar-search"
          placeholder="Search articles…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className="plain-input list-toolbar-select"
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {loading ? (
        <div className="dash-empty"><div className="spinner" /></div>
      ) : posts.length === 0 ? (
        <p>{search.trim() ? "No articles match your search." : t.blogNoPosts}</p>
      ) : (
        <>
          <div className="blog-grid">
            {posts.map((post, i) => (
              <BlogCard key={post.id} post={post} index={i} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} totalLabel={`${total} article${total === 1 ? "" : "s"}`} />
        </>
      )}
    </InfoPageShell>
  );
}


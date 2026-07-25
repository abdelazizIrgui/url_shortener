// Compact numbered pagination with a sliding window + ellipses, used by every
// list view (links, campaigns, blog, admin lists). Renders nothing when
// there's only one page, so pages can always mount it unconditionally.
export default function Pagination({ page, totalPages, onChange, totalLabel }) {
  if (!totalPages || totalPages <= 1) return null;

  const windowSize = 1;
  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= windowSize) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      {totalLabel && <span className="pagination-info">{totalLabel}</span>}
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`pagination-btn${p === page ? " pagination-btn-active" : ""}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className="pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </nav>
  );
}

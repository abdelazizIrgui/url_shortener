import { useEffect, useState } from "react";
import TopNav from "../components/TopNav.jsx";
import Footer from "../components/Footer.jsx";
import LinkForm from "../components/LinkForm.jsx";
import LinksList from "../components/LinksList.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCookieConsent } from "../context/CookieConsentContext.jsx";
import { ENDPOINTS } from "../config.js";
import { apiFetch } from "../api.js";
import { ActivityIcon, MousePointerIcon, LinkIcon, ZapIcon } from "../components/Shared.jsx";

export default function DashboardPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { openPreferences } = useCookieConsent();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchLinks = () => {
      apiFetch(ENDPOINTS.links)
        .then((data) => { if (active) setLinks(data.links); })
        .catch((err) => { if (active) setError(err.message || t.errorFallback); })
        .finally(() => { if (active) setLoading(false); });
    };

    fetchLinks();

    // Click counts change on the backend whenever someone opens a short link,
    // which can happen in another tab/device — poll periodically so numbers
    // stay fresh without the user needing to hit refresh.
    const intervalId = setInterval(fetchLinks, 15000);

    // Also refetch immediately whenever the user comes back to this tab —
    // covers the common case of clicking your own link in a new tab, then
    // switching back to the dashboard to check the count.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchLinks();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", fetchLinks);

    return () => {
      active = false;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", fetchLinks);
    };
  }, []);

  const handleCreated = (link) => setLinks((prev) => [link, ...prev]);
  const handleUpdated = (link) => setLinks((prev) => prev.map((l) => (l.id === link.id ? link : l)));
  const handleDeleted = (id) => setLinks((prev) => prev.filter((l) => l.id !== id));

  const totalClicks = links.reduce((sum, l) => sum + (l.clicksCount || 0), 0);
  const activeLinks = links.filter((l) => !l.isExpired).length;

  return (
    <div className="page">
      <div className="grid-overlay" />
      <TopNav />

      <main className="main dash-main">
        {/* Header */}
        <div className="dash-head">
          <div className="dash-head-left">
            <h1 className="dash-h1">{t.dashTitle}</h1>
            {user && (
              <p className="dash-welcome">
                <span className="dash-welcome-dot" />
                {user.name}
              </p>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-card-info">
              <div className="stat-card-label">Total Links</div>
              <div className="stat-card-value" style={{ color: "var(--accent-text)" }}>
                {loading ? "—" : links.length}
              </div>
              <div className="stat-card-sub">All time</div>
            </div>
            <div className="stat-card-icon stat-icon-purple">
              <LinkIcon size={18} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-info">
              <div className="stat-card-label">Total Clicks</div>
              <div className="stat-card-value" style={{ color: "var(--teal)" }}>
                {loading ? "—" : totalClicks.toLocaleString()}
              </div>
              <div className="stat-card-sub">Across all links</div>
            </div>
            <div className="stat-card-icon stat-icon-teal">
              <MousePointerIcon size={18} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-info">
              <div className="stat-card-label">Active Links</div>
              <div className="stat-card-value" style={{ color: "var(--gold)" }}>
                {loading ? "—" : activeLinks}
              </div>
              <div className="stat-card-sub">Not expired</div>
            </div>
            <div className="stat-card-icon stat-icon-gold">
              <ZapIcon size={18} />
            </div>
          </div>
        </div>

        {/* Create form */}
        <LinkForm onCreated={handleCreated} />

        {/* Error */}
        {error && (
          <div className="error-box" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {/* Links list */}
        {loading ? (
          <div className="dash-empty">
            <div className="spinner" />
          </div>
        ) : (
          <LinksList links={links} onUpdated={handleUpdated} onDeleted={handleDeleted} />
        )}
      </main>

      <Footer onOpenCookiePrefs={openPreferences} />
    </div>
  );
}

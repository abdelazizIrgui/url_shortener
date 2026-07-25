import { Link, Navigate } from "react-router-dom";
import TopNav from "../components/TopNav.jsx";
import { LinkIcon, BarChartIcon, QrIcon } from "../components/Shared.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function FeatureIcon({ children }) {
  return <div className="feature-icon">{children}</div>;
}

export default function LandingPage() {
  const { t } = useLang();
  const { isAuthed, loading } = useAuth();

  // If already logged in, send straight to dashboard
  if (!loading && isAuthed) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="page">
      <div className="grid-overlay" />
      <TopNav />

      <main className="main">
        <h1 className="hero-title">
          {t.heroLine1}
          <br />
          <span className="accent-text">{t.heroAccent}</span>
        </h1>

        <p className="hero-sub">{t.heroSub}</p>

        <Link to="/login" className="submit-btn cta-btn">
          {t.ctaStart}
        </Link>

        <section className="features">
          <div className="feature-card">
            <FeatureIcon><LinkIcon size={22} /></FeatureIcon>
            <h3>{t.dashCreateTitle}</h3>
            <p>{t.dashSubtitle}</p>
          </div>
          <div className="feature-card">
            <FeatureIcon><BarChartIcon size={22} /></FeatureIcon>
            <h3>{t.statsTitle}</h3>
            <p>{t.statsByCountry} · {t.statsByDevice} · {t.statsByReferrer}</p>
          </div>
          <div className="feature-card">
            <FeatureIcon><QrIcon size={22} /></FeatureIcon>
            <h3>{t.qrTitle}</h3>
            <p>{t.qrDownload}</p>
          </div>
        </section>
      </main>
    </div>
  );
}

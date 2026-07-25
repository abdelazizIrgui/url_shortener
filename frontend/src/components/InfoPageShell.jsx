import TopNav from "./TopNav.jsx";
import Footer from "./Footer.jsx";
import { useCookieConsent } from "../context/CookieConsentContext.jsx";

export default function InfoPageShell({ children, wide = false }) {
  const { openPreferences } = useCookieConsent();
  return (
    <div className="page">
      <div className="grid-overlay" />
      <TopNav />
      <main className={`info-page-main${wide ? " info-page-main-wide" : ""}`}>{children}</main>
      <Footer onOpenCookiePrefs={openPreferences} />
    </div>
  );
}

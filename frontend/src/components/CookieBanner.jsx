import { useLang } from "../context/LangContext.jsx";
import { useCookieConsent } from "../context/CookieConsentContext.jsx";

export default function CookieBanner() {
  const { t } = useLang();
  const { bannerOpen, acceptAll, rejectNonEssential } = useCookieConsent();

  if (!bannerOpen) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label={t.cookieManage}>
      <p>{t.cookieMessage}</p>
      <div className="cookie-banner-actions">
        <button type="button" className="cookie-btn-accept" onClick={acceptAll}>
          {t.cookieAccept}
        </button>
        <button type="button" className="cookie-btn-secondary" onClick={rejectNonEssential}>
          {t.cookieReject}
        </button>
      </div>
    </div>
  );
}

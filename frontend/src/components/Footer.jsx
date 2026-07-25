import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext.jsx";
import { ChainIcon, FolderIcon, MailIcon, ShieldIcon } from "./Shared.jsx";
import { BRAND_NAME } from "../i18n.js";

function SocialIcon({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="footer-social-icon"
    >
      {children}
    </a>
  );
}

export default function Footer({ onOpenCookiePrefs }) {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-col">
          <h4 className="site-footer-title"><FolderIcon size={14} /> {t.footerResourcesTitle}</h4>
          <Link to="/blog" className="site-footer-link">{t.footerBlog}</Link>
          <Link to="/about" className="site-footer-link">{t.footerAboutUs}</Link>
        </div>

        <div className="site-footer-col">
          <h4 className="site-footer-title"><MailIcon size={14} /> {t.footerContactTitle}</h4>
          <Link to="/contact#support" className="site-footer-link">{t.footerContactSupport}</Link>
        </div>

        <div className="site-footer-col">
          <h4 className="site-footer-title"><ShieldIcon size={14} /> {t.footerLegalTitle}</h4>
          <Link to="/terms" className="site-footer-link">{t.footerTerms}</Link>
          <Link to="/privacy" className="site-footer-link">{t.footerPrivacy}</Link>
          <Link to="/cookies" className="site-footer-link">{t.footerCookies}</Link>
          <Link to="/accessibility" className="site-footer-link">{t.footerAccessibility}</Link>
          <button type="button" className="site-footer-link site-footer-link-btn" onClick={onOpenCookiePrefs}>
            {t.footerPrivacyManager}
          </button>
        </div>

        <div className="site-footer-brand">
          <div className="site-footer-social">
            <SocialIcon href="https://facebook.com" label="Facebook">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z"/>
              </svg>
            </SocialIcon>
            <SocialIcon href="https://instagram.com" label="Instagram">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </SocialIcon>
            <SocialIcon href="https://linkedin.com" label="LinkedIn">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z"/>
              </svg>
            </SocialIcon>
            <SocialIcon href="https://x.com" label="X (Twitter)">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
              </svg>
            </SocialIcon>
          </div>

          <Link to="/" className="site-footer-logo">
            <span className="logo-icon-wrap"><ChainIcon size={16} /></span>
            <span>{BRAND_NAME}</span>
          </Link>

          <p className="site-footer-copy">
            © {year} {BRAND_NAME}. {t.footerRights}.
          </p>
        </div>
      </div>
    </footer>
  );
}

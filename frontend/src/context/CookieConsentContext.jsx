import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "linkblick_cookie_consent"; // "accepted" | "rejected"
const CookieConsentContext = createContext(null);

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [bannerOpen, setBannerOpen] = useState(() => !localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    if (consent) localStorage.setItem(STORAGE_KEY, consent);
  }, [consent]);

  const acceptAll = () => { setConsent("accepted"); setBannerOpen(false); };
  const rejectNonEssential = () => { setConsent("rejected"); setBannerOpen(false); };
  const openPreferences = () => setBannerOpen(true);

  return (
    <CookieConsentContext.Provider
      value={{ consent, bannerOpen, acceptAll, rejectNonEssential, openPreferences }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
}

import InfoPageShell from "../components/InfoPageShell.jsx";
import { useDocumentMeta } from "../utils/useDocumentMeta.js";
import { BRAND_NAME } from "../i18n.js";

export default function CookiePolicyPage() {
  useDocumentMeta({
    title: `Cookie Policy — ${BRAND_NAME}`,
    description: `What cookies and local storage ${BRAND_NAME} uses, and why.`,
    path: "/cookies",
  });

  return (
    <InfoPageShell>
      <h1>Cookie Policy</h1>
      <p className="info-page-updated">Last updated: January 2026</p>

      <p>
        {BRAND_NAME} uses a small number of cookies and browser storage entries. We don't use
        third-party advertising cookies.
      </p>

      <h2>Essential</h2>
      <p>Used to keep you signed in (authentication token) and remember your cookie
      preference. The service won't work correctly without these, so they can't be turned off.</p>

      <h2>Preference</h2>
      <p>Remembers your chosen language and, on your bio page, your selected theme. Turning
      these off just means we'll ask again next visit.</p>

      <h2>Analytics on your links (not tracking cookies)</h2>
      <p>When someone clicks one of <em>your</em> short links, we log their approximate
      country, device, and referrer server-side, so you can see stats in your dashboard. This
      isn't stored as a cookie in the visitor's browser — it's a one-time log entry tied to
      that click.</p>

      <h2>Managing your preference</h2>
      <p>You can change your cookie preference at any time using the "Privacy Manager" link in
      the footer of this site.</p>
    </InfoPageShell>
  );
}

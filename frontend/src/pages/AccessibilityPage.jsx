import InfoPageShell from "../components/InfoPageShell.jsx";
import { useDocumentMeta } from "../utils/useDocumentMeta.js";
import { BRAND_NAME } from "../i18n.js";

export default function AccessibilityPage() {
  useDocumentMeta({
    title: `Accessibility Statement — ${BRAND_NAME}`,
    description: `${BRAND_NAME}'s ongoing commitment to accessibility.`,
    path: "/accessibility",
  });

  return (
    <InfoPageShell>
      <h1>Accessibility Statement</h1>
      <p className="info-page-updated">Last updated: January 2026</p>

      <p>
        We want {BRAND_NAME} to be usable by as many people as possible, including people who
        rely on screen readers, keyboard navigation, or other assistive technology.
      </p>

      <h2>What we've done</h2>
      <ul>
        <li>Full right-to-left (RTL) layout support for Arabic</li>
        <li>Color choices checked for reasonable contrast against our dark theme</li>
        <li>Semantic HTML for headings, buttons, and form fields</li>
      </ul>

      <h2>Known limitations</h2>
      <p>
        Accessibility is an ongoing process, not a one-time checklist. Some interactive
        widgets (like charts and QR previews) may not yet be fully screen-reader friendly.
        We're actively working through these.
      </p>

      <h2>Let us know</h2>
      <p>
        If you hit an accessibility barrier anywhere on {BRAND_NAME}, please tell us —
        email <a href="mailto:support@linkblick.com">support@linkblick.com</a> with a
        description of the issue and the page it's on, and we'll prioritize a fix.
      </p>
    </InfoPageShell>
  );
}

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import InfoPageShell from "../components/InfoPageShell.jsx";
import { useDocumentMeta } from "../utils/useDocumentMeta.js";
import { BRAND_NAME } from "../i18n.js";

export default function PrivacyPage() {
  useDocumentMeta({
    title: `Privacy Policy — ${BRAND_NAME}`,
    description: `Learn how ${BRAND_NAME} collects, uses, and protects your personal information.`,
    path: "/privacy",
  });

  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  return (
    <InfoPageShell>
      <h1>Privacy Policy</h1>

      <p className="info-page-updated">
        Last updated: July 23, 2026
      </p>

      <p>
        At <strong>{BRAND_NAME}</strong>, we value your privacy. This Privacy
        Policy explains what information we collect, how we use it, and the
        choices you have regarding your data when using our URL shortening,
        bio page, QR code, and analytics services.
      </p>

      <h2 id="information">Information We Collect</h2>

      <p>We may collect the following information:</p>

      <ul>
        <li>Name and email address when you create an account.</li>
        <li>Profile information you choose to provide.</li>
        <li>Short links, bio pages, QR codes, and related content.</li>
        <li>Click analytics, including country, device type, browser, operating system, and referral source.</li>
        <li>IP address and log information for security and fraud prevention.</li>
      </ul>

      <h2 id="usage">How We Use Your Information</h2>

      <p>Your information helps us:</p>

      <ul>
        <li>Provide and maintain our services.</li>
        <li>Generate link analytics and reports.</li>
        <li>Improve platform performance and security.</li>
        <li>Respond to support requests.</li>
        <li>Detect abuse, spam, phishing, and fraudulent activity.</li>
      </ul>

      <h2 id="cookies">Cookies</h2>

      <p>
        We use cookies and similar technologies to keep you signed in,
        remember your preferences, improve performance, and analyze platform
        usage.
      </p>

      <h2 id="sharing">Information Sharing</h2>

      <p>
        We do not sell your personal information. We may share limited
        information with trusted service providers that help us operate our
        platform, comply with legal obligations, or protect our users and
        services.
      </p>

      <h2 id="security">Data Security</h2>

      <p>
        We use industry-standard security measures to protect your data.
        However, no method of transmission over the Internet or electronic
        storage is completely secure.
      </p>

      <h2 id="retention">Data Retention</h2>

      <p>
        We retain your information only for as long as necessary to provide
        our services, comply with legal obligations, resolve disputes, and
        enforce our agreements.
      </p>

      <h2 id="rights">Your Rights</h2>

      <p>You may have the right to:</p>

      <ul>
        <li>Access your personal information.</li>
        <li>Correct inaccurate information.</li>
        <li>Delete your account and personal data.</li>
        <li>Request a copy of your stored data.</li>
      </ul>

      <h2 id="third-party">Third-Party Services</h2>

      <p>
        Our platform may integrate with trusted third-party services for
        authentication, hosting, analytics, payments, or email delivery.
        These services have their own privacy policies.
      </p>

      <h2 id="children">Children's Privacy</h2>

      <p>
        Our services are not intended for children under the age of 13. We
        do not knowingly collect personal information from children.
      </p>

      <h2 id="changes">Changes to This Policy</h2>

      <p>
        We may update this Privacy Policy from time to time. Any changes will
        be posted on this page with a revised "Last updated" date.
      </p>

      <h2 id="contact">Contact Us</h2>

      <p>
        If you have any questions regarding this Privacy Policy, please visit
        our <a href="/contact">Contact Us</a> page or email us at{" "}
        <a href="mailto:support@linkblick.com">
          support@linkblick.com
        </a>.
      </p>
    </InfoPageShell>
  );
}
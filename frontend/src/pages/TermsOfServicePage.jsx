import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import InfoPageShell from "../components/InfoPageShell.jsx";
import { useDocumentMeta } from "../utils/useDocumentMeta.js";
import { BRAND_NAME } from "../i18n.js";

export default function TermsPage() {
  useDocumentMeta({
    title: `Terms of Service — ${BRAND_NAME}`,
    description: `Read the Terms of Service governing your use of ${BRAND_NAME}.`,
    path: "/terms",
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
      <h1>Terms of Service</h1>

      <p className="info-page-updated">
        Last updated: July 23, 2026
      </p>

      <p>
        Welcome to <strong>{BRAND_NAME}</strong>. By creating an account or
        using our services, you agree to these Terms of Service. If you do not
        agree with any part of these terms, please do not use our platform.
      </p>

      <h2 id="services">Our Services</h2>

      <p>
        {BRAND_NAME} provides online tools including:
      </p>

      <ul>
        <li>URL shortening</li>
        <li>Custom short links</li>
        <li>Bio link pages</li>
        <li>QR code generation</li>
        <li>Link analytics and reporting</li>
      </ul>

      <h2 id="accounts">Accounts</h2>

      <p>
        You are responsible for maintaining the confidentiality of your account
        credentials and for all activity that occurs under your account.
      </p>

      <p>
        You agree to provide accurate information and keep your account details
        up to date.
      </p>

      <h2 id="acceptable-use">Acceptable Use</h2>

      <p>You agree not to use our services to:</p>

      <ul>
        <li>Distribute malware or malicious software.</li>
        <li>Promote phishing, scams, or fraudulent activities.</li>
        <li>Share illegal, harmful, or abusive content.</li>
        <li>Violate copyrights, trademarks, or other intellectual property rights.</li>
        <li>Attempt unauthorized access to our systems.</li>
        <li>Interfere with the security or operation of the platform.</li>
      </ul>

      <h2 id="content">Your Content</h2>

      <p>
        You retain ownership of the links, bio pages, and other content you
        create. However, you grant {BRAND_NAME} permission to store, process,
        and display that content as necessary to provide the service.
      </p>

      <h2 id="termination">Account Suspension</h2>

      <p>
        We reserve the right to suspend or permanently terminate accounts that
        violate these Terms of Service or engage in abusive, illegal, or
        fraudulent activity.
      </p>

      <h2 id="availability">Service Availability</h2>

      <p>
        We strive to keep our services available at all times, but we cannot
        guarantee uninterrupted access. Maintenance, updates, or unforeseen
        issues may temporarily affect availability.
      </p>

      <h2 id="payments">Paid Plans</h2>

      <p>
        If you subscribe to a paid plan, you agree to pay all applicable fees.
        Subscription prices may change in the future with prior notice.
      </p>

      <h2 id="intellectual-property">Intellectual Property</h2>

      <p>
        All software, trademarks, branding, logos, and platform content belong
        to {BRAND_NAME} unless otherwise stated. You may not copy, modify,
        distribute, or resell our services without written permission.
      </p>

      <h2 id="disclaimer">Disclaimer</h2>

      <p>
        Our services are provided "as is" and "as available." We make no
        warranties regarding uninterrupted availability, accuracy, or fitness
        for a particular purpose.
      </p>

      <h2 id="liability">Limitation of Liability</h2>

      <p>
        To the maximum extent permitted by law, {BRAND_NAME} shall not be
        liable for any indirect, incidental, special, or consequential damages
        resulting from your use of our services.
      </p>

      <h2 id="changes">Changes to These Terms</h2>

      <p>
        We may update these Terms of Service at any time. Continued use of the
        platform after changes become effective constitutes acceptance of the
        revised terms.
      </p>

      <h2 id="contact">Contact Us</h2>

      <p>
        If you have any questions about these Terms of Service, please visit
        our <a href="/contact">Contact Us</a> page or email{" "}
        <a href="mailto:support@linkblick.com">
          support@linkblick.com
        </a>.
      </p>
    </InfoPageShell>
  );
}
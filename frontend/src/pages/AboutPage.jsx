import InfoPageShell from "../components/InfoPageShell.jsx";
import { useDocumentMeta } from "../utils/useDocumentMeta.js";
import { BRAND_NAME } from "../i18n.js";

export default function AboutPage() {
  useDocumentMeta({
    title: `About Us — ${BRAND_NAME}`,
    description: `Learn more about ${BRAND_NAME}, a professional platform dedicated to URL shortening.`,
    path: "/about",
  });

  return (
    <InfoPageShell>
      <h1>Welcome to {BRAND_NAME}</h1>

      <p>
        Hello! <strong>{BRAND_NAME}</strong> is a professional platform where we provide
        interesting and valuable content focused on <strong>URL shortening</strong>. We are
        committed to delivering high-quality, reliable, and insightful information. Our goal
        is to turn our passion for URL shortening into a thriving online resource.
      </p>

      <p>
        We will continue to post such valuable and knowledgeable information on our website
        for all of you. Your love and support mean a lot to us.
      </p>

      <p>
        We are dedicated to providing you with the very best insights and knowledge related
        to URL shortening. We hope you find <strong>{BRAND_NAME}</strong> helpful, as we love
        sharing it with you.
      </p>

      <p>
        <strong>Visit us at:</strong>{" "}
        <a href="https://linkblick.com" target="_blank" rel="noopener noreferrer">
          linkblick.com
        </a>
      </p>

      <p>
        <strong>For any inquiries or further information, please feel free to contact us via email at:</strong>{" "}
        <a href="mailto:blogingpersonally@gmail.com">blogingpersonally@gmail.com</a>
      </p>

      <p><strong>Thank you for visiting {BRAND_NAME}!</strong></p>
    </InfoPageShell>
  );
}

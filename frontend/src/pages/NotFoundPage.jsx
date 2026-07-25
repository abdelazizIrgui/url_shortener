import { Link, useSearchParams } from "react-router-dom";
import InfoPageShell from "../components/InfoPageShell.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useDocumentMeta } from "../utils/useDocumentMeta.js";
import { BRAND_NAME } from "../i18n.js";

export default function NotFoundPage() {
  const { t } = useLang();
  const [params] = useSearchParams();
  const isExpired = params.get("reason") === "expired";

  useDocumentMeta({
    title: `${isExpired ? t.expiredTitle : t.notFoundTitle} — ${BRAND_NAME}`,
    noindex: true,
  });

  return (
    <InfoPageShell>
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{isExpired ? "⏳" : "🔍"}</div>
        <h1 style={{ textTransform: "none" }}>{isExpired ? t.expiredTitle : t.notFoundTitle}</h1>
        <p>{isExpired ? t.expiredDesc : t.notFoundDesc}</p>
        <Link to="/" className="submit-btn cta-btn" style={{ display: "inline-flex", marginTop: 12 }}>
          {t.notFoundBack}
        </Link>
      </div>
    </InfoPageShell>
  );
}

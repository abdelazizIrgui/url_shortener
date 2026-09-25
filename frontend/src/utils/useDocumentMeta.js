import { useEffect } from "react";

const SITE_URL = "https://linkanalyse.com"; // TODO: replace with your real production domain

function setMeta(name, content, attr = "name") {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href, extraAttrs = {}) {
  if (!href) return;
  let selector = `link[rel="${rel}"]`;
  if (extraAttrs.hreflang) selector += `[hreflang="${extraAttrs.hreflang}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  Object.entries(extraAttrs).forEach(([k, v]) => el.setAttribute(k, v));
}

/**
 * Sets per-route document title, meta description, robots directive,
 * canonical URL, and Open Graph / Twitter overrides.
 *
 * @param {Object} opts
 * @param {string} opts.title       — full <title> text
 * @param {string} [opts.description]
 * @param {string} [opts.path]      — path used to build the canonical URL, e.g. "/login"
 * @param {boolean} [opts.noindex]  — set true for private/dashboard or user-generated pages
 */
export function useDocumentMeta({ title, description, path, noindex = false }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      setMeta("description", description);
      setMeta("og:description", description, "property");
      setMeta("twitter:description", description);
    }
    if (title) {
      setMeta("og:title", title, "property");
      setMeta("twitter:title", title);
    }
    setMeta("robots", noindex ? "noindex, nofollow" : "index, follow");

    if (path) {
      const canonicalUrl = `${SITE_URL}${path}`;
      setLink("canonical", canonicalUrl);
      setMeta("og:url", canonicalUrl, "property");
    }
  }, [title, description, path, noindex]);
}

export { SITE_URL };

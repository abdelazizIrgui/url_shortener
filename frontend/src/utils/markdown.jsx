// Minimal, dependency-free Markdown -> React renderer for blog post content.
//
// Why this exists instead of dangerouslySetInnerHTML + a markdown lib:
//   - No raw HTML is ever injected into the DOM, so there's no stored-XSS
//     surface even though post content comes from the admin dashboard.
//   - It only builds real React elements, so it's inert against
//     <script>, onerror=, javascript: URIs, etc.
//
// Supported syntax (kept intentionally small so it's easy to teach in the
// admin editor's help text):
//   ## Heading            -> <h2>   (### -> h3, #### -> h4, ... up to h6)
//   plain line(s)         -> <p>    (blank line = new paragraph)
//   - item / * item       -> <ul><li>
//   1. item                -> <ol><li>
//   > quote                -> <blockquote>
//   ```code```              -> <pre><code>
//   ![alt](url)             -> <img>
//   **bold**, *italic*, `code`, [text](url) -> inline formatting
//
// A single H1 is intentionally NOT supported here — the post title is
// already rendered as the page's one-and-only <h1> in BlogPostPage, and a
// page should only ever have one <h1> for good SEO/accessibility. So a
// single leading "#" is treated the same as "##" and becomes an <h2>.

function isSafeUrl(url) {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("mailto:")
  );
}

// Turns inline markdown (**bold**, *italic*, `code`, [text](url)) into an
// array of strings / React nodes.
function parseInline(text, keyPrefix) {
  const nodes = [];
  // Order matters: links first, then bold, then italic, then inline code.
  const pattern = /(\[([^\]]+)\]\(([^)\s]+)\))|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)/g;
  let lastIndex = 0;
  let match;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const key = `${keyPrefix}-${i++}`;
    if (match[1]) {
      // link
      const label = match[2];
      const href = match[3];
      if (isSafeUrl(href)) {
        nodes.push(
          <a key={key} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
            {label}
          </a>
        );
      } else {
        nodes.push(label);
      }
    } else if (match[4] || match[6]) {
      nodes.push(<strong key={key}>{match[5] || match[7]}</strong>);
    } else if (match[8] || match[10]) {
      nodes.push(<em key={key}>{match[9] || match[11]}</em>);
    } else if (match[12]) {
      nodes.push(<code key={key} className="inline-code">{match[13]}</code>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const UL_RE = /^[-*]\s+(.*)$/;
const OL_RE = /^\d+\.\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const IMAGE_ONLY_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

export function renderMarkdown(source) {
  if (!source) return null;
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Fenced code block
    if (line.trim().startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <pre key={key++} className="blog-code-block">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Heading
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      const hashes = headingMatch[1].length;
      const level = hashes <= 2 ? 2 : Math.min(hashes, 6); // # or ## -> h2, ### -> h3, #### -> h4, ##### -> h5, ###### -> h6
      const Tag = `h${level}`;
      blocks.push(<Tag key={key++}>{parseInline(headingMatch[2], `h${key}`)}</Tag>);
      i++;
      continue;
    }

    // Image on its own line
    const imageMatch = line.trim().match(IMAGE_ONLY_RE);
    if (imageMatch) {
      blocks.push(
        <figure key={key++} className="blog-content-figure">
          <img src={imageMatch[2]} alt={imageMatch[1]} loading="lazy" />
          {imageMatch[1] && <figcaption>{imageMatch[1]}</figcaption>}
        </figure>
      );
      i++;
      continue;
    }

    // Blockquote (consume consecutive quote lines)
    if (QUOTE_RE.test(line)) {
      const quoteLines = [];
      while (i < lines.length && QUOTE_RE.test(lines[i])) {
        quoteLines.push(lines[i].match(QUOTE_RE)[1]);
        i++;
      }
      blocks.push(
        <blockquote key={key++}>
          <p>{parseInline(quoteLines.join(" "), `q${key}`)}</p>
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (UL_RE.test(line)) {
      const items = [];
      while (i < lines.length && UL_RE.test(lines[i])) {
        items.push(lines[i].match(UL_RE)[1]);
        i++;
      }
      blocks.push(
        <ul key={key++}>
          {items.map((item, idx) => (
            <li key={idx}>{parseInline(item, `ul${key}-${idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (OL_RE.test(line)) {
      const items = [];
      while (i < lines.length && OL_RE.test(lines[i])) {
        items.push(lines[i].match(OL_RE)[1]);
        i++;
      }
      blocks.push(
        <ol key={key++}>
          {items.map((item, idx) => (
            <li key={idx}>{parseInline(item, `ol${key}-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph — consume consecutive plain lines as one paragraph,
    // joined with a space (soft line breaks).
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !HEADING_RE.test(lines[i]) &&
      !UL_RE.test(lines[i]) &&
      !OL_RE.test(lines[i]) &&
      !QUOTE_RE.test(lines[i]) &&
      !lines[i].trim().startsWith("```") &&
      !IMAGE_ONLY_RE.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(<p key={key++}>{parseInline(paraLines.join(" "), `p${key}`)}</p>);
  }

  return blocks;
}

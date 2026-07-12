import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li", "h2", "h3", "h4", "blockquote"];
const ALLOWED_ATTR = ["href", "target", "rel"];

/**
 * Sanitizes rich-text block content (raw HTML authored in the visual
 * editor) before it is stored or rendered. Blocks stored XSS via
 * dangerouslySetInnerHTML in BlockRenderer.
 */
export function sanitizeRichHtml(html: unknown): string {
  const raw = typeof html === "string" ? html : "";
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
  const clean = DOMPurify.sanitize(raw, { ALLOWED_TAGS, ALLOWED_ATTR });
  DOMPurify.removeHook("afterSanitizeAttributes");
  return clean;
}

/**
 * Validates a URL used in block data (image src, link/cta href) is either
 * an absolute http(s) URL or a site-relative path — rejects javascript:,
 * data:, and other unsafe schemes.
 */
export function sanitizeBlockUrl(url: unknown): string {
  const raw = typeof url === "string" ? url.trim() : "";
  if (!raw) return "";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return raw;
  } catch {
    // not a valid absolute URL
  }
  return "";
}

/**
 * Walks the known legacy block shapes (type: 'text' | 'image' | 'cta' |
 * 'hero') and sanitizes any HTML/URL fields in place. Safe to call on
 * arbitrary block arrays before persisting or rendering.
 */
export function sanitizeBlocks<T extends { type: string; data: Record<string, unknown> }>(blocks: T[]): T[] {
  return blocks.map((block) => {
    const data = { ...block.data };
    if (block.type === "text" && "content" in data) {
      data.content = sanitizeRichHtml(data.content);
    }
    if (block.type === "image" && "url" in data) {
      data.url = sanitizeBlockUrl(data.url);
    }
    if (block.type === "cta" && "href" in data) {
      data.href = sanitizeBlockUrl(data.href);
    }
    if (block.type === "hero" && "ctaHref" in data) {
      data.ctaHref = sanitizeBlockUrl(data.ctaHref);
    }
    return { ...block, data };
  });
}

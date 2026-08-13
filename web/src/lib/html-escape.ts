export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttr(s: string): string {
  return escapeHtml(s);
}

export function urlSafe(u: string): string {
  try {
    const parsed = new URL(u);
    if (!["https:", "mailto:"].includes(parsed.protocol)) {
      return "#";
    }
    return parsed.toString();
  } catch {
    return "#";
  }
}
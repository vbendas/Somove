/** Darkens (or lightens) a #rrggbb / #rgb hex color by `percent` (0-100). No dependency. */
export function shade(hex: string, percent: number): string {
  const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return hex;

  let normalized = match[1];
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const num = parseInt(normalized, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;

  const clamp = (value: number) => Math.min(255, Math.max(0, Math.round(value)));

  // Negative percent darkens (toward 0), positive percent lightens (toward 255).
  const adjust = (channel: number) =>
    percent < 0 ? channel * (1 + percent / 100) : channel + (255 - channel) * (percent / 100);

  const nr = clamp(adjust(r));
  const ng = clamp(adjust(g));
  const nb = clamp(adjust(b));

  const toHex = (value: number) => value.toString(16).padStart(2, "0");

  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}

/** Validates a string is a strict #rrggbb (6-digit) hex color. */
export function isValidHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

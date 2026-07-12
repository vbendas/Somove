/**
 * Shared date/currency formatting helpers.
 *
 * `APP_LOCALE` is the ONLY place the locale string should live going
 * forward — every formatter in this file (and every call site that adopts
 * it) should route through here instead of hand-rolling
 * `toLocaleDateString("en-GB", ...)` or manual `€${(x / 100).toFixed(2)}`
 * strings.
 */

export const APP_LOCALE = "en-GB";
export const APP_CURRENCY = "EUR";

function toDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

/**
 * Format an integer amount of cents as a localized currency string.
 *
 * - `formatCurrency(9000)` -> "€90" (no decimals by default)
 * - `formatCurrency(9050, { showCents: true })` -> "€90.50"
 * - `formatCurrency(1250000, { compact: true })` -> "€13K"
 */
export function formatCurrency(
  cents: number,
  opts?: { showCents?: boolean; compact?: boolean }
): string {
  const { showCents = false, compact = false } = opts ?? {};
  const amount = cents / 100;

  const formatter = new Intl.NumberFormat(APP_LOCALE, {
    style: "currency",
    currency: APP_CURRENCY,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });

  const formatted = formatter.format(amount);

  // Intl's compact notation lowercases the magnitude suffix (e.g. "€13k").
  // Uppercase it so compact currency reads "€13K" per the app's style.
  return compact ? formatted.replace(/([kmbt])(\s*)$/i, (_, s) => s.toUpperCase()) : formatted;
}

/**
 * Format a date. Accepts a `Date` or an ISO date string (Supabase returns
 * dates as strings).
 *
 * - `short`:  "12 Jul"
 * - `medium`: "Sat, 12 Jul" (default)
 * - `long`:   "12 July 2026"
 */
export function formatDate(
  d: Date | string,
  style: "short" | "medium" | "long" = "medium"
): string {
  const date = toDate(d);

  if (style === "short") {
    return new Intl.DateTimeFormat(APP_LOCALE, {
      day: "numeric",
      month: "short",
    }).format(date);
  }

  if (style === "long") {
    return new Intl.DateTimeFormat(APP_LOCALE, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  // medium: "Sat, 12 Jul" — Intl doesn't insert the comma for a
  // weekday+day+month combo, so build it from two formatters.
  const weekday = new Intl.DateTimeFormat(APP_LOCALE, { weekday: "short" }).format(date);
  const dayMonth = new Intl.DateTimeFormat(APP_LOCALE, {
    day: "numeric",
    month: "short",
  }).format(date);
  return `${weekday}, ${dayMonth}`;
}

/**
 * Format a time as 24h "en-GB" style, e.g. "14:30".
 */
export function formatTime(d: Date | string): string {
  const date = toDate(d);
  return new Intl.DateTimeFormat(APP_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Format a date+time, e.g. "Sat, 12 Jul at 14:30".
 */
export function formatDateTime(d: Date | string): string {
  const date = toDate(d);
  return `${formatDate(date, "medium")} at ${formatTime(date)}`;
}

/**
 * Format a date as an abbreviated month + 2-digit year, e.g. "Jul 25".
 * Used for chart axis ticks.
 */
export function formatMonthYear(d: Date | string): string {
  const date = toDate(d);
  return new Intl.DateTimeFormat(APP_LOCALE, {
    month: "short",
    year: "2-digit",
  }).format(date);
}

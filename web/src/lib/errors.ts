import * as Sentry from "@sentry/nextjs";

/**
 * Capture an error and report it to Sentry (if configured) while also
 * logging to the console. Use this in place of `.catch(() => {})` and
 * empty `catch {}` blocks so failures are never silently dropped.
 */
export function captureError(err: unknown, ctx?: Record<string, unknown>) {
  console.error("[captureError]", err, ctx ?? {});
  if (!process.env.SENTRY_DSN) return;
  if (err instanceof Error) {
    Sentry.captureException(err, { extra: ctx });
  } else {
    Sentry.captureMessage(String(err), { level: "error", extra: ctx });
  }
}
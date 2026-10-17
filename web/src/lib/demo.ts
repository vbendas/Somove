export const DEMO_DISABLED_MESSAGE = "Disabled in the demo.";

/** True when the app runs as the public demo (server-side env only). */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

/**
 * Guard for destructive server actions. Returns `{ error }` in the same shape
 * the actions already use, or null when the operation is allowed.
 */
export function demoGuard(): { error: string } | null {
  return isDemoMode() ? { error: DEMO_DISABLED_MESSAGE } : null;
}

/** Mask an email for display, e.g. "dana@example.com" -> "d***@example.com". */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const at = email.indexOf("@");
  if (at < 1) return "***";
  return `${email[0]}***${email.slice(at)}`;
}

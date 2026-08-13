export type ConsentCategory = "essential" | "analytics" | "support" | "push";

export interface ConsentState {
  essential: boolean;
  analytics: boolean;
  support: boolean;
  push: boolean;
  acceptedAt: string;
}

const STORAGE_KEY = "somove-cookie-consent";

export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

export function hasConsent(category: ConsentCategory): boolean {
  const consent = getConsent();
  if (!consent) return false;
  return consent[category] === true;
}

export function setConsent(state: Omit<ConsentState, "acceptedAt">): ConsentState {
  const full: ConsentState = {
    ...state,
    acceptedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  }
  return full;
}

export function hasDecided(): boolean {
  return getConsent() !== null;
}
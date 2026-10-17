"use client";

import { useEffect, useState } from "react";
import {
  getConsent,
  setConsent as saveConsent,
  hasDecided,
  type ConsentState,
} from "@/lib/consent";

export function ConsentGate({
  category,
  children,
}: {
  category: "support" | "push" | "analytics";
  children: React.ReactNode;
}) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [decided, setDecided] = useState(false);

  useEffect(() => {
    setConsent(getConsent());
    setDecided(hasDecided());
  }, []);

  if (!decided || !consent || !consent[category]) return null;
  return <>{children}</>;
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasDecided()) setShow(true);
  }, []);

  function acceptAll() {
    saveConsent({
      essential: true,
      analytics: true,
      support: true,
      push: true,
    });
    setShow(false);
  }

  function rejectNonEssential() {
    saveConsent({
      essential: true,
      analytics: false,
      support: false,
      push: false,
    });
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      // z-[70]: above the bottom nav (z-[60], fixed bottom-0) so the
      // banner and its buttons are never hidden or made unclickable
      // behind the nav's translucent backdrop. On mobile the banner sits
      // ABOVE the bottom nav rather than under it: BottomNav publishes its
      // height via the --bottom-nav-h CSS variable while mounted, so this
      // offsets by that amount where a bottom nav exists (client/therapist
      // areas) and falls back to 0 where it doesn't (e.g. admin).
      style={{ marginBottom: "var(--bottom-nav-h, 0px)" }}
      className="fixed bottom-4 left-4 right-4 z-[70] max-w-sm rounded-xl border border-border bg-card p-4 text-sm shadow-lg sm:left-auto"
    >
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-foreground">
          We use cookies to provide essential features, and optionally for support
          chat and push notifications. See our{" "}
          <a href="/legal/privacy" className="underline">
            Privacy Policy
          </a>
          .
        </p>
        <div className="flex gap-2">
          <button
            onClick={rejectNonEssential}
            className="whitespace-nowrap rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Essential only
          </button>
          <button
            onClick={acceptAll}
            className="whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
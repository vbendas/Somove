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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Essential only
          </button>
          <button
            onClick={acceptAll}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
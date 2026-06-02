"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("somove-install-dismissed");
    if (dismissed) return;

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show || !deferredPrompt) return null;

  const handleInstall = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prompt = deferredPrompt as any;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("somove-install-dismissed", "true");
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md rounded-xl border border-border bg-background p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Install Somove</p>
          <p className="mt-0.5 text-xs text-warm-gray">
            Add to your home screen for quick access
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-warm-gray hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={handleInstall} className="flex-1">
          Install
        </Button>
        <Button size="sm" variant="outline" onClick={handleDismiss}>
          Not now
        </Button>
      </div>
    </div>
  );
}

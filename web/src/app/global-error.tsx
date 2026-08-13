"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-heading mb-4">Something went wrong</h1>
            <p className="text-warm-gray mb-6">
              We have been notified and are looking into it. Sorry for the inconvenience.
            </p>
            <button
              onClick={reset}
              className="rounded-button bg-primary px-6 py-2 text-primary-foreground hover:bg-primary-dark"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const checks: Record<string, string> = {};

  checks.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing";
  checks.supabase_anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "missing";
  checks.supabase_service_key = process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "missing";

  const externalChecks: Promise<void>[] = [];

  externalChecks.push(
    (async () => {
      try {
        const supabase = createAdminClient();
        const { error } = await supabase.from("users").select("id").limit(1);
        checks.supabase_connection = error ? `error: ${error.message}` : "ok";
      } catch {
        checks.supabase_connection = "error: connection failed";
      }
    })()
  );

  if (process.env.STRIPE_SECRET_KEY) {
    externalChecks.push(
      (async () => {
        try {
          const r = await fetch("https://api.stripe.com/v1/balance", {
            headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
          });
          checks.stripe = r.ok ? "ok" : `error: ${r.status}`;
        } catch {
          checks.stripe = "error: unreachable";
        }
      })()
    );
  }

  if (process.env.RESEND_API_KEY) {
    externalChecks.push(
      (async () => {
        try {
          const r = await fetch("https://api.resend.com/audiences", {
            headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          });
          checks.resend = r.ok ? "ok" : `error: ${r.status}`;
        } catch {
          checks.resend = "error: unreachable";
        }
      })()
    );
  }

  if (process.env.DAILY_API_KEY) {
    externalChecks.push(
      (async () => {
        try {
          const r = await fetch("https://api.daily.co/v1/rooms?limit=1", {
            headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
          });
          checks.daily = r.ok ? "ok" : `error: ${r.status}`;
        } catch {
          checks.daily = "error: unreachable";
        }
      })()
    );
  }

  await Promise.all(externalChecks);

  const allOk = Object.values(checks).every(
    (v) => v === "ok" || v === "set"
  );

  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
  });
}
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const TZ = "Europe/Lisbon";
const DEMO_CLIENT_EMAIL = "demo-client@example.com";
const DEMO_PRO_EMAIL = "demo-pro@example.com";

// Mirrors scripts/seed-demo.mjs: offsets in days from today (Lisbon date).
const PLAN: { days: number; status: "completed" | "confirmed" }[] = [
  { days: -12, status: "completed" },
  { days: -5, status: "completed" },
  { days: 2, status: "confirmed" },
  { days: 9, status: "confirmed" },
];

function lisbonOffsetMin(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second"));
  return Math.round((asUtc - date.getTime()) / 60000);
}

// 10:00 Lisbon wall time, `days` from today (Lisbon date).
function lisbonTenAm(days: number): Date {
  const now = new Date();
  const lis = new Date(now.getTime() + lisbonOffsetMin(now) * 60000);
  const guess = Date.UTC(lis.getUTCFullYear(), lis.getUTCMonth(), lis.getUTCDate() + days, 10, 0, 0);
  const off = lisbonOffsetMin(new Date(guess));
  return new Date(guess - off * 60000);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json({ updated: 0 });
  }

  const admin = createAdminClient();

  const { data: users } = await admin
    .from("users")
    .select("id, email")
    .in("email", [DEMO_CLIENT_EMAIL, DEMO_PRO_EMAIL]);

  const clientId = users?.find((u) => u.email === DEMO_CLIENT_EMAIL)?.id;
  const proId = users?.find((u) => u.email === DEMO_PRO_EMAIL)?.id;
  if (!clientId || !proId) {
    return NextResponse.json({ updated: 0 });
  }

  // Only the seeded demo sessions (stripe_payment_intent_id prefixed "demo_pi_").
  const { data: sessions } = await admin
    .from("sessions")
    .select("id, scheduled_at")
    .eq("client_id", clientId)
    .eq("therapist_id", proId)
    .like("stripe_payment_intent_id", "demo_pi_%")
    .order("scheduled_at", { ascending: true });

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  let updated = 0;
  for (let i = 0; i < Math.min(sessions.length, PLAN.length); i++) {
    const session = sessions[i];
    const slot = PLAN[i];
    const { error } = await admin
      .from("sessions")
      .update({
        scheduled_at: lisbonTenAm(slot.days).toISOString(),
        status: slot.status,
      })
      .eq("id", session.id);
    if (error) {
      console.error("demo-refresh update failed:", session.id, error.message);
      continue;
    }
    updated++;
  }

  return NextResponse.json({ updated });
}

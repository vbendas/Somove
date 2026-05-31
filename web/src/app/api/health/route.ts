import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const checks: Record<string, string> = {};

  checks.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing";
  checks.supabase_anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "missing";
  checks.supabase_service_key = process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "missing";

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("users").select("id").limit(1);
    checks.supabase_connection = error ? `error: ${error.message}` : "ok";
  } catch {
    checks.supabase_connection = "error: connection failed";
  }

  const allOk = Object.values(checks).every((v) => v === "ok" || v === "set");

  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
  });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureError } from "@/lib/errors";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: pendingSessions } = await admin
    .from("sessions")
    .select("id")
    .eq("room_pending", true)
    .eq("status", "confirmed")
    .limit(50);

  if (!pendingSessions || pendingSessions.length === 0) {
    return NextResponse.json({ processed: 0, recovered: 0, failed: 0 });
  }

  let recovered = 0;
  let failed = 0;

  for (const session of pendingSessions) {
    try {
      const { createSessionRoom } = await import("@/app/actions/session");
      const result = await createSessionRoom(session.id, true);

      if ("joinUrl" in result) {
        await admin
          .from("sessions")
          .update({ room_pending: false })
          .eq("id", session.id);
        recovered++;
      } else {
        captureError(result.error, { sessionId: session.id, step: "reconcile-rooms retry" });
        failed++;
      }
    } catch (e) {
      captureError(e, { sessionId: session.id, step: "reconcile-rooms exception" });
      failed++;
    }
  }

  return NextResponse.json({
    processed: pendingSessions.length,
    recovered,
    failed,
  });
}
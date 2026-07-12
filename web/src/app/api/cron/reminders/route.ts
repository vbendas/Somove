import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const windowStart = new Date(now.getTime() + 15 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 1000);

  const { data: sessions } = await admin
    .from("sessions")
    .select("id, client_id, therapist_id, scheduled_at")
    .eq("status", "confirmed")
    .gte("scheduled_at", windowStart.toISOString())
    .lt("scheduled_at", windowEnd.toISOString());

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const resend = getResendClient();
  let sent = 0;

  for (const session of sessions) {
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("type", "session_reminder")
      .like("link", `%${session.id}%`)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const [clientUser, therapistUser] = await Promise.all([
      admin.from("users").select("id, name, email").eq("id", session.client_id).single(),
      admin.from("users").select("id, name, email").eq("id", session.therapist_id).single(),
    ]);

    if (!clientUser.data || !therapistUser.data) continue;

    const client = clientUser.data;
    const therapist = therapistUser.data;

    try {
      if (resend) {
        await resend.sendSessionReminder({
          to: client.email,
          clientName: client.name || "Client",
          therapistName: therapist.name || "Professional",
          scheduledAt: session.scheduled_at,
          joinUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/session/${session.id}`,
          minutesUntil: 15,
        });
        sent++;
      }
    } catch (e) {
      console.error("Failed to send reminder email:", e);
    }

    await admin.from("notifications").insert([
      {
        user_id: client.id,
        type: "session_reminder",
        title: "Session Starting Soon",
        body: `Your session with ${therapist.name || "your therapist"} starts in 15 minutes.`,
        link: `/session/${session.id}`,
      },
      {
        user_id: therapist.id,
        type: "session_reminder",
        title: "Session Starting Soon",
        body: `Your session starts in 15 minutes.`,
        link: `/session/${session.id}`,
      },
    ]);
  }

  return NextResponse.json({ sent });
}

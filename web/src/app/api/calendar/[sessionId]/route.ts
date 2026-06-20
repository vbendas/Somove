import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id, scheduled_at, duration_min, client_id, therapist_id")
    .eq("id", params.sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.client_id !== user.id && session.therapist_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: therapistUser } = await supabase
    .from("users")
    .select("name")
    .eq("id", session.therapist_id)
    .single();

  const therapistName = therapistUser?.name || "Therapist";
  const start = new Date(session.scheduled_at);
  const end = new Date(start.getTime() + session.duration_min * 60000);

  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Somove//EN",
    "BEGIN:VEVENT",
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:Session with ${therapistName}`,
    `DESCRIPTION:Your session with ${therapistName} on Somove`,
    `URL:${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/session/${session.id}`,
    `UID:${session.id}@somove.app`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="somove-session-${session.id.slice(0, 8)}.ics"`,
    },
  });
}

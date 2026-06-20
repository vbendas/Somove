import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import CalendarView from "@/components/schedule/calendar-view";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { session?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, users!sessions_client_id_fkey(name, email)")
    .eq("therapist_id", user.id)
    .gte("scheduled_at", new Date().toISOString())
    .in("status", ["confirmed", "active", "pending_payment"])
    .order("scheduled_at", { ascending: true })
    .limit(20);

  const calendarEvents = (sessions || []).map((session) => {
    const client = session.users as unknown as { name: string } | null;
    const start = new Date(session.scheduled_at);
    const end = new Date(start.getTime() + session.duration_min * 60000);
    return {
      id: session.id,
      title: client?.name || "Client",
      start: start.toISOString(),
      end: end.toISOString(),
      status: session.status,
    };
  });

  const selectedSessionId = searchParams.session;
  const selectedSession = selectedSessionId
    ? sessions?.find((s) => s.id === selectedSessionId)
    : null;
  const selectedClient = selectedSession
    ? (selectedSession.users as unknown as { name: string } | null)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <h1 className="mb-6 font-heading text-3xl font-medium text-foreground">
          Schedule
        </h1>

        {sessions && sessions.length > 0 ? (
          <CalendarView sessions={calendarEvents} />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-warm-gray">No upcoming sessions</p>
            </CardContent>
          </Card>
        )}

        {selectedSession && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="font-medium">Session Detail</h3>
              <p className="text-sm text-warm-gray">
                {selectedClient?.name || "Client"} —{" "}
                {new Date(selectedSession.scheduled_at).toLocaleString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {selectedSession.duration_min} min · {selectedSession.status}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

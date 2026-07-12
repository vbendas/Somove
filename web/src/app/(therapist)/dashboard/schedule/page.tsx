import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import CalendarView from "@/components/schedule/calendar-view";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
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

  const selectedSessionId = sp.session;
  const selectedSession = selectedSessionId
    ? sessions?.find((s) => s.id === selectedSessionId)
    : null;
  const selectedClient = selectedSession
    ? (selectedSession.users as unknown as { name: string } | null)
    : null;

  return (
    <PageContainer width="full">
      <PageHeader title="Schedule" />

      {sessions && sessions.length > 0 ? (
        <CalendarView sessions={calendarEvents} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <EmptyState icon={CalendarDays} title="No upcoming sessions" />
          </CardContent>
        </Card>
      )}

      {selectedSession && (
        <Card className="mt-4">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <h3 className="font-medium">Session Detail</h3>
              <p className="text-sm text-warm-gray">
                {selectedClient?.name || "Client"} —{" "}
                {formatDateTime(selectedSession.scheduled_at)} ·{" "}
                {selectedSession.duration_min} min
              </p>
            </div>
            <StatusBadge status={selectedSession.status} />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Users, MessageSquare } from "lucide-react";
import Link from "next/link";
import SessionActions from "./[id]/session-actions";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: todaySessions } = await supabase
    .from("sessions")
    .select("*, users!sessions_client_id_fkey(name, email)")
    .eq("therapist_id", user.id)
    .gte("scheduled_at", today.toISOString())
    .lt("scheduled_at", tomorrow.toISOString())
    .in("status", ["confirmed", "active"])
    .order("scheduled_at", { ascending: true });

  const { count: totalClients } = await supabase
    .from("sessions")
    .select("client_id", { count: "exact", head: true })
    .eq("therapist_id", user.id)
    .eq("status", "completed");

  const { count: unreadMessages } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .neq("sender_id", user.id)
    .is("read_at", null)
    .in(
      "conversation_id",
      (
        await supabase
          .from("conversations")
          .select("id")
          .eq("therapist_id", user.id)
      ).data?.map((c) => c.id) || []
    );

  return (
    <PageContainer width="narrow">
      <PageHeader title="Today" />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard icon={CalendarDays} value={todaySessions?.length || 0} label="Sessions" />
        <StatCard icon={Users} value={totalClients || 0} label="Clients" />
        <StatCard icon={MessageSquare} value={unreadMessages || 0} label="Unread" />
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-warm-gray">
            Today&apos;s Sessions
          </h2>
          <Link
            href="/dashboard/schedule"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {(!todaySessions || todaySessions.length === 0) ? (
          <EmptyState icon={CalendarDays} title="No sessions today" />
        ) : (
          <div className="space-y-3">
            {todaySessions.map((session) => {
              const client = session.users;
              const scheduledAt = new Date(session.scheduled_at);
              return (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {(client as unknown as { name: string })?.name || "Client"}
                        </p>
                        <p className="text-sm text-warm-gray">
                          {formatTime(scheduledAt)} · {session.duration_min} min
                        </p>
                      </div>
                      <StatusBadge status={session.status} />
                    </div>
                    <SessionActions
                      sessionId={session.id}
                      status={session.status}
                      scheduledAt={session.scheduled_at}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

interface TherapistUser {
  name: string;
}

export default async function MySessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const page = parseInt(sp.page || "0");
  const pageSize = 50;

  const { data: upcomingSessions } = await supabase
    .from("sessions")
    .select("*, therapist_profile!sessions_therapist_id_fkey(*, users!inner(name))")
    .eq("client_id", user.id)
    .in("status", ["confirmed", "pending_payment"])
    .order("scheduled_at", { ascending: true });

  const { data: pastSessions } = await supabase
    .from("sessions")
    .select("*, therapist_profile!sessions_therapist_id_fkey(*, users!inner(name))")
    .eq("client_id", user.id)
    .in("status", ["completed", "cancelled", "no_show"])
    .order("scheduled_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  return (
    <PageContainer width="narrow">
      <PageHeader title="My Sessions" />

      {(!upcomingSessions || upcomingSessions.length === 0) &&
        (!pastSessions || pastSessions.length === 0) && (
          <EmptyState
            icon={CalendarDays}
            title="No sessions yet"
            action={{ label: "Browse Professionals", href: "/" }}
          />
        )}

      {upcomingSessions && upcomingSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-warm-gray">
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcomingSessions.map((session) => {
              const therapist = session.therapist_profile?.users as TherapistUser | null;
              const scheduledAt = new Date(session.scheduled_at);
              return (
                <Link key={session.id} href={`/my-sessions/${session.id}`}>
                  <div className="cursor-pointer rounded-card border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {therapist?.name || "Professional"}
                        </p>
                        <p className="text-sm text-warm-gray">
                          {formatDate(scheduledAt)} at {formatTime(scheduledAt)}
                        </p>
                      </div>
                      <StatusBadge status={session.status} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {pastSessions && pastSessions.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-warm-gray">
            Past
          </h2>
          <div className="space-y-3">
            {pastSessions.map((session) => {
              const therapist = session.therapist_profile?.users as TherapistUser | null;
              const scheduledAt = new Date(session.scheduled_at);
              const therapistUserId = session.therapist_id;
              return (
                <div
                  key={session.id}
                  className="rounded-card border border-border bg-card p-4 opacity-70"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {therapist?.name || "Professional"}
                      </p>
                      <p className="text-sm text-warm-gray">
                        {formatDate(scheduledAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={session.status} />
                      {session.status === "completed" && therapistUserId && (
                        <Link href={`/therapists/${therapistUserId}/book`}>
                          <Button size="sm" variant="outline">
                            Book Again
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {pastSessions && pastSessions.length === pageSize && (
            <div className="mt-6 text-center">
              <Link
                href={`/my-sessions?page=${page + 1}`}
                className="text-sm text-primary hover:underline"
              >
                Load more
              </Link>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

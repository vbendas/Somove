import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MySessionsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const page = parseInt(searchParams.page || "0");
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-6 font-heading text-3xl font-medium text-foreground">
          My Sessions
        </h1>

        {(!upcomingSessions || upcomingSessions.length === 0) &&
          (!pastSessions || pastSessions.length === 0) && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
                <CalendarDays className="h-8 w-8 text-warm-gray" />
              </div>
              <p className="text-warm-gray">No sessions yet</p>
              <Link href="/">
                <Button>Browse Professionals</Button>
              </Link>
            </div>
          )}

        {upcomingSessions && upcomingSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-warm-gray">
              Upcoming
            </h2>
            <div className="space-y-3">
              {upcomingSessions.map((session) => {
                const therapist = session.therapist_profile?.users;
                const scheduledAt = new Date(session.scheduled_at);
                return (
                  <Link key={session.id} href={`/my-sessions/${session.id}`}>
                    <div className="cursor-pointer rounded-card border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {(therapist as unknown as { name: string })?.name || "Professional"}
                          </p>
                          <p className="text-sm text-warm-gray">
                            {scheduledAt.toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            at{" "}
                            {scheduledAt.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            session.status === "confirmed"
                              ? "bg-light-moss text-foreground"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {session.status === "confirmed" ? "Confirmed" : "Pending"}
                        </span>
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
                const therapist = session.therapist_profile?.users;
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
                          {(therapist as unknown as { name: string })?.name || "Professional"}
                        </p>
                        <p className="text-sm text-warm-gray">
                          {scheduledAt.toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-surface px-3 py-1 text-xs text-warm-gray">
                          {session.status}
                        </span>
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
      </div>
    </div>
  );
}

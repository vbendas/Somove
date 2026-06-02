import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Users, MessageSquare } from "lucide-react";
import Link from "next/link";
import SessionActions from "./[id]/session-actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-6 font-heading text-3xl font-medium text-foreground">
          Today
        </h1>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <CalendarDays className="mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-medium text-foreground">
                {todaySessions?.length || 0}
              </p>
              <p className="text-xs text-warm-gray">Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <Users className="mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-medium text-foreground">
                {totalClients || 0}
              </p>
              <p className="text-xs text-warm-gray">Clients</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <MessageSquare className="mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-medium text-foreground">
                {unreadMessages || 0}
              </p>
              <p className="text-xs text-warm-gray">Unread</p>
            </CardContent>
          </Card>
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
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-warm-gray">No sessions today</p>
              </CardContent>
            </Card>
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
                            {scheduledAt.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            · {session.duration_min} min
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            session.status === "active"
                              ? "bg-accent/10 text-accent"
                              : "bg-light-moss text-foreground"
                          }`}
                        >
                          {session.status === "active" ? "In Progress" : "Confirmed"}
                        </span>
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
      </div>
    </div>
  );
}

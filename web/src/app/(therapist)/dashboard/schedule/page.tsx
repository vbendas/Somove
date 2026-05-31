import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-6 font-heading text-3xl font-medium text-foreground">
          Schedule
        </h1>

        {!sessions || sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-warm-gray">No upcoming sessions</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const client = session.users;
              const scheduledAt = new Date(session.scheduled_at);
              const dateStr = scheduledAt.toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const timeStr = scheduledAt.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <Card key={session.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-foreground">
                        {(client as unknown as { name: string })?.name || "Client"}
                      </p>
                      <p className="text-sm text-warm-gray">
                        {dateStr} at {timeStr} · {session.duration_min} min
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        session.status === "confirmed"
                          ? "bg-light-moss text-foreground"
                          : session.status === "active"
                          ? "bg-accent/10 text-accent"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {session.status === "confirmed"
                        ? "Confirmed"
                        : session.status === "active"
                        ? "In Progress"
                        : "Pending"}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

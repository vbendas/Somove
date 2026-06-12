import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, CreditCard, MessageSquare } from "lucide-react";
import { signOut } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

async function getUserData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return userData;
}

async function getUpcomingSessions(clientId: string) {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("client_id", clientId)
    .in("status", ["confirmed", "pending_payment"])
    .gte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(3);

  if (!sessions || sessions.length === 0) return [];

  const therapistIds = Array.from(new Set(sessions.map((s) => s.therapist_id)));

  const admin = createAdminClient();
  const { data: therapistUsers } = await admin
    .from("users")
    .select("id, name")
    .in("id", therapistIds);

  const userMap = new Map((therapistUsers || []).map((u) => [u.id, u]));

  return sessions.map((s) => ({
    ...s,
    therapist_profile: { users: userMap.get(s.therapist_id) || null },
  }));
}

async function getTotalCredits(clientId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("session_credits")
    .select("remaining_credits")
    .eq("client_id", clientId)
    .gt("remaining_credits", 0);

  return data?.reduce((sum, c) => sum + c.remaining_credits, 0) || 0;
}

async function getUnreadCount(userId: string) {
  const supabase = createClient();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("client_id", userId);

  if (!conversations || conversations.length === 0) return 0;

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .neq("sender_id", userId)
    .is("read_at", null)
    .in(
      "conversation_id",
      conversations.map((c) => c.id)
    );

  return count || 0;
}

async function getTherapists() {
  const admin = createAdminClient();

  const { data: profiles, error: profileError } = await admin
    .from("therapist_profile")
    .select("*")
    .eq("status", "active");

  if (profileError) {
    console.error("getTherapists profile query error:", profileError.message);
    return [];
  }

  if (!profiles || profiles.length === 0) return [];

  const userIds = profiles.map((p) => p.user_id);
  const { data: users } = await admin
    .from("users")
    .select("id, name, email")
    .in("id", userIds);

  const userMap = new Map((users || []).map((u) => [u.id, u]));

  return profiles.map((p) => ({
    ...p,
    users: userMap.get(p.user_id) || null,
  }));
}

export default async function Home() {
  const userData = await getUserData();
  const [therapists, upcomingSessions, totalCredits, unreadCount] = await Promise.all([
    getTherapists(),
    getUpcomingSessions(userData.id),
    getTotalCredits(userData.id),
    getUnreadCount(userData.id),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-5 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-heading text-3xl font-medium text-foreground">
            Welcome, {userData.name?.split(" ")[0] || "there"}
          </h1>
          <div className="flex items-center gap-2">
            {userData.role === "therapist" && (
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
            )}
            <form action={signOut}>
              <Button variant="ghost" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <CalendarDays className="mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-medium text-foreground">
                {upcomingSessions.length}
              </p>
              <p className="text-xs text-warm-gray">Upcoming</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <CreditCard className="mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-medium text-foreground">
                {totalCredits}
              </p>
              <p className="text-xs text-warm-gray">Credits</p>
            </CardContent>
          </Card>
          <Link href="/inbox">
            <Card className="cursor-pointer transition-all hover:border-primary/30">
              <CardContent className="flex flex-col items-center p-4">
                <MessageSquare className="mb-1 h-5 w-5 text-primary" />
                <p className="text-2xl font-medium text-foreground">
                  {unreadCount}
                </p>
                <p className="text-xs text-warm-gray">Messages</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wider text-warm-gray">
                Upcoming Sessions
              </h2>
              <Link
                href="/my-sessions"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingSessions.map((session) => {
                const therapist = session.therapist_profile?.users;
                const scheduledAt = new Date(session.scheduled_at);
                return (
                  <Link key={session.id} href={`/my-sessions/${session.id}`}>
                    <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm">
                      <CardContent className="p-4">
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
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Therapist Directory */}
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-warm-gray">
            {upcomingSessions.length > 0 ? "Find a Professional" : "Available Professionals"}
          </h2>

          {therapists.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-warm-gray">No professionals available yet. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {therapists.map((therapist) => (
                <Link
                  key={therapist.user_id}
                  href={`/therapists/${therapist.user_id}`}
                >
                  <div className="group cursor-pointer rounded-card-lg border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-heading text-xl font-medium text-primary">
                        {therapist.users?.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <h2 className="font-heading text-xl font-medium text-foreground group-hover:text-primary transition-colors">
                          {therapist.users?.name || "Professional"}
                        </h2>
                        {therapist.modalities && therapist.modalities.length > 0 && (
                          <p className="text-sm text-warm-gray">
                            {therapist.modalities.slice(0, 2).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {therapist.bio && (
                      <p className="mb-4 line-clamp-3 text-sm text-warm-gray">
                        {therapist.bio}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        {therapist.session_price_cents !== null ? (
                          <span className="text-lg font-medium text-foreground">
                            €{(therapist.session_price_cents / 100).toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-sm text-warm-gray">Price on request</span>
                        )}
                        <span className="ml-1 text-sm text-warm-gray">
                          / {therapist.default_session_duration} min
                        </span>
                      </div>
                      {therapist.free_first_session && (
                        <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                          Free first session
                        </span>
                      )}
                    </div>

                    {therapist.credentials && therapist.credentials.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(therapist.credentials as string[]).slice(0, 3).map((cred: string) => (
                          <span
                            key={cred}
                            className="rounded-full bg-surface px-3 py-1 text-xs text-warm-gray"
                          >
                            {cred}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

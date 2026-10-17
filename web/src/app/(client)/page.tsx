import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, CreditCard, MessageSquare, Users } from "lucide-react";
import TherapistFilters from "@/components/directory/therapist-filters";
import { TherapistCard } from "@/components/directory/therapist-card";
import { getTherapists } from "@/lib/directory";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatTime } from "@/lib/format";

interface TherapistUser {
  name: string;
}

export const dynamic = "force-dynamic";

async function getUserData() {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data } = await supabase
    .from("session_credits")
    .select("remaining_credits")
    .eq("client_id", clientId)
    .gt("remaining_credits", 0);

  return data?.reduce((sum, c) => sum + c.remaining_credits, 0) || 0;
}

async function getUnreadCount(userId: string) {
  const supabase = await createClient();

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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ modality?: string }>;
}) {
  const sp = await searchParams;
  const userData = await getUserData();

  const [allTherapists, upcomingSessions, totalCredits, unreadCount] = await Promise.all([
    getTherapists(),
    getUpcomingSessions(userData.id),
    getTotalCredits(userData.id),
    getUnreadCount(userData.id),
  ]);

  const allModalities = Array.from(
    new Set(allTherapists.flatMap((t) => t.modalities || []))
  ).sort();

  const therapists = sp.modality
    ? allTherapists.filter((t) => t.modalities?.includes(sp.modality!))
    : allTherapists;

  return (
    <PageContainer width="dashboard">
      <PageHeader
        title={`Welcome, ${userData.name?.split(" ")[0] || "there"}`}
        description="Find a professional and manage your sessions."
      />

      {/* Dashboard Stats */}
      <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard icon={CalendarDays} value={upcomingSessions.length} label="Upcoming" />
        <StatCard icon={CreditCard} value={totalCredits} label="Credits" />
        <StatCard icon={MessageSquare} value={unreadCount} label="Messages" href="/inbox" />
      </div>

      {/* Upcoming Sessions */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Upcoming Sessions
          </h2>
          {upcomingSessions.length > 0 && (
            <Link
              href="/my-sessions"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          )}
        </div>
        {upcomingSessions.length > 0 ? (
          <div className="space-y-3">
            {upcomingSessions.map((session) => {
              const therapist = session.therapist_profile?.users as TherapistUser | null;
              const scheduledAt = new Date(session.scheduled_at);
              return (
                <Link key={session.id} href={`/my-sessions/${session.id}`}>
                  <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm">
                    <CardContent className="p-4">
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
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title="No upcoming sessions"
              description={
                therapists.length === 1
                  ? "Ready to get started? Book a session with your professional."
                  : "Browse our professionals and book a session that fits your schedule."
              }
              action={
                allTherapists.length === 1
                  ? {
                      label: "Book a session",
                      href: `/therapists/${allTherapists[0].user_id}/book`,
                    }
                  : { label: "Browse professionals", href: "#directory" }
              }
              className="py-10"
            />
          </Card>
        )}
      </div>

      {/* Therapist Directory */}
      <div id="directory" className="scroll-mt-6">
        <h2 className="mb-4 font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {upcomingSessions.length > 0 ? "Find a Professional" : "Available Professionals"}
        </h2>

        {therapists.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No professionals available yet"
            description="Check back soon!"
          />
        ) : (
          <>
            {allModalities.length > 1 && (
              <TherapistFilters modalities={allModalities} />
            )}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {therapists.map((therapist) => (
                <TherapistCard key={therapist.user_id} therapist={therapist} />
              ))}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}

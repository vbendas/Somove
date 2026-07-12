import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, CreditCard } from "lucide-react";
import CancelButton from "@/components/sessions/cancel-button";
import JoinButton from "./join-button";
import RescheduleButton from "./reschedule-button";
import ReviewForm from "./review-form";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

interface TherapistUser {
  name: string;
  email: string;
}

async function getSession(sessionId: string) {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("*, therapist_profile!sessions_therapist_id_fkey(*, users!inner(name, email))")
    .eq("id", sessionId)
    .single();
  return session;
}

async function getExistingReview(sessionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, body")
    .eq("session_id", sessionId)
    .maybeSingle();
  return data;
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const session = await getSession(id);
  if (!session || session.client_id !== user.id) notFound();

  const therapist = session.therapist_profile?.users as TherapistUser | null;
  const therapistUserId = session.therapist_id;
  const scheduledAt = new Date(session.scheduled_at);
  const isUpcoming = ["confirmed", "pending_payment"].includes(session.status);
  const isActive = session.status === "active";
  const isCompleted = session.status === "completed";
  const isCancelled = session.status === "cancelled";
  const canJoin = (isUpcoming || isActive) && (session.daily_room_url || session.mirotalk_room_url);

  const existingReview = isCompleted ? await getExistingReview(id) : null;

  return (
    <PageContainer width="narrow">
      <PageHeader title="Session Details" backHref="/my-sessions" />

      <div className="space-y-4">
        <div className="rounded-card border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-foreground">
              {therapist?.name || "Professional"}
            </h2>
            <StatusBadge status={session.status} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-warm-gray" />
              <span className="text-sm text-foreground">
                {formatDate(scheduledAt, "long")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-warm-gray" />
              <span className="text-sm text-foreground">
                {formatTime(scheduledAt)} ({session.duration_min} min)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-warm-gray" />
              <span className="text-sm text-foreground">
                {session.payment_status === "free_first_session"
                  ? "Free Session"
                  : session.payment_status === "paid"
                  ? formatCurrency(session.amount_paid_cents || 0, { showCents: true })
                  : session.payment_status === "refunded"
                  ? "Refunded"
                  : "Payment Pending"}
              </span>
            </div>
          </div>
        </div>

        {canJoin && (
          <div className="space-y-3">
            <JoinButton
              sessionId={session.id}
              userId={user.id}
              role="client"
              isStartable={false}
              disabled={false}
            />
            {isUpcoming && (
              <div className="flex gap-3">
                <RescheduleButton sessionId={session.id} />
                <CancelButton sessionId={session.id} scheduledAt={session.scheduled_at} />
              </div>
            )}
          </div>
        )}

        {isUpcoming && !isCancelled && !canJoin && (
          <div className="flex gap-3">
            <Link href={`/therapists/${therapistUserId}/book`} className="flex-1">
              <Button variant="outline" className="w-full">
                Book Again
              </Button>
            </Link>
            <RescheduleButton sessionId={session.id} />
            <CancelButton sessionId={session.id} scheduledAt={session.scheduled_at} />
          </div>
        )}

        {isCompleted && (
          <ReviewForm
            sessionId={session.id}
            therapistId={therapistUserId}
            clientId={user.id}
            existingReview={existingReview}
          />
        )}

        {isCancelled && (
          <div className="rounded-card border border-border bg-surface p-4">
            <p className="text-sm text-warm-gray">
              This session was cancelled.
              {session.payment_status === "refunded" && " A refund has been processed."}
            </p>
            {therapistUserId && (
              <Link href={`/therapists/${therapistUserId}/book`} className="mt-3 block">
                <Button variant="outline" className="w-full">
                  Book a New Session
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

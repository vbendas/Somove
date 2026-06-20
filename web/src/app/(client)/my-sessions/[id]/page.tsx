import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, CreditCard } from "lucide-react";
import CancelButton from "@/components/sessions/cancel-button";
import JoinButton from "./join-button";
import RescheduleButton from "./reschedule-button";
import ReviewForm from "./review-form";

export const dynamic = "force-dynamic";

async function getSession(sessionId: string) {
  const supabase = createClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("*, therapist_profile!sessions_therapist_id_fkey(*, users!inner(name, email))")
    .eq("id", sessionId)
    .single();
  return session;
}

async function getExistingReview(sessionId: string) {
  const supabase = createClient();
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
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const session = await getSession(params.id);
  if (!session || session.client_id !== user.id) notFound();

  const therapist = session.therapist_profile?.users as unknown as {
    name: string;
    email: string;
  } | null;
  const therapistUserId = session.therapist_id;
  const scheduledAt = new Date(session.scheduled_at);
  const isUpcoming = ["confirmed", "pending_payment"].includes(session.status);
  const isActive = session.status === "active";
  const isCompleted = session.status === "completed";
  const isCancelled = session.status === "cancelled";
  const canJoin = (isUpcoming || isActive) && (session.daily_room_url || session.mirotalk_room_url);

  const existingReview = isCompleted ? await getExistingReview(params.id) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Link
          href="/my-sessions"
          className="mb-6 inline-flex items-center text-sm text-warm-gray hover:text-foreground transition-colors"
        >
          ← Back to sessions
        </Link>

        <h1 className="mb-6 font-heading text-3xl font-medium text-foreground">
          Session Details
        </h1>

        <div className="space-y-4">
          <div className="rounded-card border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-foreground">
                {therapist?.name || "Professional"}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : session.status === "confirmed"
                    ? "bg-light-moss text-foreground"
                    : session.status === "pending_payment"
                    ? "bg-primary/10 text-primary"
                    : isCompleted
                    ? "bg-accent/10 text-accent"
                    : "bg-surface text-warm-gray"
                }`}
              >
                {isActive
                  ? "In Progress"
                  : session.status === "confirmed"
                  ? "Confirmed"
                  : session.status === "pending_payment"
                  ? "Pending Payment"
                  : isCompleted
                  ? "Completed"
                  : isCancelled
                  ? "Cancelled"
                  : session.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-warm-gray" />
                <span className="text-sm text-foreground">
                  {scheduledAt.toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-warm-gray" />
                <span className="text-sm text-foreground">
                  {scheduledAt.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  ({session.duration_min} min)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-warm-gray" />
                <span className="text-sm text-foreground">
                  {session.payment_status === "free_first_session"
                    ? "Free Session"
                    : session.payment_status === "paid"
                    ? `€${((session.amount_paid_cents || 0) / 100).toFixed(2)}`
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
      </div>
    </div>
  );
}

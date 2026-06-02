import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, CalendarDays, Clock, XCircle, CreditCard } from "lucide-react";
import { createStripeCheckout } from "@/app/actions/stripe";

export const dynamic = "force-dynamic";

export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: { sessionId?: string; payment?: string };
}) {
  if (!searchParams.sessionId) redirect("/my-sessions");

  const supabase = createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, therapist_profile!sessions_therapist_id_fkey(*, users!inner(name))")
    .eq("id", searchParams.sessionId)
    .single();

  if (!session) redirect("/my-sessions");

  const scheduledAt = new Date(session.scheduled_at);
  const therapist = session.therapist_profile?.users;
  const therapistName = (therapist as unknown as { name: string })?.name || "Professional";

  const paymentStatus = searchParams.payment;

  const isCancelled = paymentStatus === "cancelled";
  const isPaid = paymentStatus === "success";
  const isFree = session.payment_status === "free_first_session";
  const isConfirmed = session.status === "confirmed";
  const isPending = session.payment_status === "pending" && !isPaid;

  const heading = isCancelled
    ? "Payment Cancelled"
    : isFree
    ? "Free Session Booked!"
    : isPaid || isConfirmed
    ? "Session Confirmed!"
    : isPending
    ? "Complete Payment"
    : "Session Booked!";

  const subtitle = isCancelled
    ? "Your session is pending payment. Complete payment to confirm."
    : isFree || isPaid || isConfirmed
    ? "Your session has been confirmed. See you there!"
    : "Complete payment to confirm your session.";

  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Session+with+${encodeURIComponent(therapistName)}&dates=${scheduledAt.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${new Date(scheduledAt.getTime() + session.duration_min * 60000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${scheduledAt.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTEND:${new Date(scheduledAt.getTime() + session.duration_min * 60000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z
SUMMARY:Session with ${therapistName}
DESCRIPTION:Session via Somove
END:VEVENT
END:VCALENDAR`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              isCancelled ? "bg-destructive/10" : "bg-accent/10"
            }`}
          >
            {isCancelled ? (
              <XCircle className="h-8 w-8 text-destructive" />
            ) : (
              <CheckCircle className="h-8 w-8 text-accent" />
            )}
          </div>
        </div>

        <h1 className="mb-2 font-heading text-3xl font-medium text-foreground">
          {heading}
        </h1>
        <p className="mb-8 text-warm-gray">{subtitle}</p>

        <div className="mb-8 rounded-card border border-border bg-card p-5 text-left">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-warm-gray">Date</p>
                <p className="font-medium text-foreground">
                  {scheduledAt.toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-warm-gray">Time</p>
                <p className="font-medium text-foreground">
                  {scheduledAt.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  ({session.duration_min} min)
                </p>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm text-warm-gray">Professional</p>
              <p className="font-medium text-foreground">{therapistName}</p>
            </div>
            {session.payment_status === "paid" && (
              <div className="border-t border-border pt-3">
                <p className="text-sm text-warm-gray">Payment</p>
                <p className="font-medium text-foreground">
                  €{(session.amount_paid_cents / 100).toFixed(0)} — Confirmed
                </p>
              </div>
            )}
          </div>
        </div>

        {isPending && (
          <div className="mb-6">
            <form
              action={async () => {
                "use server";
                const result = await createStripeCheckout(session.id);
                if (result.url) {
                  redirect(result.url);
                }
              }}
            >
              <Button type="submit" className="w-full" size="lg">
                <CreditCard className="mr-2 h-4 w-4" />
                Complete Payment — €{(session.amount_paid_cents / 100).toFixed(0)}
              </Button>
            </form>
          </div>
        )}

        {(isPaid || isFree || isConfirmed) && (
          <div className="mb-8 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-warm-gray">
              Add to calendar
            </p>
            <div className="flex gap-2">
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full" size="sm">
                  Google Calendar
                </Button>
              </a>
              <a
                href={`data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`}
                download="session.ics"
                className="flex-1"
              >
                <Button variant="outline" className="w-full" size="sm">
                  Download .ics
                </Button>
              </a>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link href="/my-sessions">
            <Button className="w-full">View My Sessions</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="w-full">
              Browse More Professionals
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

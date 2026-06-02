import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { CalClient } from "@/lib/cal";
import BookingForm from "./booking-form";

export const dynamic = "force-dynamic";

async function getTherapist(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("therapist_profile")
    .select("*, users!inner(id, name, email)")
    .eq("user_id", id)
    .eq("status", "active")
    .single();
  return data;
}

async function getExistingBookings(therapistId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("sessions")
    .select("scheduled_at, duration_min")
    .eq("therapist_id", therapistId)
    .in("status", ["confirmed", "pending_payment", "active"]);
  return data || [];
}

async function hasClientBookedBefore(clientId: string, therapistId: string) {
  const supabase = createClient();
  const { count } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("therapist_id", therapistId);
  return (count || 0) > 0;
}

async function getSessionTypes(therapistId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("session_types")
    .select("*")
    .eq("therapist_id", therapistId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  return data || [];
}

async function getClientCredits(clientId: string, therapistId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("session_credits")
    .select("id, remaining_credits, total_credits")
    .eq("client_id", clientId)
    .eq("therapist_id", therapistId)
    .gt("remaining_credits", 0);
  return data || [];
}

async function getTherapistToS(therapistId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("therapist_profile")
    .select("tos_text, tos_version")
    .eq("user_id", therapistId)
    .single();
  return data;
}

async function hasAcceptedToS(clientId: string, therapistId: string, tosVersion: number) {
  const supabase = createClient();
  const { count } = await supabase
    .from("terms_acceptances")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("therapist_id", therapistId)
    .eq("tos_version", tosVersion);
  return (count || 0) > 0;
}

async function fetchCalSlots(apiKey: string, eventTypeId: string) {
  const calClient = new CalClient(apiKey);
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 28);

  const result = await calClient.getSlots(
    parseInt(eventTypeId),
    start.toISOString(),
    end.toISOString()
  );

  return result;
}

export default async function BookSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const therapist = await getTherapist(params.id);
  if (!therapist || !user) notFound();

  const existingBookings = await getExistingBookings(params.id);
  const hasBooked = await hasClientBookedBefore(user.id, params.id);
  const canUseFreeSession = therapist.free_first_session && !hasBooked;

  const userName = (therapist.users as unknown as { name: string })?.name;

  const sessionTypes = await getSessionTypes(params.id);
  const clientCredits = await getClientCredits(user.id, params.id);
  const totalCredits = clientCredits.reduce((sum, c) => sum + c.remaining_credits, 0);

  const therapistTos = await getTherapistToS(params.id);
  const hasTos = !!(therapistTos?.tos_text && therapistTos.tos_text.trim());
  const tosAccepted = hasTos ? await hasAcceptedToS(user.id, params.id, therapistTos.tos_version) : true;

  const hasCalIntegration = !!(therapist.cal_api_key && therapist.cal_event_type_id);
  let calSlots = null;
  let calError = null;

  if (hasCalIntegration) {
    const result = await fetchCalSlots(
      therapist.cal_api_key!,
      therapist.cal_event_type_id!
    );
    if (result.error) {
      calError = result.error.message;
    } else {
      calSlots = result.data;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Link
          href={`/therapists/${params.id}`}
          className="mb-6 inline-flex items-center text-sm text-warm-gray hover:text-foreground transition-colors"
        >
          ← Back to profile
        </Link>

        <h1 className="mb-2 mt-4 font-heading text-3xl font-medium text-foreground">
          Book a Session
        </h1>
        <p className="mb-8 text-warm-gray">with {userName}</p>

        <div className="mb-6 space-y-3">
          {canUseFreeSession && (
            <div className="flex items-center gap-3 rounded-card border border-accent/30 bg-accent/5 p-4">
              <CreditCard className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-foreground">Free First Session</p>
                <p className="text-sm text-warm-gray">Available for your first booking</p>
              </div>
            </div>
          )}
          {totalCredits > 0 && (
            <div className="flex items-center gap-3 rounded-card border border-border bg-card p-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  {totalCredits} {totalCredits === 1 ? "Session Credit" : "Session Credits"}
                </p>
                <p className="text-sm text-warm-gray">Use credits instead of paying</p>
              </div>
            </div>
          )}
        </div>

        {calError && (
          <div className="mb-6 rounded-card border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">
              Scheduling service temporarily unavailable: {calError}
            </p>
            <p className="mt-1 text-xs text-warm-gray">
              Please try again later or contact support.
            </p>
          </div>
        )}

        <BookingForm
          therapistId={params.id}
          durationMin={therapist.default_session_duration}
          priceCents={therapist.session_price_cents || 0}
          canUseFreeSession={canUseFreeSession}
          availabilityRules={therapist.availability_rules}
          existingBookings={existingBookings}
          timezone={therapist.timezone || "Europe/Lisbon"}
          calSlots={calSlots}
          useCalIntegration={hasCalIntegration && !calError}
          sessionTypes={sessionTypes}
          availableCredits={totalCredits}
          hasTos={hasTos}
          tosAccepted={tosAccepted}
          tosText={therapistTos?.tos_text || null}
          tosVersion={therapistTos?.tos_version || 1}
        />
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CreditCard } from "lucide-react";
import { CalClient } from "@/lib/cal";
import BookingForm from "./booking-form";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

interface TherapistUser {
  name: string;
}

async function getTherapist(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("therapist_profile")
    .select("*, users!inner(id, name, email)")
    .eq("user_id", id)
    .eq("status", "active")
    .single();
  if (error || !data) notFound();
  return data;
}

async function getExistingBookings(therapistId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("scheduled_at, duration_min")
    .eq("therapist_id", therapistId)
    .in("status", ["confirmed", "pending_payment", "active"]);
  return data || [];
}

async function hasClientBookedBefore(clientId: string, therapistId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("therapist_id", therapistId);
  return (count || 0) > 0;
}

async function getSessionTypes(therapistId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("session_types")
    .select("*")
    .eq("therapist_id", therapistId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  return data || [];
}

async function getClientCredits(clientId: string, therapistId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("session_credits")
    .select("id, remaining_credits, total_credits")
    .eq("client_id", clientId)
    .eq("therapist_id", therapistId)
    .gt("remaining_credits", 0);
  return data || [];
}

async function getTherapistToS(therapistId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("therapist_profile")
    .select("tos_text, tos_version")
    .eq("user_id", therapistId)
    .single();
  return data;
}

async function hasAcceptedToS(clientId: string, therapistId: string, tosVersion: number) {
  const supabase = await createClient();
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
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const therapist = await getTherapist(id);
  if (!therapist || !user) notFound();

  const existingBookings = await getExistingBookings(id);
  const hasBooked = await hasClientBookedBefore(user.id, id);
  const canUseFreeSession = therapist.free_first_session && !hasBooked;

  const userName = (therapist.users as TherapistUser)?.name;

  const sessionTypes = await getSessionTypes(id);
  const clientCredits = await getClientCredits(user.id, id);
  const totalCredits = clientCredits.reduce((sum, c) => sum + c.remaining_credits, 0);

  const therapistTos = await getTherapistToS(id);
  const hasTos = !!(therapistTos?.tos_text && therapistTos.tos_text.trim());
  const tosAccepted = hasTos ? await hasAcceptedToS(user.id, id, therapistTos.tos_version) : true;

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
    <PageContainer width="narrow">
      <PageHeader
        backHref={`/therapists/${id}`}
        title="Book a Session"
        description={`with ${userName}`}
      />

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
        therapistId={id}
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
    </PageContainer>
  );
}

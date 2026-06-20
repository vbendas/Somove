"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CalClient } from "@/lib/cal";

interface CreateSessionInput {
  therapistId: string;
  scheduledAt: string;
  durationMin: number;
  sessionType: "single" | "free_first_session";
  priceCents: number;
  timeZone?: string;
  sessionTypeId?: string;
  useCredits?: boolean;
}

export async function createSession(input: CreateSessionInput) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  // Validate scheduledAt is in the future
  if (new Date(input.scheduledAt) <= new Date()) {
    return { error: "Cannot book a session in the past." };
  }

  // Validate therapist has an active therapist profile
  const { data: therapistProfile } = await supabase
    .from("therapist_profile")
    .select("session_price_cents, status, users!inner(name)")
    .eq("user_id", input.therapistId)
    .single();

  if (!therapistProfile || therapistProfile.status !== "active") {
    return { error: "Therapist profile not found or inactive." };
  }

  const therapistNameRaw = therapistProfile.users as unknown as
    | { name: string }
    | { name: string }[]
    | null;
  const therapistName =
    (Array.isArray(therapistNameRaw) ? therapistNameRaw[0]?.name : therapistNameRaw?.name) ||
    "Professional";

  // Server-side price validation: derive canonical price, never trust client
  let canonicalPriceCents: number;
  if (input.sessionTypeId) {
    const { data: sessionType } = await supabase
      .from("session_types")
      .select("price_cents, is_active")
      .eq("id", input.sessionTypeId)
      .eq("therapist_id", input.therapistId)
      .single();
    if (!sessionType || !sessionType.is_active) {
      return { error: "Invalid session type." };
    }
    canonicalPriceCents = sessionType.price_cents;
  } else {
    canonicalPriceCents = therapistProfile.session_price_cents || 0;
  }

  const { data: clientUser } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .single();

  const paymentStatus = input.sessionType === "free_first_session"
    ? "free_first_session"
    : input.useCredits
    ? "paid"
    : "pending";
  const status = input.sessionType === "free_first_session" || input.useCredits
    ? "confirmed"
    : "pending_payment";

  // Fetch therapist secrets via admin client (secrets no longer on therapist_profile)
  const admin = createAdminClient();
  const { data: secrets } = await admin
    .from("therapist_secrets")
    .select("cal_api_key, cal_event_type_id, stripe_secret_key, daily_api_key, resend_api_key, mirotalk_api_key, mirotalk_url")
    .eq("user_id", input.therapistId)
    .single();

  // Atomically decrement credit if useCredits; fail if no credit available
  let creditId: string | null = null;
  if (input.useCredits) {
    const { data: creditOk, error: creditError } = await supabase.rpc(
      "decrement_credit",
      {
        p_client_id: user.id,
        p_therapist_id: input.therapistId,
      }
    );

    if (creditError || !creditOk) {
      return { error: "No session credits available." };
    }

    const { data: usedCredit } = await supabase
      .from("session_credits")
      .select("id")
      .eq("client_id", user.id)
      .eq("therapist_id", input.therapistId)
      .gt("remaining_credits", 0)
      .order("purchased_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    creditId = usedCredit?.id || null;
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      client_id: user.id,
      therapist_id: input.therapistId,
      session_type_id: input.sessionTypeId || null,
      scheduled_at: input.scheduledAt,
      duration_min: input.durationMin,
      status,
      payment_status: paymentStatus,
      amount_paid_cents: paymentStatus === "free_first_session" || paymentStatus === "paid" ? 0 : canonicalPriceCents,
      currency: "EUR",
      tos_version: null,
    })
    .select("id")
    .single();

  if (error) {
    // Roll back credit decrement on insert failure
    if (input.useCredits) {
      await supabase.rpc("restore_credit", {
        p_client_id: user.id,
        p_therapist_id: input.therapistId,
      });
    }
    return { error: error.message };
  }

  if (input.useCredits && creditId) {
    await supabase.from("sessions").update({ credit_id: creditId }).eq("id", session.id);
  }

  // Roll back credit decrement if anything downstream fails
  let rolledBackCredit = false;
  const rollbackCredit = async () => {
    if (input.useCredits && !rolledBackCredit) {
      rolledBackCredit = true;
      await supabase.rpc("restore_credit", {
        p_client_id: user.id,
        p_therapist_id: input.therapistId,
      });
    }
  };

  if (secrets?.cal_api_key && secrets?.cal_event_type_id) {
    const calClient = new CalClient(secrets.cal_api_key);

    const calBookingResult = await calClient.createBooking({
      eventTypeId: parseInt(secrets.cal_event_type_id),
      start: new Date(input.scheduledAt).toISOString(),
      attendee: {
        name: clientUser?.name || "Client",
        email: clientUser?.email || "",
        timeZone: input.timeZone || "Europe/Lisbon",
      },
      metadata: {
        somove_session_id: session.id,
        somove_client_id: user.id,
      },
    });

    if (calBookingResult.error) {
      await supabase.from("sessions").delete().eq("id", session.id);
      await rollbackCredit();
      return {
        error: `Booking failed: ${calBookingResult.error.message}. Please try again.`,
      };
    }

    if (calBookingResult.data?.uid) {
      await supabase
        .from("sessions")
        .update({ cal_booking_uid: calBookingResult.data.uid })
        .eq("id", session.id);
    }
  }

  if (input.sessionType !== "free_first_session" && !input.useCredits) {
    const stripeKey = secrets?.stripe_secret_key || process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      const { StripeClient } = await import("@/lib/stripe");
      const stripeClient = new StripeClient(stripeKey);

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      let productName = `Session with ${therapistName}`;
      if (input.sessionTypeId) {
        const { data: sessionType } = await supabase
          .from("session_types")
          .select("name, is_bundle, bundle_sessions")
          .eq("id", input.sessionTypeId)
          .single();
        if (sessionType) {
          productName = sessionType.is_bundle
            ? `${sessionType.name} (${sessionType.bundle_sessions} sessions)`
            : sessionType.name;
        }
      }

      const checkoutResult = await stripeClient.createCheckoutSession({
        lineItems: [
          {
            priceData: {
              currency: "eur",
              productData: {
                name: productName,
                description: `${input.durationMin} min session with ${therapistName}`,
              },
              unitAmount: canonicalPriceCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        successUrl: `${siteUrl}/booking/confirmed?sessionId=${session.id}&payment=success`,
        cancelUrl: `${siteUrl}/booking/confirmed?sessionId=${session.id}&payment=cancelled`,
        customerEmail: clientUser?.email,
        metadata: {
          somove_session_id: session.id,
          somove_client_id: user.id,
          somove_therapist_id: input.therapistId,
          somove_session_type_id: input.sessionTypeId || "",
          somove_is_bundle: input.sessionTypeId ? "true" : "false",
        },
      });

      if (checkoutResult.error) {
        await supabase.from("sessions").delete().eq("id", session.id);
        await rollbackCredit();
        return { error: `Payment setup failed: ${checkoutResult.error.message}` };
      }

      await supabase
        .from("sessions")
        .update({ stripe_checkout_id: checkoutResult.data?.sessionId })
        .eq("id", session.id);

      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("therapist_id", input.therapistId)
        .eq("client_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!existingConv) {
        await supabase.from("conversations").insert({
          therapist_id: input.therapistId,
          client_id: user.id,
        });
      }

      redirect(checkoutResult.data?.url || "/booking/confirmed?sessionId=" + session.id);
    }
  }

  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .eq("therapist_id", input.therapistId)
    .eq("client_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!existingConv) {
    await supabase.from("conversations").insert({
      therapist_id: input.therapistId,
      client_id: user.id,
    });
  }

  const { createSessionRoom } = await import("@/app/actions/session");
  createSessionRoom(session.id).catch(() => {});

  const { notifyBookingConfirmed } = await import("@/app/actions/notifications");
  notifyBookingConfirmed(session.id).catch(() => {});

  revalidatePath("/my-sessions");
  redirect(`/booking/confirmed?sessionId=${session.id}`);
}

export async function getClientSessions() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("sessions")
    .select("*, therapist_profile!sessions_therapist_id_fkey(*, users!inner(name, email))")
    .eq("client_id", user.id)
    .order("scheduled_at", { ascending: false });

  return data || [];
}

export async function getTherapistSessions() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("sessions")
    .select("*, users!sessions_client_id_fkey(name, email)")
    .eq("therapist_id", user.id)
    .order("scheduled_at", { ascending: false });

  return data || [];
}

export async function getTodaySessions() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data } = await supabase
    .from("sessions")
    .select("*, users!sessions_client_id_fkey(name, email)")
    .eq("therapist_id", user.id)
    .gte("scheduled_at", today.toISOString())
    .lt("scheduled_at", tomorrow.toISOString())
    .in("status", ["confirmed", "active"])
    .order("scheduled_at", { ascending: true });

  return data || [];
}

export async function cancelSession(sessionId: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  // Fetch session with ownership scoping — authorization happens BEFORE side effects
  const { data: session, error: fetchError } = await supabase
    .from("sessions")
    .select("cal_booking_uid, stripe_payment_intent_id, payment_status, therapist_id, client_id, session_type_id, scheduled_at, status")
    .eq("id", sessionId)
    .or(`client_id.eq.${user.id},therapist_id.eq.${user.id}`)
    .single();

  if (fetchError || !session) {
    return { error: "Session not found or you don't have permission to cancel it." };
  }

  // Don't allow cancelling already-completed or cancelled sessions
  if (session.status === "completed" || session.status === "cancelled") {
    return { error: "This session cannot be cancelled." };
  }

  // Now safe to proceed with update and side effects
  const { error } = await supabase
    .from("sessions")
    .update({ status: "cancelled" })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  // Fetch therapist secrets via admin client for API calls
  const admin = createAdminClient();
  const { data: secrets } = await admin
    .from("therapist_secrets")
    .select("cal_api_key, stripe_secret_key")
    .eq("user_id", session.therapist_id)
    .single();

  if (session?.cal_booking_uid) {
    if (secrets?.cal_api_key) {
      const calClient = new CalClient(secrets.cal_api_key);
      await calClient.cancelBooking(session.cal_booking_uid);
    }
  }

  // 24-hour refund policy
  const sessionDate = new Date(session.scheduled_at);
  const hoursUntil = (sessionDate.getTime() - Date.now()) / (1000 * 60 * 60);
  const isTherapistCancelling = session.therapist_id === user.id;

  // Therapist cancels: always full refund
  // Client cancels >24h: full refund
  // Client cancels <24h: no refund
  const eligibleForRefund = isTherapistCancelling || hoursUntil > 24;

  // Only refund via Stripe if session was paid with Stripe (not credits)
  if (
    eligibleForRefund &&
    session?.stripe_payment_intent_id &&
    session.payment_status === "paid"
  ) {
    const refundStripeKey = secrets?.stripe_secret_key || process.env.STRIPE_SECRET_KEY;
    if (refundStripeKey) {
      const { StripeClient } = await import("@/lib/stripe");
      const stripeClient = new StripeClient(refundStripeKey);
      const refundResult = await stripeClient.createRefund(session.stripe_payment_intent_id);
      if (refundResult.error) {
        console.error("Refund failed:", refundResult.error);
        // Don't mark as refunded, but session is still cancelled
      } else {
        await supabase
          .from("sessions")
          .update({ payment_status: "refunded" })
          .eq("id", sessionId);

        await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("session_id", sessionId)
          .eq("stripe_payment_intent_id", session.stripe_payment_intent_id);
      }
    }
  }

  // Only restore credit if session was paid with credits (not Stripe)
  if (
    eligibleForRefund &&
    session?.payment_status === "paid" &&
    session?.session_type_id &&
    !session?.stripe_payment_intent_id
  ) {
    await supabase.rpc("restore_credit", {
      p_client_id: user.id,
      p_therapist_id: session.therapist_id,
    });
  }

  const { notifySessionCancelled } = await import("@/app/actions/notifications");
  notifySessionCancelled(sessionId).catch(() => {});

  revalidatePath("/my-sessions");
  revalidatePath("/dashboard");
  return { success: true };
}

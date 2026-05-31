"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalClient } from "@/lib/cal";

interface CreateSessionInput {
  therapistId: string;
  scheduledAt: string;
  durationMin: number;
  sessionType: "single" | "free_first_session";
  priceCents: number;
  timeZone?: string;
}

export async function createSession(input: CreateSessionInput) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { data: clientUser } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .single();

  const paymentStatus = input.sessionType === "free_first_session" ? "free_first_session" : "pending";
  const status = input.sessionType === "free_first_session" ? "confirmed" : "pending_payment";

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      client_id: user.id,
      therapist_id: input.therapistId,
      scheduled_at: input.scheduledAt,
      duration_min: input.durationMin,
      status,
      payment_status: paymentStatus,
      amount_paid_cents: input.sessionType === "free_first_session" ? 0 : input.priceCents,
      currency: "EUR",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  const { data: therapistProfile } = await supabase
    .from("therapist_profile")
    .select("cal_api_key, cal_event_type_id, stripe_secret_key, users!inner(name)")
    .eq("user_id", input.therapistId)
    .single();

  if (
    therapistProfile?.cal_api_key &&
    therapistProfile?.cal_event_type_id
  ) {
    const calClient = new CalClient(therapistProfile.cal_api_key);

    const calBookingResult = await calClient.createBooking({
      eventTypeId: parseInt(therapistProfile.cal_event_type_id),
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

  if (input.sessionType !== "free_first_session") {
    const profile = therapistProfile as unknown as {
      stripe_secret_key: string | null;
      users: { name: string } | null;
    };

    if (profile?.stripe_secret_key) {
      const { StripeClient } = await import("@/lib/stripe");
      const stripeClient = new StripeClient(profile.stripe_secret_key);

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      const checkoutResult = await stripeClient.createCheckoutSession({
        lineItems: [
          {
            priceData: {
              currency: "eur",
              productData: {
                name: `Session with ${profile.users?.name || "Therapist"}`,
                description: `${input.durationMin} min somatic therapy session`,
              },
              unitAmount: input.priceCents,
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
        },
      });

      if (checkoutResult.error) {
        await supabase.from("sessions").delete().eq("id", session.id);
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

  const { data: session } = await supabase
    .from("sessions")
    .select("cal_booking_uid, stripe_payment_intent_id, payment_status, therapist_id")
    .eq("id", sessionId)
    .single();

  const { error } = await supabase
    .from("sessions")
    .update({ status: "cancelled" })
    .eq("id", sessionId)
    .or(`client_id.eq.${user.id},therapist_id.eq.${user.id}`);

  if (error) return { error: error.message };

  if (session?.cal_booking_uid) {
    const { data: therapistProfile } = await supabase
      .from("therapist_profile")
      .select("cal_api_key")
      .eq("user_id", session.therapist_id)
      .single();

    if (therapistProfile?.cal_api_key) {
      const calClient = new CalClient(therapistProfile.cal_api_key);
      await calClient.cancelBooking(session.cal_booking_uid);
    }
  }

  if (session?.stripe_payment_intent_id && session.payment_status === "paid") {
    const { data: therapistProfile } = await supabase
      .from("therapist_profile")
      .select("stripe_secret_key")
      .eq("user_id", session.therapist_id)
      .single();

    if (therapistProfile?.stripe_secret_key) {
      const { StripeClient } = await import("@/lib/stripe");
      const stripeClient = new StripeClient(therapistProfile.stripe_secret_key);
      await stripeClient.createRefund(session.stripe_payment_intent_id);
    }

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

  revalidatePath("/my-sessions");
  revalidatePath("/dashboard");
  return { success: true };
}

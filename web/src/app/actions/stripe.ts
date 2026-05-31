"use server";

import { StripeClient } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function testStripeConnection(secretKey: string) {
  const stripeClient = new StripeClient(secretKey);
  const result = await stripeClient.testConnection();
  return result;
}

export async function createStripeCheckout(sessionId: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data: session } = await supabase
    .from("sessions")
    .select("*, users!sessions_client_id_fkey(name, email), therapist_profile!sessions_therapist_id_fkey(stripe_secret_key, users!inner(name))")
    .eq("id", sessionId)
    .single();

  if (!session) return { error: "Session not found." };

  const profile = session.therapist_profile as unknown as {
    stripe_secret_key: string | null;
    users: { name: string } | null;
  };

  if (!profile?.stripe_secret_key) {
    return { error: "Therapist has not configured Stripe." };
  }

  const client = session.users as unknown as { name: string; email: string } | null;
  const therapistName = profile.users?.name || "Therapist";

  const stripeClient = new StripeClient(profile.stripe_secret_key);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const result = await stripeClient.createCheckoutSession({
    lineItems: [
      {
        priceData: {
          currency: "eur",
          productData: {
            name: `Session with ${therapistName}`,
            description: `${session.duration_min} min somatic therapy session`,
          },
          unitAmount: session.amount_paid_cents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    successUrl: `${siteUrl}/booking/confirmed?sessionId=${session.id}&payment=success`,
    cancelUrl: `${siteUrl}/booking/confirmed?sessionId=${session.id}&payment=cancelled`,
    customerEmail: client?.email,
    metadata: {
      somove_session_id: session.id,
      somove_client_id: session.client_id,
      somove_therapist_id: session.therapist_id,
    },
  });

  if (result.error) {
    return { error: result.error.message };
  }

  if (!result.data) {
    return { error: "No checkout session created" };
  }

  await supabase
    .from("sessions")
    .update({ stripe_checkout_id: result.data.sessionId })
    .eq("id", sessionId);

  return { url: result.data.url };
}

export async function processRefund(sessionId: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data: session } = await supabase
    .from("sessions")
    .select("stripe_payment_intent_id, therapist_id, therapist_profile!sessions_therapist_id_fkey(stripe_secret_key)")
    .eq("id", sessionId)
    .single();

  if (!session) return { error: "Session not found." };

  if (!session.stripe_payment_intent_id) {
    return { error: "No payment to refund." };
  }

  const profile = session.therapist_profile as unknown as {
    stripe_secret_key: string | null;
  };

  if (!profile?.stripe_secret_key) {
    return { error: "Therapist Stripe not configured." };
  }

  const stripeClient = new StripeClient(profile.stripe_secret_key);
  const refundResult = await stripeClient.createRefund(session.stripe_payment_intent_id);

  if (refundResult.error) {
    return { error: refundResult.error.message };
  }

  await supabase
    .from("sessions")
    .update({
      payment_status: "refunded",
      status: "cancelled",
    })
    .eq("id", sessionId);

  await supabase
    .from("payments")
    .update({ status: "refunded" })
    .eq("session_id", sessionId)
    .eq("stripe_payment_intent_id", session.stripe_payment_intent_id);

  return { success: true };
}

export async function saveStripeIntegration(stripeSecretKey: string, stripeWebhookSecret: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("therapist_profile")
    .update({
      stripe_secret_key: stripeSecretKey || null,
      stripe_webhook_secret: stripeWebhookSecret || null,
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

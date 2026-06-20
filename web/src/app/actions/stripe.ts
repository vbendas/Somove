"use server";

import { StripeClient } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const PLATFORM_FEE_PERCENT = 10;

function getPlatformStripe(): StripeClient | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new StripeClient(key);
}

export async function createOrGetConnectedAccount(): Promise<
  { accountId: string } | { error: string }
> {
  const stripe = getPlatformStripe();
  if (!stripe) return { error: "Stripe platform not configured" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("therapist_profile")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (profile?.stripe_account_id) {
    return { accountId: profile.stripe_account_id };
  }

  const result = await stripe.createConnectedAccount(user.email || "");
  if (result.error) return { error: result.error.message };

  await supabase
    .from("therapist_profile")
    .update({ stripe_account_id: result.data!.accountId })
    .eq("user_id", user.id);

  return { accountId: result.data!.accountId };
}

export async function getOnboardingLink(): Promise<
  { url: string } | { error: string }
> {
  const stripe = getPlatformStripe();
  if (!stripe) return { error: "Stripe platform not configured" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("therapist_profile")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return { error: "No Stripe account found. Please create one first." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const result = await stripe.createOnboardingLink(
    profile.stripe_account_id,
    `${siteUrl}/dashboard/settings?onboarding=refresh`,
    `${siteUrl}/dashboard/settings?onboarding=complete`
  );

  if (result.error) return { error: result.error.message };
  return { url: result.data!.url };
}

export async function refreshAccountStatus(): Promise<
  { chargesEnabled: boolean; payoutsEnabled: boolean } | { error: string }
> {
  const stripe = getPlatformStripe();
  if (!stripe) return { error: "Stripe platform not configured" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("therapist_profile")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return { error: "No Stripe account found" };
  }

  const result = await stripe.getAccountStatus(profile.stripe_account_id);
  if (result.error) return { error: result.error.message };

  await supabase
    .from("therapist_profile")
    .update({
      stripe_onboarding_done:
        result.data!.chargesEnabled && result.data!.payoutsEnabled,
      stripe_payouts_enabled: result.data!.payoutsEnabled,
    })
    .eq("user_id", user.id);

  return {
    chargesEnabled: result.data!.chargesEnabled,
    payoutsEnabled: result.data!.payoutsEnabled,
  };
}

export async function getDashboardLink(): Promise<
  { url: string } | { error: string }
> {
  const stripe = getPlatformStripe();
  if (!stripe) return { error: "Stripe platform not configured" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("therapist_profile")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return { error: "No Stripe account found" };
  }

  const result = await stripe.createDashboardLink(profile.stripe_account_id);
  if (result.error) return { error: result.error.message };
  return { url: result.data!.url };
}

export async function createStripeCheckout(sessionId: string) {
  const stripe = getPlatformStripe();
  if (!stripe) return { error: "Stripe platform not configured" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: session } = await supabase
    .from("sessions")
    .select(
      "*, users!sessions_client_id_fkey(name, email), therapist_profile!sessions_therapist_id_fkey(stripe_account_id, stripe_payouts_enabled, users!inner(name))"
    )
    .eq("id", sessionId)
    .single();

  if (!session) return { error: "Session not found" };

  const profile = session.therapist_profile as unknown as {
    stripe_account_id: string | null;
    stripe_payouts_enabled: boolean;
    users: { name: string } | null;
  };

  if (!profile?.stripe_account_id) {
    return { error: "Therapist has not connected their bank account" };
  }

  if (!profile.stripe_payouts_enabled) {
    return {
      error: "Therapist has not completed Stripe onboarding yet",
    };
  }

  const client = session.users as unknown as { name: string; email: string } | null;
  const therapistName = profile.users?.name || "Professional";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const platformFee = Math.round(session.amount_paid_cents * (PLATFORM_FEE_PERCENT / 100));

  let productName = `Session with ${therapistName}`;
  if (session.session_type_id) {
    const { data: st } = await supabase
      .from("session_types")
      .select("name, is_bundle, bundle_sessions")
      .eq("id", session.session_type_id)
      .single();
    if (st) {
      productName = st.is_bundle
        ? `${st.name} (${st.bundle_sessions} sessions)`
        : st.name;
    }
  }

  const result = await stripe.createConnectedCheckout({
    amount: session.amount_paid_cents,
    currency: "eur",
    connectedAccountId: profile.stripe_account_id,
    applicationFeeAmount: platformFee,
    metadata: {
      somove_session_id: session.id,
      somove_client_id: session.client_id,
      somove_therapist_id: session.therapist_id,
      somove_platform_fee: String(platformFee),
    },
    successUrl: `${siteUrl}/booking/confirmed?sessionId=${session.id}&payment=success`,
    cancelUrl: `${siteUrl}/booking/confirmed?sessionId=${session.id}&payment=cancelled`,
    customerEmail: client?.email,
    productName,
    productDescription: `${session.duration_min} min somatic therapy session`,
  });

  if (result.error) return { error: result.error.message };
  if (!result.data) return { error: "No checkout session created" };

  await supabase
    .from("sessions")
    .update({ stripe_checkout_id: result.data.sessionId })
    .eq("id", sessionId);

  return { url: result.data.url };
}

export async function processRefund(sessionId: string) {
  const stripe = getPlatformStripe();
  if (!stripe) return { error: "Stripe platform not configured" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: session } = await supabase
    .from("sessions")
    .select("id, therapist_id, client_id, stripe_payment_intent_id, payment_status")
    .eq("id", sessionId)
    .single();

  if (!session) return { error: "Session not found" };

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (session.therapist_id !== user.id && userData?.role !== "admin") {
    return { error: "Only the therapist or admin can issue refunds." };
  }

  if (!session.stripe_payment_intent_id) return { error: "No payment to refund" };

  const refundResult = await stripe.createRefund(session.stripe_payment_intent_id);
  if (refundResult.error) return { error: refundResult.error.message };

  await supabase
    .from("sessions")
    .update({ payment_status: "refunded", status: "cancelled" })
    .eq("id", sessionId);

  await supabase
    .from("payments")
    .update({ status: "refunded" })
    .eq("session_id", sessionId)
    .eq("stripe_payment_intent_id", session.stripe_payment_intent_id);

  return { success: true };
}

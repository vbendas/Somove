import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  const supabase = createAdminClient();
  const eventId = event.id;
  const eventType = event.type;

  switch (event.type) {
    case "checkout.session.completed": {
      const { data: existingEvent } = await supabase
        .from("stripe_events")
        .select("id")
        .eq("id", eventId)
        .single();

      if (existingEvent) {
        return NextResponse.json({ received: true });
      }

      const session = event.data.object as Stripe.Checkout.Session;
      const somoveSessionId = session.metadata?.somove_session_id;
      if (!somoveSessionId) break;

      const platformFee = parseInt(session.metadata?.somove_platform_fee || "0", 10);
      const totalAmount = session.amount_total || 0;

      await supabase
        .from("sessions")
        .update({
          payment_status: "paid",
          status: "confirmed",
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid_cents: totalAmount,
        })
        .eq("id", somoveSessionId);

      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("session_id", somoveSessionId)
        .maybeSingle();

      if (!existingPayment) {
        await supabase.from("payments").insert({
          client_id: session.metadata?.somove_client_id,
          therapist_id: session.metadata?.somove_therapist_id,
          session_id: somoveSessionId,
          amount_cents: totalAmount,
          platform_fee_cents: platformFee,
          therapist_net_cents: totalAmount - platformFee,
          currency: session.currency || "eur",
          method: "stripe",
          status: "confirmed",
          stripe_payment_intent_id: session.payment_intent as string,
        });
      }

      await supabase.from("stripe_events").insert({ id: eventId, type: eventType });

      const { createSessionRoom } = await import("@/app/actions/session");
      createSessionRoom(somoveSessionId, true).catch(() => {});

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const somoveSessionId = session.metadata?.somove_session_id;
      if (!somoveSessionId) break;

      await supabase
        .from("sessions")
        .update({
          payment_status: "failed",
          status: "cancelled",
        })
        .eq("id", somoveSessionId);

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("cal_booking_uid, therapist_id")
        .eq("id", somoveSessionId)
        .single();

      if (sessionData?.cal_booking_uid) {
        const { data: profile } = await supabase
          .from("therapist_profile")
          .select("cal_api_key")
          .eq("user_id", sessionData.therapist_id)
          .single();

        if (profile?.cal_api_key) {
          const { CalClient } = await import("@/lib/cal");
          const calClient = new CalClient(profile.cal_api_key);
          await calClient.cancelBooking(sessionData.cal_booking_uid);
        }
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;
      if (!paymentIntentId) break;

      const { data: session } = await supabase
        .from("sessions")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .single();

      if (!session) break;

      if (charge.amount_refunded >= charge.amount_captured) {
        await supabase
          .from("sessions")
          .update({
            payment_status: "refunded",
            status: "cancelled",
          })
          .eq("id", session.id);

        await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent_id", paymentIntentId)
          .eq("session_id", session.id);
      } else {
        await supabase
          .from("payments")
          .update({ status: "partially_refunded" })
          .eq("stripe_payment_intent_id", paymentIntentId)
          .eq("session_id", session.id);
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;

      await supabase
        .from("therapist_profile")
        .update({
          stripe_onboarding_done:
            (account.charges_enabled ?? false) &&
            (account.payouts_enabled ?? false),
          stripe_payouts_enabled: account.payouts_enabled ?? false,
        })
        .eq("stripe_account_id", account.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

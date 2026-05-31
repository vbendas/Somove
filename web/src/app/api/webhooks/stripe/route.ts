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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const somoveSessionId = session.metadata?.somove_session_id;
      if (!somoveSessionId) break;

      await supabase
        .from("sessions")
        .update({
          payment_status: "paid",
          status: "confirmed",
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid_cents: session.amount_total || 0,
        })
        .eq("id", somoveSessionId);

      await supabase.from("payments").insert({
        client_id: session.metadata?.somove_client_id,
        therapist_id: session.metadata?.somove_therapist_id,
        session_id: somoveSessionId,
        amount_cents: session.amount_total || 0,
        currency: session.currency || "eur",
        method: "stripe",
        status: "confirmed",
        stripe_payment_intent_id: session.payment_intent as string,
      });
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
      break;
    }
  }

  return NextResponse.json({ received: true });
}

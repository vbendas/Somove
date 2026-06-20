import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(request: Request) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  const signature = request.headers.get("cal-signature-256");

  if (!secret) {
    console.error("CAL_WEBHOOK_SECRET is not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  if (!signature) {
    return new Response("Missing signature", { status: 401 });
  }

  const body = await request.text();

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "BOOKING_CANCELLED": {
      const bookingUid = event.data?.uid;
      if (!bookingUid) break;

      const { data: session } = await supabase
        .from("sessions")
        .select("id, payment_status, session_type_id, stripe_payment_intent_id, client_id, therapist_id")
        .eq("cal_booking_uid", bookingUid)
        .single();

      if (session) {
        await supabase
          .from("sessions")
          .update({ status: "cancelled" })
          .eq("id", session.id);

        if (session.payment_status === "paid" && session.session_type_id && !session.stripe_payment_intent_id) {
          await supabase.rpc("restore_credit", {
            p_client_id: session.client_id,
            p_therapist_id: session.therapist_id,
          });
        }
      }
      break;
    }

    case "BOOKING_RESCHEDULED": {
      const newBooking = event.data;
      if (!newBooking?.uid || !newBooking?.start) break;

      const { data: session } = await supabase
        .from("sessions")
        .select("id")
        .eq("cal_booking_uid", newBooking.uid)
        .single();

      if (session) {
        await supabase
          .from("sessions")
          .update({ scheduled_at: newBooking.start })
          .eq("id", session.id);
      }
      break;
    }

    case "BOOKING_CREATED": {
      break;
    }
  }

  return NextResponse.json({ received: true });
}

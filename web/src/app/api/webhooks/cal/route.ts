import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(request: Request) {
  const body = await request.text();

  const signature = request.headers.get("cal-signature-256");
  const secret = process.env.CAL_WEBHOOK_SECRET;

  if (secret && signature) {
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature !== `sha256=${expectedSig}`) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
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
        .select("id")
        .eq("cal_booking_uid", bookingUid)
        .single();

      if (session) {
        await supabase
          .from("sessions")
          .update({ status: "cancelled" })
          .eq("id", session.id);
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

"use server";

import { createClient } from "@/lib/supabase/server";
import { getVideoProvider } from "@/lib/video";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

function generatePassword(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function createSessionRoom(
  sessionId: string
): Promise<{ joinUrl: string } | { error: string }> {
  const supabase = createClient();

  const { data: session, error: fetchError } = await supabase
    .from("sessions")
    .select("id, therapist_id, mirotalk_room_url, daily_room_url")
    .eq("id", sessionId)
    .single();

  if (fetchError || !session) {
    return { error: "Session not found" };
  }

  if (session.mirotalk_room_url || session.daily_room_url) {
    return { joinUrl: session.mirotalk_room_url || session.daily_room_url! };
  }

  const provider = await getVideoProvider(session.therapist_id);
  if (!provider) {
    return { error: "Video call service not configured" };
  }

  const roomPassword = generatePassword();
  const clientPassword = generatePassword();
  const roomName = `somove-${sessionId.slice(0, 8)}`;

  const createResult = await provider.createRoom({ roomName });
  if ("error" in createResult) {
    return { error: "Failed to create video room" };
  }

  const updateData: Record<string, unknown> = {
    mirotalk_room_password: roomPassword,
    mirotalk_client_password: clientPassword,
  };

  if (provider.name === "daily") {
    updateData.daily_room_url = `https://${process.env.DAILY_DOMAIN || "somove"}.daily.co/${roomName}`;
  } else {
    updateData.mirotalk_room_url = createResult.roomId;
  }

  await supabase
    .from("sessions")
    .update(updateData)
    .eq("id", sessionId);

  return {
    joinUrl:
      provider.name === "daily"
        ? updateData.daily_room_url as string
        : createResult.roomId,
  };
}

export async function getSessionJoinUrl(
  sessionId: string,
  userId: string,
  role: "client" | "therapist"
): Promise<{ joinUrl: string } | { error: string }> {
  const supabase = createClient();

  const { data: session, error: fetchError } = await supabase
    .from("sessions")
    .select(
      "id, client_id, therapist_id, mirotalk_room_url, daily_room_url, mirotalk_room_password, mirotalk_client_password, status"
    )
    .eq("id", sessionId)
    .single();

  if (fetchError || !session) {
    return { error: "Session not found" };
  }

  if (role === "client" && session.client_id !== userId) {
    return { error: "Unauthorized" };
  }
  if (role === "therapist" && session.therapist_id !== userId) {
    return { error: "Unauthorized" };
  }

  const provider = await getVideoProvider(session.therapist_id);
  if (!provider) {
    return { error: "Video call service not configured" };
  }

  const roomUrl = provider.name === "daily"
    ? session.daily_room_url
    : session.mirotalk_room_url;

  if (!roomUrl) {
    return { error: "Video room not ready yet" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .single();

  const displayName =
    role === "therapist"
      ? `${userData?.name || "Professional"} (Host)`
      : userData?.name || "Client";

  const isPresenter = role === "therapist";
  const password = isPresenter
    ? session.mirotalk_room_password
    : session.mirotalk_client_password;

  const roomName = `somove-${sessionId.slice(0, 8)}`;

  const joinResult = await provider.createJoinUrl({
    roomName,
    displayName,
    isPresenter,
    password,
  });

  if ("error" in joinResult) {
    return { error: joinResult.error };
  }

  return { joinUrl: joinResult.joinUrl };
}

export async function startSession(
  sessionId: string
): Promise<{ joinUrl: string } | { error: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: session } = await supabase
    .from("sessions")
    .select("id, therapist_id, status, scheduled_at")
    .eq("id", sessionId)
    .single();

  if (!session) return { error: "Session not found" };
  if (session.therapist_id !== user.id) return { error: "Unauthorized" };
  if (session.status !== "confirmed") {
    return { error: "Session must be confirmed before starting" };
  }

  await supabase
    .from("sessions")
    .update({ status: "active" })
    .eq("id", sessionId);

  const joinResult = await getSessionJoinUrl(sessionId, user.id, "therapist");

  if ("error" in joinResult) {
    return { error: joinResult.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/my-sessions");

  return { joinUrl: joinResult.joinUrl };
}

export async function completeSession(
  sessionId: string
): Promise<{ success: boolean } | { error: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: session } = await supabase
    .from("sessions")
    .select("id, therapist_id, client_id, status")
    .eq("id", sessionId)
    .single();

  if (!session) return { error: "Session not found" };
  if (session.therapist_id !== user.id && session.client_id !== user.id) {
    return { error: "Unauthorized" };
  }
  if (session.status !== "active") {
    return { error: "Only active sessions can be completed" };
  }

  await supabase
    .from("sessions")
    .update({ status: "completed" })
    .eq("id", sessionId);

  revalidatePath("/dashboard");
  revalidatePath("/my-sessions");

  return { success: true };
}

export async function markNoShow(
  sessionId: string
): Promise<{ success: boolean } | { error: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: session } = await supabase
    .from("sessions")
    .select("id, therapist_id, status, scheduled_at")
    .eq("id", sessionId)
    .single();

  if (!session) return { error: "Session not found" };
  if (session.therapist_id !== user.id) return { error: "Unauthorized" };
  if (session.status !== "confirmed") {
    return { error: "Only confirmed sessions can be marked as no-show" };
  }

  const scheduledTime = new Date(session.scheduled_at);
  if (scheduledTime > new Date()) {
    return { error: "Session is not yet past its scheduled time" };
  }

  await supabase
    .from("sessions")
    .update({ status: "no_show" })
    .eq("id", sessionId);

  revalidatePath("/dashboard");
  revalidatePath("/my-sessions");

  return { success: true };
}

export async function rescheduleSession(
  sessionId: string,
  newScheduledAt: string
): Promise<{ success: boolean } | { error: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: session } = await supabase
    .from("sessions")
    .select("id, therapist_id, status, cal_booking_uid")
    .eq("id", sessionId)
    .single();

  if (!session) return { error: "Session not found" };
  if (session.therapist_id !== user.id) return { error: "Unauthorized" };
  if (!["confirmed", "pending_payment"].includes(session.status)) {
    return { error: "Only confirmed or pending sessions can be rescheduled" };
  }

  await supabase
    .from("sessions")
    .update({ scheduled_at: newScheduledAt })
    .eq("id", sessionId);

  if (session.cal_booking_uid) {
    const { data: profile } = await supabase
      .from("therapist_profile")
      .select("cal_api_key")
      .eq("user_id", user.id)
      .single();

    if (profile?.cal_api_key) {
      try {
        const { CalClient } = await import("@/lib/cal");
        const calClient = new CalClient(profile.cal_api_key);
        await calClient.cancelBooking(session.cal_booking_uid);
      } catch {
        // Cal.com reschedule failed but session is still updated in DB
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/schedule");
  revalidatePath("/my-sessions");

  return { success: true };
}

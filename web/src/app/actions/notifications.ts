"use server";

import { createClient } from "@/lib/supabase/server";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export async function getNotifications(limit: number = 20, cursor?: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) return { error: error.message };

  return { notifications: data as Notification[] };
}

export async function getUnreadCount() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { count: 0 };

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return { count: count || 0 };
}

export async function markAsRead(notificationId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function markAllAsRead() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteNotification(notificationId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

async function createNotification(
  supabase: ReturnType<typeof createClient>,
  params: {
    user_id: string;
    type: string;
    title: string;
    body: string;
    link?: string;
  }
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.user_id,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link || null,
  });

  return error;
}

async function getNotificationPreferences(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  return (
    data || {
      user_id: userId,
      email_booking_confirmed: true,
      email_session_reminder: true,
      email_new_message: true,
      push_booking_confirmed: true,
      push_session_reminder: true,
      push_new_message: true,
      push_session_cancelled: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
    }
  );
}

function isInQuietHours(
  quietHoursStart: string | null,
  quietHoursEnd: string | null
): boolean {
  if (!quietHoursStart || !quietHoursEnd) return false;
  const now = new Date();
  const [startH, startM] = quietHoursStart.split(":").map(Number);
  const [endH, endM] = quietHoursEnd.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export async function notifyBookingConfirmed(sessionId: string) {
  const supabase = createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, client_id, therapist_id, scheduled_at")
    .eq("id", sessionId)
    .single();

  if (!session) return;

  const [clientUser, therapistUser] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email")
      .eq("id", session.client_id)
      .single(),
    supabase
      .from("users")
      .select("id, name, email")
      .eq("id", session.therapist_id)
      .single(),
  ]);

  if (!clientUser.data || !therapistUser.data) return;

  const client = clientUser.data;
  const therapist = therapistUser.data;
  const dateStr = new Date(session.scheduled_at).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const [clientPrefs, therapistPrefs] = await Promise.all([
    getNotificationPreferences(supabase, client.id),
    getNotificationPreferences(supabase, therapist.id),
  ]);

  await createNotification(supabase, {
    user_id: client.id,
    type: "booking_confirmed",
    title: "Booking Confirmed",
    body: `Your session with ${therapist.name || "your therapist"} on ${dateStr} is confirmed.`,
    link: `/my-sessions/${sessionId}`,
  });

  await createNotification(supabase, {
    user_id: therapist.id,
    type: "booking_confirmed",
    title: "New Booking",
    body: `${client.name || "A client"} booked a session on ${dateStr}.`,
    link: `/dashboard`,
  });

  if (clientPrefs.email_booking_confirmed) {
    const { getResendClient } = await import("@/lib/resend");
    const resend = getResendClient();
    if (resend) {
      await resend.sendBookingConfirmation({
        to: client.email,
        clientName: client.name || "Client",
        therapistName: therapist.name || "Professional",
        scheduledAt: session.scheduled_at,
        duration: 50,
        joinUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/session/${sessionId}`,
      });
    }
  }

  if (
    clientPrefs.push_booking_confirmed &&
    !isInQuietHours(clientPrefs.quiet_hours_start, clientPrefs.quiet_hours_end)
  ) {
    const { sendPushToUser } = await import("@/lib/push");
    await sendPushToUser(client.id, {
      title: "Booking Confirmed",
      body: `Your session with ${therapist.name || "your therapist"} on ${dateStr} is confirmed.`,
      url: `/my-sessions/${sessionId}`,
      tag: `booking-${sessionId}`,
    });
  }

  if (
    therapistPrefs.push_booking_confirmed &&
    !isInQuietHours(therapistPrefs.quiet_hours_start, therapistPrefs.quiet_hours_end)
  ) {
    const { sendPushToUser } = await import("@/lib/push");
    await sendPushToUser(therapist.id, {
      title: "New Booking",
      body: `${client.name || "A client"} booked a session on ${dateStr}.`,
      url: `/dashboard`,
      tag: `booking-${sessionId}`,
    });
  }
}

export async function notifySessionReminder(sessionId: string) {
  const supabase = createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, client_id, therapist_id, scheduled_at")
    .eq("id", sessionId)
    .single();

  if (!session) return;

  const [clientUser, therapistUser] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email")
      .eq("id", session.client_id)
      .single(),
    supabase
      .from("users")
      .select("id, name, email")
      .eq("id", session.therapist_id)
      .single(),
  ]);

  if (!clientUser.data || !therapistUser.data) return;

  const client = clientUser.data;
  const therapist = therapistUser.data;

  const [clientPrefs, therapistPrefs] = await Promise.all([
    getNotificationPreferences(supabase, client.id),
    getNotificationPreferences(supabase, therapist.id),
  ]);

  const timeStr = new Date(session.scheduled_at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  await createNotification(supabase, {
    user_id: client.id,
    type: "session_reminder",
    title: "Session Starting Soon",
    body: `Your session with ${therapist.name || "your therapist"} starts at ${timeStr}.`,
    link: `/session/${sessionId}`,
  });

  await createNotification(supabase, {
    user_id: therapist.id,
    type: "session_reminder",
    title: "Session Starting Soon",
    body: `Your session starts at ${timeStr}.`,
    link: `/session/${sessionId}`,
  });

  if (clientPrefs.email_session_reminder) {
    const { getResendClient } = await import("@/lib/resend");
    const resend = getResendClient();
    if (resend) {
      await resend.sendSessionReminder({
        to: client.email,
        clientName: client.name || "Client",
        therapistName: therapist.name || "Professional",
        scheduledAt: session.scheduled_at,
        joinUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/session/${sessionId}`,
        minutesUntil: 15,
      });
    }
  }

  if (
    clientPrefs.push_session_reminder &&
    !isInQuietHours(clientPrefs.quiet_hours_start, clientPrefs.quiet_hours_end)
  ) {
    const { sendPushToUser } = await import("@/lib/push");
    await sendPushToUser(client.id, {
      title: "Session Starting Soon",
      body: `Your session with ${therapist.name || "your therapist"} starts at ${timeStr}.`,
      url: `/session/${sessionId}`,
      tag: `reminder-${sessionId}`,
    });
  }

  if (
    therapistPrefs.push_session_reminder &&
    !isInQuietHours(therapistPrefs.quiet_hours_start, therapistPrefs.quiet_hours_end)
  ) {
    const { sendPushToUser } = await import("@/lib/push");
    await sendPushToUser(therapist.id, {
      title: "Session Starting Soon",
      body: `Your session starts at ${timeStr}.`,
      url: `/session/${sessionId}`,
      tag: `reminder-${sessionId}`,
    });
  }
}

export async function notifySessionCancelled(sessionId: string) {
  const supabase = createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, client_id, therapist_id, scheduled_at")
    .eq("id", sessionId)
    .single();

  if (!session) return;

  const [clientUser, therapistUser] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email")
      .eq("id", session.client_id)
      .single(),
    supabase
      .from("users")
      .select("id, name, email")
      .eq("id", session.therapist_id)
      .single(),
  ]);

  if (!clientUser.data || !therapistUser.data) return;

  const client = clientUser.data;
  const therapist = therapistUser.data;
  const dateStr = new Date(session.scheduled_at).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const [clientPrefs, therapistPrefs] = await Promise.all([
    getNotificationPreferences(supabase, client.id),
    getNotificationPreferences(supabase, therapist.id),
  ]);

  await createNotification(supabase, {
    user_id: client.id,
    type: "session_cancelled",
    title: "Session Cancelled",
    body: `Your session on ${dateStr} has been cancelled.`,
    link: `/my-sessions/${sessionId}`,
  });

  await createNotification(supabase, {
    user_id: therapist.id,
    type: "session_cancelled",
    title: "Session Cancelled",
    body: `The session on ${dateStr} has been cancelled.`,
    link: `/dashboard`,
  });

  if (clientPrefs.email_booking_confirmed) {
    const { getResendClient } = await import("@/lib/resend");
    const resend = getResendClient();
    if (resend) {
      await resend.sendCancellationNotice({
        to: client.email,
        recipientName: client.name || "Client",
        sessionDate: dateStr,
        refundStatus: "refunded",
      });
    }
  }

  if (
    clientPrefs.push_session_cancelled &&
    !isInQuietHours(clientPrefs.quiet_hours_start, clientPrefs.quiet_hours_end)
  ) {
    const { sendPushToUser } = await import("@/lib/push");
    await sendPushToUser(client.id, {
      title: "Session Cancelled",
      body: `Your session on ${dateStr} has been cancelled.`,
      url: `/my-sessions/${sessionId}`,
      tag: `cancel-${sessionId}`,
    });
  }

  if (
    therapistPrefs.push_session_cancelled &&
    !isInQuietHours(therapistPrefs.quiet_hours_start, therapistPrefs.quiet_hours_end)
  ) {
    const { sendPushToUser } = await import("@/lib/push");
    await sendPushToUser(therapist.id, {
      title: "Session Cancelled",
      body: `The session on ${dateStr} has been cancelled.`,
      url: `/dashboard`,
      tag: `cancel-${sessionId}`,
    });
  }
}

export async function notifyNewMessage(
  conversationId: string,
  senderId: string,
  recipientId: string,
  messagePreview: string
) {
  const supabase = createClient();

  const prefs = await getNotificationPreferences(supabase, recipientId);

  const senderData = await supabase
    .from("users")
    .select("name")
    .eq("id", senderId)
    .single();

  const senderName = senderData.data?.name || "Someone";

  await createNotification(supabase, {
    user_id: recipientId,
    type: "new_message",
    title: `New message from ${senderName}`,
    body: messagePreview.length > 100
      ? messagePreview.substring(0, 100) + "..."
      : messagePreview,
    link: `/inbox/${conversationId}`,
  });

  if (prefs.push_new_message && !isInQuietHours(prefs.quiet_hours_start, prefs.quiet_hours_end)) {
    const { sendPushToUser } = await import("@/lib/push");
    await sendPushToUser(recipientId, {
      title: `New message from ${senderName}`,
      body: messagePreview.length > 100
        ? messagePreview.substring(0, 100) + "..."
        : messagePreview,
      url: `/inbox/${conversationId}`,
      tag: `message-${conversationId}`,
    });
  }
}

export async function getNotificationPreferencesAction() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code === "PGRST116") {
    const defaults = {
      user_id: user.id,
      email_booking_confirmed: true,
      email_session_reminder: true,
      email_new_message: true,
      push_booking_confirmed: true,
      push_session_reminder: true,
      push_new_message: true,
      push_session_cancelled: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
    };

    const { error: insertError } = await supabase
      .from("notification_preferences")
      .insert(defaults);

    if (insertError) return { error: insertError.message };
    return { preferences: defaults };
  }

  if (error) return { error: error.message };
  return { preferences: data };
}

export async function updateNotificationPreferences(prefs: {
  email_booking_confirmed?: boolean;
  email_session_reminder?: boolean;
  email_new_message?: boolean;
  push_booking_confirmed?: boolean;
  push_session_reminder?: boolean;
  push_new_message?: boolean;
  push_session_cancelled?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("notification_preferences")
    .upsert({
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };
  return { success: true };
}

export async function subscribePush(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) return { error: error.message };
  return { success: true };
}

export async function unsubscribePush(endpoint: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

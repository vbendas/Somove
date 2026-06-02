export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: WebPushPayload
): Promise<{ ok: boolean; error?: string }> {
  const { default: webPush } = await import("web-push");

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:hello@somove.app";

  if (!vapidPublicKey || !vapidPrivateKey) {
    return { ok: false, error: "VAPID keys not configured" };
  }

  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      const statusCode = (error as { statusCode: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        return { ok: false, error: "Subscription expired" };
      }
    }
    return { ok: false, error: error instanceof Error ? error.message : "Push failed" };
  }
}

export async function sendPushToUser(
  userId: string,
  payload: WebPushPayload
): Promise<{ sent: number; failed: number; expired: string[] }> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = createClient();

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0, expired: [] };
  }

  let sent = 0;
  let failed = 0;
  const expired: string[] = [];

  for (const sub of subscriptions) {
    const result = await sendPushNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      payload
    );

    if (result.ok) {
      sent++;
    } else {
      failed++;
      if (result.error === "Subscription expired") {
        expired.push(sub.id);
      }
    }
  }

  if (expired.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", expired);
  }

  return { sent, failed, expired };
}

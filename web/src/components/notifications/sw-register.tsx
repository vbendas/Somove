"use client";

import { useEffect, useRef } from "react";
import { subscribePush, unsubscribePush } from "@/app/actions/notifications";

export function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}

export function PushPermission() {
  const subscribed = useRef(false);

  useEffect(() => {
    async function checkAndSubscribe() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (subscribed.current) return;

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        subscribed.current = true;
      await subscribePush({
        endpoint: existing.endpoint,
        p256dh: btoa(
          String.fromCharCode(
            ...Array.from(new Uint8Array(existing.getKey("p256dh")!))
          )
        ),
        auth: btoa(
          String.fromCharCode(
            ...Array.from(new Uint8Array(existing.getKey("auth")!))
          )
        ),
      });
        return;
      }

      const permission = Notification.permission;
      if (permission === "granted") {
        await subscribeUser(registration);
      }
    }

    checkAndSubscribe();
  }, []);

  return null;
}

async function subscribeUser(registration: ServiceWorkerRegistration) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  await subscribePush({
    endpoint: subscription.endpoint,
    p256dh: btoa(
      String.fromCharCode(...Array.from(new Uint8Array(subscription.getKey("p256dh")!)))
    ),
    auth: btoa(
      String.fromCharCode(...Array.from(new Uint8Array(subscription.getKey("auth")!)))
    ),
  });
}

export async function requestPushPermission() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { error: "Push notifications not supported" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { error: "Permission denied" };
  }

  const registration = await navigator.serviceWorker.ready;
  await subscribeUser(registration);
  return { success: true };
}

export async function disablePushNotifications() {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await unsubscribePush(subscription.endpoint);
    await subscription.unsubscribe();
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

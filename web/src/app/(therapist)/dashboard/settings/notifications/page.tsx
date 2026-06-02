"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  getNotificationPreferencesAction,
  updateNotificationPreferences,
} from "@/app/actions/notifications";
import {
  requestPushPermission,
  disablePushNotifications,
} from "@/components/notifications/sw-register";
import { Bell, Mail, BellRing } from "lucide-react";
import { toast } from "sonner";

interface Preferences {
  email_booking_confirmed: boolean;
  email_session_reminder: boolean;
  email_new_message: boolean;
  push_booking_confirmed: boolean;
  push_session_reminder: boolean;
  push_new_message: boolean;
  push_session_cancelled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export default function TherapistNotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotificationPreferencesAction().then((result) => {
      if (result.preferences) setPrefs(result.preferences as Preferences);
    });

    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const updatePref = async (key: keyof Preferences, value: boolean | string | null) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    const result = await updateNotificationPreferences({ [key]: value });
    setSaving(false);
    if (result.error) toast.error(result.error);
  };

  const togglePush = async () => {
    if (pushEnabled) {
      await disablePushNotifications();
      setPushEnabled(false);
      toast.success("Push notifications disabled");
    } else {
      const result = await requestPushPermission();
      if (result.error) {
        toast.error(result.error);
      } else {
        setPushEnabled(true);
        toast.success("Push notifications enabled");
      }
    }
  };

  if (!prefs) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <h1 className="font-heading text-2xl font-semibold">Notifications</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>Receive notifications on your device</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">Enable push notifications</span>
            <Switch checked={pushEnabled} onCheckedChange={togglePush} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Receive email notifications for important events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New booking</p>
              <p className="text-xs text-warm-gray">When a client books a session</p>
            </div>
            <Switch
              checked={prefs.email_booking_confirmed}
              onCheckedChange={(v) => updatePref("email_booking_confirmed", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Session reminder</p>
              <p className="text-xs text-warm-gray">15 minutes before session</p>
            </div>
            <Switch
              checked={prefs.email_session_reminder}
              onCheckedChange={(v) => updatePref("email_session_reminder", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New message</p>
              <p className="text-xs text-warm-gray">When a client messages you</p>
            </div>
            <Switch
              checked={prefs.email_new_message}
              onCheckedChange={(v) => updatePref("email_new_message", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Event Types
          </CardTitle>
          <CardDescription>Choose which events trigger push notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">New booking</p>
            <Switch
              checked={prefs.push_booking_confirmed}
              onCheckedChange={(v) => updatePref("push_booking_confirmed", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Session reminder</p>
            <Switch
              checked={prefs.push_session_reminder}
              onCheckedChange={(v) => updatePref("push_session_reminder", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Session cancelled</p>
            <Switch
              checked={prefs.push_session_cancelled}
              onCheckedChange={(v) => updatePref("push_session_cancelled", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">New message</p>
            <Switch
              checked={prefs.push_new_message}
              onCheckedChange={(v) => updatePref("push_new_message", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>Suppress push notifications during these hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start</label>
              <input
                type="time"
                value={prefs.quiet_hours_start || ""}
                onChange={(e) =>
                  updatePref("quiet_hours_start", e.target.value || null)
                }
                className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End</label>
              <input
                type="time"
                value={prefs.quiet_hours_end || ""}
                onChange={(e) =>
                  updatePref("quiet_hours_end", e.target.value || null)
                }
                className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {saving && (
        <p className="text-center text-xs text-warm-gray">Saving...</p>
      )}
    </div>
  );
}

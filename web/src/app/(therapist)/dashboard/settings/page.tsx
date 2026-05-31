"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Loader2, CheckCircle, XCircle, Copy } from "lucide-react";

const TIMEZONES = [
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Rome",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "UTC",
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const MINUTES = ["00", "30"];

interface AvailabilityData {
  weekly: Record<string, string[]>;
  overrides: Record<string, string[]>;
  bufferMinutes: number;
  timezone: string;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<"profile" | "pricing" | "availability" | "integrations">("profile");
  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [bio, setBio] = useState("");
  const [sessionPrice, setSessionPrice] = useState("90");
  const [sessionDuration, setSessionDuration] = useState("60");
  const [freeFirst, setFreeFirst] = useState(false);
  const [timezone, setTimezone] = useState("Europe/Lisbon");
  const [availability, setAvailability] = useState<AvailabilityData>({
    weekly: {
      monday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
      tuesday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
      wednesday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
      thursday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
      friday: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    },
    overrides: {},
    bufferMinutes: 15,
    timezone: "Europe/Lisbon",
  });

  const [calApiKey, setCalApiKey] = useState("");
  const [calEventTypeId, setCalEventTypeId] = useState("");
  const [stripeKey, setStripeKey] = useState("");
  const [stripeWebhook, setStripeWebhook] = useState("");
  const [dailyKey, setDailyKey] = useState("");
  const [resendKey, setResendKey] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("therapist_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setBio(data.bio || "");
        setSessionPrice(String((data.session_price_cents || 0) / 100));
        setSessionDuration(String(data.default_session_duration));
        setFreeFirst(data.free_first_session);
        setTimezone(data.timezone || "Europe/Lisbon");
        if (data.availability_rules) {
          setAvailability(data.availability_rules as unknown as AvailabilityData);
        }
        setCalApiKey(data.cal_api_key || "");
        setCalEventTypeId(data.cal_event_type_id || "");
        setStripeKey(data.stripe_secret_key || "");
        setStripeWebhook(data.stripe_webhook_secret || "");
        setDailyKey(data.daily_api_key || "");
        setResendKey(data.resend_api_key || "");
      }
    } catch {
      toast.error("Failed to load profile. Please refresh the page.");
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("therapist_profile")
        .update({ bio })
        .eq("user_id", user.id);

      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const savePricing = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("therapist_profile")
        .update({
          session_price_cents: Math.round(parseFloat(sessionPrice) * 100),
          default_session_duration: parseInt(sessionDuration),
          free_first_session: freeFirst,
        })
        .eq("user_id", user.id);

      toast.success("Pricing saved");
    } catch {
      toast.error("Failed to save pricing");
    } finally {
      setLoading(false);
    }
  };

  const saveAvailability = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("therapist_profile")
        .update({
          availability_rules: { ...availability, timezone },
          timezone,
        })
        .eq("user_id", user.id);

      toast.success("Availability saved");
    } catch {
      toast.error("Failed to save availability");
    } finally {
      setLoading(false);
    }
  };

  const saveIntegrations = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("therapist_profile")
        .update({
          cal_api_key: calApiKey || null,
          cal_event_type_id: calEventTypeId || null,
          stripe_secret_key: stripeKey || null,
          stripe_webhook_secret: stripeWebhook || null,
          daily_api_key: dailyKey || null,
          resend_api_key: resendKey || null,
        })
        .eq("user_id", user.id);

      toast.success("Integrations saved");
    } catch {
      toast.error("Failed to save integrations");
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (day: string, slot: string) => {
    setAvailability((prev) => {
      const daySlots = prev.weekly[day] || [];
      const newSlots = daySlots.includes(slot)
        ? daySlots.filter((s) => s !== slot)
        : [...daySlots, slot].sort();
      return {
        ...prev,
        weekly: { ...prev.weekly, [day]: newSlots },
      };
    });
  };

  const copySchedule = (fromDay: string, toDay: string) => {
    setAvailability((prev) => ({
      ...prev,
      weekly: { ...prev.weekly, [toDay]: [...(prev.weekly[fromDay] || [])] },
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-6 font-heading text-3xl font-medium text-foreground">
          Settings
        </h1>

        {!profileLoaded ? (
          <div className="space-y-4">
            <div className="mb-6 flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 flex-1 animate-pulse rounded bg-surface" />
              ))}
            </div>
            <div className="h-48 animate-pulse rounded-card bg-surface" />
            <div className="h-12 animate-pulse rounded-card bg-surface" />
          </div>
        ) : (
          <>
        <div className="mb-6 flex gap-1 rounded-card bg-surface p-1 overflow-x-auto">
          {(["profile", "pricing", "availability", "integrations"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 rounded-button px-4 py-2 text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-warm-gray hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  About You
                </label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <Button onClick={saveProfile} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        )}

        {tab === "pricing" && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Session Price (EUR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray">€</span>
                  <Input
                    type="number"
                    min={0}
                    value={sessionPrice}
                    onChange={(e) => setSessionPrice(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Duration (minutes)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["30", "45", "60", "90"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSessionDuration(d)}
                      className={`rounded-button py-2 text-sm font-medium transition-colors ${
                        sessionDuration === d
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface text-warm-gray"
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-card border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">Free First Session</p>
                  <p className="text-sm text-warm-gray">Offer a free consultation to new clients</p>
                </div>
                <Switch checked={freeFirst} onCheckedChange={setFreeFirst} />
              </div>
              <Button onClick={savePricing} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Pricing"}
              </Button>
            </CardContent>
          </Card>
        )}

        {tab === "availability" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Timezone</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-card border border-input bg-transparent px-3 py-2 text-sm"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-warm-gray">
                  Click slots to toggle availability. 30-minute blocks.
                </p>

                {DAYS.map((day) => (
                  <div key={day}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-foreground">
                        {day}
                      </span>
                      <div className="flex gap-1">
                        {DAYS.filter((d) => d !== day)
                          .slice(0, 3)
                          .map((copyDay) => (
                            <button
                              key={copyDay}
                              onClick={() => copySchedule(copyDay, day)}
                              className="text-xs text-warm-gray hover:text-primary"
                              title={`Copy from ${copyDay}`}
                            >
                              ←{copyDay.slice(0, 2)}
                            </button>
                          ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {HOURS.map((hour) =>
                        MINUTES.map((min) => {
                          const slot = `${hour.split(":")[0]}:${min}`;
                          const isActive = (availability.weekly[day] || []).includes(slot);
                          const hourNum = parseInt(hour.split(":")[0]);
                          if (hourNum < 8 || hourNum > 20) return null;
                          return (
                            <button
                              key={slot}
                              onClick={() => toggleSlot(day, slot)}
                              className={`rounded px-2 py-1 text-xs transition-colors ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-surface text-warm-gray hover:bg-surface/80"
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Buffer between sessions
                  </label>
                  <select
                    value={availability.bufferMinutes}
                    onChange={(e) =>
                      setAvailability((prev) => ({
                        ...prev,
                        bufferMinutes: parseInt(e.target.value),
                      }))
                    }
                    className="w-full rounded-card border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value={0}>No buffer</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Button onClick={saveAvailability} disabled={loading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Availability"}
            </Button>
          </div>
        )}

        {tab === "integrations" && (
          <div className="space-y-4">
            <CalIntegrationCard
              calApiKey={calApiKey}
              setCalApiKey={setCalApiKey}
              calEventTypeId={calEventTypeId}
            />

            <StripeIntegrationCard
              stripeKey={stripeKey}
              setStripeKey={setStripeKey}
              stripeWebhook={stripeWebhook}
              setStripeWebhook={setStripeWebhook}
            />

            <Card>
              <CardHeader>
                <CardTitle>Daily.co</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-warm-gray">
                  Power your video calls with Daily.co.
                </p>
                <Input
                  type="password"
                  placeholder="Daily.co API Key"
                  value={dailyKey}
                  onChange={(e) => setDailyKey(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resend</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-warm-gray">
                  Send booking confirmations and notifications via email.
                </p>
                <Input
                  type="password"
                  placeholder="Resend API Key"
                  value={resendKey}
                  onChange={(e) => setResendKey(e.target.value)}
                />
              </CardContent>
            </Card>

            <Button onClick={saveIntegrations} disabled={loading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Integrations"}
            </Button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

function CalIntegrationCard({
  calApiKey,
  setCalApiKey,
  calEventTypeId,
}: {
  calApiKey: string;
  setCalApiKey: (v: string) => void;
  calEventTypeId: string;
}) {
  const [status, setStatus] = useState<"idle" | "testing" | "connected" | "error">("idle");
  const [connectedName, setConnectedName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleTest = async () => {
    setStatus("testing");
    setErrorMsg("");

    const { testCalConnection } = await import("@/app/actions/cal");
    const result = await testCalConnection(calApiKey);

    if (result.error) {
      setStatus("error");
      setErrorMsg(result.error.message);
    } else {
      setStatus("connected");
      setConnectedName(result.data?.name || result.data?.email || "Connected");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Cal.com</CardTitle>
            {status === "connected" && (
              <CheckCircle className="h-5 w-5 text-accent" />
            )}
            {status === "error" && (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-warm-gray">
            Connect your Cal.com account for automatic scheduling and calendar sync.
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              API Key
            </label>
            <Input
              type="password"
              placeholder="cal_live_xxxxxxxxxxxx"
              value={calApiKey}
              onChange={(e) => {
                setCalApiKey(e.target.value);
                setStatus("idle");
              }}
            />
          </div>

          {calEventTypeId && (
            <div className="rounded-card bg-surface p-3">
              <p className="text-xs text-warm-gray">Event Type ID</p>
              <p className="font-mono text-sm text-foreground">{calEventTypeId}</p>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-destructive">{errorMsg}</p>
          )}

          <Button
            onClick={handleTest}
            disabled={!calApiKey || status === "testing"}
            variant="outline"
            className="w-full"
          >
            {status === "testing" ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</>
            ) : (
              "Test Connection"
            )}
          </Button>

          {status === "connected" && (
            <p className="text-sm text-accent">Connected as {connectedName}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-warm-gray">
            To receive real-time updates (cancellations, reschedules), create a webhook in your Cal.com dashboard.
          </p>

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Webhook URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-surface px-3 py-2 text-xs text-foreground">
                {typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/cal` : "/api/webhooks/cal"}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => {
                  const url = `${window.location.origin}/api/webhooks/cal`;
                  navigator.clipboard.writeText(url);
                  toast.success("Copied to clipboard");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-1 text-xs text-warm-gray">
            <p>Steps:</p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>Go to cal.com → Settings → Webhooks</li>
              <li>Add the webhook URL above</li>
              <li>Select triggers: <strong>BOOKING_CANCELLED</strong>, <strong>BOOKING_RESCHEDULED</strong></li>
              <li>Save the webhook</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StripeIntegrationCard({
  stripeKey,
  setStripeKey,
  stripeWebhook,
  setStripeWebhook,
}: {
  stripeKey: string;
  setStripeKey: (v: string) => void;
  stripeWebhook: string;
  setStripeWebhook: (v: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "testing" | "connected" | "error">("idle");
  const [connectedEmail, setConnectedEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleTest = async () => {
    setStatus("testing");
    setErrorMsg("");

    const { testStripeConnection } = await import("@/app/actions/stripe");
    const result = await testStripeConnection(stripeKey);

    if (result.error) {
      setStatus("error");
      setErrorMsg(result.error.message);
    } else if (result.data?.success) {
      setStatus("connected");
      setConnectedEmail(result.data.email || result.data.accountId || "Connected");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Stripe</CardTitle>
            {status === "connected" && (
              <CheckCircle className="h-5 w-5 text-accent" />
            )}
            {status === "error" && (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-warm-gray">
            Accept payments via Stripe Checkout. Clients pay directly on Stripe&apos;s hosted page.
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Secret Key
            </label>
            <Input
              type="password"
              placeholder="sk_live_xxxxxxxxxxxx"
              value={stripeKey}
              onChange={(e) => {
                setStripeKey(e.target.value);
                setStatus("idle");
              }}
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-destructive">{errorMsg}</p>
          )}

          <Button
            onClick={handleTest}
            disabled={!stripeKey || status === "testing"}
            variant="outline"
            className="w-full"
          >
            {status === "testing" ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</>
            ) : (
              "Test Connection"
            )}
          </Button>

          {status === "connected" && (
            <p className="text-sm text-accent">Connected as {connectedEmail}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-warm-gray">
            To receive payment confirmations, create a webhook in your Stripe dashboard.
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Webhook Signing Secret
            </label>
            <Input
              type="password"
              placeholder="whsec_xxxxxxxxxxxx"
              value={stripeWebhook}
              onChange={(e) => setStripeWebhook(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Webhook URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-surface px-3 py-2 text-xs text-foreground">
                {typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/stripe` : "/api/webhooks/stripe"}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => {
                  const url = `${window.location.origin}/api/webhooks/stripe`;
                  navigator.clipboard.writeText(url);
                  toast.success("Copied to clipboard");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-1 text-xs text-warm-gray">
            <p>Steps:</p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>Go to stripe.com → Developers → Webhooks → Add endpoint</li>
              <li>Add the webhook URL above</li>
              <li>Select events:
                <ul className="ml-4 mt-1 list-disc space-y-0.5">
                  <li><strong>checkout.session.completed</strong></li>
                  <li><strong>checkout.session.expired</strong></li>
                  <li><strong>charge.refunded</strong></li>
                </ul>
              </li>
              <li>Copy the webhook signing secret</li>
              <li>Paste it in the Webhook Secret field above</li>
              <li>Save</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

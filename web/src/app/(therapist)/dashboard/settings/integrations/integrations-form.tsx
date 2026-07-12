"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Loader2, CheckCircle, XCircle, Copy } from "lucide-react";

interface IntegrationsInitial {
  calApiKey: string;
  calEventTypeId: string;
  mirotalkUrl: string;
  mirotalkKey: string;
  videoProvider: "daily" | "mirotalk";
  dailyApiKey: string;
  resendKey: string;
}

export function IntegrationsForm({ initial }: { initial: IntegrationsInitial }) {
  const [loading, setLoading] = useState(false);
  const [calApiKey, setCalApiKey] = useState(initial.calApiKey);
  const [calEventTypeId] = useState(initial.calEventTypeId);
  const [mirotalkUrl, setMirotalkUrl] = useState(initial.mirotalkUrl);
  const [mirotalkKey, setMirotalkKey] = useState(initial.mirotalkKey);
  const [videoProvider, setVideoProvider] = useState<"daily" | "mirotalk">(initial.videoProvider);
  const [dailyApiKey, setDailyApiKey] = useState(initial.dailyApiKey);
  const [resendKey, setResendKey] = useState(initial.resendKey);

  const saveIntegrations = async () => {
    setLoading(true);
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("therapist_profile")
        .update({
          cal_api_key: calApiKey || null,
          cal_event_type_id: calEventTypeId || null,
          mirotalk_url: mirotalkUrl || null,
          mirotalk_api_key: mirotalkKey || null,
          daily_api_key: dailyApiKey || null,
          video_provider: videoProvider,
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

  return (
    <div className="space-y-4">
      <CalIntegrationCard
        calApiKey={calApiKey}
        setCalApiKey={setCalApiKey}
        calEventTypeId={calEventTypeId}
      />

      <StripeConnectCard />

      <Card>
        <CardHeader>
          <CardTitle>Video Calls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Video Provider
            </label>
            <p className="mb-2 text-xs text-warm-gray">
              Choose how video sessions are hosted.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVideoProvider("daily")}
                aria-pressed={videoProvider === "daily"}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  videoProvider === "daily"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="text-sm font-medium">Daily.co</p>
                <p className="mt-1 text-[11px] text-warm-gray">
                  Free hosted (2,000 min/mo). No setup needed.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setVideoProvider("mirotalk")}
                aria-pressed={videoProvider === "mirotalk"}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  videoProvider === "mirotalk"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="text-sm font-medium">MiroTalk</p>
                <p className="mt-1 text-[11px] text-warm-gray">
                  Self-hosted. Full data privacy control.
                </p>
              </button>
            </div>
          </div>

          {videoProvider === "daily" && (
            <div>
              <label htmlFor="dailyApiKey" className="mb-1 block text-xs font-medium text-foreground">
                Daily.co API Key
              </label>
              <p className="mb-1 text-xs text-warm-gray">
                Get from{" "}
                <a
                  href="https://dashboard.daily.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  dashboard.daily.co
                </a>
              </p>
              <Input
                id="dailyApiKey"
                type="password"
                placeholder="Daily API Key"
                value={dailyApiKey}
                onChange={(e) => setDailyApiKey(e.target.value)}
              />
            </div>
          )}

          {videoProvider === "mirotalk" && (
            <>
              <div>
                <label htmlFor="mirotalkUrl" className="mb-1 block text-xs font-medium text-foreground">
                  Instance URL
                </label>
                <Input
                  id="mirotalkUrl"
                  placeholder="https://video.somove.app"
                  value={mirotalkUrl}
                  onChange={(e) => setMirotalkUrl(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="mirotalkKey" className="mb-1 block text-xs font-medium text-foreground">
                  API Key
                </label>
                <Input
                  id="mirotalkKey"
                  type="password"
                  placeholder="MiroTalk API_KEY_SECRET"
                  value={mirotalkKey}
                  onChange={(e) => setMirotalkKey(e.target.value)}
                />
              </div>
            </>
          )}
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
            aria-label="Resend API Key"
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
    const result = await testCalConnection();

    if ("data" in result) {
      if (result.error) {
        setStatus("error");
        setErrorMsg(result.error.message);
      } else {
        setStatus("connected");
        setConnectedName(result.data?.name || result.data?.email || "Connected");
      }
    } else {
      setStatus("error");
      setErrorMsg(typeof result.error === "string" ? result.error : "Unknown error");
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
            <label htmlFor="calApiKey" className="mb-1 block text-sm font-medium text-foreground">
              API Key
            </label>
            <Input
              id="calApiKey"
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
                aria-label="Copy webhook URL"
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

function StripeConnectCard() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const { createOrGetConnectedAccount, refreshAccountStatus } = await import("@/app/actions/stripe");
        const result = await createOrGetConnectedAccount();
        if ("accountId" in result) {
          setAccountId(result.accountId);
          const status = await refreshAccountStatus();
          if ("chargesEnabled" in status) {
            setPayoutsEnabled(status.payoutsEnabled);
          }
        }
      } catch {
        // Silently handle
      }
      setLoading(false);
    };
    loadStatus();
  }, []);

  const handleOnboarding = async () => {
    setActionLoading(true);
    try {
      const { getOnboardingLink } = await import("@/app/actions/stripe");
      const result = await getOnboardingLink();
      if ("url" in result) {
        window.location.href = result.url;
      }
    } catch {
      toast.error("Failed to create onboarding link");
    }
    setActionLoading(false);
  };

  const handleDashboard = async () => {
    setActionLoading(true);
    try {
      const { getDashboardLink } = await import("@/app/actions/stripe");
      const result = await getDashboardLink();
      if ("url" in result) {
        window.open(result.url, "_blank");
      }
    } catch {
      toast.error("Failed to open dashboard");
    }
    setActionLoading(false);
  };

  const handleRefresh = async () => {
    setActionLoading(true);
    try {
      const { refreshAccountStatus } = await import("@/app/actions/stripe");
      const status = await refreshAccountStatus();
      if ("chargesEnabled" in status) {
        setPayoutsEnabled(status.payoutsEnabled);
        toast.success("Status refreshed");
      }
    } catch {
      toast.error("Failed to refresh status");
    }
    setActionLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Stripe Payments</CardTitle>
          {payoutsEnabled && <CheckCircle className="h-5 w-5 text-accent" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-warm-gray">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading payment status...
          </div>
        ) : payoutsEnabled ? (
          <div className="space-y-4">
            <div className="rounded-card bg-accent/5 border border-accent/20 p-4">
              <p className="text-sm font-medium text-accent">
                Payouts are enabled
              </p>
              <p className="mt-1 text-xs text-warm-gray">
                Your bank account is connected. You receive payments automatically after each session (minus 10% platform fee).
              </p>
            </div>

            <Button
              onClick={handleDashboard}
              variant="outline"
              className="w-full"
              disabled={actionLoading}
            >
              Manage Payouts & Tax Documents
            </Button>

            <Button
              onClick={handleRefresh}
              variant="ghost"
              className="w-full"
              disabled={actionLoading}
            >
              Refresh Status
            </Button>
          </div>
        ) : accountId ? (
          <div className="space-y-4">
            <div className="rounded-card bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm font-medium text-primary">
                Complete your payment setup
              </p>
              <p className="mt-1 text-xs text-warm-gray">
                Connect your bank account to receive payments from sessions. You&apos;ll need to verify your identity with Stripe.
              </p>
            </div>

            <Button
              onClick={handleOnboarding}
              className="w-full"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...</>
              ) : (
                "Connect Bank Account"
              )}
            </Button>

            <Button
              onClick={handleRefresh}
              variant="ghost"
              className="w-full"
              disabled={actionLoading}
            >
              Check Status
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-warm-gray">
              Set up payments to receive earnings from sessions. Somove charges a 10% platform fee per session.
            </p>

            <Button
              onClick={handleOnboarding}
              className="w-full"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...</>
              ) : (
                "Set Up Payments"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

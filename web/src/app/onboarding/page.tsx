"use client";

import { useState } from "react";
import { createTherapistProfile } from "@/app/actions/therapist";
import { testCalConnection, createCalEventType } from "@/app/actions/cal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const CREDENTIALS_OPTIONS = [
  "SEP (Somatic Experiencing Practitioner)",
  "BC-DMT (Board Certified Dance/Movement Therapist)",
  "LCSW (Licensed Clinical Social Worker)",
  "LPC (Licensed Professional Counselor)",
  "PhD Psychology",
  "MA Psychology",
  "Certified Yoga Therapist",
  "Other",
];

const MODALITIES_OPTIONS = [
  "Somatic Experiencing",
  "Dance/Movement Therapy",
  "Polyvagal Theory",
  "Sensorimotor Psychotherapy",
  "EMDR",
  "Trauma-Informed Yoga",
  "Breathwork",
  "Sound Healing",
  "Other",
];

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
  { value: 75, label: "75 min" },
  { value: 90, label: "90 min" },
];

type CalConnectionStatus = "idle" | "testing" | "connected" | "error";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [bio, setBio] = useState("");
  const [credentials, setCredentials] = useState<string[]>([]);
  const [modalities, setModalities] = useState<string[]>([]);
  const [priceCents, setPriceCents] = useState<number>(9000);
  const [duration, setDuration] = useState<number>(60);
  const [freeFirst, setFreeFirst] = useState(false);

  const [calApiKey, setCalApiKey] = useState("");
  const [calConnectionStatus, setCalConnectionStatus] = useState<CalConnectionStatus>("idle");
  const [calConnectedName, setCalConnectedName] = useState("");
  const [calErrorMsg, setCalErrorMsg] = useState("");
  const [useCalCom, setUseCalCom] = useState(false);

  const toggleCredential = (cred: string) => {
    setCredentials((prev) =>
      prev.includes(cred) ? prev.filter((c) => c !== cred) : [...prev, cred]
    );
  };

  const toggleModality = (mod: string) => {
    setModalities((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const canProceed = () => {
    if (step === 1) return bio.length > 0 && credentials.length > 0 && modalities.length > 0;
    if (step === 2) return priceCents > 0;
    if (step === 3) return true;
    return true;
  };

  const handleTestConnection = async () => {
    setCalConnectionStatus("testing");
    setCalErrorMsg("");

    const result = await testCalConnection();

    if ("data" in result) {
      if (result.error) {
        setCalConnectionStatus("error");
        setCalErrorMsg(result.error.message);
        return;
      }
      setCalConnectionStatus("connected");
      setCalConnectedName(result.data?.name || result.data?.email || "Connected");
    } else {
      setCalConnectionStatus("error");
      setCalErrorMsg(typeof result.error === "string" ? result.error : "Unknown error");
      return;
    }
    setUseCalCom(true);

    toast.success("Cal.com connected successfully!");
  };

  const handleCreateEventType = async () => {
    if (!calApiKey || calConnectionStatus !== "connected") return null;

    const slug = `somove-${Date.now().toString(36)}`;
    const result = await createCalEventType({
      title: "Session",
      slug,
      lengthInMinutes: duration,
      description: "Book a session via Somove",
      minimumBookingNotice: 60,
      afterEventBuffer: 15,
    });

    if ("error" in result && result.error) {
      const msg = typeof result.error === "string" ? result.error : result.error.message;
      toast.error(`Failed to create event type: ${msg}`);
      return null;
    }

    if ("data" in result) {
      return result.data?.id || null;
    }
    return null;
  };

  const handleSubmit = async () => {
    setLoading(true);

    let finalCalEventTypeId: number | null = null;

    if (useCalCom && calConnectionStatus === "connected") {
      finalCalEventTypeId = await handleCreateEventType();
    }

    const result = await createTherapistProfile({
      bio,
      credentials,
      modalities,
      session_price_cents: priceCents,
      default_session_duration: duration,
      free_first_session: freeFirst,
      cal_api_key: useCalCom ? calApiKey : undefined,
      cal_event_type_id: finalCalEventTypeId ? String(finalCalEventTypeId) : undefined,
    });

    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  };

  const totalSteps = 4;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-2 w-6 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
          <CardTitle className="font-heading text-2xl">
            {step === 1 && "Your Profile"}
            {step === 2 && "Session Pricing"}
            {step === 3 && "Scheduling"}
            {step === 4 && "Launch!"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Tell clients about yourself and your approach."}
            {step === 2 && "Set your session price and duration."}
            {step === 3 && "Connect Cal.com for scheduling, or skip to manage manually."}
            {step === 4 && "Review and launch your practice."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium text-foreground">About You</label>
                <Textarea
                  id="bio"
                  placeholder="Describe your approach, what clients can expect, and your philosophy..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="credentials" className="text-sm font-medium text-foreground">Credentials</label>
                <div id="credentials" className="flex flex-wrap gap-2" role="group">
                  {CREDENTIALS_OPTIONS.map((cred) => (
                    <button
                      key={cred}
                      onClick={() => toggleCredential(cred)}
                      aria-pressed={credentials.includes(cred)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        credentials.includes(cred)
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface text-warm-gray hover:bg-surface/80"
                      }`}
                    >
                      {cred}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="modalities" className="text-sm font-medium text-foreground">Modalities</label>
                <div id="modalities" className="flex flex-wrap gap-2" role="group">
                  {MODALITIES_OPTIONS.map((mod) => (
                    <button
                      key={mod}
                      onClick={() => toggleModality(mod)}
                      aria-pressed={modalities.includes(mod)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        modalities.includes(mod)
                          ? "bg-accent text-accent-foreground"
                          : "bg-surface text-warm-gray hover:bg-surface/80"
                      }`}
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium text-foreground">
                  Session Price (EUR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray">€</span>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    value={(priceCents / 100).toFixed(0)}
                    onChange={(e) => setPriceCents(Number(e.target.value) * 100)}
                    className="h-12 pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="duration" className="text-sm font-medium text-foreground">Session Duration</label>
                <div id="duration" className="grid grid-cols-5 gap-2" role="radiogroup">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDuration(opt.value)}
                      className={`rounded-button py-2.5 text-sm font-medium transition-colors ${
                        duration === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface text-warm-gray hover:bg-surface/80"
                      }`}
                    >
                      {opt.label}
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
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-card border border-border p-4">
                <div className="mb-3 flex items-center gap-3">
                  {calConnectionStatus === "connected" ? (
                    <CheckCircle className="h-5 w-5 text-accent" />
                  ) : calConnectionStatus === "error" ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-border" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">Cal.com Integration</p>
                    <p className="text-xs text-warm-gray">
                      Connect your Cal.com account for automatic scheduling
                    </p>
                  </div>
                </div>

                {calConnectionStatus !== "connected" && (
                  <div className="space-y-3">
                    <label htmlFor="cal-api-key" className="text-sm font-medium text-foreground sr-only">Cal.com API Key</label>
                    <Input
                      id="cal-api-key"
                      type="password"
                      placeholder="Enter your Cal.com API Key"
                      value={calApiKey}
                      onChange={(e) => setCalApiKey(e.target.value)}
                    />
                    {calErrorMsg && (
                      <p className="text-xs text-destructive">{calErrorMsg}</p>
                    )}
                    <Button
                      onClick={handleTestConnection}
                      disabled={!calApiKey || calConnectionStatus === "testing"}
                      variant="outline"
                      className="w-full"
                    >
                      {calConnectionStatus === "testing" ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>
                  </div>
                )}

                {calConnectionStatus === "connected" && (
                  <p className="text-sm text-accent">
                    Connected as {calConnectedName}
                  </p>
                )}
              </div>

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setUseCalCom(false);
                    setStep((s) => s + 1);
                  }}
                  className="text-sm text-warm-gray"
                >
                  Skip — I&apos;ll manage availability manually
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                <span className="text-3xl">🎉</span>
              </div>
              <div>
                <h3 className="font-heading text-lg font-medium text-foreground">
                  Ready to Go Live!
                </h3>
                <p className="mt-2 text-sm text-warm-gray">
                  Your practice will be visible to clients. You can update your profile
                  anytime from your dashboard.
                </p>
              </div>
              <div className="rounded-card bg-surface p-4 text-left">
                <p className="mb-1 text-xs font-medium text-warm-gray">Summary</p>
                <p className="text-sm text-foreground">
                  €{(priceCents / 100).toFixed(0)} / {duration} min
                  {freeFirst && " • Free first session"}
                </p>
                <p className="mt-1 text-xs text-warm-gray">
                  {modalities.slice(0, 3).join(" • ")}
                </p>
                {useCalCom && (
                  <p className="mt-1 text-xs text-accent">
                    Cal.com: {calConnectedName}
                  </p>
                )}
                {!useCalCom && (
                  <p className="mt-1 text-xs text-warm-gray">
                    Scheduling: Manual (local availability)
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            {step < totalSteps ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="flex-1"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Launching..." : "Launch Practice"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

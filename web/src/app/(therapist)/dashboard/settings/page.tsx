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

type Tab = "profile" | "pricing" | "session-types" | "tos" | "availability" | "integrations";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
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
  const [mirotalkUrl, setMirotalkUrl] = useState("");
  const [mirotalkKey, setMirotalkKey] = useState("");
  const [videoProvider, setVideoProvider] = useState<"daily" | "mirotalk">("daily");
  const [dailyApiKey, setDailyApiKey] = useState("");
  const [resendKey, setResendKey] = useState("");

  const [sessionTypes, setSessionTypes] = useState<Array<{
    id: string;
    name: string;
    description: string | null;
    duration_min: number;
    price_cents: number;
    is_active: boolean;
    is_bundle: boolean;
    bundle_sessions: number | null;
  }>>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDuration, setNewTypeDuration] = useState("60");
  const [newTypePrice, setNewTypePrice] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [newTypeIsBundle, setNewTypeIsBundle] = useState(false);
  const [newTypeBundleSessions, setNewTypeBundleSessions] = useState("3");
  const [editingType, setEditingType] = useState<string | null>(null);

  const [tosText, setTosText] = useState("");
  const [tosVersion, setTosVersion] = useState(1);

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
        setResendKey(data.resend_api_key || "");
        setMirotalkUrl(data.mirotalk_url || "");
        setMirotalkKey(data.mirotalk_api_key || "");
        setVideoProvider(data.video_provider || "daily");
        setDailyApiKey(data.daily_api_key || "");
        setTosText(data.tos_text || "");
        setTosVersion(data.tos_version || 1);
      }

      const { data: types } = await supabase
        .from("session_types")
        .select("*")
        .eq("therapist_id", user.id)
        .order("created_at", { ascending: true });

      if (types) {
        setSessionTypes(types);
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

  const addSessionType = async () => {
    if (!newTypeName || !newTypePrice) {
      toast.error("Name and price are required");
      return;
    }
    setLoading(true);
    try {
      const { createSessionType } = await import("@/app/actions/session-types");
      const result = await createSessionType({
        name: newTypeName,
        description: newTypeDescription || null,
        duration_min: parseInt(newTypeDuration),
        price_cents: Math.round(parseFloat(newTypePrice) * 100),
        is_bundle: newTypeIsBundle,
        bundle_sessions: newTypeIsBundle ? parseInt(newTypeBundleSessions) : null,
      });

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      if (result.data) {
        setSessionTypes((prev) => [...prev, result.data!]);
      }
      setNewTypeName("");
      setNewTypePrice("");
      setNewTypeDescription("");
      setNewTypeDuration("60");
      setNewTypeIsBundle(false);
      setNewTypeBundleSessions("3");
      toast.success(newTypeIsBundle ? "Bundle created" : "Session type created");
    } catch {
      toast.error("Failed to create session type");
    } finally {
      setLoading(false);
    }
  };

  const updateSessionTypeHandler = async (id: string, updates: { name?: string; description?: string | null; duration_min?: number; price_cents?: number }) => {
    setLoading(true);
    try {
      const { updateSessionType } = await import("@/app/actions/session-types");
      const result = await updateSessionType(id, updates);

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      if (result.data) {
        setSessionTypes((prev) => prev.map((t) => (t.id === id ? result.data! : t)));
      }
      setEditingType(null);
      toast.success("Session type updated");
    } catch {
      toast.error("Failed to update session type");
    } finally {
      setLoading(false);
    }
  };

  const deleteSessionTypeHandler = async (id: string) => {
    setLoading(true);
    try {
      const { deleteSessionType } = await import("@/app/actions/session-types");
      const result = await deleteSessionType(id);

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      setSessionTypes((prev) => prev.filter((t) => t.id !== id));
      toast.success("Session type deleted");
    } catch {
      toast.error("Failed to delete session type");
    } finally {
      setLoading(false);
    }
  };

  const toggleSessionTypeActiveHandler = async (id: string, isActive: boolean) => {
    try {
      const { toggleSessionTypeActive } = await import("@/app/actions/session-types");
      const result = await toggleSessionTypeActive(id, isActive);

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      if (result.data) {
        setSessionTypes((prev) => prev.map((t) => (t.id === id ? result.data! : t)));
      }
    } catch {
      toast.error("Failed to toggle session type");
    }
  };

  const saveTosHandler = async () => {
    setLoading(true);
    try {
      const { saveTermsOfService } = await import("@/app/actions/session-types");
      const result = await saveTermsOfService(tosText);

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      setTosVersion((v) => v + 1);
      toast.success("Terms of Service saved");
    } catch {
      toast.error("Failed to save Terms of Service");
    } finally {
      setLoading(false);
    }
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
          {(["profile", "pricing", "session-types", "tos", "availability", "integrations"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 rounded-button px-4 py-2 text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-warm-gray hover:text-foreground"
              }`}
            >
              {t === "tos" ? "Terms" : t.replace("-", " ")}
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

        {tab === "session-types" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-warm-gray">
                  Create different session types that clients can book. Each type has its own name, duration, and price.
                </p>

                {sessionTypes.filter((t) => !t.is_bundle).length > 0 && (
                  <div className="space-y-2">
                    {sessionTypes.filter((t) => !t.is_bundle).map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between rounded-card border border-border p-3"
                      >
                        {editingType === st.id ? (
                          <SessionTypeEditor
                            sessionType={st}
                            onSave={(updates) => updateSessionTypeHandler(st.id, updates)}
                            onCancel={() => setEditingType(null)}
                            loading={loading}
                          />
                        ) : (
                          <>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{st.name}</span>
                                {!st.is_active && (
                                  <span className="text-xs text-warm-gray">(inactive)</span>
                                )}
                              </div>
                              <p className="text-xs text-warm-gray">
                                {st.duration_min} min — €{(st.price_cents / 100).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={st.is_active}
                                onCheckedChange={(v) => toggleSessionTypeActiveHandler(st.id, v)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingType(st.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSessionTypeHandler(st.id)}
                                className="text-destructive"
                              >
                                Delete
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-card border border-dashed border-border p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">Add Session Type</p>
                  <Input
                     placeholder="Session name (e.g., Language Lesson)"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newTypeDescription}
                    onChange={(e) => setNewTypeDescription(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">Duration</label>
                      <select
                        value={newTypeDuration}
                        onChange={(e) => setNewTypeDuration(e.target.value)}
                        className="w-full rounded-card border border-input bg-transparent px-3 py-2 text-sm"
                      >
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">60 min</option>
                        <option value="90">90 min</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">Price (EUR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-sm">€</span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="90"
                          value={newTypePrice}
                          onChange={(e) => setNewTypePrice(e.target.value)}
                          className="pl-7"
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={addSessionType} disabled={loading || !newTypeName || !newTypePrice} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add Session Type
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bundle Packages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-warm-gray">
                  Offer session bundles at a discounted rate. Clients purchase a bundle and use credits to book sessions.
                </p>

                {sessionTypes.filter((t) => t.is_bundle).length > 0 && (
                  <div className="space-y-2">
                    {sessionTypes.filter((t) => t.is_bundle).map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between rounded-card border border-border p-3"
                      >
                        {editingType === st.id ? (
                          <SessionTypeEditor
                            sessionType={st}
                            onSave={(updates) => updateSessionTypeHandler(st.id, updates)}
                            onCancel={() => setEditingType(null)}
                            loading={loading}
                          />
                        ) : (
                          <>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{st.name}</span>
                                {!st.is_active && (
                                  <span className="text-xs text-warm-gray">(inactive)</span>
                                )}
                              </div>
                              <p className="text-xs text-warm-gray">
                                {st.bundle_sessions} sessions — €{(st.price_cents / 100).toFixed(2)}
                                {st.bundle_sessions && st.price_cents > 0 && (
                                  <span className="ml-1 text-accent">
                                    (€{(st.price_cents / 100 / st.bundle_sessions).toFixed(2)}/session)
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={st.is_active}
                                onCheckedChange={(v) => toggleSessionTypeActiveHandler(st.id, v)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingType(st.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSessionTypeHandler(st.id)}
                                className="text-destructive"
                              >
                                Delete
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-card border border-dashed border-border p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">Add Bundle</p>
                  <Input
                    placeholder="Bundle name (e.g., 5-Session Pack)"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">Sessions</label>
                      <select
                        value={newTypeBundleSessions}
                        onChange={(e) => setNewTypeBundleSessions(e.target.value)}
                        className="w-full rounded-card border border-input bg-transparent px-3 py-2 text-sm"
                      >
                        <option value="3">3 sessions</option>
                        <option value="5">5 sessions</option>
                        <option value="10">10 sessions</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">Duration each</label>
                      <select
                        value={newTypeDuration}
                        onChange={(e) => setNewTypeDuration(e.target.value)}
                        className="w-full rounded-card border border-input bg-transparent px-3 py-2 text-sm"
                      >
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">60 min</option>
                        <option value="90">90 min</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">Total price</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-warm-gray text-sm">€</span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="350"
                          value={newTypePrice}
                          onChange={(e) => setNewTypePrice(e.target.value)}
                          className="pl-6"
                        />
                      </div>
                    </div>
                  </div>
                  {newTypePrice && newTypeBundleSessions && (
                    <p className="text-xs text-warm-gray">
                      €{(parseFloat(newTypePrice || "0") / parseInt(newTypeBundleSessions || "1")).toFixed(2)} per session
                    </p>
                  )}
                  <Button
                    onClick={() => {
                      setNewTypeIsBundle(true);
                      addSessionType();
                      setNewTypeIsBundle(false);
                    }}
                    disabled={loading || !newTypeName || !newTypePrice}
                    className="w-full"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add Bundle
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "tos" && (
          <Card>
            <CardHeader>
              <CardTitle>Terms of Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-warm-gray">
                Write your own Terms of Service that clients will see and accept before booking a session. If left empty, Somove&apos;s default terms apply.
              </p>
              <div className="rounded-card bg-surface p-3">
                <p className="text-xs text-warm-gray">
                  Current version: <span className="font-medium text-foreground">v{tosVersion}</span>
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Terms of Service
                </label>
                <Textarea
                  value={tosText}
                  onChange={(e) => setTosText(e.target.value)}
                  className="min-h-[200px]"
                  placeholder="Enter your terms of service here. Clients will be required to read and accept these terms before booking a session with you."
                />
              </div>
              <Button onClick={saveTosHandler} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Terms of Service"}
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
                    <label className="mb-1 block text-xs font-medium text-foreground">
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
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Instance URL
                      </label>
                      <Input
                        placeholder="https://video.somove.app"
                        value={mirotalkUrl}
                        onChange={(e) => setMirotalkUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        API Key
                      </label>
                      <Input
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

function SessionTypeEditor({
  sessionType,
  onSave,
  onCancel,
  loading,
}: {
  sessionType: {
    id: string;
    name: string;
    description: string | null;
    duration_min: number;
    price_cents: number;
    is_bundle: boolean;
    bundle_sessions: number | null;
  };
  onSave: (updates: { name?: string; description?: string | null; duration_min?: number; price_cents?: number }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(sessionType.name);
  const [duration, setDuration] = useState(String(sessionType.duration_min));
  const [price, setPrice] = useState(String(sessionType.price_cents / 100));

  return (
    <div className="flex-1 space-y-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="rounded-card border border-input bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="30">30 min</option>
          <option value="45">45 min</option>
          <option value="60">60 min</option>
          <option value="90">90 min</option>
        </select>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-warm-gray text-sm">€</span>
          <Input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="pl-6 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() =>
            onSave({
              name,
              duration_min: parseInt(duration),
              price_cents: Math.round(parseFloat(price) * 100),
            })
          }
          disabled={loading || !name || !price}
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
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

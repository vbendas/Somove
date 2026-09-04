"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Database } from "@/types/database";

type SessionType = Database["public"]["Tables"]["session_types"]["Row"];

export function SessionTypesManager({ initial }: { initial: SessionType[] }) {
  const [loading, setLoading] = useState(false);
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>(initial);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDuration, setNewTypeDuration] = useState("60");
  const [newTypePrice, setNewTypePrice] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [newTypeIsBundle, setNewTypeIsBundle] = useState(false);
  const [newTypeBundleSessions, setNewTypeBundleSessions] = useState("3");
  const [editingType, setEditingType] = useState<string | null>(null);

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

  return (
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
               aria-label="Session name"
               placeholder="Session name (e.g., Language Lesson)"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
            />
            <Textarea
              aria-label="Session description"
              placeholder="Description (optional)"
              value={newTypeDescription}
              onChange={(e) => setNewTypeDescription(e.target.value)}
              className="min-h-[60px]"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sessionTypeDuration" className="mb-1 block text-xs font-medium text-foreground">Duration</label>
                <select
                  id="sessionTypeDuration"
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
                <label htmlFor="sessionTypePrice" className="mb-1 block text-xs font-medium text-foreground">Price (EUR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-sm">€</span>
                  <Input
                    id="sessionTypePrice"
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
              aria-label="Bundle name"
              placeholder="Bundle name (e.g., 5-Session Pack)"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="bundleSessions" className="mb-1 block text-xs font-medium text-foreground">Sessions</label>
                <select
                  id="bundleSessions"
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
                <label htmlFor="bundleDuration" className="mb-1 block text-xs font-medium text-foreground">Duration each</label>
                <select
                  id="bundleDuration"
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
                <label htmlFor="bundleTotalPrice" className="mb-1 block text-xs font-medium text-foreground">Total price</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-warm-gray text-sm">€</span>
                  <Input
                    id="bundleTotalPrice"
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
        aria-label="Session type name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label="Duration"
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
            aria-label="Price"
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

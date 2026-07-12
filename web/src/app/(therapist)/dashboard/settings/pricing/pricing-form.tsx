"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface PricingInitial {
  sessionPrice: string;
  sessionDuration: string;
  freeFirst: boolean;
}

export function PricingForm({ initial }: { initial: PricingInitial }) {
  const [loading, setLoading] = useState(false);
  const [sessionPrice, setSessionPrice] = useState(initial.sessionPrice);
  const [sessionDuration, setSessionDuration] = useState(initial.sessionDuration);
  const [freeFirst, setFreeFirst] = useState(initial.freeFirst);

  const savePricing = async () => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="sessionPrice" className="mb-1 block text-sm font-medium text-foreground">
            Session Price (EUR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray">€</span>
            <Input
              id="sessionPrice"
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
                aria-pressed={sessionDuration === d}
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
  );
}

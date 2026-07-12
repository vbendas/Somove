"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { TIMEZONES, DAYS, HOURS, MINUTES, type AvailabilityData } from "../constants";

interface AvailabilityInitial {
  timezone: string;
  availability: AvailabilityData;
}

export function AvailabilityEditor({ initial }: { initial: AvailabilityInitial }) {
  const [loading, setLoading] = useState(false);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [availability, setAvailability] = useState<AvailabilityData>(initial.availability);

  const saveAvailability = async () => {
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle id="timezoneLabel">Timezone</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            aria-labelledby="timezoneLabel"
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
                        aria-pressed={isActive}
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
            <label htmlFor="bufferMinutes" className="mb-1 block text-sm font-medium text-foreground">
              Buffer between sessions
            </label>
            <select
              id="bufferMinutes"
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
  );
}

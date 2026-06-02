"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { createSession } from "@/app/actions/booking";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import type { CalSlotsResponse } from "@/lib/cal.types";

interface SessionType {
  id: string;
  name: string;
  description: string | null;
  duration_min: number;
  price_cents: number;
  is_bundle: boolean;
  bundle_sessions: number | null;
}

interface BookingFormProps {
  therapistId: string;
  durationMin: number;
  priceCents: number;
  canUseFreeSession: boolean;
  availabilityRules: Record<string, unknown> | null;
  existingBookings: Array<{ scheduled_at: string; duration_min: number }>;
  timezone: string;
  calSlots: CalSlotsResponse | null;
  useCalIntegration: boolean;
  sessionTypes: SessionType[];
  availableCredits: number;
  hasTos: boolean;
  tosAccepted: boolean;
  tosText: string | null;
  tosVersion: number;
}

interface WeeklyAvailability {
  weekly: Record<string, string[]>;
  overrides: Record<string, string[]>;
  bufferMinutes: number;
}

function getLocalAvailableDates(
  rules: WeeklyAvailability,
  durationMin: number,
  bufferMin: number,
  existingBookings: Array<{ scheduled_at: string; duration_min: number }>
): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= 28; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
    const dateStr = date.toISOString().split("T")[0];

    const overrideSlots = rules.overrides?.[dateStr];
    const weeklySlots = rules.weekly?.[dayName] || [];
    const slots = overrideSlots !== undefined ? overrideSlots : weeklySlots;

    if (slots.length === 0) continue;

    const availableSlots = slots.filter((slot) => {
      const [hours, mins] = slot.split(":").map(Number);
      const slotStart = new Date(date);
      slotStart.setHours(hours, mins, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMin + bufferMin);

      if (slotEnd.getHours() > 20) return false;

      for (const booking of existingBookings) {
        const bookingStart = new Date(booking.scheduled_at);
        const bookingEnd = new Date(bookingStart);
        bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.duration_min + bufferMin);

        if (slotStart < bookingEnd && slotEnd > bookingStart) return false;
      }

      return true;
    });

    if (availableSlots.length > 0) dates.push(dateStr);
  }

  return dates;
}

function getLocalAvailableSlots(
  dateStr: string,
  rules: WeeklyAvailability,
  durationMin: number,
  bufferMin: number,
  existingBookings: Array<{ scheduled_at: string; duration_min: number }>
): string[] {
  const date = new Date(dateStr + "T00:00:00");
  const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];

  const overrideSlots = rules.overrides?.[dateStr];
  const weeklySlots = rules.weekly?.[dayName] || [];
  const slots = overrideSlots !== undefined ? overrideSlots : weeklySlots;

  return slots.filter((slot) => {
    const [hours, mins] = slot.split(":").map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, mins, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + durationMin + bufferMin);

    if (slotEnd.getHours() > 20) return false;

    for (const booking of existingBookings) {
      const bookingStart = new Date(booking.scheduled_at);
      const bookingEnd = new Date(bookingStart);
      bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.duration_min + bufferMin);

      if (slotStart < bookingEnd && slotEnd > bookingStart) return false;
    }

    return true;
  });
}

function getCalAvailableDates(calSlots: CalSlotsResponse): string[] {
  return Object.keys(calSlots)
    .filter((date) => calSlots[date].length > 0)
    .sort();
}

function getCalAvailableSlots(
  dateStr: string,
  calSlots: CalSlotsResponse
): Array<{ start: string; end: string; label: string }> {
  const slots = calSlots[dateStr] || [];
  return slots.map((slot) => {
    const startDate = new Date(slot.start);
    const endDate = new Date(slot.end);
    return {
      start: slot.start,
      end: slot.end,
      label: `${startDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} — ${endDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
    };
  });
}

type Step = "type" | "date" | "time" | "tos" | "confirm";

export default function BookingForm({
  therapistId,
  durationMin,
  priceCents,
  canUseFreeSession,
  availabilityRules,
  existingBookings,
  timezone,
  calSlots,
  useCalIntegration,
  sessionTypes,
  availableCredits,
  hasTos,
  tosAccepted,
  tosText,
  tosVersion,
}: BookingFormProps) {
  const [step, setStep] = useState<Step>(
    hasTos && !tosAccepted ? "type" : "type"
  );
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType | null>(null);
  const [useCredits, setUseCredits] = useState(false);
  const [useFreeSession, setUseFreeSession] = useState(canUseFreeSession);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedTimeLabel, setSelectedTimeLabel] = useState<string>("");
  const [tosAgreed, setTosAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  const singleTypes = sessionTypes.filter((t) => !t.is_bundle);
  const bundleTypes = sessionTypes.filter((t) => t.is_bundle);

  const rules = useMemo(
    () =>
      (availabilityRules as unknown as WeeklyAvailability) || {
        weekly: {},
        overrides: {},
        bufferMinutes: 15,
      },
    [availabilityRules]
  );

  const activeDuration = selectedSessionType?.duration_min || durationMin;
  const activePrice = selectedSessionType?.price_cents || priceCents;

  const availableDates = useMemo(() => {
    if (useCalIntegration && calSlots) {
      return getCalAvailableDates(calSlots);
    }
    return getLocalAvailableDates(rules, activeDuration, rules.bufferMinutes || 15, existingBookings);
  }, [useCalIntegration, calSlots, rules, activeDuration, existingBookings]);

  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];

    if (useCalIntegration && calSlots) {
      return getCalAvailableSlots(selectedDate, calSlots);
    }

    return getLocalAvailableSlots(selectedDate, rules, activeDuration, rules.bufferMinutes || 15, existingBookings).map(
      (slot) => ({
        start: `${selectedDate}T${slot}:00`,
        end: "",
        label: slot,
      })
    );
  }, [selectedDate, useCalIntegration, calSlots, rules, activeDuration, existingBookings]);

  const monthDates = useMemo(() => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return availableDates.filter((d) => {
      const date = new Date(d + "T00:00:00");
      return date.getMonth() === targetMonth.getMonth() && date.getFullYear() === targetMonth.getFullYear();
    });
  }, [availableDates, monthOffset]);

  const monthLabel = useMemo(() => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return targetMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }, [monthOffset]);

  const handleTypeSelect = (type: SessionType) => {
    setSelectedSessionType(type);
    setUseFreeSession(false);
    setUseCredits(false);
    setStep("date");
  };

  const handleFreeSession = () => {
    setSelectedSessionType(null);
    setUseFreeSession(true);
    setUseCredits(false);
    setStep("date");
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime("");
    setSelectedTimeLabel("");
    setStep("time");
  };

  const handleTimeSelect = (slot: { start: string; end: string; label: string }) => {
    setSelectedTime(slot.start);
    setSelectedTimeLabel(slot.label);

    if (hasTos && !tosAccepted) {
      setStep("tos");
    } else {
      setStep("confirm");
    }
  };

  const handleTosAccept = async () => {
    if (!tosAgreed) return;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("terms_acceptances").insert({
        therapist_id: therapistId,
        client_id: user.id,
        tos_version: tosVersion,
      });

      if (error) {
        toast.error("Failed to record acceptance");
        return;
      }

      setStep("confirm");
    } catch {
      toast.error("Failed to accept terms");
    }
  };

  const handleBook = async () => {
    setLoading(true);

    const scheduledAt = new Date(selectedTime);

    const sessionTypeId = selectedSessionType?.id;
    const isFreeSession = useFreeSession || (canUseFreeSession && !selectedSessionType);
    const isCreditUse = useCredits && availableCredits > 0;

    const result = await createSession({
      therapistId,
      scheduledAt: scheduledAt.toISOString(),
      durationMin: activeDuration,
      sessionType: isFreeSession ? "free_first_session" : isCreditUse ? "single" : "single",
      priceCents: isFreeSession || isCreditUse ? 0 : activePrice,
      timeZone: timezone,
      sessionTypeId: sessionTypeId || undefined,
      useCredits: isCreditUse,
    });

    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  };

  const steps: Step[] = hasTos && !tosAccepted
    ? ["type", "date", "time", "tos", "confirm"]
    : ["type", "date", "time", "confirm"];

  const currentStepIndex = steps.indexOf(step);

  const isFreeEligible = canUseFreeSession && !selectedSessionType;
  const effectivePrice = isFreeEligible ? 0 : useCredits ? 0 : activePrice;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentStepIndex ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      {step === "type" && (
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-medium text-foreground">
            Choose Session Type
          </h3>

          {canUseFreeSession && (
            <button
              onClick={handleFreeSession}
              className="w-full rounded-card border border-accent/30 bg-accent/5 p-4 text-left transition-all hover:border-accent/50 hover:bg-accent/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Free First Session</p>
                  <p className="text-sm text-warm-gray">Try a session with no commitment</p>
                </div>
                <span className="text-lg font-medium text-accent">Free</span>
              </div>
            </button>
          )}

          {singleTypes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-warm-gray uppercase tracking-wide">Individual Sessions</p>
              {singleTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type)}
                  className="w-full rounded-card border border-border p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{type.name}</p>
                      {type.description && (
                        <p className="text-sm text-warm-gray">{type.description}</p>
                      )}
                      <p className="text-xs text-warm-gray">{type.duration_min} min</p>
                    </div>
                    <span className="text-lg font-medium text-foreground">
                      €{(type.price_cents / 100).toFixed(0)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {bundleTypes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-warm-gray uppercase tracking-wide">Bundle Packages</p>
              {bundleTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type)}
                  className="w-full rounded-card border border-border p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{type.name}</p>
                      <p className="text-sm text-warm-gray">
                        {type.bundle_sessions} sessions — €{(type.price_cents / 100 / (type.bundle_sessions || 1)).toFixed(0)}/session
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-medium text-foreground">
                        €{(type.price_cents / 100).toFixed(0)}
                      </span>
                      <p className="text-xs text-warm-gray">{type.duration_min} min each</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {singleTypes.length === 0 && bundleTypes.length === 0 && !canUseFreeSession && (
            <p className="py-4 text-center text-warm-gray">
              No session types available. Please try again later.
            </p>
          )}
        </div>
      )}

      {step === "date" && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setStep("type")}>
              ← Change type
            </Button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg font-medium text-foreground">
              {monthLabel}
            </h3>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMonthOffset((m) => Math.max(0, m - 1))}
                disabled={monthOffset === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMonthOffset((m) => Math.min(2, m + 1))}
                disabled={monthOffset >= 2}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {monthDates.length === 0 ? (
            <p className="py-8 text-center text-warm-gray">No available dates this month</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {monthDates.map((dateStr) => {
                const date = new Date(dateStr + "T00:00:00");
                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateSelect(dateStr)}
                    className="rounded-card border border-border p-3 text-center transition-all hover:border-primary/30 hover:bg-primary/5"
                  >
                    <p className="text-xs text-warm-gray">
                      {date.toLocaleDateString("en-GB", { weekday: "short" })}
                    </p>
                    <p className="text-lg font-medium text-foreground">{date.getDate()}</p>
                    <p className="text-xs text-warm-gray">
                      {date.toLocaleDateString("en-GB", { month: "short" })}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === "time" && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setStep("date")}>
              ← Change date
            </Button>
            <p className="text-sm text-warm-gray">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>

          {availableSlots.length === 0 ? (
            <p className="py-8 text-center text-warm-gray">No available times for this date</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot, i) => (
                <button
                  key={`${slot.start}-${i}`}
                  onClick={() => handleTimeSelect(slot)}
                  className="rounded-card border border-border p-3 text-center transition-all hover:border-primary/30 hover:bg-primary/5"
                >
                  <Clock className="mx-auto mb-1 h-4 w-4 text-warm-gray" />
                  <p className="font-medium text-foreground">{slot.label}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "tos" && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setStep("time")} className="mb-4">
            ← Change time
          </Button>

          <h3 className="mb-4 font-heading text-lg font-medium text-foreground">
            Terms of Service
          </h3>

          <div className="max-h-[300px] overflow-y-auto rounded-card border border-border bg-card p-4 mb-4">
            <div className="prose prose-sm text-foreground whitespace-pre-wrap">
              {tosText}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-card border border-border p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={tosAgreed}
              onChange={(e) => setTosAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <span className="text-sm text-foreground">
              I have read and accept the Terms of Service (v{tosVersion})
            </span>
          </label>

          <Button
            className="mt-4 w-full"
            size="lg"
            onClick={handleTosAccept}
            disabled={!tosAgreed || loading}
          >
            Accept & Continue
          </Button>
        </div>
      )}

      {step === "confirm" && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setStep(hasTos && !tosAccepted ? "tos" : "time")} className="mb-4">
            ← Change time
          </Button>

          <div className="space-y-3 rounded-card border border-border bg-card p-4">
            {selectedSessionType && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-warm-gray">Session</span>
                <span className="text-sm font-medium text-foreground">
                  {selectedSessionType.name}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-warm-gray">Date</span>
              <span className="text-sm font-medium text-foreground">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-warm-gray">Time</span>
              <span className="text-sm font-medium text-foreground">
                {selectedTimeLabel} ({timezone})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-warm-gray">Duration</span>
              <span className="text-sm font-medium text-foreground">{activeDuration} min</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="text-lg font-medium text-foreground">
                  {effectivePrice === 0 ? "Free" : `€${(effectivePrice / 100).toFixed(0)}`}
                </span>
              </div>
            </div>
          </div>

          {availableCredits > 0 && !useFreeSession && (
            <div className="mt-4 flex items-center justify-between rounded-card border border-primary/30 bg-primary/5 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {availableCredits} {availableCredits === 1 ? "Credit" : "Credits"} Available
                </p>
                <p className="text-xs text-warm-gray">Use a credit instead of paying</p>
              </div>
              <Button
                variant={useCredits ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCredits(!useCredits)}
              >
                {useCredits ? "Using Credit" : "Use Credit"}
              </Button>
            </div>
          )}

          {canUseFreeSession && !useFreeSession && (
            <div className="mt-4 flex items-center justify-between rounded-card border border-accent/30 bg-accent/5 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Use free first session?</p>
                <p className="text-xs text-warm-gray">This is your first session with this therapist</p>
              </div>
              <Button
                variant={useFreeSession ? "default" : "outline"}
                size="sm"
                onClick={() => setUseFreeSession(!useFreeSession)}
              >
                {useFreeSession ? "Using Free" : "Use Free"}
              </Button>
            </div>
          )}

          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={handleBook}
            disabled={loading}
          >
            {loading
              ? "Booking..."
              : effectivePrice === 0
              ? "Confirm Booking"
              : "Continue to Payment"}
          </Button>
        </div>
      )}
    </div>
  );
}

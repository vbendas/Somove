"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { rescheduleSession } from "@/app/actions/session";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RescheduleButtonProps {
  sessionId: string;
}

export default function RescheduleButton({ sessionId }: RescheduleButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [newDateTime, setNewDateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReschedule = async () => {
    if (!newDateTime) {
      toast.error("Please select a new date and time");
      return;
    }

    setLoading(true);
    const newDate = new Date(newDateTime);
    const result = await rescheduleSession(sessionId, newDate.toISOString());
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Session rescheduled");
      router.push("/my-sessions");
      router.refresh();
    }
    setLoading(false);
  };

  if (!showPicker) {
    return (
      <Button variant="outline" onClick={() => setShowPicker(true)}>
        Reschedule
      </Button>
    );
  }

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="mb-2 text-sm font-medium text-foreground">
        Choose a new date and time
      </p>
      <input
        type="datetime-local"
        aria-label="New date and time"
        value={newDateTime}
        onChange={(e) => setNewDateTime(e.target.value)}
        className="mb-4 w-full rounded-card border border-border bg-card px-3 py-2 text-sm text-foreground"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleReschedule}
          disabled={loading || !newDateTime}
        >
          {loading ? "Rescheduling..." : "Confirm Reschedule"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPicker(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

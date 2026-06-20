"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cancelSession } from "@/app/actions/booking";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CancelButtonProps {
  sessionId: string;
  scheduledAt: string;
}

export default function CancelButton({ sessionId, scheduledAt }: CancelButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sessionDate = new Date(scheduledAt);
  const hoursUntil = (sessionDate.getTime() - Date.now()) / (1000 * 60 * 60);
  const canCancel = hoursUntil > 24;
  const refundNote = canCancel
    ? "You will receive a full refund."
    : "Cancellations within 24 hours are not eligible for a refund.";

  const handleCancel = async () => {
    setLoading(true);
    const result = await cancelSession(sessionId);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Session cancelled");
      router.push("/my-sessions");
    }
    setLoading(false);
  };

  if (!showConfirm) {
    return (
      <Button variant="destructive" onClick={() => setShowConfirm(true)}>
        Cancel Session
      </Button>
    );
  }

  return (
    <div className="rounded-card border border-destructive/20 bg-destructive/5 p-4">
      <p className="mb-2 text-sm font-medium text-foreground">
        Are you sure you want to cancel?
      </p>
      <p className="mb-4 text-xs text-warm-gray">{refundNote}</p>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleCancel}
          disabled={loading}
        >
          {loading ? "Cancelling..." : "Confirm Cancel"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
        >
          Keep Session
        </Button>
      </div>
    </div>
  );
}

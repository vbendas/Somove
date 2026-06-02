"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelSession } from "@/app/actions/booking";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CancelSessionButton({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    setLoading(true);
    const result = await cancelSession(sessionId);

    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Session cancelled");
      router.refresh();
    }
  };

  if (showConfirm) {
    return (
      <div className="flex-1 rounded-card border border-destructive/30 bg-destructive/5 p-3">
        <p className="mb-2 text-sm text-foreground">Cancel this session?</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Cancelling..." : "Yes, Cancel"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="flex-1"
          >
            Keep Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => setShowConfirm(true)}
      className="flex-1 text-destructive hover:text-destructive"
    >
      Cancel
    </Button>
  );
}

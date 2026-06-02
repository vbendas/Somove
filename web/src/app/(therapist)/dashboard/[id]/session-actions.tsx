"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Video, Play, CheckCircle, UserX } from "lucide-react";

export default function SessionActions({
  sessionId,
  status,
  scheduledAt,
}: {
  sessionId: string;
  status: string;
  scheduledAt: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isConfirmed = status === "confirmed";
  const isActive = status === "active";
  const isPastScheduled = new Date(scheduledAt) < new Date();

  const handleStart = async () => {
    setLoading(true);
    try {
      const { startSession } = await import("@/app/actions/session");
      const result = await startSession(sessionId);

      if ("error" in result) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      router.push(`/session/${sessionId}`);
    } catch {
      toast.error("Failed to start session");
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setLoading(true);
    try {
      const { getSessionJoinUrl } = await import("@/app/actions/session");
      const { data: { user } } = await (await import("@/lib/supabase/client")).createClient().auth.getUser();
      if (!user) return;

      const result = await getSessionJoinUrl(sessionId, user.id, "therapist");

      if ("error" in result) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      window.open(result.joinUrl, "_blank");
    } catch {
      toast.error("Failed to join session");
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { completeSession } = await import("@/app/actions/session");
      const result = await completeSession(sessionId);

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Session completed");
        router.refresh();
      }
    } catch {
      toast.error("Failed to complete session");
    }
    setLoading(false);
  };

  const handleNoShow = async () => {
    if (!confirm("Mark this client as no-show?")) return;
    setLoading(true);
    try {
      const { markNoShow } = await import("@/app/actions/session");
      const result = await markNoShow(sessionId);

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Marked as no-show");
        router.refresh();
      }
    } catch {
      toast.error("Failed to mark no-show");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      {isConfirmed && (
        <Button onClick={handleStart} disabled={loading} className="w-full" size="lg">
          <Play className="mr-2 h-4 w-4" />
          {loading ? "Starting..." : "Start Session"}
        </Button>
      )}

      {isActive && (
        <Button onClick={handleJoin} disabled={loading} className="w-full" size="lg">
          <Video className="mr-2 h-4 w-4" />
          {loading ? "Joining..." : "Join Session"}
        </Button>
      )}

      {isActive && (
        <Button onClick={handleComplete} disabled={loading} variant="outline" className="w-full">
          <CheckCircle className="mr-2 h-4 w-4" />
          End Session
        </Button>
      )}

      {isConfirmed && isPastScheduled && (
        <Button onClick={handleNoShow} disabled={loading} variant="ghost" className="w-full text-destructive hover:text-destructive">
          <UserX className="mr-2 h-4 w-4" />
          Mark No Show
        </Button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Video } from "lucide-react";

export default function JoinButton({
  sessionId,
  userId,
  role,
  isStartable,
  disabled,
}: {
  sessionId: string;
  userId: string;
  role: "client" | "therapist";
  isStartable: boolean;
  disabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async () => {
    setLoading(true);

    try {
      if (role === "therapist" && isStartable) {
        const { startSession } = await import("@/app/actions/session");
        const result = await startSession(sessionId);

        if ("error" in result) {
          toast.error(result.error);
          setLoading(false);
          return;
        }

        router.push(`/session/${sessionId}`);
      } else {
        const { getSessionJoinUrl } = await import("@/app/actions/session");
        const result = await getSessionJoinUrl(sessionId, userId, role);

        if ("error" in result) {
          toast.error(result.error);
          setLoading(false);
          return;
        }

        window.open(result.joinUrl, "_blank");
      }
    } catch {
      toast.error("Failed to join session");
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleJoin}
      disabled={disabled || loading}
      className="w-full"
      size="lg"
    >
      <Video className="mr-2 h-4 w-4" />
      {loading
        ? "Joining..."
        : isStartable && role === "therapist"
        ? "Start Session"
        : "Join Video Call"}
    </Button>
  );
}

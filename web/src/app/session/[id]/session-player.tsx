"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { completeSession } from "@/app/actions/session";
import { toast } from "sonner";
import { PhoneOff } from "lucide-react";

export default function SessionPlayer({
  joinUrl,
  sessionId,
  role,
}: {
  joinUrl: string;
  sessionId: string;
  role: "client" | "therapist";
}) {
  const [ending, setEnding] = useState(false);
  const router = useRouter();

  const handleEnd = async () => {
    setEnding(true);

    try {
      const result = await completeSession(sessionId);
      if ("error" in result) {
        toast.error(result.error);
      }
    } catch {
      // Silently handle - room closes regardless
    }

    router.push(role === "client" ? "/my-sessions" : "/dashboard");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between bg-background/90 px-4 py-2 backdrop-blur-sm">
        <p className="text-sm font-medium text-foreground">
          {role === "therapist" ? "Professional View — " : ""}Somove Session
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleEnd}
          disabled={ending}
        >
          <PhoneOff className="mr-2 h-4 w-4" />
          {ending
            ? role === "client"
              ? "Leaving..."
              : "Ending..."
            : "End Session"}
        </Button>
      </div>
      <iframe
        src={joinUrl}
        className="flex-1 border-0"
        allow="camera;microphone;fullscreen;display-capture"
        title="Video Session"
      />
    </div>
  );
}

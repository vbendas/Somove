"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reorderSiteSections } from "@/app/actions/pages";

interface ReorderButtonsProps {
  /** Ordered list of { key, sort_order } for ALL sections, sorted ascending. */
  sections: { key: string; sort_order: number }[];
  index: number;
}

export function ReorderButtons({ sections, index }: ReorderButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingDirection, setPendingDirection] = useState<"up" | "down" | null>(null);

  async function move(direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const current = sections[index];
    const target = sections[targetIndex];

    setPendingDirection(direction);
    startTransition(async () => {
      const result = await reorderSiteSections([
        { key: current.key, sort_order: target.sort_order },
        { key: target.key, sort_order: current.sort_order },
      ]);
      setPendingDirection(null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={index === 0 || isPending}
        onClick={() => move("up")}
        aria-label="Move up"
      >
        <ChevronUp className={`h-4 w-4 ${isPending && pendingDirection === "up" ? "opacity-50" : ""}`} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={index === sections.length - 1 || isPending}
        onClick={() => move("down")}
        aria-label="Move down"
      >
        <ChevronDown className={`h-4 w-4 ${isPending && pendingDirection === "down" ? "opacity-50" : ""}`} />
      </Button>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reorderSiteMenus } from "@/app/actions/menus";

interface MenuReorderButtonsProps {
  /** Ordered list of { slug, sort_order } for the reorderable group (e.g. all footer_* menus), sorted ascending. */
  menus: { slug: string; sort_order: number }[];
  index: number;
}

/** Copies the up/down swap-reorder pattern from admin/website/reorder-buttons.tsx. Scoped to footer menus — the header menu isn't reorderable. */
export function MenuReorderButtons({ menus, index }: MenuReorderButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingDirection, setPendingDirection] = useState<"up" | "down" | null>(null);

  async function move(direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menus.length) return;

    const current = menus[index];
    const target = menus[targetIndex];

    setPendingDirection(direction);
    startTransition(async () => {
      const result = await reorderSiteMenus([
        { slug: current.slug, sort_order: target.sort_order },
        { slug: target.slug, sort_order: current.sort_order },
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
        disabled={index === menus.length - 1 || isPending}
        onClick={() => move("down")}
        aria-label="Move down"
      >
        <ChevronDown className={`h-4 w-4 ${isPending && pendingDirection === "down" ? "opacity-50" : ""}`} />
      </Button>
    </div>
  );
}

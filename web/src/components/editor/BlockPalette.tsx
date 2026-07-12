"use client";

import * as Icons from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { blockSchemaDefs } from "@/blocks";

type IconComponent = (typeof Icons)["Component"];

interface BlockPaletteProps {
  onAddBlock: (type: string) => void;
}

/**
 * Scrollable list of every registered block type, driving "add block" from
 * the editor toolbar (desktop: fixed left column; mobile: inside a Sheet).
 */
export function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  const defs = Object.values(blockSchemaDefs);

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-3">
        {defs.map((def) => {
          const Icon: IconComponent =
            (Icons as unknown as Record<string, IconComponent>)[def.icon] ?? Icons.Component;

          return (
            <button
              key={def.type}
              type="button"
              onClick={() => onAddBlock(def.type)}
              className="flex items-center gap-3 rounded-md border bg-background p-3 text-left text-sm transition-colors hover:border-primary hover:bg-accent"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-medium">{def.label}</span>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

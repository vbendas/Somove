"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ArrowRight, Copy, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MenuChildItem, MenuItem } from "@/lib/menus/schema";

interface SortableMenuItemRowProps {
  item: MenuItem | MenuChildItem;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  /** Present only for top-level rows. */
  onIndent?: () => void;
  indentDisabled?: boolean;
  /** Present only for child rows. */
  onOutdent?: () => void;
}

const KIND_LABEL: Record<MenuChildItem["kind"], string> = {
  anchor: "Anchor",
  internal: "Page",
  external: "External",
};

/**
 * A single draggable row in the menu tree — mirrors
 * src/components/editor/SortableBlock.tsx's selection/drag-handle pattern:
 * only the grip button is wired to dnd-kit's attributes/listeners, so
 * clicking the row body selects instead of starting a drag.
 */
export function SortableMenuItemRow({
  item,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onIndent,
  indentDisabled,
  onOutdent,
}: SortableMenuItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-md border p-2 transition-shadow",
        isSelected ? "border-primary ring-2 ring-primary" : "border-border hover:border-foreground/30",
        isDragging && "z-10 opacity-70"
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <span className="truncate text-sm font-medium text-foreground">{item.label}</span>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {KIND_LABEL[item.kind]}
        </Badge>
        {item.style === "button" && (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            Button
          </Badge>
        )}
      </button>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {onIndent && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label="Indent under previous item"
            disabled={indentDisabled}
            onClick={onIndent}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
        {onOutdent && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label="Move out to top level"
            onClick={onOutdent}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          aria-label="Duplicate item"
          onClick={onDuplicate}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          aria-label="Delete item"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

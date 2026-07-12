"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Block } from "@/blocks";

interface SortableBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  /** The block's rendered preview, resolved by the parent `EditorCanvas`. */
  children: ReactNode;
}

/**
 * Wraps a single block's rendered preview with selection, drag-reorder, and
 * duplicate/delete affordances. The drag handle is the ONLY element wired to
 * dnd-kit's `attributes`/`listeners`, so clicking the block body selects it
 * instead of starting a drag.
 */
export function SortableBlock({ block, isSelected, onSelect, onDelete, onDuplicate, children }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative mb-4 rounded-md border transition-shadow last:mb-0",
        isSelected ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-border",
        isDragging && "z-10 opacity-70"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 -top-3 z-10 flex items-center justify-between px-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
          isSelected && "opacity-100"
        )}
      >
        <button
          type="button"
          aria-label="Drag to reorder block"
          className="pointer-events-auto flex h-6 w-6 cursor-grab items-center justify-center rounded border bg-background text-muted-foreground shadow-sm hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="pointer-events-auto flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-6 w-6 bg-background"
            aria-label="Duplicate block"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-6 w-6 bg-background"
            aria-label="Delete block"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className="cursor-pointer rounded-md p-1"
      >
        {children}
      </div>
    </div>
  );
}

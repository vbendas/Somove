"use client";

import { History, Monitor, Plus, SlidersHorizontal, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SaveState = "saved" | "dirty" | "saving" | "error";

const SAVE_STATE_CONFIG: Record<SaveState, { label: string; dot: string }> = {
  saved: { label: "Saved", dot: "bg-emerald-500" },
  dirty: { label: "Unsaved changes", dot: "bg-amber-500" },
  saving: { label: "Saving…", dot: "bg-amber-500 animate-pulse" },
  error: { label: "Save failed", dot: "bg-destructive" },
};

export interface EditorToolbarProps {
  contextLabel: string;
  saveState: SaveState;
  previewHref: string;
  viewportMode: "desktop" | "mobile";
  onViewportModeChange: (mode: "desktop" | "mobile") => void;
  onPublish: () => void;
  onOpenRevisions: () => void;
  /** Mobile-only: opens the block palette Sheet. Rendered only when provided. */
  onOpenPalette?: () => void;
  /** Mobile-only: opens the inspector Sheet. Rendered only when provided. */
  onOpenInspector?: () => void;
}

export function EditorToolbar({
  contextLabel,
  saveState,
  previewHref,
  viewportMode,
  onViewportModeChange,
  onPublish,
  onOpenRevisions,
  onOpenPalette,
  onOpenInspector,
}: EditorToolbarProps) {
  const status = SAVE_STATE_CONFIG[saveState];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {onOpenPalette && (
          <Button type="button" variant="outline" size="sm" className="lg:hidden" onClick={onOpenPalette}>
            <Plus className="h-4 w-4" />
            Add block
          </Button>
        )}
        <span className="truncate text-sm font-medium">{contextLabel}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} aria-hidden="true" />
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {onOpenInspector && (
          <Button type="button" variant="outline" size="sm" className="lg:hidden" onClick={onOpenInspector}>
            <SlidersHorizontal className="h-4 w-4" />
            Properties
          </Button>
        )}

        <div className="hidden items-center gap-1 rounded-md border p-0.5 sm:flex">
          <Button
            type="button"
            variant={viewportMode === "desktop" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            aria-label="Desktop preview"
            aria-pressed={viewportMode === "desktop"}
            onClick={() => onViewportModeChange("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={viewportMode === "mobile" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            aria-label="Mobile preview"
            aria-pressed={viewportMode === "mobile"}
            onClick={() => onViewportModeChange("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>

        <Button asChild variant="outline" size="sm">
          <a href={previewHref} target="_blank" rel="noopener noreferrer">
            Preview
          </a>
        </Button>

        <Button type="button" variant="outline" size="sm" onClick={onOpenRevisions}>
          <History className="h-4 w-4" />
          Revisions
        </Button>

        <Button type="button" size="sm" onClick={onPublish}>
          Publish
        </Button>
      </div>
    </div>
  );
}

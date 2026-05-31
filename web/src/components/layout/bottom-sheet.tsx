"use client";

import { useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={sheetRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col rounded-t-card-lg bg-background shadow-lg",
          "pb-[env(safe-area-inset-bottom)]",
          "animate-in slide-in-from-bottom duration-300 ease-out",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "bottom-sheet-title" : undefined}
      >
        <div className="flex items-center justify-center pt-3">
          <div className="h-1.5 w-12 rounded-full bg-border" />
        </div>

        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-4">
            {title && (
              <h2
                id="bottom-sheet-title"
                className="font-heading text-lg font-medium"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="ml-auto h-8 w-8"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}

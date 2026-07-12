"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { PageEditorProps } from "./PageEditor";

type Revision = Awaited<ReturnType<PageEditorProps["loadRevisions"]>>[number];

interface RevisionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadRevisions: PageEditorProps["loadRevisions"];
  onRestore: (id: string) => Promise<void>;
}

export function RevisionsSheet({ open, onOpenChange, loadRevisions, onRestore }: RevisionsSheetProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    loadRevisions()
      .then((data) => {
        if (!cancelled) setRevisions(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load revisions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, loadRevisions]);

  async function handleRestore(id: string) {
    if (!window.confirm("Restore this revision? Your current draft will be replaced.")) return;

    setRestoringId(id);
    try {
      await onRestore(id);
      toast.success("Revision restored");
      onOpenChange(false);
    } catch {
      toast.error("Failed to restore revision");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Revision history</SheetTitle>
          <SheetDescription>Restore a previously published version into your draft.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="space-y-2 py-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : revisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No revisions yet.</p>
            ) : (
              revisions.map((revision) => (
                <div key={revision.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
                  <span className="text-sm">{new Date(revision.created_at).toLocaleString()}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={restoringId === revision.id}
                    onClick={() => handleRestore(revision.id)}
                  >
                    {restoringId === revision.id ? "Restoring…" : "Restore"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

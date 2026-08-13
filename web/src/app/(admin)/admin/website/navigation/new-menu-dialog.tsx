"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createSiteMenu } from "@/app/actions/menus";

export function NewMenuDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createSiteMenu(slug.trim(), title.trim());

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setSlug("");
    setTitle("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New menu
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New menu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="menu-title">Title</Label>
            <Input
              id="menu-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resources"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-slug">Slug</Label>
            <Input
              id="menu-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="footer_resources"
              pattern="[a-z0-9_]+"
              maxLength={60}
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-warm-gray">
              Lowercase letters, numbers, and underscores only. Prefix with <code>footer_</code> to show it as a
              footer column.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create menu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

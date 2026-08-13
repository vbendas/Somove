"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteSiteMenu } from "@/app/actions/menus";

export function DeleteMenuButton({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    setDeleting(true);
    const result = await deleteSiteMenu(slug);
    setDeleting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Menu deleted");
    router.refresh();
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleDelete}
      disabled={deleting}
      aria-label={`Delete ${title}`}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

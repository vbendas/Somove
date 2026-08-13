"use client";

import { MenuEditor } from "@/components/menu-editor/MenuEditor";
import type { MenuItem } from "@/lib/menus/schema";
import type { AnchorOption } from "@/lib/menus/anchors";
import { saveMenuDraft, publishMenuDraft, getMenuRevisions, restoreMenuRevision } from "@/app/actions/menus";

interface MenuEditorClientProps {
  slug: string;
  contextLabel: string;
  variant: "header" | "footer";
  initialItems: MenuItem[];
  anchorOptions: AnchorOption[];
}

export function MenuEditorClient({ slug, contextLabel, variant, initialItems, anchorOptions }: MenuEditorClientProps) {
  return (
    <MenuEditor
      initialItems={initialItems}
      contextLabel={contextLabel}
      variant={variant}
      previewHref="/landing?preview=1"
      anchorOptions={anchorOptions}
      saveDraft={(items) => saveMenuDraft(slug, items)}
      publish={() => publishMenuDraft(slug)}
      loadRevisions={() => getMenuRevisions(slug)}
      restoreRevision={(id) => restoreMenuRevision(id)}
    />
  );
}

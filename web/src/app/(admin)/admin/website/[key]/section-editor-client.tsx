"use client";

import { PageEditor } from "@/components/editor/PageEditor";
import type { Block } from "@/blocks";
import { saveSectionDraft, publishSectionDraft, getPageRevisions, restorePageRevision } from "@/app/actions/pages";

interface SectionEditorClientProps {
  sectionKey: string;
  contextLabel: string;
  initialBlocks: Block[];
}

export function SectionEditorClient({ sectionKey, contextLabel, initialBlocks }: SectionEditorClientProps) {
  return (
    <PageEditor
      initialBlocks={initialBlocks}
      contextLabel={contextLabel}
      previewHref="/landing?preview=1"
      saveDraft={(blocks) => saveSectionDraft(sectionKey, blocks)}
      publish={() => publishSectionDraft(sectionKey)}
      loadRevisions={() => getPageRevisions({ sectionKey })}
      restoreRevision={(id) => restorePageRevision(id)}
    />
  );
}

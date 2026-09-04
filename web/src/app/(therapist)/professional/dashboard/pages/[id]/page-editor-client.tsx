"use client";

import { PageEditor } from "@/components/editor/PageEditor";
import type { Block } from "@/blocks";
import type { TherapistPageRow } from "@/types/cms";
import {
  saveTherapistPageDraft,
  publishTherapistPageDraft,
  getPageRevisions,
  restorePageRevision,
} from "@/app/actions/pages";

interface PageEditorClientProps {
  page: TherapistPageRow;
}

/**
 * Thin client wrapper binding a single therapist page's row to the shared
 * `PageEditor` shell: draft content/meta prefill, and each callback bound to
 * this page's id via the CMS v2 draft/publish/revision server actions.
 */
export function PageEditorClient({ page }: PageEditorClientProps) {
  const initialBlocks = (
    page.draft_content && page.draft_content.length > 0 ? page.draft_content : page.content
  ) as Block[];

  return (
    <PageEditor
      initialBlocks={initialBlocks}
      meta={{
        title: page.title,
        description: page.description ?? undefined,
        seo_title: page.seo_title ?? undefined,
        seo_description: page.seo_description ?? undefined,
      }}
      contextLabel={page.title}
      previewHref={`/therapists/${page.therapist_id}/${page.slug}?preview=1`}
      saveDraft={(blocks, meta) => saveTherapistPageDraft(page.id, blocks, meta)}
      publish={() => publishTherapistPageDraft(page.id)}
      loadRevisions={() => getPageRevisions({ pageId: page.id })}
      restoreRevision={(revisionId) => restorePageRevision(revisionId)}
    />
  );
}

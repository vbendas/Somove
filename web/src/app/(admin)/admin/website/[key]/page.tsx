import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SiteSectionRow } from "@/types/cms";
import type { Block } from "@/blocks";
import { SectionEditorClient } from "./section-editor-client";

export const dynamic = "force-dynamic";

interface SectionEditorPageProps {
  params: Promise<{ key: string }>;
}

export default async function SectionEditorPage({ params }: SectionEditorPageProps) {
  const { key } = await params;

  const supabase = await createClient();
  const { data: section } = await supabase
    .from("site_sections")
    .select("*")
    .eq("key", key)
    .single<SiteSectionRow>();

  if (!section) notFound();

  const initialBlocks = ((section.draft_content?.length ? section.draft_content : section.content) ??
    []) as Block[];

  return (
    <SectionEditorClient
      sectionKey={section.key}
      contextLabel={section.title || section.key}
      initialBlocks={initialBlocks}
    />
  );
}

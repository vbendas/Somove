import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TherapistPageRow } from "@/types/cms";
import { PageEditorClient } from "./page-editor-client";

export const dynamic = "force-dynamic";

export default async function TherapistPageEditorRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: page } = await supabase
    .from("therapist_pages")
    .select("*")
    .eq("id", id)
    .eq("therapist_id", user.id)
    .single();

  if (!page) notFound();

  return <PageEditorClient page={page as TherapistPageRow} />;
}

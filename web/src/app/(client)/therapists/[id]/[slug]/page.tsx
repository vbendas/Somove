import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}): Promise<Metadata> {
  const { id, slug } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("therapist_pages")
    .select("title, description, seo_title, seo_description")
    .eq("therapist_id", id)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!page) return {};

  return {
    title: page.seo_title || page.title,
    description: page.seo_description || page.description || undefined,
  };
}

export default async function TherapistCustomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { id, slug } = await params;
  const sp = await searchParams;
  const isPreview = sp.preview === "1";
  const supabase = await createClient();

  const PAGE_SELECT = "*, therapist_profile!inner(*, users!inner(name))";

  let page: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let usingDraft = false;

  if (isPreview) {
    // Draft preview: only the page's owner or an admin may see
    // draft_content. Verify server-side before touching any draft data;
    // anyone else silently falls through to the normal published view
    // below (no error, no hint that preview mode or an unpublished page
    // even exists).
    const { data: unpublished } = await supabase
      .from("therapist_pages")
      .select(PAGE_SELECT)
      .eq("therapist_id", id)
      .eq("slug", slug)
      .maybeSingle();

    if (unpublished) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let isAuthorized = false;
      if (user) {
        if (user.id === unpublished.therapist_id) {
          isAuthorized = true;
        } else {
          const { data: userRow } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();
          isAuthorized = userRow?.role === "admin";
        }
      }

      if (isAuthorized) {
        page = unpublished;
        usingDraft = true;
      }
    }
  }

  if (!page) {
    const { data } = await supabase
      .from("therapist_pages")
      .select(PAGE_SELECT)
      .eq("therapist_id", id)
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    page = data;
    usingDraft = false;
  }

  if (!page) notFound();

  const therapistName = (page.therapist_profile?.users as any)?.name || "Therapist"; // eslint-disable-line @typescript-eslint/no-explicit-any

  const blocks = usingDraft
    ? (page.draft_content && page.draft_content.length > 0 ? page.draft_content : page.content) || []
    : page.content || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <Link href={`/therapists/${id}`} className="text-sm text-warm-gray hover:text-foreground">
          ← Back to {therapistName}
        </Link>

        <h1 className="mt-6 font-heading text-4xl font-medium">{page.title}</h1>
        {page.description && (
          <p className="mt-2 text-lg text-warm-gray">{page.description}</p>
        )}

        <div className="mt-8">
          <BlockRenderer blocks={blocks} />
        </div>

        <div className="mt-12 pt-6 border-t text-sm text-warm-gray">
          <Link href={`/therapists/${id}/book`} className="text-primary hover:underline">
            Book a session with {therapistName}
          </Link>
        </div>
      </div>
    </div>
  );
}

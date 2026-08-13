import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SiteMenuRow } from "@/types/cms";
import { menuItemsSchema, RESERVED_MENU_SLUG } from "@/lib/menus/schema";
import { flattenAnchorOptions } from "@/lib/menus/anchors";
import { MenuEditorClient } from "./menu-editor-client";

export const dynamic = "force-dynamic";

interface MenuEditorPageProps {
  params: Promise<{ slug: string }>;
}

export default async function MenuEditorPage({ params }: MenuEditorPageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: menu } = await supabase
    .from("site_menus")
    .select("*")
    .eq("slug", slug)
    .single<SiteMenuRow>();

  if (!menu) notFound();

  const rawItems = menu.draft_items?.length ? menu.draft_items : menu.items;
  const parsedItems = menuItemsSchema.safeParse(rawItems ?? []);
  const initialItems = parsedItems.success ? parsedItems.data : [];

  const { data: sections } = await supabase
    .from("site_sections")
    .select("key, title")
    .eq("is_published", true)
    .order("sort_order");
  const anchorOptions = flattenAnchorOptions(sections ?? []);

  return (
    <MenuEditorClient
      slug={menu.slug}
      contextLabel={menu.title}
      variant={slug === RESERVED_MENU_SLUG ? "header" : "footer"}
      initialItems={initialItems}
      anchorOptions={anchorOptions}
    />
  );
}

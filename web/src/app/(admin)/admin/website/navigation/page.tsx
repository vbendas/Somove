import Link from "next/link";
import { ListTree } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { getSiteMenus } from "@/app/actions/menus";
import { RESERVED_MENU_SLUG } from "@/lib/menus/schema";
import type { SiteMenuRow } from "@/types/cms";
import { NewMenuDialog } from "./new-menu-dialog";
import { DeleteMenuButton } from "./delete-menu-button";
import { MenuReorderButtons } from "./menu-reorder-buttons";

export const dynamic = "force-dynamic";

function hasUnpublishedChanges(menu: SiteMenuRow): boolean {
  return JSON.stringify(menu.draft_items ?? []) !== JSON.stringify(menu.items ?? []);
}

export default async function NavigationPage() {
  const raw = (await getSiteMenus()) as SiteMenuRow[];
  const menus = [...raw].sort((a, b) => a.sort_order - b.sort_order);
  const footerMenus = menus.filter((m) => m.slug !== RESERVED_MENU_SLUG);
  const footerOrderInfo = footerMenus.map((m) => ({ slug: m.slug, sort_order: m.sort_order }));

  return (
    <PageContainer width="full">
      <PageHeader
        title="Navigation"
        description="Manage the header and footer menus shown on the public site."
        backHref="/admin/website"
        actions={<NewMenuDialog />}
      />

      {menus.length === 0 ? (
        <EmptyState
          icon={ListTree}
          title="No menus yet"
          description="Create your first menu to start building site navigation."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-surface text-left text-xs uppercase text-warm-gray">
              <tr>
                <th className="w-10 px-3 py-3"></th>
                <th className="px-3 py-3 font-medium">Title</th>
                <th className="px-3 py-3 font-medium">Slug</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu) => {
                const footerIndex = footerOrderInfo.findIndex((m) => m.slug === menu.slug);
                return (
                  <tr key={menu.slug} className="border-b last:border-b-0 hover:bg-surface/50">
                    <td className="px-3 py-3">
                      {footerIndex !== -1 && <MenuReorderButtons menus={footerOrderInfo} index={footerIndex} />}
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/admin/website/navigation/${menu.slug}`} className="font-medium hover:underline">
                        {menu.title}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-warm-gray">{menu.slug}</code>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={menu.is_published ? "default" : "outline"}>
                          {menu.is_published ? "Live" : "Draft"}
                        </Badge>
                        {menu.is_published && hasUnpublishedChanges(menu) && (
                          <Badge variant="secondary">Unsaved changes</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/website/navigation/${menu.slug}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Edit
                        </Link>
                        {menu.slug !== RESERVED_MENU_SLUG && (
                          <DeleteMenuButton slug={menu.slug} title={menu.title} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}

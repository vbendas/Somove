import Link from "next/link";
import { LayoutTemplate } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { getSiteSections } from "@/app/actions/pages";
import type { SiteSectionRow } from "@/types/cms";
import { NewSectionDialog } from "./new-section-dialog";
import { ReorderButtons } from "./reorder-buttons";

export const dynamic = "force-dynamic";

function hasUnpublishedChanges(section: SiteSectionRow): boolean {
  return JSON.stringify(section.draft_content ?? []) !== JSON.stringify(section.content ?? []);
}

export default async function WebsiteSectionsPage() {
  const raw = (await getSiteSections()) as SiteSectionRow[];
  const sections = [...raw].sort((a, b) => a.sort_order - b.sort_order);
  const orderInfo = sections.map((s) => ({ key: s.key, sort_order: s.sort_order }));

  return (
    <PageContainer width="full">
      <PageHeader
        title="Website"
        description="Manage the content sections that make up the public site."
        actions={<NewSectionDialog />}
      />

      {sections.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No sections yet"
          description="Create your first section to start building the public site."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-surface text-left text-xs uppercase text-warm-gray">
              <tr>
                <th className="w-10 px-3 py-3"></th>
                <th className="px-3 py-3 font-medium">Title</th>
                <th className="px-3 py-3 font-medium">Key</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section, index) => (
                <tr key={section.key} className="border-b last:border-b-0 hover:bg-surface/50">
                  <td className="px-3 py-3">
                    <ReorderButtons sections={orderInfo} index={index} />
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/admin/website/${section.key}`} className="font-medium hover:underline">
                      {section.title || section.key}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-warm-gray">{section.key}</code>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={section.is_published ? "default" : "outline"}>
                        {section.is_published ? "Live" : "Draft"}
                      </Badge>
                      {section.is_published && hasUnpublishedChanges(section) && (
                        <Badge variant="secondary">Unsaved changes</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/admin/website/${section.key}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTherapistPages } from "@/app/actions/pages";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { TherapistPageRow } from "@/types/cms";
import { NewPageDialog } from "./new-page-dialog";
import { DeletePageButton } from "./delete-page-button";

export const dynamic = "force-dynamic";

export default async function TherapistPagesList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const pages = (await getTherapistPages()) as TherapistPageRow[];

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Pages"
        description="Custom pages for your public profile, built with the visual editor."
        actions={<NewPageDialog />}
      />

      {pages.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No pages yet"
          description="Create a custom page to share your approach, specialties, or anything else with prospective clients."
        />
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card key={page.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/pages/${page.id}`}
                      className="truncate font-medium text-foreground hover:underline"
                    >
                      {page.title}
                    </Link>
                    <Badge variant={page.status === "published" ? "default" : "secondary"}>
                      {page.status}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-warm-gray">/{page.slug}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/pages/${page.id}`}>Edit</Link>
                  </Button>
                  <DeletePageButton id={page.id} title={page.title} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

import { Users } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TherapistCard } from "@/components/directory/therapist-card";
import { getTherapists } from "@/lib/directory";

export const dynamic = "force-dynamic";

export default async function TherapistsPage() {
  const therapists = await getTherapists();

  return (
    <PageContainer width="dashboard">
      <PageHeader
        title="Find a professional"
        description="Browse our professionals and book a session."
      />
      {therapists.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No professionals available yet"
          description="Check back soon!"
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {therapists.map((t) => (
            <TherapistCard key={t.user_id} therapist={t} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

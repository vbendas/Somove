import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer width="narrow">
      <Skeleton className="mb-6 h-9 w-32" />

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
      </div>

      {/* Session list */}
      <Skeleton className="mb-3 h-4 w-40" />
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-20 rounded-card" />
      </div>
    </PageContainer>
  );
}

import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer width="narrow">
      <Skeleton className="mb-6 h-9 w-32" />

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
      </div>

      {/* Charts */}
      <div className="mb-6 space-y-3">
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>

      {/* Payment history */}
      <Skeleton className="mb-3 h-4 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </PageContainer>
  );
}

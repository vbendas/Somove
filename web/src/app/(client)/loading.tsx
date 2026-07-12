import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer width="wide">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
      </div>

      {/* List items */}
      <Skeleton className="mb-3 h-4 w-40" />
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-20 rounded-card" />
      </div>
    </PageContainer>
  );
}

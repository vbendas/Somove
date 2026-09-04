import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer width="full">
      <Skeleton className="mb-6 h-9 w-40" />
      <Skeleton className="h-[600px] w-full rounded-card" />
    </PageContainer>
  );
}

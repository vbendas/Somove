import Link from "next/link";
import { SearchX } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageContainer standalone width="narrow">
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
          <SearchX className="h-8 w-8 text-warm-gray" />
        </div>
        <h1 className="font-heading text-3xl font-medium text-foreground">
          Page not found
        </h1>
        <p className="text-warm-gray">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <Link href="/">
          <Button className="mt-2">Back to home</Button>
        </Link>
      </div>
    </PageContainer>
  );
}

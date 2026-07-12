import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** If set, renders a back chevron link before the title. */
  backHref?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-start justify-between gap-4",
        className
      )}
    >
      <div className="flex items-start gap-2">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Go back"
            className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-warm-gray transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <div>
          <h1 className="font-heading text-3xl font-medium text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-warm-gray">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

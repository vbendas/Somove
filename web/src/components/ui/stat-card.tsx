import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon?: React.ComponentType<{ className?: string }>;
  value: React.ReactNode;
  label: string;
  href?: string;
  hint?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  href,
  hint,
  className,
}: StatCardProps) {
  const content = (
    <CardContent className="flex flex-col items-center gap-1 p-3 text-center sm:flex-row sm:items-center sm:gap-4 sm:p-5 sm:text-left">
      {Icon && (
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-10 sm:w-10">
          <Icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
        </div>
      )}
      <div className="min-w-0">
        <div className="font-heading text-xl font-medium text-foreground sm:text-2xl">
          {value}
        </div>
        <div className="whitespace-normal text-xs leading-tight text-warm-gray sm:text-sm">
          {label}
        </div>
        {hint && <div className="mt-0.5 text-xs text-warm-gray">{hint}</div>}
      </div>
    </CardContent>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "block rounded-xl border bg-card text-card-foreground shadow transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
      >
        {content}
      </Link>
    );
  }

  return <Card className={className}>{content}</Card>;
}

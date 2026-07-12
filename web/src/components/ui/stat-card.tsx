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
    <CardContent className="flex items-center gap-4 p-5">
      {Icon && (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      )}
      <div className="min-w-0">
        <div className="font-heading text-2xl font-medium text-foreground">
          {value}
        </div>
        <div className="truncate text-sm text-warm-gray">{label}</div>
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

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
        <Icon className="h-8 w-8 text-warm-gray" />
      </div>
      <h3 className="mb-2 font-heading text-lg font-medium text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-warm-gray">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-button bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

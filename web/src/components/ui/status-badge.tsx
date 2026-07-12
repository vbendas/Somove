import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SessionStatus =
  | "confirmed"
  | "active"
  | "pending_payment"
  | "completed"
  | "cancelled"
  | "no_show";

interface StatusMeta {
  label: string;
  className: string;
  /** CSS custom-property reference for the status's dominant hue (e.g. for calendar event coloring). */
  cssVar: string;
}

export const SESSION_STATUS_META: Record<SessionStatus, StatusMeta> = {
  confirmed: {
    label: "Confirmed",
    className: "border-transparent bg-accent/15 text-accent-dark",
    cssVar: "var(--accent)",
  },
  active: {
    label: "In Progress",
    className: "border-transparent bg-light-moss/50 text-accent-dark",
    cssVar: "var(--light-moss)",
  },
  pending_payment: {
    label: "Pending Payment",
    className: "border-transparent bg-soft-rose/30 text-primary-dark",
    cssVar: "var(--soft-rose)",
  },
  completed: {
    label: "Completed",
    className: "border-transparent bg-muted text-muted-foreground",
    cssVar: "var(--muted-foreground)",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-transparent bg-muted/60 text-warm-gray",
    cssVar: "var(--warm-gray)",
  },
  no_show: {
    label: "No Show",
    // dark:text-destructive-foreground: text-destructive on bg-destructive/15
    // measures ~3:1 against the dark-mode card color (below WCAG AA 4.5:1 for
    // this badge's small bold text); the paired -foreground token clears
    // >11:1 against the same tinted background.
    className: "border-transparent bg-destructive/15 text-destructive dark:text-destructive-foreground",
    cssVar: "var(--destructive)",
  },
};

const FALLBACK_STATUS_META: StatusMeta = {
  label: "Unknown",
  className: "border-transparent bg-muted text-muted-foreground",
  cssVar: "var(--muted-foreground)",
};

function getStatusMeta(status: string): StatusMeta {
  return (
    SESSION_STATUS_META[status as SessionStatus] ?? {
      ...FALLBACK_STATUS_META,
      label: status ? status.replace(/_/g, " ") : FALLBACK_STATUS_META.label,
    }
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = getStatusMeta(status);
  return (
    <Badge className={cn(meta.className, className)}>{meta.label}</Badge>
  );
}

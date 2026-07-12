import { Calendar, Clock, CreditCard } from "lucide-react";
import { formatMonthYear } from "@/lib/format";

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
}

interface ClientHeaderProps {
  client: ClientProfile;
  firstSessionDate: string | null;
  sessionsCount: number;
  remainingCredits: number;
}

/**
 * Avatar + meta-chip row shown under the page title for a client's detail
 * page. The name/email themselves are rendered by the page's <PageHeader>
 * (title/description) — this component only adds the avatar and stats.
 */
export function ClientHeader({
  client,
  firstSessionDate,
  sessionsCount,
  remainingCredits,
}: ClientHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 font-heading text-xl font-medium text-primary">
          {client.name?.charAt(0) || "?"}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-warm-gray">
          {firstSessionDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Client since {formatMonthYear(firstSessionDate)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{sessionsCount} sessions</span>
          </div>
          {remainingCredits > 0 && (
            <div className="flex items-center gap-1 text-primary">
              <CreditCard className="h-3 w-3" />
              <span>
                {remainingCredits} credit{remainingCredits !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

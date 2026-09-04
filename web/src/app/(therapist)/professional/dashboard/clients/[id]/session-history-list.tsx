import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "lucide-react";
import { formatDate, formatTime } from "@/lib/format";

export interface SessionInfo {
  id: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
}

interface SessionHistoryListProps {
  sessions: SessionInfo[];
}

export function SessionHistoryList({ sessions }: SessionHistoryListProps) {
  if (sessions.length === 0) {
    return <EmptyState icon={Calendar} title="No sessions yet" />;
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {formatDate(session.scheduled_at, "long")}
                </p>
                <p className="text-sm text-warm-gray">
                  {formatTime(session.scheduled_at)} · {session.duration_min} min
                </p>
              </div>
              <StatusBadge status={session.status} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

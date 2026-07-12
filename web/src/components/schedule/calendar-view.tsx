"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { SESSION_STATUS_META, type SessionStatus } from "@/components/ui/status-badge";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => <p className="p-4 text-warm-gray">Loading calendar…</p>,
});

interface SessionEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
}

interface CalendarViewProps {
  sessions: SessionEvent[];
}

/** Fallback for any status not present in SESSION_STATUS_META. */
const DEFAULT_STATUS_COLOR = "var(--muted-foreground)";

function getStatusColor(status: string): string {
  return SESSION_STATUS_META[status as SessionStatus]?.cssVar ?? DEFAULT_STATUS_COLOR;
}

// Per-status event text color, picked for contrast against that status's
// full-opacity `cssVar` background (see getStatusColor) — not just the
// muted/tinted color used for the small badge variant. Most status colors
// are light/mid-tone so a dark background-color reads best; "active" is the
// one status backed by a dark color (light-moss) and needs light text.
const STATUS_TEXT_COLOR: Partial<Record<SessionStatus, string>> = {
  active: "var(--card-foreground)",
};
const DEFAULT_EVENT_TEXT_COLOR = "var(--background)";

function getStatusTextColor(status: string): string {
  return STATUS_TEXT_COLOR[status as SessionStatus] ?? DEFAULT_EVENT_TEXT_COLOR;
}

export default function CalendarView({ sessions }: CalendarViewProps) {
  const router = useRouter();
  const events = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    start: s.start,
    end: s.end,
    backgroundColor: getStatusColor(s.status),
    borderColor: getStatusColor(s.status),
    textColor: getStatusTextColor(s.status),
  }));

  return (
    <div className="rounded-card border border-border bg-card p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        eventClick={(info) => {
          router.push(`/dashboard/schedule?session=${info.event.id}`);
        }}
        height="auto"
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        nowIndicator={true}
        locale="en-GB"
      />
    </div>
  );
}

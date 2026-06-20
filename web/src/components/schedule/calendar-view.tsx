"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

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

const statusColors: Record<string, string> = {
  confirmed: "#8BA888",
  active: "#D4A574",
  pending_payment: "#B5C7D3",
  completed: "#9A9590",
  cancelled: "#E8C4B8",
};

export default function CalendarView({ sessions }: CalendarViewProps) {
  const events = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    start: s.start,
    end: s.end,
    backgroundColor: statusColors[s.status] || "#9A9590",
    borderColor: statusColors[s.status] || "#9A9590",
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
          window.location.href = `/dashboard/schedule?session=${info.event.id}`;
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

# Launch Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 11 improvements to make Somove launch-ready for remote professionals, therapists, and teachers.

**Architecture:** Each feature is independent and can be implemented in parallel. Features follow existing patterns: server actions in `src/app/actions/`, Supabase for data, Resend for emails, shadcn/ui components.

**Tech Stack:** Next.js 14 App Router, Supabase, Resend, Tailwind CSS, shadcn/ui, FullCalendar

---

## Task 1: Fix N+1 Query in Client Directory

**Files:**
- Modify: `web/src/app/(therapist)/dashboard/clients/page.tsx:61-79`

- [ ] **Step 1: Replace per-client note queries with batch query**

Replace the N+1 loop (lines 61-79) with a single batch query:

```typescript
if (clientIds.length > 0) {
  const { data: latestNotes } = await supabase
    .from("client_notes")
    .select("client_id, body, updated_at")
    .eq("therapist_id", user.id)
    .is("deleted_at", null)
    .in("client_id", clientIds)
    .order("updated_at", { ascending: false });

  if (latestNotes) {
    const noteMap = new Map<string, string>();
    for (const note of latestNotes) {
      if (!noteMap.has(note.client_id) && note.body) {
        const firstLine = note.body.split("\n")[0];
        noteMap.set(
          note.client_id,
          firstLine.length > 60 ? firstLine.slice(0, 60) + "..." : firstLine
        );
      }
    }
    for (const [cId, client] of clientsMap.entries()) {
      const note = noteMap.get(cId);
      if (note) client.lastNote = note;
    }
  }
}
```

- [ ] **Step 2: Remove the old N+1 loop**

Delete lines 61-79 (the `for (const cId of clientIds)` loop).

- [ ] **Step 3: Verify the page loads correctly**

Run: `cd /Users/victorbendas/Documents/GitHub/Somove/web && npm run typecheck`
Expected: No type errors

---

## Task 2: Therapist Schedule Calendar View

**Files:**
- Modify: `web/src/app/(therapist)/dashboard/schedule/page.tsx`
- Create: `web/src/components/schedule/calendar-view.tsx`
- Install: `@fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction`

- [ ] **Step 1: Install FullCalendar dependencies**

```bash
cd /Users/victorbendas/Documents/GitHub/Somove/web
npm install @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/react
```

- [ ] **Step 2: Create CalendarView component**

Create `web/src/components/schedule/calendar-view.tsx`:

```tsx
"use client";

import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Link from "next/link";

interface SessionEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  clientId: string;
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
    extendedProps: { status: s.status, clientId: s.clientId },
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
```

- [ ] **Step 3: Update schedule page to use calendar**

Update `web/src/app/(therapist)/dashboard/schedule/page.tsx` to transform sessions into calendar events and render `CalendarView`:

```tsx
import CalendarView from "@/components/schedule/calendar-view";

// In the component, transform sessions:
const calendarEvents = (sessions || []).map((session) => {
  const client = session.users as unknown as { name: string } | null;
  const start = new Date(session.scheduled_at);
  const end = new Date(start.getTime() + session.duration_min * 60000);
  return {
    id: session.id,
    title: client?.name || "Client",
    start: start.toISOString(),
    end: end.toISOString(),
    status: session.status,
    clientId: session.client_id,
  };
});

// Replace the list with:
<CalendarView sessions={calendarEvents} />
```

- [ ] **Step 4: Verify typecheck passes**

```bash
cd /Users/victorbendas/Documents/GitHub/Somove/web && npm run typecheck
```

---

## Task 3: Client Cancellation UI

**Files:**
- Create: `web/src/components/sessions/cancel-button.tsx`
- Modify: `web/src/app/(client)/my-sessions/[id]/page.tsx`

- [ ] **Step 1: Create CancelButton component**

Create `web/src/components/sessions/cancel-button.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cancelSession } from "@/app/actions/booking";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CancelButtonProps {
  sessionId: string;
  scheduledAt: string;
}

export default function CancelButton({ sessionId, scheduledAt }: CancelButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sessionDate = new Date(scheduledAt);
  const hoursUntil = (sessionDate.getTime() - Date.now()) / (1000 * 60 * 60);
  const canCancel = hoursUntil > 24;
  const refundNote = canCancel
    ? "You will receive a full refund."
    : "Cancellations within 24 hours are not eligible for a refund.";

  const handleCancel = async () => {
    setLoading(true);
    const result = await cancelSession(sessionId);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Session cancelled");
      router.push("/my-sessions");
    }
    setLoading(false);
  };

  if (!showConfirm) {
    return (
      <Button variant="destructive" onClick={() => setShowConfirm(true)}>
        Cancel Session
      </Button>
    );
  }

  return (
    <div className="rounded-card border border-destructive/20 bg-destructive/5 p-4">
      <p className="mb-2 text-sm font-medium text-foreground">
        Are you sure you want to cancel?
      </p>
      <p className="mb-4 text-xs text-warm-gray">{refundNote}</p>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleCancel}
          disabled={loading}
        >
          {loading ? "Cancelling..." : "Confirm Cancel"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
        >
          Keep Session
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add CancelButton to client session detail page**

In `web/src/app/(client)/my-sessions/[id]/page.tsx`, add the cancel button for sessions that are `confirmed` or `pending_payment`:

```tsx
import CancelButton from "@/components/sessions/cancel-button";

// Add in the session detail section, after the join button:
{["confirmed", "pending_payment"].includes(session.status) && (
  <CancelButton sessionId={session.id} scheduledAt={session.scheduled_at} />
)}
```

- [ ] **Step 3: Verify typecheck**

```bash
cd /Users/victorbendas/Documents/GitHub/Somove/web && npm run typecheck
```

---

## Task 4: "Book Again" Button for Past Sessions

**Files:**
- Modify: `web/src/app/(client)/my-sessions/page.tsx`

- [ ] **Step 1: Add "Book Again" link to past session cards**

In the past sessions tab, add a link to the therapist's booking page:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

// In the past session card, after the status badge:
<Link href={`/therapists/${session.therapist_id}/book`}>
  <Button variant="outline" size="sm">
    Book Again
  </Button>
</Link>
```

- [ ] **Step 2: Verify typecheck**

```bash
cd /Users/victorbendas/Documents/GitHub/Somove/web && npm run typecheck
```

---

## Task 5: Enhanced Emergency Page

**Files:**
- Modify: `web/src/app/(client)/emergency/page.tsx`

- [ ] **Step 1: Expand crisis resources with country detection**

Update the emergency page with comprehensive resources and country auto-detection:

```tsx
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageSquare } from "lucide-react";

const CRISIS_RESOURCES: Record<string, { name: string; number: string; description: string }[]> = {
  PT: [
    { name: "SNS 24", number: "808200204", description: "24h health line (free)" },
    { name: "SOS Voz Amiga", number: "213544545", description: "Emotional support" },
    { name: "Voz de Apoio", number: "228323535", description: "Crisis support" },
  ],
  EU: [
    { name: "Samaritans", number: "116123", description: "24h emotional support (free)" },
    { name: "Emergency", number: "112", description: "EU emergency number" },
  ],
  US: [
    { name: "988 Suicide & Crisis Lifeline", number: "988", description: "24h call or text" },
    { name: "Crisis Text Line", number: "741741", description: "Text HOME to 741741" },
  ],
  GB: [
    { name: "Samaritans", number: "116123", description: "24h emotional support (free)" },
    { name: "NHS 111", number: "111", description: "Non-emergency health line" },
  ],
  DEFAULT: [
    { name: "Befrienders Worldwide", number: "", description: "befrienders.org — international directory" },
    { name: "Emergency", number: "112", description: "Local emergency services" },
  ],
};

export default async function EmergencyPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let country = "DEFAULT";
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("country")
      .eq("id", user.id)
      .single();
    if (userData?.country) country = userData.country;
  }

  const resources = CRISIS_RESOURCES[country] || CRISIS_RESOURCES.DEFAULT;
  const euResources = CRISIS_RESOURCES.EU;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-2 font-heading text-3xl font-medium text-foreground">
          Help & Emergency
        </h1>
        <p className="mb-6 text-sm text-warm-gray">
          If you are in immediate danger, call your local emergency number.
        </p>

        <Card className="mb-4">
          <CardContent className="space-y-3 py-6">
            <h2 className="font-heading text-lg font-medium text-foreground">
              Crisis Resources
            </h2>
            {resources.map((r) => (
              <a
                key={r.number || r.name}
                href={r.number ? `tel:${r.number}` : undefined}
                className="flex items-center gap-3 rounded-card border border-border p-3 transition-colors hover:border-primary/30"
              >
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{r.name}</p>
                  <p className="text-sm text-warm-gray">
                    {r.number && `${r.number} — `}{r.description}
                  </p>
                </div>
              </a>
            ))}
          </CardContent>
        </Card>

        {country !== "EU" && (
          <Card className="mb-4">
            <CardContent className="space-y-3 py-6">
              <h2 className="font-heading text-lg font-medium text-foreground">
                EU-Wide Resources
              </h2>
              {euResources.map((r) => (
                <a
                  key={r.number}
                  href={`tel:${r.number}`}
                  className="flex items-center gap-3 rounded-card border border-border p-3 transition-colors hover:border-primary/30"
                >
                  <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{r.name}</p>
                    <p className="text-sm text-warm-gray">{r.number} — {r.description}</p>
                  </div>
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {user && (
          <Card>
            <CardContent className="py-6">
              <h2 className="mb-3 font-heading text-lg font-medium text-foreground">
                Contact Your Therapist
              </h2>
              <p className="mb-4 text-sm text-warm-gray">
                Send an urgent message to your therapist. They will be notified immediately.
              </p>
              <a
                href="/inbox?emergency=true"
                className="inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Send Urgent Message
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd /Users/victorbendas/Documents/GitHub/Somove/web && npm run typecheck
```

---

## Task 6: Therapist Availability Badge on Directory

**Files:**
- Modify: `web/src/app/(client)/page.tsx`

- [ ] **Step 1: Add availability display to therapist cards**

In the therapist directory card, add a "typically available" indicator based on `availability_rules`:

```tsx
// In the therapist card, after the price section:
{therapist.availability_rules && (
  <p className="mt-2 text-xs text-warm-gray">
    Typically available {formatAvailability(therapist.availability_rules)}
  </p>
)}
```

Add a helper function at the top of the file:

```tsx
function formatAvailability(rules: Record<string, unknown>): string {
  const days = Object.keys(rules);
  if (days.length === 0) return "";
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const availableDays = days
    .filter((d) => (rules[d] as Record<string, unknown>)?.available)
    .map((d) => dayNames[parseInt(d)] || d);
  if (availableDays.length === 0) return "";
  if (availableDays.length <= 2) return availableDays.join(" & ");
  return `${availableDays[0]}–${availableDays[availableDays.length - 1]}`;
}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd /Users/victorbendas/Documents/GitHub/Somove/web && npm run typecheck
```

---

## Task 7: Therapist Directory Search & Filter

**Files:**
- Create: `web/src/components/directory/therapist-filters.tsx`
- Modify: `web/src/app/(client)/page.tsx`

- [ ] **Step 1: Create TherapistFilters component**

Create `web/src/components/directory/therapist-filters.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface TherapistFiltersProps {
  modalities: string[];
}

export default function TherapistFilters({ modalities }: TherapistFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeModality = searchParams.get("modality") || "";

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        onClick={() => setFilter("modality", "")}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          !activeModality
            ? "bg-primary text-primary-foreground"
            : "bg-surface text-warm-gray hover:bg-surface/80"
        }`}
      >
        All
      </button>
      {modalities.map((m) => (
        <button
          key={m}
          onClick={() => setFilter("modality", m)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeModality === m
              ? "bg-primary text-primary-foreground"
              : "bg-surface text-warm-gray hover:bg-surface/80"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add filtering logic to the directory page**

In `web/src/app/(client)/page.tsx`, extract unique modalities and filter:

```tsx
import TherapistFilters from "@/components/directory/therapist-filters";

// In getTherapists, accept optional modality filter:
async function getTherapists(modality?: string) {
  // ... existing query ...
  let filtered = profiles;
  if (modality) {
    filtered = profiles.filter((p) =>
      p.modalities?.includes(modality)
    );
  }
  return filtered.map(/* ... */);
}

// In the component:
export default async function Home({
  searchParams,
}: {
  searchParams: { modality?: string };
}) {
  // ... existing code ...
  const therapists = await getTherapists(searchParams.modality);

  // Extract unique modalities:
  const allModalities = Array.from(
    new Set(therapists.flatMap((t) => t.modalities || []))
  ).sort();

  // In the template, before the grid:
  {allModalities.length > 1 && (
    <TherapistFilters modalities={allModalities} />
  )}
```

- [ ] **Step 3: Verify typecheck**

```bash
cd /Users/victorbendas/Documents/GitHub/Somove/web && npm run typecheck
```

---

## Task 8: Email Notification for New Messages

**Files:**
- Modify: `web/src/app/actions/messaging.ts`
- Modify: `web/src/lib/resend.ts`

- [ ] **Step 1: Add sendNewMessage method to ResendClient**

In `web/src/lib/resend.ts`, add:

```tsx
async sendNewMessage(params: {
  to: string;
  recipientName: string;
  senderName: string;
  messagePreview: string;
  conversationUrl: string;
}): Promise<{ id: string } | { error: string }> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2D2A26; font-size: 24px;">New Message</h1>
      <p style="color: #9A9590;">Hi ${params.recipientName},</p>
      <p style="color: #9A9590;">${params.senderName} sent you a message:</p>
      <div style="background: #FFF5E1; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0; color: #2D2A26;">${params.messagePreview}</p>
      </div>
      <a href="${params.conversationUrl}" style="display: inline-block; background: #D4A574; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Message</a>
    </div>
  `;

  return this.send({
    to: params.to,
    subject: `New message from ${params.senderName}`,
    html,
  });
}
```

- [ ] **Step 2: Add email notification to messaging action**

In `web/src/app/actions/messaging.ts`, after sending a message, add:

```tsx
import { getResendClient } from "@/lib/resend";

// After the message is inserted:
const resend = getResendClient();
if (resend) {
  const { data: recipientData } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", recipientId)
    .single();

  const { data: senderData } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  if (recipientData && senderData) {
    // Check if recipient has email notifications enabled
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("email_new_message")
      .eq("user_id", recipientId)
      .single();

    if (!prefs || prefs.email_new_message) {
      await resend.sendNewMessage({
        to: recipientData.email,
        recipientName: recipientData.name || "there",
        senderName: senderData.name || "Someone",
        messagePreview: content.length > 150 ? content.slice(0, 150) + "..." : content,
        conversationUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/inbox/${conversationId}`,
      });
    }
  }
}
```

- [ ] **Step 3: Verify typecheck**

```bash
cd /Users/victorbendas/Documents/GitHub/Somove/web && npm run typecheck
```

---

## Task 9: Session Reminder Email Cron

**Files:**
- Create: `web/src/app/api/cron/reminders/route.ts`

- [ ] **Step 1: Create cron endpoint for session reminders**

Create `web/src/app/api/cron/reminders/route.ts`:

```tsx
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  // Find sessions starting in 15-25 minutes (to catch the cron window)
  const windowStart = new Date(now.getTime() + 15 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 1000);

  const { data: sessions } = await admin
    .from("sessions")
    .select("id, client_id, therapist_id, scheduled_at")
    .eq("status", "confirmed")
    .gte("scheduled_at", windowStart.toISOString())
    .lt("scheduled_at", windowEnd.toISOString());

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const resend = getResendClient();
  let sent = 0;

  for (const session of sessions) {
    // Check if reminder already sent
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("type", "session_reminder")
      .like("link", `%${session.id}%`)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const [clientUser, therapistUser] = await Promise.all([
      admin.from("users").select("id, name, email").eq("id", session.client_id).single(),
      admin.from("users").select("id, name, email").eq("id", session.therapist_id).single(),
    ]);

    if (!clientUser.data || !therapistUser.data) continue;

    const client = clientUser.data;
    const therapist = therapistUser.data;

    // Create in-app notifications
    await admin.from("notifications").insert([
      {
        user_id: client.id,
        type: "session_reminder",
        title: "Session Starting Soon",
        body: `Your session with ${therapist.name || "your therapist"} starts in 15 minutes.`,
        link: `/session/${session.id}`,
      },
      {
        user_id: therapist.id,
        type: "session_reminder",
        title: "Session Starting Soon",
        body: `Your session starts in 15 minutes.`,
        link: `/session/${session.id}`,
      },
    ]);

    // Send email to client
    if (resend) {
      await resend.sendSessionReminder({
        to: client.email,
        clientName: client.name || "Client",
        therapistName: therapist.name || "Professional",
        scheduledAt: session.scheduled_at,
        joinUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/session/${session.id}`,
        minutesUntil: 15,
      });
      sent++;
    }
  }

  return NextResponse.json({ sent });
}
```

- [ ] **Step 2: Add cron configuration to vercel.json**

If `web/vercel.json` doesn't exist, create it:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

- [ ] **Step 3: Verify typecheck**

```bash
cd /Users/victorbendas/Documents/GitHub/Somove/web && npm run typecheck
```

---

## Task 10: Therapist Onboarding Wizard Improvements

**Files:**
- Modify: `web/src/app/setup/page.tsx`
- Modify: `web/src/app/actions/setup.ts`

- [ ] **Step 1: Add Stripe Connect onboarding step**

In the setup wizard, add a step that links to Stripe Connect onboarding:

```tsx
// Add as a new step after pricing:
{
  id: "stripe",
  title: "Connect Payments",
  description: "Set up Stripe to receive payments from clients.",
  content: (
    <div className="space-y-4">
      <p className="text-sm text-warm-gray">
        Connect your Stripe account to receive payments. You'll be redirected to Stripe to complete setup.
      </p>
      <a
        href="/api/stripe/connect"
        target="_blank"
        className="inline-flex items-center gap-2 rounded-card bg-[#635BFF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#635BFF]/90 transition-colors"
      >
        Connect Stripe Account
      </a>
      <p className="text-xs text-warm-gray">
        You can skip this and set up payments later in Settings.
      </p>
    </div>
  ),
  canSkip: true,
},
```

- [ ] **Step 2: Add validation for required fields**

In the setup action, validate that name, email, and at least basic profile info are provided before allowing completion.

- [ ] **Step 3: Verify typecheck**

```bash
cd /Users/victorbendas/Documents/GitHub/Somove/web && npm run typecheck
```

---

## Task 11: ICS Calendar Export

**Files:**
- Create: `web/src/app/api/calendar/[sessionId]/route.ts`

- [ ] **Step 1: Create ICS endpoint**

Create `web/src/app/api/calendar/[sessionId]/route.ts`:

```tsx
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("sessions")
    .select("id, scheduled_at, duration_min, client_id, therapist_id")
    .eq("id", params.sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const [clientUser, therapistUser] = await Promise.all([
    admin.from("users").select("name").eq("id", session.client_id).single(),
    admin.from("users").select("name").eq("id", session.therapist_id).single(),
  ]);

  const therapistName = therapistUser.data?.name || "Therapist";
  const start = new Date(session.scheduled_at);
  const end = new Date(start.getTime() + session.duration_min * 60000);

  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Somove//EN",
    "BEGIN:VEVENT",
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:Session with ${therapistName}`,
    `DESCRIPTION:Your session with ${therapistName} on Somove`,
    `URL:${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/session/${session.id}`,
    `UID:${session.id}@somove.app`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="somove-session-${session.id.slice(0, 8)}.ics"`,
    },
  });
}
```

- [ ] **Step 2: Add "Add to Calendar" button on booking confirmation**

In `web/src/app/(client)/booking/confirmed/page.tsx`, add:

```tsx
<a
  href={`/api/calendar/${sessionId}`}
  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
>
  <CalendarDays className="h-4 w-4" />
  Add to Calendar
</a>
```

- [ ] **Step 3: Verify typecheck**

```bash
cd /Users/victorbendas/Documents/GitHub/Somove/web && npm run typecheck
```

---

## Verification

After all tasks are complete:

- [ ] Run `npm run typecheck` — no errors
- [ ] Run `npm run lint` — no errors
- [ ] Run `npm run build` — successful build
- [ ] Test each feature manually in the browser

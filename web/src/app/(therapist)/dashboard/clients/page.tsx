import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import ClientListSearch from "./client-list-search";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const page = parseInt(searchParams.page || "0");
  const pageSize = 50;

  const { data: sessions } = await supabase
    .from("sessions")
    .select("client_id, users!sessions_client_id_fkey(name, email), scheduled_at, status")
    .eq("therapist_id", user.id)
    .order("scheduled_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const clientsMap = new Map<
    string,
    {
      name: string;
      email: string;
      lastSession: string;
      nextSession: string | null;
      lastNote: string | null;
    }
  >();

  sessions?.forEach((s) => {
    const client = s.users as unknown as { name: string; email: string };
    if (!client) return;
    const existing = clientsMap.get(s.client_id);
    const scheduledAt = new Date(s.scheduled_at).toISOString();
    if (!existing) {
      clientsMap.set(s.client_id, {
        name: client.name || "Client",
        email: client.email,
        lastSession: scheduledAt,
        nextSession:
          ["confirmed", "pending_payment"].includes(s.status) ? scheduledAt : null,
        lastNote: null,
      });
    } else {
      if (!existing.nextSession && ["confirmed", "pending_payment"].includes(s.status)) {
        existing.nextSession = scheduledAt;
      }
    }
  });

  const clientIds = Array.from(clientsMap.keys());

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
      for (const [cId, client] of Array.from(clientsMap.entries())) {
        const note = noteMap.get(cId);
        if (note) client.lastNote = note;
      }
    }
  }

  const q = searchParams.q?.toLowerCase() || "";
  const clients = Array.from(clientsMap.entries()).filter(
    ([, c]) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-6 font-heading text-3xl font-medium text-foreground">
          Clients
        </h1>

        <ClientListSearch initialQuery={q} />

        {clients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-warm-gray">
                {q ? "No clients match your search" : "No clients yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {clients.map(([clientId, client]) => (
              <Link key={clientId} href={`/dashboard/clients/${clientId}`}>
                <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-medium text-primary">
                      {client.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{client.name}</p>
                      <p className="truncate text-sm text-warm-gray">
                        Last:{" "}
                        {new Date(client.lastSession).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                        {client.nextSession && (
                          <>
                            {" "}
                            · Next:{" "}
                            {new Date(client.nextSession).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </>
                        )}
                      </p>
                      {client.lastNote && (
                        <p className="mt-0.5 truncate text-xs text-warm-gray/70 italic">
                          {client.lastNote}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {sessions && sessions.length === pageSize && (
          <div className="mt-6 text-center">
            <Link
              href={`/dashboard/clients?page=${page + 1}${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ""}`}
              className="text-sm text-primary hover:underline"
            >
              Load more
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

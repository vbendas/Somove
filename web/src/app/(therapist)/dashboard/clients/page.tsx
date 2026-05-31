import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";
import { Search } from "lucide-react";

export default async function ClientsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("client_id, users!sessions_client_id_fkey(name, email), scheduled_at, status")
    .eq("therapist_id", user.id)
    .order("scheduled_at", { ascending: false });

  const clientsMap = new Map<string, { name: string; email: string; lastSession: string; nextSession: string | null }>();
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
      });
    } else {
      if (!existing.nextSession && ["confirmed", "pending_payment"].includes(s.status)) {
        existing.nextSession = scheduledAt;
      }
    }
  });

  const clients = Array.from(clientsMap.entries());

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-6 font-heading text-3xl font-medium text-foreground">
          Clients
        </h1>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray" />
          <Input placeholder="Search clients..." className="pl-10" />
        </div>

        {clients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-warm-gray">No clients yet</p>
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
                        Last: {new Date(client.lastSession).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                        {client.nextSession && (
                          <> · Next: {new Date(client.nextSession).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}</>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Euro } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: allPayments } = await supabase
    .from("payments")
    .select("*, users!payments_client_id_fkey(name)")
    .eq("therapist_id", user.id)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyPayments = (allPayments || []).filter(
    (p) => new Date(p.created_at) >= startOfMonth
  );

  const monthlyTotal = monthlyPayments.reduce((sum, p) => sum + p.amount_cents, 0);
  const allTimeTotal = (allPayments || []).reduce((sum, p) => sum + p.amount_cents, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-6 font-heading text-3xl font-medium text-foreground">
          Earnings
        </h1>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <Euro className="mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-medium text-foreground">
                €{(monthlyTotal / 100).toFixed(0)}
              </p>
              <p className="text-xs text-warm-gray">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <Euro className="mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-medium text-foreground">
                €{(allTimeTotal / 100).toFixed(0)}
              </p>
              <p className="text-xs text-warm-gray">All time</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {(!allPayments || allPayments.length === 0) ? (
              <p className="py-4 text-center text-warm-gray">No payments yet</p>
            ) : (
              <div className="divide-y divide-border">
                {allPayments.slice(0, 20).map((payment) => {
                  const client = payment.users as unknown as { name: string } | null;
                  return (
                    <div key={payment.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {client?.name || "Client"}
                        </p>
                        <p className="text-xs text-warm-gray">
                          {new Date(payment.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          €{(payment.amount_cents / 100).toFixed(0)}
                        </p>
                        <p className="text-xs text-warm-gray capitalize">{payment.method}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

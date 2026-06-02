import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Euro, CreditCard } from "lucide-react";

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

  const monthlyFees = monthlyPayments.reduce((sum, p) => sum + (p.platform_fee_cents || 0), 0);
  const monthlyNet = monthlyPayments.reduce((sum, p) => sum + (p.therapist_net_cents || p.amount_cents), 0);

  const allTimeNet = (allPayments || []).reduce((sum, p) => sum + (p.therapist_net_cents || p.amount_cents), 0);

  const { data: profile } = await supabase
    .from("therapist_profile")
    .select("stripe_payouts_enabled, stripe_account_id")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-6 font-heading text-3xl font-medium text-foreground">
          Earnings
        </h1>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <Euro className="mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-medium text-foreground">
                €{(monthlyNet / 100).toFixed(0)}
              </p>
              <p className="text-xs text-warm-gray">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <p className="text-lg font-medium text-primary">
                €{(monthlyFees / 100).toFixed(0)}
              </p>
              <p className="text-xs text-warm-gray">Fees (10%)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <p className="text-lg font-medium text-foreground">
                €{(allTimeNet / 100).toFixed(0)}
              </p>
              <p className="text-xs text-warm-gray">All time</p>
            </CardContent>
          </Card>
        </div>

        {profile?.stripe_payouts_enabled && (
          <Card className="mb-6">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">Payouts active</p>
                  <p className="text-xs text-warm-gray">Payments are sent automatically to your bank account</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/settings" target="_self">Manage</a>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {(!allPayments || allPayments.length === 0) ? (
              <p className="py-4 text-center text-warm-gray">No payments yet</p>
            ) : (
              <div className="divide-y divide-border">
                {allPayments.slice(0, 20).map((payment) => {
                  const client = payment.users as unknown as { name: string } | null;
                  const net = payment.therapist_net_cents || payment.amount_cents;
                  const fee = payment.platform_fee_cents || 0;
                  return (
                    <div key={payment.id} className="py-3">
                      <div className="flex items-center justify-between">
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
                            €{(net / 100).toFixed(2)}
                          </p>
                          {fee > 0 && (
                            <p className="text-xs text-warm-gray">
                              Gross €{(payment.amount_cents / 100).toFixed(2)} · Fee €{(fee / 100).toFixed(2)}
                            </p>
                          )}
                        </div>
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

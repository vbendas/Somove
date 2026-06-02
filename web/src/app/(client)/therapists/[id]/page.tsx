import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

async function getTherapist(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("therapist_profile")
    .select("*, users!inner(id, name, email)")
    .eq("user_id", id)
    .eq("status", "active")
    .single();

  if (error) return null;
  return data;
}

async function getClientCredits(clientId: string, therapistId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("session_credits")
    .select("remaining_credits")
    .eq("client_id", clientId)
    .eq("therapist_id", therapistId)
    .gt("remaining_credits", 0);
  return data?.reduce((sum, c) => sum + c.remaining_credits, 0) || 0;
}

export default async function TherapistProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const therapist = await getTherapist(params.id);

  if (!therapist) {
    notFound();
  }

  const userObj = therapist.users as { id: string; name: string; email: string } | null;
  const name = userObj?.name || "Professional";

  const credits = user ? await getClientCredits(user.id, params.id) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Link href="/" className="mb-6 inline-flex items-center text-sm text-warm-gray hover:text-foreground transition-colors">
          ← Back to therapists
        </Link>

        <div className="mt-6 rounded-card-lg border border-border bg-card p-6">
          <div className="mb-6 flex items-start gap-5">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-2xl font-medium text-primary">
              {name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-3xl font-medium text-foreground">
                {name}
              </h1>
              {therapist.modalities && therapist.modalities.length > 0 && (
                <p className="mt-1 text-sm text-warm-gray">
                  {therapist.modalities.join(" · ")}
                </p>
              )}
              {therapist.free_first_session && (
                <span className="mt-3 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  Free first session
                </span>
              )}
            </div>
          </div>

          {credits > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-card border border-primary/20 bg-primary/5 p-3">
              <CreditCard className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">
                You have {credits} {credits === 1 ? "session credit" : "session credits"} remaining
              </p>
            </div>
          )}

          {therapist.bio && (
            <div className="mb-6">
              <h2 className="mb-2 font-heading text-sm font-medium uppercase tracking-wider text-warm-gray">
                About
              </h2>
              <p className="text-sm leading-relaxed text-foreground/80">
                {therapist.bio}
              </p>
            </div>
          )}

          {therapist.credentials && therapist.credentials.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 font-heading text-sm font-medium uppercase tracking-wider text-warm-gray">
                Credentials
              </h2>
              <div className="flex flex-wrap gap-2">
                {therapist.credentials.map((cred: string) => (
                  <span
                    key={cred}
                    className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-warm-gray"
                  >
                    {cred}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6 rounded-card bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-warm-gray">Session</p>
                {therapist.session_price_cents !== null ? (
                  <p className="text-2xl font-medium text-foreground">
                    €{(therapist.session_price_cents / 100).toFixed(0)}
                  </p>
                ) : (
                  <p className="text-lg text-warm-gray">Price on request</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-warm-gray">Duration</p>
                <p className="text-lg font-medium text-foreground">
                  {therapist.default_session_duration} min
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href={`/therapists/${params.id}/book`} className="flex-1">
              <Button className="w-full" size="lg">
                Book a Session
              </Button>
            </Link>
            <Link href={`/inbox?therapist=${userObj?.id}`} className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                Message {name.split(" ")[0]}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

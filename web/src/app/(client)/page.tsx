import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

async function getUserData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("*, therapist_profile(*)")
    .eq("id", user.id)
    .single();

  return userData;
}

async function getTherapists() {
  const supabase = createClient();
  const { data } = await supabase
    .from("therapist_profile")
    .select("*, users!inner(id, name, email)")
    .eq("status", "active");

  return data || [];
}

export default async function Home() {
  const userData = await getUserData();
  const therapists = await getTherapists();

  if (therapists.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="font-heading text-4xl font-medium text-foreground">
            Welcome, {userData.name}
          </h1>
          <p className="max-w-md text-warm-gray">
            No professionals are available yet. Check back soon!
          </p>
          <form action={signOut}>
            <Button variant="outline">Sign Out</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-heading text-3xl font-medium text-foreground">
            Find a Professional
          </h1>
          <div className="flex items-center gap-2">
            {userData.role === "therapist" && (
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
            )}
            <form action={signOut}>
              <Button variant="ghost" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {therapists.map((therapist) => (
            <Link
              key={therapist.user_id}
              href={`/therapists/${therapist.user_id}`}
            >
              <div className="group cursor-pointer rounded-card-lg border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-heading text-xl font-medium text-primary">
                    {therapist.users?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-medium text-foreground group-hover:text-primary transition-colors">
                      {therapist.users?.name || "Professional"}
                    </h2>
                    {therapist.modalities && therapist.modalities.length > 0 && (
                      <p className="text-sm text-warm-gray">
                        {therapist.modalities.slice(0, 2).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                {therapist.bio && (
                  <p className="mb-4 line-clamp-3 text-sm text-warm-gray">
                    {therapist.bio}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    {therapist.session_price_cents !== null ? (
                      <span className="text-lg font-medium text-foreground">
                        €{(therapist.session_price_cents / 100).toFixed(0)}
                      </span>
                    ) : (
                      <span className="text-sm text-warm-gray">Price on request</span>
                    )}
                    <span className="ml-1 text-sm text-warm-gray">
                      / {therapist.default_session_duration} min
                    </span>
                  </div>
                  {therapist.free_first_session && (
                    <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                      Free first session
                    </span>
                  )}
                </div>

                {therapist.credentials && therapist.credentials.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(therapist.credentials as string[]).slice(0, 3).map((cred: string) => (
                      <span
                        key={cred}
                        className="rounded-full bg-surface px-3 py-1 text-xs text-warm-gray"
                      >
                        {cred}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

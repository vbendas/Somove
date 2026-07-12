import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreditCard, Star } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency } from "@/lib/format";

async function getTherapist(id: string) {
  const supabase = await createClient();

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
  const supabase = await createClient();
  const { data } = await supabase
    .from("session_credits")
    .select("remaining_credits")
    .eq("client_id", clientId)
    .eq("therapist_id", therapistId)
    .gt("remaining_credits", 0);
  return data?.reduce((sum, c) => sum + c.remaining_credits, 0) || 0;
}

async function getReviews(therapistId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, body, created_at, client_id")
    .eq("therapist_id", therapistId)
    .order("created_at", { ascending: false })
    .limit(3);
  return data || [];
}

async function getAverageRating(therapistId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("therapist_id", therapistId);
  if (!data || data.length === 0) return { avg: null, count: 0 };
  const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
  return { avg, count: data.length };
}

async function getClientNames(clientIds: string[]) {
  if (clientIds.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, name")
    .in("id", clientIds);
  const map: Record<string, string> = {};
  (data || []).forEach((u) => {
    map[u.id] = u.name || "Client";
  });
  return map;
}

export default async function TherapistProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const therapist = await getTherapist(id);

  if (!therapist) {
    notFound();
  }

  // Fetch custom published pages for this therapist (visual editor feature)
  const { data: customPages } = await supabase
    .from("therapist_pages")
    .select("slug, title")
    .eq("therapist_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  const userObj = therapist.users as { id: string; name: string; email: string } | null;
  const name = userObj?.name || "Professional";

  const credits = user ? await getClientCredits(user.id, id) : 0;
  const [reviews, ratingInfo] = await Promise.all([
    getReviews(id),
    getAverageRating(id),
  ]);
  const clientNames = await getClientNames(reviews.map((r) => r.client_id));

  return (
    <PageContainer width="narrow">
      <PageHeader
        backHref="/"
        title={name}
        description={
          therapist.modalities && therapist.modalities.length > 0
            ? therapist.modalities.join(" · ")
            : undefined
        }
      />

      <div className="rounded-card-lg border border-border bg-card p-6">
        <div className="mb-6 flex items-start gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-2xl font-medium text-primary">
            {name.charAt(0)}
          </div>
          {therapist.free_first_session && (
            <span className="mt-1 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              Free first session
            </span>
          )}
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

          {customPages && customPages.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 font-heading text-sm font-medium uppercase tracking-wider text-warm-gray">
                More from {name.split(" ")[0]}
              </h2>
              <div className="flex flex-wrap gap-2">
                {customPages.map((p: { slug: string; title: string }) => (
                  <Link
                    key={p.slug}
                    href={`/therapists/${id}/${p.slug}`}
                    className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-warm-gray hover:text-primary hover:bg-primary/10"
                  >
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {ratingInfo.avg !== null && (
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-heading text-sm font-medium uppercase tracking-wider text-warm-gray">
                  Reviews
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(ratingInfo.avg!)
                            ? "fill-accent text-accent"
                            : "text-warm-gray"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {ratingInfo.avg!.toFixed(1)}
                  </span>
                  <span className="text-xs text-warm-gray">
                    ({ratingInfo.count})
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-card border border-border bg-surface p-4"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {clientNames[review.client_id] || "Client"}
                      </p>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= review.rating
                                ? "fill-accent text-accent"
                                : "text-warm-gray"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.body && (
                      <p className="text-sm text-foreground/80">{review.body}</p>
                    )}
                  </div>
                ))}
              </div>

              <Link
                href={`/therapists/${id}/reviews`}
                className="mt-3 block text-center text-sm text-primary hover:underline"
              >
                See all reviews
              </Link>
            </div>
          )}

          <div className="mb-6 rounded-card bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-warm-gray">Session</p>
                {therapist.session_price_cents !== null ? (
                  <p className="text-2xl font-medium text-foreground">
                    {formatCurrency(therapist.session_price_cents)}
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
            <Link href={`/therapists/${id}/book`} className="flex-1">
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
    </PageContainer>
  );
}

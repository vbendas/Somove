import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

async function getTherapistName(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("name")
    .eq("id", id)
    .single();
  return data?.name || "Professional";
}

async function getAllReviews(therapistId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, body, created_at, client_id")
    .eq("therapist_id", therapistId)
    .order("created_at", { ascending: false });
  return data || [];
}

async function getClientNames(clientIds: string[]) {
  if (clientIds.length === 0) return {};
  const supabase = createClient();
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

export default async function ReviewsPage({
  params,
}: {
  params: { id: string };
}) {
  const reviews = await getAllReviews(params.id);
  const therapistName = await getTherapistName(params.id);
  const clientNames = await getClientNames(reviews.map((r) => r.client_id));

  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Link
          href={`/therapists/${params.id}`}
          className="mb-6 inline-flex items-center text-sm text-warm-gray hover:text-foreground transition-colors"
        >
          ← Back to {therapistName}
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-3xl font-medium text-foreground">
            Reviews
          </h1>
          {avg !== null && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(avg)
                        ? "fill-accent text-accent"
                        : "text-warm-gray"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">
                {avg.toFixed(1)}
              </span>
              <span className="text-xs text-warm-gray">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="py-8 text-center text-warm-gray">
            No reviews yet
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-card border border-border bg-card p-5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium text-foreground">
                    {clientNames[review.client_id] || "Client"}
                  </p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? "fill-accent text-accent"
                            : "text-warm-gray"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.body && (
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {review.body}
                  </p>
                )}
                <p className="mt-2 text-xs text-warm-gray">
                  {new Date(review.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

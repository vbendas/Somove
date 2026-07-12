import { createClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getTherapistName(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("name")
    .eq("id", id)
    .single();
  return data?.name || "Professional";
}

async function getAllReviews(therapistId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, body, created_at, client_id")
    .eq("therapist_id", therapistId)
    .order("created_at", { ascending: false });
  return data || [];
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

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reviews = await getAllReviews(id);
  const therapistName = await getTherapistName(id);
  const clientNames = await getClientNames(reviews.map((r) => r.client_id));

  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return (
    <PageContainer width="narrow">
      <PageHeader
        backHref={`/therapists/${id}`}
        title="Reviews"
        description={`for ${therapistName}`}
        actions={
          avg !== null ? (
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
          ) : undefined
        }
      />

      {reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" />
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
                {formatDate(review.created_at, "long")}
              </p>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

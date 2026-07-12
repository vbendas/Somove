"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

interface ReviewFormProps {
  sessionId: string;
  therapistId: string;
  clientId: string;
  existingReview?: {
    id: string;
    rating: number;
    body: string | null;
  } | null;
}

export default function ReviewForm({
  sessionId,
  therapistId,
  clientId,
  existingReview,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(existingReview?.body || "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    const supabase = await createClient();

    if (existingReview) {
      const { error } = await supabase
        .from("reviews")
        .update({ rating, body: body.trim() || null })
        .eq("id", existingReview.id);
      if (error) {
        toast.error("Failed to update review");
      } else {
        toast.success("Review updated");
        router.refresh();
      }
    } else {
      const { error } = await supabase.from("reviews").insert({
        therapist_id: therapistId,
        client_id: clientId,
        session_id: sessionId,
        rating,
        body: body.trim() || null,
      });
      if (error) {
        toast.error(error.message || "Failed to submit review");
      } else {
        toast.success("Review submitted");
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <div className="rounded-card border border-border bg-card p-5">
      <h2 className="mb-3 font-medium text-foreground">
        {existingReview ? "Edit your review" : "Leave a Review"}
      </h2>

      <div className="mb-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <Star
              className={`h-6 w-6 ${
                star <= (hover || rating)
                  ? "fill-accent text-accent"
                  : "text-warm-gray"
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your experience (optional)"
        rows={3}
        className="mb-4 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-foreground"
      />

      <Button
        onClick={handleSubmit}
        disabled={loading || rating < 1}
        size="sm"
      >
        {loading
          ? "Submitting..."
          : existingReview
          ? "Update Review"
          : "Submit Review"}
      </Button>
    </div>
  );
}

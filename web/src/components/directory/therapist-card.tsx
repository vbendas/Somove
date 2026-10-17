import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { getTherapists } from "@/lib/directory";

type DirectoryTherapist = Awaited<ReturnType<typeof getTherapists>>[number];

function formatAvailability(rules: Record<string, unknown> | null): string {
  if (!rules) return "";
  const days = Object.keys(rules);
  if (days.length === 0) return "";
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const availableDays = days
    .filter((d) => (rules[d] as Record<string, unknown>)?.available)
    .map((d) => dayNames[parseInt(d)] || d)
    .filter(Boolean);
  if (availableDays.length === 0) return "";
  if (availableDays.length <= 2) return availableDays.join(" & ");
  return `${availableDays[0]}\u2013${availableDays[availableDays.length - 1]}`;
}

export function TherapistCard({ therapist }: { therapist: DirectoryTherapist }) {
  return (
    <Link
        href={`/therapists/${therapist.user_id}`}
      >
        <Card className="group h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/30">
          <CardContent className="p-6">
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
                    {formatCurrency(therapist.session_price_cents)}
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
  
            {therapist.availability_rules && formatAvailability(therapist.availability_rules as Record<string, unknown>) && (
              <p className="mt-2 text-xs text-warm-gray">
                Typically available {formatAvailability(therapist.availability_rules as Record<string, unknown>)}
              </p>
            )}
  
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
          </CardContent>
        </Card>
      </Link>
  );
}

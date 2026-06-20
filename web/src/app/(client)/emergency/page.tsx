import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

const CRISIS_RESOURCES: Record<string, { name: string; number: string; description: string }[]> = {
  PT: [
    { name: "SNS 24", number: "808200204", description: "24h health line (free)" },
    { name: "SOS Voz Amiga", number: "213544545", description: "Emotional support" },
    { name: "Voz de Apoio", number: "228323535", description: "Crisis support" },
  ],
  EU: [
    { name: "Samaritans", number: "116123", description: "24h emotional support (free)" },
    { name: "Emergency", number: "112", description: "EU emergency number" },
  ],
  US: [
    { name: "988 Suicide & Crisis Lifeline", number: "988", description: "24h call or text" },
    { name: "Crisis Text Line", number: "741741", description: "Text HOME to 741741" },
  ],
  GB: [
    { name: "Samaritans", number: "116123", description: "24h emotional support (free)" },
    { name: "NHS 111", number: "111", description: "Non-emergency health line" },
  ],
  DEFAULT: [
    { name: "Befrienders Worldwide", number: "", description: "befrienders.org — international directory" },
    { name: "Emergency", number: "112", description: "Local emergency services" },
  ],
};

export default async function EmergencyPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let country = "DEFAULT";
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("country")
      .eq("id", user.id)
      .single();
    if (userData?.country) country = userData.country;
  }

  const resources = CRISIS_RESOURCES[country] || CRISIS_RESOURCES.DEFAULT;
  const euResources = CRISIS_RESOURCES.EU;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-2 font-heading text-3xl font-medium text-foreground">
          Help & Emergency
        </h1>
        <p className="mb-6 text-sm text-warm-gray">
          If you are in immediate danger, call your local emergency number.
        </p>

        <Card className="mb-4">
          <CardContent className="space-y-3 py-6">
            <h2 className="font-heading text-lg font-medium text-foreground">
              Crisis Resources
            </h2>
            {resources.map((r) => (
              <a
                key={r.number || r.name}
                href={r.number ? `tel:${r.number}` : undefined}
                className="flex items-center gap-3 rounded-card border border-border p-3 transition-colors hover:border-primary/30"
              >
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{r.name}</p>
                  <p className="text-sm text-warm-gray">
                    {r.number && `${r.number} — `}{r.description}
                  </p>
                </div>
              </a>
            ))}
          </CardContent>
        </Card>

        {country !== "EU" && (
          <Card className="mb-4">
            <CardContent className="space-y-3 py-6">
              <h2 className="font-heading text-lg font-medium text-foreground">
                EU-Wide Resources
              </h2>
              {euResources.map((r) => (
                <a
                  key={r.number}
                  href={`tel:${r.number}`}
                  className="flex items-center gap-3 rounded-card border border-border p-3 transition-colors hover:border-primary/30"
                >
                  <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{r.name}</p>
                    <p className="text-sm text-warm-gray">{r.number} — {r.description}</p>
                  </div>
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {user && (
          <Card>
            <CardContent className="py-6">
              <h2 className="mb-3 font-heading text-lg font-medium text-foreground">
                Contact Your Therapist
              </h2>
              <p className="mb-4 text-sm text-warm-gray">
                Send an urgent message to your therapist. They will be notified immediately.
              </p>
              <a
                href="/inbox"
                className="inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Message Your Therapist
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

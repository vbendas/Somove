import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function EmergencyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-6 font-heading text-3xl font-medium text-foreground">
          Help & Emergency
        </h1>
        <Card className="mb-4">
          <CardContent className="space-y-4 py-6">
            <h2 className="font-heading text-lg font-medium text-foreground">
              Crisis Resources
            </h2>
            <div className="space-y-3">
              <a href="tel:116123" className="block rounded-card border border-border p-3 transition-colors hover:border-primary/30">
                <p className="font-medium text-foreground">EU: 116 123</p>
                <p className="text-sm text-warm-gray">Samaritans (24h, free)</p>
              </a>
              <a href="tel:808200204" className="block rounded-card border border-border p-3 transition-colors hover:border-primary/30">
                <p className="font-medium text-foreground">Portugal: 808 200 204</p>
                <p className="text-sm text-warm-gray">SNS 24 (24h, free)</p>
              </a>
              <a href="tel:988" className="block rounded-card border border-border p-3 transition-colors hover:border-primary/30">
                <p className="font-medium text-foreground">US: 988</p>
                <p className="text-sm text-warm-gray">Suicide & Crisis Lifeline</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

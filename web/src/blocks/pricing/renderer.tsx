import type { z } from "zod";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { pricingSchemaDef } from "./schema";

type PricingData = z.infer<(typeof pricingSchemaDef)["schema"]>;

export function PricingRenderer({ data }: { data: PricingData }) {
  return (
    <div className="container-wide section-padding">
      {(data.eyebrow || data.title || data.subtitle) && (
        <div className="mx-auto mb-12 max-w-2xl text-center">
          {data.eyebrow && <span className="pill-badge mb-4 inline-block">{data.eyebrow}</span>}
          {data.title && <h2 className="font-heading text-3xl font-normal text-foreground sm:text-4xl">{data.title}</h2>}
          {data.subtitle && <p className="mt-4 font-body text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
        {data.tiers.map((tier, i) => (
          <div
            key={i}
            className={cn(
              "section-card relative",
              tier.highlighted && "border-primary shadow-md lg:scale-[1.03]"
            )}
          >
            {tier.highlighted && tier.badge && (
              <span className="pill-badge-accent absolute -top-3 left-1/2 -translate-x-1/2">{tier.badge}</span>
            )}
            <h3 className="font-heading text-xl font-normal text-foreground">{tier.name}</h3>
            <div className="mt-4">
              <span className="font-heading text-4xl font-normal text-primary">{tier.price}</span>
              {tier.period && <span className="font-body text-sm text-muted-foreground"> {tier.period}</span>}
            </div>
            {tier.features.length > 0 && (
              <ul className="mt-6 space-y-3">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span className="font-body text-sm text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild size="lg" className="mt-8 w-full" variant={tier.highlighted ? "default" : "outline"}>
              <Link href={tier.cta.href}>{tier.cta.label}</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

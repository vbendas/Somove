"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const tiers = [
  {
    name: "Single Session",
    price: "€90",
    period: "/ session",
    features: ["50-minute session", "Video or in-person", "Session notes provided", "Invoice provided"],
    cta: "Book Now",
    highlighted: false,
  },
  {
    name: "5 Session Package",
    price: "€400",
    period: "/ 5 sessions",
    badge: "Most Popular",
    features: ["Everything in Single", "Priority scheduling", "Between-session messaging", "Grounding exercises library", "Save €50 vs individual"],
    cta: "Book Now",
    highlighted: true,
  },
  {
    name: "Monthly Support",
    price: "€320",
    period: "/ month",
    features: ["4 sessions per month", "24/7 emergency support", "Personalized exercises", "Ongoing therapist support"],
    cta: "Book Now",
    highlighted: false,
  },
];

export function Pricing() {
  const [active, setActive] = useState(1);

  return (
    <section id="pricing" className="relative overflow-hidden">
      <div className="container-wide section-padding relative" style={{ zIndex: 2 }}>
        <AnimatedSection>
          <SectionHeading
            eyebrow="Session Options"
            title="Choose Your Path"
            subtitle="Transparent pricing. No hidden fees. EU-compliant invoices provided."
          />
        </AnimatedSection>

        {/* Mobile: Horizontal scroll */}
        <div className="lg:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
          <div className="flex gap-5 px-5">
            {tiers.map((tier, i) => (
              <div key={tier.name} className="min-w-[82vw] max-w-[85vw] snap-center shrink-0">
                <AnimatedSection delay={i * 150}>
                  <div
                    className="section-card relative"
                    style={tier.highlighted ? { borderTop: "4px solid #D4A574" } : undefined}
                  >
                    {tier.highlighted && tier.badge && (
                      <div className="absolute -top-3 left-1/2" style={{ transform: "translateX(-50%)" }}>
                        <Badge variant="accent">{tier.badge}</Badge>
                      </div>
                    )}
                    <h3 className="font-heading text-lg font-normal text-warm-charcoal mb-2">{tier.name}</h3>
                    <div className="mb-4">
                      <span className="font-heading text-3xl font-normal text-primary">{tier.price}</span>
                      <span className="text-warm-gray font-body text-xs"> {tier.period}</span>
                    </div>
                    <div className="h-px bg-primary/10 mb-4" />
                    <ul className="space-y-2 mb-5">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent mt-0.5 shrink-0">
                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="text-warm-charcoal font-body text-xs">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button variant={tier.highlighted ? "secondary" : "outline"} size="sm" className="w-full">{tier.cta}</Button>
                  </div>
                </AnimatedSection>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-6 lg:hidden">
          {tiers.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === active ? "bg-primary w-6" : "bg-primary/25"}`}
              aria-label={`Plan ${i + 1}`}
            />
          ))}
        </div>

        {/* Desktop: 3-column */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 items-start">
          {tiers.map((tier, i) => (
            <AnimatedSection key={tier.name} delay={i * 150}>
              <div
                className="section-card relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  ...(tier.highlighted ? { borderTop: "4px solid #D4A574", transform: "scale(1.03)" } : {}),
                }}
              >
                {tier.highlighted && tier.badge && (
                  <div className="absolute -top-3 left-1/2" style={{ transform: "translateX(-50%)" }}>
                    <Badge variant="accent">{tier.badge}</Badge>
                  </div>
                )}
                <h3 className="font-heading text-xl font-normal text-warm-charcoal mb-2">{tier.name}</h3>
                <div className="mb-5">
                  <span className="font-heading text-4xl font-normal text-primary">{tier.price}</span>
                  <span className="text-warm-gray font-body text-sm"> {tier.period}</span>
                </div>
                <div className="h-px bg-primary/10 mb-5" />
                <ul className="space-y-3 mb-7">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent mt-0.5 shrink-0">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-warm-charcoal font-body text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={tier.highlighted ? "secondary" : "outline"} size="md" className="w-full">{tier.cta}</Button>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={500}>
          <p className="text-center text-warm-gray text-xs font-body mt-8 max-w-xl mx-auto">
            Payment via card or MBWay. EU-compliant invoices provided. Insurance reimbursement support available.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}

import { AnimatedSection } from "@/components/ui/AnimatedSection";

export function CrisisBanner() {
  return (
    <section className="relative overflow-hidden">
      <div className="container-wide section-padding relative" style={{ zIndex: 2 }}>
        <AnimatedSection>
          <div className="section-card text-center max-w-2xl mx-auto" style={{ borderColor: "rgba(232,196,184,0.2)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3 text-soft-rose">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="font-heading text-base sm:text-lg font-normal text-warm-charcoal mb-2">
              If you&apos;re in immediate danger or crisis, please reach out for help.
            </p>
            <p className="text-warm-gray font-body text-xs sm:text-sm mb-4">
              This is not a substitute for emergency services.
            </p>
            <a href="#contact" className="inline-flex items-center gap-2 text-primary font-body font-medium text-sm hover:underline">
              View Crisis Resources
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

import { AnimatedSection } from "@/components/ui/AnimatedSection";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: "rgba(45,42,38,0.92)" }} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />
      <div className="container-wide section-padding relative" style={{ zIndex: 2 }}>
        <AnimatedSection>
          <div className="text-center">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-normal text-white mb-4 text-balance">
              Ready to Begin?
            </h2>
            <p className="text-white/70 font-body text-base sm:text-lg max-w-xl mx-auto mb-8">
              Book your first session and start your journey toward embodied healing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 pl-7 pr-2.5 py-2.5 rounded-full bg-primary text-white font-body font-medium text-sm uppercase tracking-wider hover:bg-white hover:text-warm-charcoal transition-all duration-300 min-h-[48px]"
              >
                <span>Book Now</span>
                <span className="w-9 h-9 rounded-full flex items-center justify-center bg-white/20">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </a>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

import { AnimatedSection } from "@/components/ui/AnimatedSection";

export function AboutTherapist() {
  return (
    <section id="about" className="relative overflow-hidden">
      <div className="container-wide section-padding relative" style={{ zIndex: 2 }}>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <AnimatedSection>
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                <div
                  className="w-64 h-72 sm:w-80 sm:h-96 lg:w-[420px] lg:h-[500px] rounded-[25px] overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(212,165,116,0.15), rgba(255,245,225,1), rgba(139,168,136,0.15))",
                    border: "3px solid rgba(212,165,116,0.15)",
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="100" height="100" viewBox="0 0 120 120" fill="none" className="text-primary/20">
                      <circle cx="60" cy="40" r="22" stroke="currentColor" strokeWidth="2" />
                      <path d="M20 110c0-22.09 17.91-40 40-40s40 17.91 40 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-accent/10" aria-hidden="true" />
                <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-primary/10" aria-hidden="true" />
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <div>
              <span className="pill-badge mb-4 inline-block">About Us</span>
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-normal text-warm-charcoal leading-tight mb-5">
                Harmonizing the Mind, Body, and Spirit.
              </h2>

              <div className="relative pl-5 border-l-2 border-primary/30 mb-6">
                <p className="font-heading text-base sm:text-lg italic text-warm-charcoal leading-relaxed">
                  &ldquo;The body holds a wisdom the mind often overlooks. Trauma, stress, and emotional pain live in our muscles, our breath, our nervous system.&rdquo;
                </p>
              </div>

              <p className="text-warm-gray font-body text-sm sm:text-base leading-relaxed mb-6">
                Through somatic therapy, I help you reconnect with your body&apos;s natural ability to heal. Together, we create a safe space where movement, breath, and awareness become your most powerful tools.
              </p>

              <ul className="space-y-3 mb-8">
                {["Somatic Experiencing", "Dance/Movement Therapy", "Trauma-Informed Care", "Nervous System Regulation"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span className="text-warm-charcoal font-heading text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-6 sm:gap-8">
                <div className="text-center">
                  <div className="font-heading text-3xl sm:text-4xl font-normal text-warm-charcoal border-r border-primary/20 pr-6 sm:pr-8">500+</div>
                  <p className="text-warm-gray text-xs sm:text-sm font-body mt-1">Sessions</p>
                </div>
                <div className="text-center">
                  <div className="font-heading text-3xl sm:text-4xl font-normal text-warm-charcoal border-r border-primary/20 pr-6 sm:pr-8">80+</div>
                  <p className="text-warm-gray text-xs sm:text-sm font-body mt-1">Clients</p>
                </div>
                <div className="text-center">
                  <div className="font-heading text-3xl sm:text-4xl font-normal text-warm-charcoal">100%</div>
                  <p className="text-warm-gray text-xs sm:text-sm font-body mt-1">Online</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

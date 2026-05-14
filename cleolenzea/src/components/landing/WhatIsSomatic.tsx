import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const services = [
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-warm-charcoal">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Body Awareness",
    description:
      "Learn to listen to the signals your body sends. Tension, numbness, restlessness — they all carry meaning.",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-warm-charcoal">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Nervous System Regulation",
    description:
      "Move from survival mode to safety using breath, movement, and gentle techniques to calm your nervous system.",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-warm-charcoal">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    title: "Movement & Expression",
    description:
      "Your body holds what words can't reach. Through guided movement, process and release stored tension.",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-warm-charcoal">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Trauma Release",
    description:
      "Gentle somatic techniques to process and release trauma stored in the body, building resilience from within.",
  },
];

export function WhatIsSomatic() {
  return (
    <section id="services" className="relative overflow-hidden">
      <div className="container-wide section-padding relative" style={{ zIndex: 2 }}>
        <AnimatedSection>
          <SectionHeading
            eyebrow="Our Services"
            title="Somatic Therapy Services"
            subtitle="Evidence-based body-centered approaches to healing and transformation."
          />
        </AnimatedSection>

        <div className="max-w-4xl mx-auto">
          {services.map((service, i) => (
            <AnimatedSection key={service.title} delay={i * 100}>
              <div
                className={`flex items-start gap-5 sm:gap-8 py-7 sm:py-8 ${
                  i < services.length - 1 ? "border-b border-primary/10" : ""
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,253,245,0.8)", border: "1px solid rgba(212,165,116,0.12)" }}
                >
                  {service.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading text-lg sm:text-xl font-normal text-warm-charcoal mb-2">
                    {service.title}
                  </h4>
                  <p className="text-warm-gray font-body text-sm sm:text-base leading-relaxed">
                    {service.description}
                  </p>
                </div>
                <a
                  href="#pricing"
                  className="hidden sm:inline-flex text-primary font-body text-sm font-medium hover:underline shrink-0 pt-1"
                >
                  Read More
                </a>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

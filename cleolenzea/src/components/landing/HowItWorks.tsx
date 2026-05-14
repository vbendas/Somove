import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const steps = [
  {
    number: "01",
    title: "Breathe Deeply",
    description: "Begin with conscious breathing to ground yourself and create space for healing.",
  },
  {
    number: "02",
    title: "Invite Energy",
    description: "Through gentle somatic techniques, invite awareness and energy into areas of held tension.",
  },
  {
    number: "03",
    title: "Heal Within",
    description: "Allow your body's natural intelligence to process, release, and integrate what's been stored.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden">
      <div className="container-wide section-padding relative" style={{ zIndex: 2 }}>
        <AnimatedSection>
          <SectionHeading
            eyebrow="Getting Started"
            title="Your Healing Journey"
          />
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <AnimatedSection key={step.number} delay={i * 150}>
              <div className="text-center section-card">
                <span className="block font-heading text-5xl sm:text-6xl font-normal text-primary/20 mb-3">
                  {step.number}
                </span>
                <h4 className="font-heading text-xl sm:text-2xl font-normal text-warm-charcoal mb-3">
                  {step.title}
                </h4>
                <p className="text-warm-gray font-body text-sm sm:text-base leading-relaxed">
                  {step.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Button } from "@/components/ui/Button";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const items = [
  { title: "Rhythms of Release", icon: "1" },
  { title: "Harmonic Spaces", icon: "2" },
  { title: "Meditation Mastery", icon: "3" },
  { title: "Sound Healing", icon: "4" },
  { title: "Chakra Alignment", icon: "5" },
];

export function GreenCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: "rgba(139,168,136,0.9)" }} />
      <div className="container-wide section-padding relative" style={{ zIndex: 2 }}>
        <AnimatedSection>
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-normal text-white">
              Explore Our Healing Modalities
            </h2>
          </div>
        </AnimatedSection>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {items.map((item, i) => (
            <AnimatedSection key={item.title} delay={i * 80}>
              <div className="rounded-[25px] p-4 sm:p-5 text-center transition-all duration-300 hover:-translate-y-1" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <span className="font-heading text-lg text-white">{item.icon}</span>
                </div>
                <h4 className="font-heading text-sm sm:text-base font-normal text-white">{item.title}</h4>
              </div>
            </AnimatedSection>
          ))}
        </div>
        <AnimatedSection delay={500}>
          <div className="text-center mt-10">
            <Button variant="white" size="lg" href="#pricing">
              Get Started
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

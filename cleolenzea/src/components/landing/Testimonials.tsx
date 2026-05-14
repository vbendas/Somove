"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { useSwipe } from "@/hooks/useSwipe";

const testimonials = [
  {
    quote: "I had tried talk therapy for years, but something was always missing. Working with the body changed everything. I'm actually releasing my trauma now.",
    name: "Tammy Silva",
    role: "Client for 6 months",
    rating: 5,
  },
  {
    quote: "The full-body video setup made online therapy feel natural. I could move freely and still feel deeply connected to the process.",
    name: "Paula Davis",
    role: "Client for 3 months",
    rating: 5,
  },
  {
    quote: "The between-session tools are a game-changer. When I feel overwhelmed at 2am, I open the app and do a grounding exercise.",
    name: "Whitney Rain",
    role: "Client for 1 year",
    rating: 5,
  },
  {
    quote: "Somatic therapy helped me understand my body in ways I never imagined. The sessions are transformative and deeply healing.",
    name: "Hailey Star",
    role: "Client for 8 months",
    rating: 5,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" className={i < rating ? "text-primary" : "text-primary/20"} fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  const [active, setActive] = useState(0);
  const swipeHandlers = useSwipe(
    () => setActive((p) => Math.min(p + 1, testimonials.length - 1)),
    () => setActive((p) => Math.max(p - 1, 0))
  );

  return (
    <section id="testimonials" className="relative overflow-hidden">
      <div className="container-wide section-padding relative" style={{ zIndex: 2 }}>
        <AnimatedSection>
          <SectionHeading
            eyebrow="Feedback"
            title="Reiki Feedback from Happy Clients"
          />
        </AnimatedSection>

        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="font-heading text-4xl sm:text-5xl font-normal text-warm-charcoal">4.9</div>
          <div className="text-left">
            <StarRating rating={5} />
            <p className="text-warm-gray text-xs font-body mt-1">Genuine Rating</p>
          </div>
        </div>

        {/* Mobile: Carousel */}
        <div className="lg:hidden overflow-hidden">
          <div
            className="flex transition-transform duration-400 ease-out"
            style={{ transform: `translateX(-${active * 100}%)` }}
            {...swipeHandlers}
          >
            {testimonials.map((t) => (
              <div key={t.name} className="w-full shrink-0 px-1">
                <div className="section-card text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="font-heading text-lg text-primary">{t.name.charAt(0)}</span>
                  </div>
                  <StarRating rating={t.rating} />
                  <p className="text-warm-charcoal font-body text-sm leading-relaxed mt-4 mb-5">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <p className="font-heading font-medium text-warm-charcoal text-sm">{t.name}</p>
                  <p className="text-warm-gray text-xs font-body">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === active ? "bg-primary w-6" : "bg-primary/25"}`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-5">
          {testimonials.map((t, i) => (
            <AnimatedSection key={t.name} delay={i * 100}>
              <div className="section-card text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="font-heading text-base text-primary">{t.name.charAt(0)}</span>
                </div>
                <StarRating rating={t.rating} />
                <p className="text-warm-charcoal font-body text-sm leading-relaxed mt-3 mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="font-heading font-medium text-warm-charcoal text-sm">{t.name}</p>
                <p className="text-warm-gray text-xs font-body">{t.role}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

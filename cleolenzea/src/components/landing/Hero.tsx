import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(45,42,38,0.7) 0%, rgba(45,42,38,0.5) 40%, rgba(212,165,116,0.3) 100%)",
        }}
      />
      <div className="container-wide px-5 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20 sm:pb-24 relative" style={{ zIndex: 2 }}>
        <div className="max-w-2xl">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 text-xs font-body font-semibold tracking-wider uppercase text-warm-charcoal">
              <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                </svg>
              </span>
              Somatic Therapy
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal text-white leading-tight text-balance">
            Heal Through Your Body
          </h1>

          <p className="mt-5 text-white/70 text-base sm:text-lg lg:text-xl font-body leading-relaxed max-w-lg">
            Somatic therapy for anxiety, trauma, and emotional resilience.
            Discover the wisdom your body holds. Online sessions from wherever
            you feel safe.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button variant="white" size="lg" href="#pricing">
              Book Now
            </Button>
            <Button
              variant="outline"
              size="lg"
              href="#services"
              className="border-white/30 text-white hover:border-white hover:bg-white hover:text-warm-charcoal [&>span:last-child]:border-white/20 [&>span:last-child]:text-white"
            >
              Learn More
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/60 font-body">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Certified Therapist
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Secure &amp; Private
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Online Sessions
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 scroll-bounce"
        style={{ zIndex: 2 }}
        aria-hidden="true"
      >
        <span className="text-xs font-body tracking-widest uppercase text-white/40">
          scroll
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/40">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </section>
  );
}

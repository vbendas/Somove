"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";

const stats = [
  { value: 500, suffix: "+", label: "Happy Client" },
  { value: 98, suffix: "%", label: "Daily Client" },
  { value: 15, suffix: "+", label: "Years of Experience" },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const { ref, isInView } = useInView(0.3);
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 2000;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center">
      <span className="font-heading text-4xl sm:text-5xl lg:text-6xl font-normal text-warm-charcoal">
        {display}{suffix}
      </span>
      <p className="text-warm-gray font-body text-xs sm:text-sm mt-2 uppercase tracking-wider">
        {""}
      </p>
    </div>
  );
}

export function StatsCounter() {
  return (
    <section className="relative overflow-hidden">
      <div className="container-wide section-padding relative" style={{ zIndex: 2 }}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`flex-1 text-center ${i < stats.length - 1 ? "sm:border-r sm:border-primary/15" : ""}`}>
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              <p className="text-warm-gray font-body text-xs sm:text-sm mt-1 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

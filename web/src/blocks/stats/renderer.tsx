"use client";

import { useEffect, useRef, useState } from "react";
import type { z } from "zod";
import type { statsSchemaDef } from "./schema";

type StatsData = z.infer<(typeof statsSchemaDef)["schema"]>;
type StatItem = StatsData["items"][number];

const DURATION_MS = 1600;

function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

function AnimatedStat({ item }: { item: StatItem }) {
  const { ref, isInView } = useInView<HTMLDivElement>();
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;
    let raf: number;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(item.value * eased));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isInView, item.value]);

  return (
    <div ref={ref} className="flex-1 text-center">
      <span className="font-heading text-4xl font-normal text-foreground sm:text-5xl lg:text-6xl">
        {display}
        {item.suffix}
      </span>
      <p className="mt-2 font-body text-xs uppercase tracking-wider text-muted-foreground sm:text-sm">
        {item.label}
      </p>
    </div>
  );
}

export function StatsRenderer({ data }: { data: StatsData }) {
  return (
    <div className="container-wide section-padding">
      <div className="flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-0">
        {data.items.map((item, i) => (
          <div
            key={i}
            className={
              i < data.items.length - 1 ? "w-full flex-1 sm:border-r sm:border-border" : "w-full flex-1"
            }
          >
            <AnimatedStat item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

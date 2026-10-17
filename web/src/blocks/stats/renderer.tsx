"use client";

import { useEffect, useRef, useState } from "react";
import type { z } from "zod";
import type { statsSchemaDef } from "./schema";
import { sectionContainer } from "../section-header";

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
      <span className="font-heading text-4xl font-normal tabular-nums text-primary sm:text-5xl">
        {display}
        {item.suffix}
      </span>
      <p className="mt-2 font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {item.label}
      </p>
    </div>
  );
}

export function StatsRenderer({ data }: { data: StatsData }) {
  return (
    <div className={sectionContainer}>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-card-lg border border-border bg-border sm:grid-cols-3">
        {data.items.map((item, i) => (
          <div key={i} className="bg-card px-6 py-10">
            <AnimatedStat item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

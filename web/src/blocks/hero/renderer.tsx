import type { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, CreditCard, Lock, ShieldCheck, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { heroSchemaDef } from "./schema";

type HeroData = z.infer<(typeof heroSchemaDef)["schema"]>;

const BADGE_ICONS = [ShieldCheck, Video, Lock, CalendarCheck, CreditCard];

export function HeroRenderer({ data }: { data: HeroData }) {
  const hasBackground = Boolean(data.backgroundImage?.url);

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        hasBackground && "min-h-[420px] sm:min-h-[520px]"
      )}
    >
      {hasBackground && data.backgroundImage ? (
        <>
          <Image
            src={data.backgroundImage.url}
            alt={data.backgroundImage.alt || ""}
            fill
            className="object-cover"
            sizes="100vw"
          />
          {data.overlay && <div className="absolute inset-0 bg-foreground/60" aria-hidden="true" />}
        </>
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_70%)]"
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "relative z-10 mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6 md:py-32 lg:px-8",
          hasBackground && "text-white"
        )}
      >
        <div className="mx-auto max-w-3xl">
          {data.eyebrow && (
            <span
              className={cn(
                "mb-6 inline-flex items-center rounded-full border px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-wider",
                hasBackground
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-primary/25 bg-primary/10 text-primary"
              )}
            >
              {data.eyebrow}
            </span>
          )}

          <h1 className="font-heading text-5xl font-normal leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            {data.title}
          </h1>

          {data.subtitle && (
            <p
              className={cn(
                "mx-auto mt-6 max-w-2xl font-body text-base leading-relaxed sm:text-lg md:text-xl",
                hasBackground ? "text-white/80" : "text-muted-foreground"
              )}
            >
              {data.subtitle}
            </p>
          )}

          {(data.primaryCta || data.secondaryCta) && (
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              {data.primaryCta && (
                <Button asChild size="lg" className="shadow-md">
                  <Link href={data.primaryCta.href}>{data.primaryCta.label}</Link>
                </Button>
              )}
              {data.secondaryCta && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className={cn(hasBackground && "border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white")}
                >
                  <Link href={data.secondaryCta.href}>{data.secondaryCta.label}</Link>
                </Button>
              )}
            </div>
          )}

          {data.trustBadges.length > 0 && (
            <ul className="mt-10 flex flex-wrap justify-center gap-2.5">
              {data.trustBadges.map((badge, i) => {
                const Icon = BADGE_ICONS[i % BADGE_ICONS.length];
                return (
                  <li
                    key={i}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-body text-xs font-medium sm:text-sm",
                      hasBackground
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-border bg-card/70 text-foreground/80"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", !hasBackground && "text-primary")} aria-hidden="true" />
                    {badge}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

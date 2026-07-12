import type { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { heroSchemaDef } from "./schema";

type HeroData = z.infer<(typeof heroSchemaDef)["schema"]>;

export function HeroRenderer({ data }: { data: HeroData }) {
  const hasBackground = Boolean(data.backgroundImage?.url);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-card-lg",
        hasBackground ? "min-h-[420px] sm:min-h-[520px]" : "bg-surface"
      )}
    >
      {hasBackground && data.backgroundImage && (
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
      )}

      <div
        className={cn(
          "container-wide section-padding relative z-10 text-center",
          hasBackground && "text-white"
        )}
      >
        <div className="mx-auto max-w-2xl">
          {data.eyebrow && <span className="pill-badge mb-6 inline-block">{data.eyebrow}</span>}

          <h1 className="font-heading text-4xl font-normal leading-tight text-balance sm:text-5xl lg:text-6xl">
            {data.title}
          </h1>

          {data.subtitle && (
            <p
              className={cn(
                "mt-5 font-body text-base leading-relaxed sm:text-lg",
                hasBackground ? "text-white/80" : "text-muted-foreground"
              )}
            >
              {data.subtitle}
            </p>
          )}

          {(data.primaryCta || data.secondaryCta) && (
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              {data.primaryCta && (
                <Button asChild size="lg">
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
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {data.trustBadges.map((badge, i) => (
                <span key={i} className="pill-badge">
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

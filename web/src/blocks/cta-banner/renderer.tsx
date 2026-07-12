import type { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ctaBannerSchemaDef } from "./schema";

type CtaBannerData = z.infer<(typeof ctaBannerSchemaDef)["schema"]>;

const styleClasses: Record<CtaBannerData["style"], string> = {
  dark: "bg-foreground text-background",
  accent: "bg-accent text-accent-foreground",
  light: "bg-surface text-foreground",
};

export function CtaBannerRenderer({ data }: { data: CtaBannerData }) {
  const isInverted = data.style !== "light";

  return (
    <section className={cn("rounded-card-lg", styleClasses[data.style])}>
      <div className="container-wide section-padding text-center">
        <h2 className="font-heading text-3xl font-normal text-balance sm:text-4xl">{data.title}</h2>
        {data.subtitle && (
          <p className={cn("mx-auto mt-4 max-w-xl font-body text-base sm:text-lg", isInverted ? "opacity-80" : "text-muted-foreground")}>
            {data.subtitle}
          </p>
        )}
        <Button
          asChild
          size="lg"
          className="mt-8"
          variant={data.style === "light" ? "default" : "secondary"}
        >
          <Link href={data.cta.href}>{data.cta.label}</Link>
        </Button>
      </div>
    </section>
  );
}

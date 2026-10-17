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
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
      <div className={cn("relative overflow-hidden rounded-card-lg px-6 py-16 text-center sm:px-12 md:py-20", styleClasses[data.style])}>
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

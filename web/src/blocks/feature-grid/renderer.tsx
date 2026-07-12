import type { z } from "zod";
import * as LucideIcons from "lucide-react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { featureGridSchemaDef } from "./schema";

type FeatureGridData = z.infer<(typeof featureGridSchemaDef)["schema"]>;

const columnsClass: Record<FeatureGridData["columns"], string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

function FeatureIcon({ name }: { name?: string }) {
  const Icon = (name && (LucideIcons as unknown as Record<string, typeof Sparkles>)[name]) || Sparkles;
  return (
    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

export function FeatureGridRenderer({ data }: { data: FeatureGridData }) {
  return (
    <div className="container-wide section-padding">
      {(data.eyebrow || data.title || data.subtitle) && (
        <div className="mx-auto mb-12 max-w-2xl text-center">
          {data.eyebrow && <span className="pill-badge mb-4 inline-block">{data.eyebrow}</span>}
          {data.title && <h2 className="font-heading text-3xl font-normal text-foreground sm:text-4xl">{data.title}</h2>}
          {data.subtitle && <p className="mt-4 font-body text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}

      <div className={cn("grid grid-cols-1 gap-6 lg:gap-8", columnsClass[data.columns])}>
        {data.items.map((item, i) => (
          <div key={i} className="section-card text-center">
            {data.style === "numbered" ? (
              <span className="mb-3 block font-heading text-5xl font-normal text-primary/25">
                {item.number || String(i + 1).padStart(2, "0")}
              </span>
            ) : (
              <FeatureIcon name={item.icon} />
            )}
            <h3 className="font-heading text-xl font-normal text-foreground">{item.title}</h3>
            {item.description && (
              <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

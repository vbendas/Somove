import type { z } from "zod";
import * as LucideIcons from "lucide-react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader, sectionContainer } from "../section-header";
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
    <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

export function FeatureGridRenderer({ data }: { data: FeatureGridData }) {
  return (
    <div className={sectionContainer}>
      <SectionHeader eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} />

      <div className={cn("grid grid-cols-1 gap-5 lg:gap-6", columnsClass[data.columns])}>
        {data.items.map((item, i) => (
          <div key={i} className="rounded-card-lg border border-border bg-card p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-8">
            {data.style === "numbered" ? (
              <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-body text-sm font-semibold tabular-nums text-primary">
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

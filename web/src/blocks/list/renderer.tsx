import type { z } from "zod";
import { Check } from "lucide-react";
import type { listSchemaDef } from "./schema";

type ListData = z.infer<(typeof listSchemaDef)["schema"]>;

export function ListRenderer({ data }: { data: ListData }) {
  if (data.style === "check") {
    return (
      <div className="container-wide section-padding">
        <ul className="mx-auto max-w-2xl space-y-3">
          {data.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 font-body text-foreground/80">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="container-wide section-padding">
      <ul className="mx-auto max-w-2xl list-disc space-y-2 pl-5 font-body text-foreground/80">
        {data.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

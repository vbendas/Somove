import type { z } from "zod";
import Image from "next/image";
import { Quote } from "lucide-react";
import { SectionHeader, sectionContainer } from "../section-header";
import type { testimonialsSchemaDef } from "./schema";

type TestimonialsData = z.infer<(typeof testimonialsSchemaDef)["schema"]>;

export function TestimonialsRenderer({ data }: { data: TestimonialsData }) {
  return (
    <div className={sectionContainer}>
      <SectionHeader eyebrow={data.eyebrow} title={data.title} />

      <div
        className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
          data.items.length % 4 === 0 ? "lg:grid-cols-4" : "lg:grid-cols-3"
        }`}
      >
        {data.items.map((item, i) => (
          <figure
            key={i}
            className="flex flex-col rounded-card-lg border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-8"
          >
            <Quote className="mb-4 h-7 w-7 text-primary/40" aria-hidden="true" />
            <blockquote className="font-heading flex-1 text-lg font-normal leading-relaxed text-foreground">
              {item.quote}
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary/10">
                {item.avatar?.url ? (
                  <Image src={item.avatar.url} alt={item.avatar.alt || item.author} width={40} height={40} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-heading text-base text-primary">
                    {item.author.charAt(0)}
                  </span>
                )}
              </div>
              <div>
              <span className="block font-body text-sm font-medium text-foreground">{item.author}</span>
              {item.role && <span className="block font-body text-xs text-muted-foreground">{item.role}</span>}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

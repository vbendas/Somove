import type { z } from "zod";
import Image from "next/image";
import type { testimonialsSchemaDef } from "./schema";

type TestimonialsData = z.infer<(typeof testimonialsSchemaDef)["schema"]>;

export function TestimonialsRenderer({ data }: { data: TestimonialsData }) {
  return (
    <div className="container-wide section-padding">
      {(data.eyebrow || data.title) && (
        <div className="mx-auto mb-12 max-w-2xl text-center">
          {data.eyebrow && <span className="pill-badge mb-4 inline-block">{data.eyebrow}</span>}
          {data.title && <h2 className="font-heading text-3xl font-normal text-foreground sm:text-4xl">{data.title}</h2>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((item, i) => (
          <figure key={i} className="section-card text-center">
            <div className="mx-auto mb-4 h-12 w-12 overflow-hidden rounded-full bg-primary/10">
              {item.avatar?.url ? (
                <Image src={item.avatar.url} alt={item.avatar.alt || item.author} width={48} height={48} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-heading text-lg text-primary">
                  {item.author.charAt(0)}
                </span>
              )}
            </div>
            <blockquote className="font-heading text-lg font-normal leading-relaxed text-foreground">
              &ldquo;{item.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-4">
              <span className="block font-body text-sm font-medium text-foreground">{item.author}</span>
              {item.role && <span className="block font-body text-xs text-muted-foreground">{item.role}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

import type { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sectionContainer } from "../section-header";
import type { imageTextSchemaDef } from "./schema";

type ImageTextData = z.infer<(typeof imageTextSchemaDef)["schema"]>;

/**
 * Renders pre-sanitized HTML (`data.html`). Sanitization happens once, at
 * the `BlockRenderer` dispatch layer, before this component ever sees it.
 */
export function ImageTextRenderer({ data }: { data: ImageTextData }) {
  const imageOnRight = data.imagePosition === "right";

  return (
    <div className={sectionContainer}>
      <div className={cn("grid items-center gap-8 lg:gap-12", data.image ? "md:grid-cols-2" : "mx-auto max-w-3xl")}>
        {data.image && (
          <div className={cn("relative aspect-[4/3] w-full overflow-hidden rounded-card-lg bg-surface", imageOnRight ? "md:order-2" : "md:order-1")}>
            <Image src={data.image.url} alt={data.image.alt || ""} fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
          </div>
        )}
        <div className={cn(data.image ? (imageOnRight ? "md:order-1" : "md:order-2") : "text-center")}>
          {data.eyebrow && (
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wider text-primary">{data.eyebrow}</p>
          )}
          <h2 className="font-heading text-3xl font-normal text-balance text-foreground sm:text-4xl">{data.title}</h2>
          {data.html && (
            <div
              className="prose mt-5 font-body text-base leading-relaxed text-foreground/80 sm:text-lg [&_a]:text-primary [&_a]:underline [&_p+p]:mt-4"
              dangerouslySetInnerHTML={{ __html: data.html }}
            />
          )}
          {data.cta && (
            <Button asChild size="lg" className="mt-6">
              <Link href={data.cta.href}>{data.cta.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

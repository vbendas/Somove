import type { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { imageTextSchemaDef } from "./schema";

type ImageTextData = z.infer<(typeof imageTextSchemaDef)["schema"]>;

/**
 * Renders pre-sanitized HTML (`data.html`). Sanitization happens once, at
 * the `BlockRenderer` dispatch layer, before this component ever sees it.
 */
export function ImageTextRenderer({ data }: { data: ImageTextData }) {
  const imageOnRight = data.imagePosition === "right";

  return (
    <div className="container-wide section-padding">
      <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
        {data.image && (
          <div className={cn("relative aspect-[4/3] w-full overflow-hidden rounded-card-lg bg-surface", imageOnRight ? "md:order-2" : "md:order-1")}>
            <Image src={data.image.url} alt={data.image.alt || ""} fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
          </div>
        )}
        <div className={cn(imageOnRight ? "md:order-1" : "md:order-2")}>
          {data.eyebrow && <span className="pill-badge mb-4 inline-block">{data.eyebrow}</span>}
          <h2 className="font-heading text-3xl font-normal text-foreground sm:text-4xl">{data.title}</h2>
          {data.html && (
            <div
              className="prose mt-4 font-body leading-relaxed text-foreground/80 [&_a]:text-primary [&_a]:underline"
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

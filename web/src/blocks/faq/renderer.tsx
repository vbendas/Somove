import type { z } from "zod";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { faqSchemaDef } from "./schema";

type FaqData = z.infer<(typeof faqSchemaDef)["schema"]>;

/**
 * Renders pre-sanitized HTML (`item.answerHtml`). Sanitization happens once,
 * at the `BlockRenderer` dispatch layer, before this component sees it.
 */
export function FaqRenderer({ data }: { data: FaqData }) {
  return (
    <div className="container-wide section-padding">
      {(data.eyebrow || data.title) && (
        <div className="mx-auto mb-10 max-w-2xl text-center">
          {data.eyebrow && <span className="pill-badge mb-4 inline-block">{data.eyebrow}</span>}
          {data.title && <h2 className="font-heading text-3xl font-normal text-foreground sm:text-4xl">{data.title}</h2>}
        </div>
      )}

      <Accordion type="single" collapsible className="mx-auto max-w-2xl">
        {data.items.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="font-heading text-lg font-normal text-foreground">
              {item.question}
            </AccordionTrigger>
            <AccordionContent>
              <div
                className="font-body text-sm leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: item.answerHtml }}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

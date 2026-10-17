import type { z } from "zod";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionHeader, sectionContainer } from "../section-header";
import type { faqSchemaDef } from "./schema";

type FaqData = z.infer<(typeof faqSchemaDef)["schema"]>;

/**
 * Renders pre-sanitized HTML (`item.answerHtml`). Sanitization happens once,
 * at the `BlockRenderer` dispatch layer, before this component sees it.
 */
export function FaqRenderer({ data }: { data: FaqData }) {
  return (
    <div className={sectionContainer}>
      <SectionHeader eyebrow={data.eyebrow} title={data.title} />

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

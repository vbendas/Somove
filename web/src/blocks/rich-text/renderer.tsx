import type { z } from "zod";
import type { richTextSchemaDef } from "./schema";

type RichTextData = z.infer<(typeof richTextSchemaDef)["schema"]>;

/**
 * Renders pre-sanitized HTML. Sanitization happens once, at the
 * `BlockRenderer` dispatch layer (via `sanitizeBlockContent`), so `data.html`
 * is trusted by the time it reaches this component — do not re-sanitize here.
 */
export function RichTextRenderer({ data }: { data: RichTextData }) {
  return (
    <div className="container-wide section-padding">
      <div
        className="prose mx-auto max-w-3xl font-body leading-relaxed text-foreground/80 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:font-heading [&_h2]:text-foreground [&_h3]:font-heading [&_h3]:text-foreground [&_h4]:font-heading [&_h4]:text-foreground"
        dangerouslySetInnerHTML={{ __html: data.html }}
      />
    </div>
  );
}

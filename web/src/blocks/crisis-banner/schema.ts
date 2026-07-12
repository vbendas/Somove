import { z } from "zod";
import type { BlockSchemaDef } from "../types";

const dataSchema = z.object({
  heading: z.string().min(1),
  body: z.string().optional(),
  linkLabel: z.string().optional(),
  linkHref: z.string().optional(),
});

export const crisisBannerSchemaDef: BlockSchemaDef<typeof dataSchema> = {
  type: "crisisBanner",
  label: "Crisis banner",
  icon: "AlertTriangle",
  schema: dataSchema,
  defaults: {
    heading: "Need immediate help?",
  },
  fields: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "body", label: "Body" },
    { kind: "text", key: "linkLabel", label: "Link label" },
    { kind: "text", key: "linkHref", label: "Link URL" },
  ],
};

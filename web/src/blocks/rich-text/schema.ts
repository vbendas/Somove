import { z } from "zod";
import type { BlockSchemaDef } from "../types";

const dataSchema = z.object({
  html: z.string().default(""),
});

export const richTextSchemaDef: BlockSchemaDef<typeof dataSchema> = {
  type: "richText",
  label: "Rich text",
  icon: "Type",
  schema: dataSchema,
  defaults: {
    html: "",
  },
  fields: [{ kind: "richtext", key: "html", label: "Content" }],
};

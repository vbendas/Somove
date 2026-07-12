import { z } from "zod";
import type { BlockSchemaDef } from "../types";
import { imgSchema } from "../common";

const dataSchema = z.object({
  image: imgSchema,
  caption: z.string().optional(),
  fullBleed: z.boolean().default(false),
});

export const imageSchemaDef: BlockSchemaDef<typeof dataSchema> = {
  type: "image",
  label: "Image",
  icon: "Image",
  schema: dataSchema,
  defaults: {
    image: { url: "https://placehold.co/1200x630", alt: "" },
    fullBleed: false,
  },
  fields: [
    { kind: "image", key: "image", label: "Image" },
    { kind: "text", key: "caption", label: "Caption" },
    { kind: "boolean", key: "fullBleed", label: "Full bleed" },
  ],
};

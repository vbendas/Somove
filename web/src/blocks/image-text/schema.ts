import { z } from "zod";
import type { BlockSchemaDef } from "../types";
import { imgSchema, linkSchema } from "../common";

const dataSchema = z.object({
  image: imgSchema.optional(),
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  html: z.string().default(""),
  imagePosition: z.enum(["left", "right"]).default("left"),
  cta: linkSchema.optional(),
});

export const imageTextSchemaDef: BlockSchemaDef<typeof dataSchema> = {
  type: "imageText",
  label: "Image + text",
  icon: "Columns2",
  schema: dataSchema,
  defaults: {
    title: "Section title",
    html: "",
    imagePosition: "left",
  },
  fields: [
    { kind: "image", key: "image", label: "Image" },
    { kind: "text", key: "eyebrow", label: "Eyebrow" },
    { kind: "text", key: "title", label: "Title" },
    { kind: "richtext", key: "html", label: "Content" },
    {
      kind: "select",
      key: "imagePosition",
      label: "Image position",
      options: [
        { value: "left", label: "Left" },
        { value: "right", label: "Right" },
      ],
    },
    { kind: "link", key: "cta", label: "Button" },
  ],
};

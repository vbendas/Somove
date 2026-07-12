import { z } from "zod";
import type { BlockSchemaDef } from "../types";
import { imgSchema } from "../common";

const itemSchema = z.object({
  quote: z.string().min(1),
  author: z.string().min(1),
  role: z.string().optional(),
  avatar: imgSchema.optional(),
});

const dataSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  items: z.array(itemSchema).default([]),
});

export const testimonialsSchemaDef: BlockSchemaDef<typeof dataSchema> = {
  type: "testimonials",
  label: "Testimonials",
  icon: "Quote",
  schema: dataSchema,
  defaults: {
    items: [],
  },
  fields: [
    { kind: "text", key: "eyebrow", label: "Eyebrow" },
    { kind: "text", key: "title", label: "Title" },
    {
      kind: "repeater",
      key: "items",
      label: "Testimonials",
      itemLabel: "Testimonial",
      fields: [
        { kind: "textarea", key: "quote", label: "Quote" },
        { kind: "text", key: "author", label: "Author" },
        { kind: "text", key: "role", label: "Role" },
        { kind: "image", key: "avatar", label: "Avatar" },
      ],
    },
  ],
};

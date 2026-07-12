import { z } from "zod";
import type { BlockSchemaDef } from "../types";
import { linkSchema } from "../common";

const tierSchema = z.object({
  name: z.string().min(1),
  price: z.string().min(1),
  period: z.string().default(""),
  badge: z.string().optional(),
  features: z.array(z.string()).default([]),
  cta: linkSchema,
  highlighted: z.boolean().default(false),
});

const dataSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  tiers: z.array(tierSchema).default([]),
});

export const pricingSchemaDef: BlockSchemaDef<typeof dataSchema> = {
  type: "pricing",
  label: "Pricing",
  icon: "Tags",
  schema: dataSchema,
  defaults: {
    tiers: [],
  },
  fields: [
    { kind: "text", key: "eyebrow", label: "Eyebrow" },
    { kind: "text", key: "title", label: "Title" },
    { kind: "textarea", key: "subtitle", label: "Subtitle" },
    {
      kind: "repeater",
      key: "tiers",
      label: "Pricing tiers",
      itemLabel: "Tier",
      fields: [
        { kind: "text", key: "name", label: "Name" },
        { kind: "text", key: "price", label: "Price" },
        { kind: "text", key: "period", label: "Period" },
        { kind: "text", key: "badge", label: "Badge" },
        { kind: "stringList", key: "features", label: "Features" },
        { kind: "link", key: "cta", label: "Button" },
        { kind: "boolean", key: "highlighted", label: "Highlighted" },
      ],
    },
  ],
};

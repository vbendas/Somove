import { z } from "zod";
import type { BlockSchemaDef } from "../types";

const itemSchema = z.object({
  number: z.string().optional(),
  icon: z.string().optional(),
  title: z.string().min(1),
  description: z.string().default(""),
});

const dataSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  style: z.enum(["numbered", "icon"]).default("numbered"),
  items: z.array(itemSchema).default([]),
});

export const featureGridSchemaDef: BlockSchemaDef<typeof dataSchema> = {
  type: "featureGrid",
  label: "Feature grid",
  icon: "LayoutGrid",
  schema: dataSchema,
  defaults: {
    columns: 3,
    style: "numbered",
    items: [],
  },
  fields: [
    { kind: "text", key: "eyebrow", label: "Eyebrow" },
    { kind: "text", key: "title", label: "Title" },
    { kind: "textarea", key: "subtitle", label: "Subtitle" },
    {
      kind: "select",
      key: "columns",
      label: "Columns",
      options: [
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
      ],
    },
    {
      kind: "select",
      key: "style",
      label: "Style",
      options: [
        { value: "numbered", label: "Numbered" },
        { value: "icon", label: "Icon" },
      ],
    },
    {
      kind: "repeater",
      key: "items",
      label: "Items",
      itemLabel: "Feature",
      fields: [
        { kind: "text", key: "number", label: "Number" },
        { kind: "text", key: "icon", label: "Icon" },
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "description", label: "Description" },
      ],
    },
  ],
};

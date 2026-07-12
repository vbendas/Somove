import { z } from "zod";
import type { BlockSchemaDef } from "../types";

const itemSchema = z.object({
  value: z.number(),
  suffix: z.string().optional(),
  label: z.string().min(1),
});

const dataSchema = z.object({
  items: z.array(itemSchema).default([]),
});

export const statsSchemaDef: BlockSchemaDef<typeof dataSchema> = {
  type: "stats",
  label: "Stats",
  icon: "BarChart3",
  schema: dataSchema,
  defaults: {
    items: [],
  },
  fields: [
    {
      kind: "repeater",
      key: "items",
      label: "Stats",
      itemLabel: "Stat",
      fields: [
        { kind: "number", key: "value", label: "Value" },
        { kind: "text", key: "suffix", label: "Suffix" },
        { kind: "text", key: "label", label: "Label" },
      ],
    },
  ],
};

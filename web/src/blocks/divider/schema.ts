import { z } from "zod";
import type { BlockSchemaDef } from "../types";

const dataSchema = z.object({
  style: z.enum(["line", "space"]).default("line"),
});

export const dividerSchemaDef: BlockSchemaDef<typeof dataSchema> = {
  type: "divider",
  label: "Divider",
  icon: "Minus",
  schema: dataSchema,
  defaults: {
    style: "line",
  },
  fields: [
    {
      kind: "select",
      key: "style",
      label: "Style",
      options: [
        { value: "line", label: "Line" },
        { value: "space", label: "Space" },
      ],
    },
  ],
};

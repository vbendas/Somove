import { z } from "zod";
import type { BlockSchemaDef } from "../types";

const dataSchema = z.object({
  style: z.enum(["bullet", "check"]).default("bullet"),
  items: z.array(z.string()).default([]),
});

export const listSchemaDef: BlockSchemaDef<typeof dataSchema> = {
  type: "list",
  label: "List",
  icon: "List",
  schema: dataSchema,
  defaults: {
    style: "bullet",
    items: [],
  },
  fields: [
    {
      kind: "select",
      key: "style",
      label: "Style",
      options: [
        { value: "bullet", label: "Bullet" },
        { value: "check", label: "Check" },
      ],
    },
    { kind: "stringList", key: "items", label: "Items" },
  ],
};

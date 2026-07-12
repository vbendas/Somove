import { z } from "zod";
import type { BlockSchemaDef } from "../types";

const itemSchema = z.object({
  question: z.string().min(1),
  answerHtml: z.string().default(""),
});

const dataSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  items: z.array(itemSchema).default([]),
});

export const faqSchemaDef: BlockSchemaDef<typeof dataSchema> = {
  type: "faq",
  label: "FAQ",
  icon: "HelpCircle",
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
      label: "Questions",
      itemLabel: "Question",
      fields: [
        { kind: "text", key: "question", label: "Question" },
        { kind: "richtext", key: "answerHtml", label: "Answer" },
      ],
    },
  ],
};

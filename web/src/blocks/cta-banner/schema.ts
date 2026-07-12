import { z } from "zod";
import type { BlockSchemaDef } from "../types";
import { linkSchema } from "../common";

const dataSchema = z.object({
  style: z.enum(["dark", "accent", "light"]).default("dark"),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  cta: linkSchema,
});

export const ctaBannerSchemaDef: BlockSchemaDef<typeof dataSchema> = {
  type: "ctaBanner",
  label: "CTA banner",
  icon: "Megaphone",
  schema: dataSchema,
  defaults: {
    style: "dark",
    title: "Ready to get started?",
    cta: { label: "Get started", href: "/" },
  },
  fields: [
    {
      kind: "select",
      key: "style",
      label: "Style",
      options: [
        { value: "dark", label: "Dark" },
        { value: "accent", label: "Accent" },
        { value: "light", label: "Light" },
      ],
    },
    { kind: "text", key: "title", label: "Title" },
    { kind: "textarea", key: "subtitle", label: "Subtitle" },
    { kind: "link", key: "cta", label: "Button" },
  ],
};

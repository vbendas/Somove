import { z } from "zod";
import type { BlockSchemaDef } from "../types";
import { imgSchema, linkSchema } from "../common";

const dataSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  backgroundImage: imgSchema.optional(),
  overlay: z.boolean().default(true),
  primaryCta: linkSchema.optional(),
  secondaryCta: linkSchema.optional(),
  trustBadges: z.array(z.string()).default([]),
});

export const heroSchemaDef: BlockSchemaDef<typeof dataSchema> = {
  type: "hero",
  label: "Hero",
  icon: "Layout",
  schema: dataSchema,
  defaults: {
    title: "Welcome",
    overlay: true,
    trustBadges: [],
  },
  fields: [
    { kind: "text", key: "eyebrow", label: "Eyebrow" },
    { kind: "text", key: "title", label: "Title" },
    { kind: "textarea", key: "subtitle", label: "Subtitle" },
    { kind: "image", key: "backgroundImage", label: "Background image" },
    { kind: "boolean", key: "overlay", label: "Dark overlay" },
    { kind: "link", key: "primaryCta", label: "Primary button" },
    { kind: "link", key: "secondaryCta", label: "Secondary button" },
    { kind: "stringList", key: "trustBadges", label: "Trust badges" },
  ],
};

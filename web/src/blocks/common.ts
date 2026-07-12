import { z } from "zod";

/**
 * Shared sub-schemas reused across block `data` shapes. No React
 * dependency — safe to import from "use server" action files.
 */

export const imgSchema = z.object({
  url: z.url(),
  alt: z.string().default(""),
});

export const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

export type ImgValue = z.infer<typeof imgSchema>;
export type LinkValue = z.infer<typeof linkSchema>;

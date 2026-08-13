import { z } from "zod";

export const setupSchema = z.object({
  platformName: z.string().min(1).max(80),
  supportEmail: z.string().email(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  termsOfService: z.string().optional(),
  privacyPolicy: z.string().optional(),
});
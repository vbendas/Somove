import { z } from "zod";

export const sessionTypeSchema = z.object({
  name: z.string().min(1).max(100),
  durationMinutes: z.number().int().min(15).max(240),
  priceCents: z.number().int().min(0),
  isBundle: z.boolean().optional(),
  bundleSessions: z.number().int().min(2).max(50).optional(),
  isActive: z.boolean().optional(),
});
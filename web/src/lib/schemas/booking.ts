import { z } from "zod";

export const createSessionSchema = z.object({
  therapistId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  durationMin: z.number().int().min(15).max(240),
  sessionType: z.enum(["single", "free_first_session"]),
  priceCents: z.number().int().min(0),
  timeZone: z.string().max(100).optional(),
  sessionTypeId: z.string().uuid().nullable().optional(),
  useCredits: z.boolean().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
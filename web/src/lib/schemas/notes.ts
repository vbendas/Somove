import { z } from "zod";

export const upsertNoteSchema = z.object({
  sessionId: z.string().uuid().nullable().optional(),
  content: z.string().min(1).max(50000),
});
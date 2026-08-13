import { z } from "zod";

export const intakeSchema = z.object({
  answers: z.record(z.string(), z.string().max(5000)),
});
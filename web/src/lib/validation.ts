import { ZodSchema, ZodError } from "zod";

export function validateInput<T>(
  schema: ZodSchema<T>,
  input: unknown
): { data?: T; error?: string } {
  try {
    const data = schema.parse(input);
    return { data };
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        error: e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      };
    }
    return { error: "Invalid input" };
  }
}
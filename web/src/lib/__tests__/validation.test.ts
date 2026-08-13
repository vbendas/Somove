import { describe, it, expect } from "vitest";
import { validateInput } from "@/lib/validation";
import { z } from "zod";

const testSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150),
});

describe("validateInput", () => {
  it("returns parsed data on valid input", () => {
    const result = validateInput(testSchema, { name: "Alice", age: 30 });
    expect(result.data).toEqual({ name: "Alice", age: 30 });
    expect(result.error).toBeUndefined();
  });

  it("returns error string on invalid input", () => {
    const result = validateInput(testSchema, { name: "", age: -1 });
    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  it("returns error for missing fields", () => {
    const result = validateInput(testSchema, {});
    expect(result.error).toBeDefined();
    expect(result.error).toContain("name");
  });

  it("handles non-object input gracefully", () => {
    const result = validateInput(testSchema, "not an object");
    expect(result.error).toBeDefined();
  });
});
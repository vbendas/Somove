import { describe, it, expect } from "vitest";
import { blockSchemaDefs, contentSchema, type BlockType } from "@/blocks/schemas";

function envelope(id: string, type: string, data: Record<string, unknown>) {
  return { id, type, data };
}

describe("contentSchema", () => {
  it("accepts a valid array covering all 13 registered block types with their defaults", () => {
    const blocks = (Object.keys(blockSchemaDefs) as BlockType[]).map((type, i) =>
      envelope(`b${i}`, type, blockSchemaDefs[type].defaults as Record<string, unknown>)
    );
    const result = contentSchema.safeParse(blocks);
    expect(result.success).toBe(true);
  });

  it("each block def's defaults independently satisfy its own schema", () => {
    for (const type of Object.keys(blockSchemaDefs) as BlockType[]) {
      const def = blockSchemaDefs[type];
      const result = def.schema.safeParse(def.defaults);
      expect(result.success, `defaults for "${type}" should be valid`).toBe(true);
    }
  });

  it("rejects an unknown block type", () => {
    const result = contentSchema.safeParse([envelope("b1", "notARealType", {})]);
    expect(result.success).toBe(false);
  });

  it("rejects a block whose data fails its schema (hero missing required title)", () => {
    const result = contentSchema.safeParse([envelope("b1", "hero", { overlay: true, trustBadges: [] })]);
    expect(result.success).toBe(false);
  });

  it("rejects more than 50 blocks", () => {
    const blocks = Array.from({ length: 51 }, (_, i) => envelope(`b${i}`, "divider", { style: "line" }));
    const result = contentSchema.safeParse(blocks);
    expect(result.success).toBe(false);
  });

  it("accepts legacy 'text' type aliased onto richText", () => {
    const result = contentSchema.safeParse([envelope("b1", "text", { html: "<p>hello</p>" })]);
    expect(result.success).toBe(true);
  });

  it("accepts legacy 'cta' type aliased onto ctaBanner", () => {
    const result = contentSchema.safeParse([
      envelope("b1", "cta", { title: "Get started", cta: { label: "Go", href: "/signup" } }),
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects legacy 'text' with data that fails the aliased richText schema", () => {
    // richText's `html` defaults to "" when omitted, so an object without
    // `html` is still valid — but a non-string `html` is not.
    const result = contentSchema.safeParse([envelope("b1", "text", { html: 123 })]);
    expect(result.success).toBe(false);
  });
});

import { sanitizeRichHtml } from "@/lib/sanitize";
import { blockSchemaDefs, legacyTypeAliases, type BlockType } from "./schemas";
import type { Block, FieldConfig } from "./types";

function resolveDefKey(type: string): BlockType | undefined {
  if (type in blockSchemaDefs) return type as BlockType;
  return legacyTypeAliases[type];
}

function sanitizeValueForField(field: FieldConfig, value: unknown): unknown {
  if (field.kind === "richtext") {
    return sanitizeRichHtml(value);
  }
  if (field.kind === "repeater") {
    if (!Array.isArray(value)) return value;
    return value.map((item) => sanitizeFields(field.fields, item));
  }
  return value;
}

/**
 * Sanitizes the `richtext`-kind fields described by `fields` on a single
 * block-data (or repeater-item-data) object, leaving every other field
 * untouched. Defensive against missing/malformed data — a field config with
 * no matching key on `data` is simply skipped, never thrown on.
 */
function sanitizeFields(fields: FieldConfig[], data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const result: Record<string, unknown> = { ...(data as Record<string, unknown>) };
  for (const field of fields) {
    if (!(field.key in result)) continue;
    result[field.key] = sanitizeValueForField(field, result[field.key]);
  }
  return result;
}

/**
 * Walks a block array and sanitizes every `richtext`-kind field's value
 * (including nested richtext fields inside `repeater` items, e.g.
 * faq.items[].answerHtml) using `sanitizeRichHtml`. Unknown block types are
 * passed through unchanged — validation (rejecting unknown types) is
 * `contentSchema`'s job, not this function's.
 */
export function sanitizeBlockContent(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    const key = resolveDefKey(block.type);
    if (!key) return block;
    const def = blockSchemaDefs[key];
    const data = sanitizeFields(def.fields, block.data);
    return { ...block, data: data as Record<string, unknown> };
  });
}

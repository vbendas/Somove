import { z } from "zod";
import { heroSchemaDef } from "./hero/schema";
import { richTextSchemaDef } from "./rich-text/schema";
import { imageSchemaDef } from "./image/schema";
import { imageTextSchemaDef } from "./image-text/schema";
import { featureGridSchemaDef } from "./feature-grid/schema";
import { testimonialsSchemaDef } from "./testimonials/schema";
import { pricingSchemaDef } from "./pricing/schema";
import { faqSchemaDef } from "./faq/schema";
import { statsSchemaDef } from "./stats/schema";
import { ctaBannerSchemaDef } from "./cta-banner/schema";
import { crisisBannerSchemaDef } from "./crisis-banner/schema";
import { listSchemaDef } from "./list/schema";
import { dividerSchemaDef } from "./divider/schema";

/**
 * Data-only block registry: maps a block `type` string to its
 * `BlockSchemaDef` (schema + defaults + field config). Zero React
 * dependency — safe to import from "use server" action files.
 */
export const blockSchemaDefs = {
  hero: heroSchemaDef,
  richText: richTextSchemaDef,
  image: imageSchemaDef,
  imageText: imageTextSchemaDef,
  featureGrid: featureGridSchemaDef,
  testimonials: testimonialsSchemaDef,
  pricing: pricingSchemaDef,
  faq: faqSchemaDef,
  stats: statsSchemaDef,
  ctaBanner: ctaBannerSchemaDef,
  crisisBanner: crisisBannerSchemaDef,
  list: listSchemaDef,
  divider: dividerSchemaDef,
} as const;

export type BlockType = keyof typeof blockSchemaDefs;

/**
 * Legacy block `type` strings (pre-registry, see the original
 * web/src/components/blocks/BlockRenderer.tsx) mapped onto the closest new
 * def so existing stored rows keep validating without a data migration.
 * "text" blocks had a free-form HTML `content` field, closest to richText's
 * `html`; "cta" blocks had `{ text, href }`, closest to ctaBanner (though
 * the legacy field names don't line up 1:1 with ctaBanner's `data` shape —
 * legacy rows validate their `type` via this alias, `data` still has to
 * satisfy the aliased target schema, which is guaranteed only once these
 * blocks are re-saved through the new editor and normalized).
 */
export const legacyTypeAliases: Record<string, BlockType> = {
  text: "richText",
  cta: "ctaBanner",
};

function resolveDefKey(type: string): BlockType | undefined {
  if (type in blockSchemaDefs) return type as BlockType;
  return legacyTypeAliases[type];
}

/**
 * Validates an array of stored blocks (up to 50). Each block's `type` must
 * resolve (directly or via a legacy alias) to a known `BlockSchemaDef`, and
 * its `data` must satisfy that def's schema.
 *
 * Implemented as a manual per-block lookup + `safeParse` inside
 * `superRefine`, rather than a single `z.discriminatedUnion("type", ...)`.
 * A discriminated union requires each member's `type` literal to match the
 * schema branch it validates against — legacy aliases ("text" -> richText,
 * "cta" -> ctaBanner) need TWO literal branches per aliased schema (one for
 * the canonical type, one for the legacy type), which would either double
 * the union membership or require hand-duplicating schema branches out of
 * sync with `blockSchemaDefs`. The manual lookup keeps `blockSchemaDefs` as
 * the single source of truth for both the type->schema mapping and alias
 * resolution, and produces clearer per-field error paths.
 */
export const contentSchema = z
  .array(
    z.object({
      id: z.string(),
      type: z.string(),
      data: z.record(z.string(), z.unknown()),
      order: z.number().optional(),
    })
  )
  .max(50)
  .superRefine((blocks, ctx) => {
    blocks.forEach((block, i) => {
      const key = resolveDefKey(block.type);
      if (!key) {
        ctx.addIssue({
          code: "custom",
          message: `Unknown block type: ${block.type}`,
          path: [i, "type"],
        });
        return;
      }
      const result = blockSchemaDefs[key].schema.safeParse(block.data);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          message: `Invalid data for block type ${block.type}`,
          path: [i, "data"],
        });
      }
    });
  });

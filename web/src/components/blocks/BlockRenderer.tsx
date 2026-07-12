import type { ComponentType } from "react";
import {
  blockSchemaDefs,
  legacyTypeAliases,
  normalizeBlocks,
  sanitizeBlockContent,
  type Block,
  type BlockType,
} from "@/blocks";

import { HeroRenderer } from "@/blocks/hero/renderer";
import { RichTextRenderer } from "@/blocks/rich-text/renderer";
import { ImageRenderer } from "@/blocks/image/renderer";
import { ImageTextRenderer } from "@/blocks/image-text/renderer";
import { FeatureGridRenderer } from "@/blocks/feature-grid/renderer";
import { TestimonialsRenderer } from "@/blocks/testimonials/renderer";
import { PricingRenderer } from "@/blocks/pricing/renderer";
import { FaqRenderer } from "@/blocks/faq/renderer";
import { StatsRenderer } from "@/blocks/stats/renderer";
import { CtaBannerRenderer } from "@/blocks/cta-banner/renderer";
import { CrisisBannerRenderer } from "@/blocks/crisis-banner/renderer";
import { ListRenderer } from "@/blocks/list/renderer";
import { DividerRenderer } from "@/blocks/divider/renderer";

export type { Block };

interface BlockRendererProps {
  blocks: Block[];
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rendererMap: Record<BlockType, ComponentType<{ data: any }>> = {
  hero: HeroRenderer,
  richText: RichTextRenderer,
  image: ImageRenderer,
  imageText: ImageTextRenderer,
  featureGrid: FeatureGridRenderer,
  testimonials: TestimonialsRenderer,
  pricing: PricingRenderer,
  faq: FaqRenderer,
  stats: StatsRenderer,
  ctaBanner: CtaBannerRenderer,
  crisisBanner: CrisisBannerRenderer,
  list: ListRenderer,
  divider: DividerRenderer,
};

function resolveDefKey(type: string): BlockType | undefined {
  if (type in blockSchemaDefs) return type as BlockType;
  return legacyTypeAliases[type];
}

/**
 * Registry-driven block renderer: normalizes the incoming block array,
 * sanitizes every `richtext`-kind field (see `@/blocks/sanitize`), then
 * validates + renders each block against its `BlockSchemaDef`. Unknown
 * types (and blocks that fail schema validation) are skipped silently
 * rather than throwing, so a single bad row never takes down a whole page.
 */
export function BlockRenderer({ blocks, className }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  const normalized = normalizeBlocks(blocks);
  const sanitized = sanitizeBlockContent(normalized);

  return (
    <div className={className}>
      {sanitized.map((block) => {
        const key = resolveDefKey(block.type);
        if (!key) return null;

        const def = blockSchemaDefs[key];
        const parsed = def.schema.safeParse(block.data);
        if (!parsed.success) return null;

        const Renderer = rendererMap[key];
        return (
          <div key={block.id} className="mb-6 last:mb-0">
            <Renderer data={parsed.data} />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Legacy helper retained for backward compatibility with existing callers
 * (the pre-registry dashboard page-builder UI, which predates this block
 * registry and is slated for a rewrite in a later phase). Filters out
 * malformed entries; unlike `normalizeBlocks`/`contentSchema` it does not
 * assign ids or validate `data` against a per-type schema.
 */
export function validateBlocks(blocks: unknown[]): Block[] {
  return blocks.filter((b): b is Block => {
    if (!b || typeof b !== "object") return false;
    const obj = b as Record<string, unknown>;
    return typeof obj.type === "string" && typeof obj.data === "object" && obj.data !== null;
  });
}

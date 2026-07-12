export * from "./types";
export * from "./schemas";
export { sanitizeBlockContent } from "./sanitize";

import type { Block } from "./types";

// NOTE: a later task adds a `blockRegistry` here, combining `blockSchemaDefs`
// (schemas.ts) with each block folder's `renderer.tsx` React component into
// a `BlockDef` map (schema + defaults + fields + Renderer) for client/RSC
// rendering, and rewrites web/src/components/blocks/BlockRenderer.tsx to use
// it. That work doesn't exist yet in this file on purpose — the renderer
// files it depends on haven't been created.

type RawBlock = {
  id?: unknown;
  type?: unknown;
  data?: unknown;
  order?: unknown;
};

/**
 * Normalizes an arbitrary array of stored/incoming blocks into `Block[]`:
 * assigns missing `id`s via `crypto.randomUUID()`, and — as a one-time
 * migration shim for legacy rows that carried a numeric `order` field with
 * no `id` at all — sorts by that `order` once. Subsequent saves always rely
 * on array position to imply order, so no `order` field is needed (or
 * retained) going forward.
 */
export function normalizeBlocks(blocks: unknown[]): Block[] {
  const raw = blocks.map((b): RawBlock => (b && typeof b === "object" ? (b as RawBlock) : {}));

  // Legacy rows had no `id` field at all; only sort-by-`order` (once) when
  // none of the incoming blocks already carry an id of their own.
  const hadNoIds = raw.every((b) => typeof b.id !== "string" || b.id.length === 0);

  const withIds = raw.map((b) => {
    const id = typeof b.id === "string" && b.id.length > 0 ? b.id : crypto.randomUUID();
    const type = typeof b.type === "string" ? b.type : "";
    const data = b.data && typeof b.data === "object" ? (b.data as Record<string, unknown>) : {};
    const order = typeof b.order === "number" ? b.order : undefined;
    return { id, type, data, order };
  });

  const hasOrder = withIds.some((b) => typeof b.order === "number");
  const ordered = hadNoIds && hasOrder ? [...withIds].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : withIds;

  return ordered.map(({ id, type, data }) => ({ id, type, data }));
}

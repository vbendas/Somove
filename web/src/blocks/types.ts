import type { z } from "zod";

/**
 * Stored block envelope — the shape persisted in a therapist page's
 * `content` JSON array. `data` is validated per-`type` against the
 * corresponding `BlockSchemaDef.schema` (see schemas.ts).
 */
export type Block = { id: string; type: string; data: Record<string, unknown> };

/**
 * Describes a single editable field on a block's `data` object, driving an
 * auto-generated property panel in the visual editor (built in a later
 * phase). `key` addresses a top-level key of the block's data (or, inside a
 * `repeater`'s nested `fields`, a key of the repeater item's data).
 */
export type FieldConfig =
  | { kind: "text" | "textarea" | "number" | "boolean"; key: string; label: string; placeholder?: string }
  | { kind: "select"; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: "richtext"; key: string; label: string }
  | { kind: "image"; key: string; label: string }
  | { kind: "link"; key: string; label: string }
  | { kind: "stringList"; key: string; label: string }
  | { kind: "repeater"; key: string; label: string; itemLabel: string; fields: FieldConfig[] };

/**
 * Data-only definition of a block type: its Zod schema, defaults, and
 * property-panel field config. Deliberately has NO React dependency so it
 * can be imported from "use server" action files.
 *
 * NOTE: a later task adds a `BlockDef<S> extends BlockSchemaDef<S>` (with a
 * `Renderer: React.ComponentType<{ data: z.infer<S> }>` field) once each
 * block folder gets a `renderer.tsx` alongside its `schema.ts`. That type
 * intentionally is NOT declared here yet, to keep this file free of React
 * types for the data-only import chain (schemas.ts / sanitize.ts / server
 * actions).
 */
export interface BlockSchemaDef<S extends z.ZodTypeAny = z.ZodTypeAny> {
  type: string;
  label: string;
  icon: string; // lucide-react icon name as a string, e.g. "Layout", "Type", "Image"
  schema: S; // zod schema for the block's `data` field
  defaults: z.infer<S>; // inserted when a user adds this block from the palette
  fields: FieldConfig[]; // drives an auto-generated property panel (built in a later phase)
}

"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { FieldRenderer } from "@/components/editor/fields/FieldRenderer";
import { blockSchemaDefs, legacyTypeAliases, type Block, type BlockType } from "@/blocks";

function resolveDefKey(type: string): BlockType | undefined {
  if (type in blockSchemaDefs) return type as BlockType;
  return legacyTypeAliases[type];
}

interface InspectorProps {
  /** `null` = nothing selected — renders an empty-state message. */
  block: Block | null;
  /** Called with the block's FULL new `data` object (already merged). */
  onChange: (data: Record<string, unknown>) => void;
}

/**
 * Auto-generated property panel for the currently selected block, driven by
 * its `BlockSchemaDef.fields`. Field-level rendering is delegated to
 * `FieldRenderer` (a stub until Task 4.2 lands).
 */
export function Inspector({ block, onChange }: InspectorProps) {
  if (!block) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Select a block on the canvas to edit its properties.
      </div>
    );
  }

  const key = resolveDefKey(block.type);
  const def = key ? blockSchemaDefs[key] : undefined;

  if (!def) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Unknown block type &ldquo;{block.type}&rdquo;.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {def.label}
        </h3>
        <div className="space-y-4">
          {def.fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={block.data[field.key]}
              onChange={(value) => onChange({ ...block.data, [field.key]: value })}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

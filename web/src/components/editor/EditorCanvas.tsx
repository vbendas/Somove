"use client";

import { useMemo, type ComponentType } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { LayoutTemplate } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { blockSchemaDefs, legacyTypeAliases, type Block, type BlockType } from "@/blocks";
import { SortableBlock } from "./SortableBlock";

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

// Local mirror of web/src/components/blocks/BlockRenderer.tsx's rendererMap —
// that file doesn't export one, and the editor canvas needs to render each
// block individually (rather than the whole array at once) so each block can
// be wrapped in its own SortableBlock selection/drag UI.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockRendererMap: Record<BlockType, ComponentType<{ data: any }>> = {
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

interface EditorCanvasProps {
  blocks: Block[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (blocks: Block[]) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  viewportMode: "desktop" | "mobile";
}

export function EditorCanvas({
  blocks,
  selectedId,
  onSelect,
  onReorder,
  onDelete,
  onDuplicate,
  viewportMode,
}: EditorCanvasProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ids = useMemo(() => blocks.map((b) => b.id), [blocks]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(blocks, oldIndex, newIndex));
  }

  return (
    <div className="min-h-full bg-muted/30 p-4 sm:p-8">
      {/*
        Force light mode for the rendered preview itself: this frame mirrors
        what an anonymous site visitor sees on the published marketing page,
        which doesn't offer its own theme toggle, so it should render
        predictably in light mode regardless of the admin's current app
        theme. All block renderers style themselves purely through the
        bg-background/text-foreground/etc. token utilities (CSS var()
        references, no `dark:`-prefixed utilities), so this only needs to
        win the CSS-variable cascade, not out-fight a `.dark <selector>`
        rule: `.light` in globals.css redeclares every --background/
        --foreground/etc. variable, and since custom properties resolve from
        the *nearest* ancestor that sets them, this div's `.light` values
        take precedence over an outer `.dark` ancestor's for everything
        inside it. `colorScheme: "light"` additionally forces native form
        control/scrollbar chrome (checkboxes, date pickers) to light
        rendering.
      */}
      <div className="light" style={{ colorScheme: "light" }}>
        <div
          className={cn(
            "mx-auto",
            viewportMode === "mobile"
              ? "max-w-[390px] rounded-[2rem] border bg-background p-4 shadow-sm"
              : "max-w-3xl"
          )}
        >
          {blocks.length === 0 ? (
            <EmptyState
              icon={LayoutTemplate}
              title="No blocks yet"
              description="Use the Add block button to start building this page."
            />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {blocks.map((block) => {
                  const key = resolveDefKey(block.type);
                  const def = key ? blockSchemaDefs[key] : undefined;
                  const parsed = def?.schema.safeParse(block.data);
                  const Renderer = key ? blockRendererMap[key] : undefined;

                  return (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      isSelected={block.id === selectedId}
                      onSelect={() => onSelect(block.id)}
                      onDelete={() => onDelete(block.id)}
                      onDuplicate={() => onDuplicate(block.id)}
                    >
                      {Renderer && parsed?.success ? (
                        <Renderer data={parsed.data} />
                      ) : (
                        <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
                          Unknown block type &ldquo;{block.type}&rdquo;
                        </div>
                      )}
                    </SortableBlock>
                  );
                })}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { blockSchemaDefs, type Block } from "@/blocks";
import { EditorToolbar, type SaveState } from "./EditorToolbar";
import { BlockPalette } from "./BlockPalette";
import { EditorCanvas } from "./EditorCanvas";
import { Inspector } from "./Inspector";
import { RevisionsSheet } from "./RevisionsSheet";
import { PageMetaPanel } from "./PageMetaPanel";

export interface PageMeta {
  title: string;
  description?: string;
  seo_title?: string;
  seo_description?: string;
}

export interface PageEditorProps {
  initialBlocks: Block[];
  /** Present only for therapist pages; absent for site sections. */
  meta?: PageMeta;
  /** e.g. "Homepage — Hero" or a page title, shown in the toolbar. */
  contextLabel: string;
  /** Draft preview URL, opened in a new tab via the toolbar. */
  previewHref: string;
  saveDraft: (blocks: Block[], meta?: PageMeta) => Promise<{ success?: true; error?: string }>;
  publish: () => Promise<{ success?: true; error?: string }>;
  loadRevisions: () => Promise<Array<{ id: string; created_at: string; meta?: Record<string, unknown> }>>;
  restoreRevision: (id: string) => Promise<{ success?: true; error?: string }>;
}

interface EditorState {
  blocks: Block[];
  selectedId: string | null;
  meta: PageMeta | undefined;
  saveState: SaveState;
}

type EditorAction =
  | { type: "ADD_BLOCK"; blockType: string }
  | { type: "UPDATE_BLOCK_DATA"; id: string; data: Record<string, unknown> }
  | { type: "REORDER_BLOCKS"; blocks: Block[] }
  | { type: "DELETE_BLOCK"; id: string }
  | { type: "DUPLICATE_BLOCK"; id: string }
  | { type: "SELECT_BLOCK"; id: string | null }
  | { type: "UPDATE_META"; meta: Partial<PageMeta> }
  | { type: "SET_SAVE_STATE"; saveState: SaveState };

const AUTOSAVE_DELAY_MS = 1500;

function createBlock(type: string): Block | null {
  const def = (blockSchemaDefs as Record<string, { defaults: Record<string, unknown> } | undefined>)[type];
  if (!def) return null;
  return { id: crypto.randomUUID(), type, data: { ...def.defaults } };
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "ADD_BLOCK": {
      const block = createBlock(action.blockType);
      if (!block) return state;
      return { ...state, blocks: [...state.blocks, block], selectedId: block.id, saveState: "dirty" };
    }
    case "UPDATE_BLOCK_DATA": {
      return {
        ...state,
        blocks: state.blocks.map((b) => (b.id === action.id ? { ...b, data: { ...b.data, ...action.data } } : b)),
        saveState: "dirty",
      };
    }
    case "REORDER_BLOCKS": {
      return { ...state, blocks: action.blocks, saveState: "dirty" };
    }
    case "DELETE_BLOCK": {
      return {
        ...state,
        blocks: state.blocks.filter((b) => b.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
        saveState: "dirty",
      };
    }
    case "DUPLICATE_BLOCK": {
      const index = state.blocks.findIndex((b) => b.id === action.id);
      if (index === -1) return state;
      const source = state.blocks[index];
      const clone: Block = { id: crypto.randomUUID(), type: source.type, data: { ...source.data } };
      const blocks = [...state.blocks];
      blocks.splice(index + 1, 0, clone);
      return { ...state, blocks, selectedId: clone.id, saveState: "dirty" };
    }
    case "SELECT_BLOCK": {
      return { ...state, selectedId: action.id };
    }
    case "UPDATE_META": {
      return { ...state, meta: { ...(state.meta ?? { title: "" }), ...action.meta }, saveState: "dirty" };
    }
    case "SET_SAVE_STATE": {
      return { ...state, saveState: action.saveState };
    }
    default:
      return state;
  }
}

/**
 * Shell for the visual block editor: owns editor state (blocks, selection,
 * page meta, save status) via a single reducer, wires up debounced
 * autosave + explicit publish, and lays out the palette/canvas/inspector
 * responsively (fixed 3-column on desktop, Sheet overlays below `lg`).
 */
export function PageEditor({
  initialBlocks,
  meta: initialMeta,
  contextLabel,
  previewHref,
  saveDraft,
  publish,
  loadRevisions,
  restoreRevision,
}: PageEditorProps) {
  const [state, dispatch] = useReducer(editorReducer, {
    blocks: initialBlocks,
    selectedId: null,
    meta: initialMeta,
    saveState: "saved" as SaveState,
  });

  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">("desktop");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);

  const isFirstRun = useRef(true);

  // Debounced autosave — fires whenever `blocks`/`meta` identity changes,
  // which only happens via the reducer's content-mutating actions (ADD/
  // UPDATE/REORDER/DELETE/DUPLICATE_BLOCK, UPDATE_META), never from
  // SELECT_BLOCK or SET_SAVE_STATE alone.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      dispatch({ type: "SET_SAVE_STATE", saveState: "saving" });
      try {
        const result = await saveDraft(state.blocks, state.meta);
        if (result?.error) {
          dispatch({ type: "SET_SAVE_STATE", saveState: "error" });
          toast.error(result.error);
        } else {
          dispatch({ type: "SET_SAVE_STATE", saveState: "saved" });
        }
      } catch {
        dispatch({ type: "SET_SAVE_STATE", saveState: "error" });
        toast.error("Failed to save draft");
      }
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.blocks, state.meta]);

  // Warn on navigation away while there's an unsaved (or not-yet-saved) edit.
  useEffect(() => {
    if (state.saveState !== "dirty") return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.saveState]);

  const selectedBlock = state.blocks.find((b) => b.id === state.selectedId) ?? null;

  function handleSelect(id: string) {
    dispatch({ type: "SELECT_BLOCK", id });
    setInspectorOpen(true);
  }

  function handleAddBlock(type: string) {
    dispatch({ type: "ADD_BLOCK", blockType: type });
    setPaletteOpen(false);
    setInspectorOpen(true);
  }

  function handleInspectorChange(data: Record<string, unknown>) {
    if (!selectedBlock) return;
    dispatch({ type: "UPDATE_BLOCK_DATA", id: selectedBlock.id, data });
  }

  async function handlePublish() {
    const result = await publish();
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Published");
    }
  }

  // Publishing the draft to `page_revisions` happens server-side inside
  // `restoreRevision`; it lands in `draft_content`, not local editor state.
  // Re-syncing the open editor's in-memory blocks with the restored draft is
  // out of scope here — it's wired up by the page that composes
  // `PageEditor` (Task 4.4).
  async function handleRestore(id: string) {
    const result = await restoreRevision(id);
    if (result?.error) throw new Error(result.error);
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      {state.meta && (
        <PageMetaPanel meta={state.meta} onChange={(meta) => dispatch({ type: "UPDATE_META", meta })} />
      )}

      <EditorToolbar
        contextLabel={contextLabel}
        saveState={state.saveState}
        previewHref={previewHref}
        viewportMode={viewportMode}
        onViewportModeChange={setViewportMode}
        onPublish={handlePublish}
        onOpenRevisions={() => setRevisionsOpen(true)}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenInspector={selectedBlock ? () => setInspectorOpen(true) : undefined}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[220px] shrink-0 border-r lg:block">
          <BlockPalette onAddBlock={handleAddBlock} />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <EditorCanvas
            blocks={state.blocks}
            selectedId={state.selectedId}
            onSelect={handleSelect}
            onReorder={(blocks) => dispatch({ type: "REORDER_BLOCKS", blocks })}
            onDelete={(id) => dispatch({ type: "DELETE_BLOCK", id })}
            onDuplicate={(id) => dispatch({ type: "DUPLICATE_BLOCK", id })}
            viewportMode={viewportMode}
          />
        </main>

        <aside className="hidden w-[320px] shrink-0 border-l lg:block">
          <Inspector block={selectedBlock} onChange={handleInspectorChange} />
        </aside>
      </div>

      {/* Mobile: block palette as a Sheet overlay */}
      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent side="left" className="flex w-[280px] flex-col p-0 sm:max-w-xs">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle>Add block</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1">
            <BlockPalette onAddBlock={handleAddBlock} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile: inspector as a Sheet overlay, auto-opened on block select */}
      <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <SheetContent side="right" className="flex w-[320px] flex-col p-0 sm:max-w-sm">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle>{selectedBlock ? "Block properties" : "Properties"}</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1">
            <Inspector block={selectedBlock} onChange={handleInspectorChange} />
          </div>
        </SheetContent>
      </Sheet>

      <RevisionsSheet
        open={revisionsOpen}
        onOpenChange={setRevisionsOpen}
        loadRevisions={loadRevisions}
        onRestore={handleRestore}
      />
    </div>
  );
}

"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EditorToolbar, type SaveState } from "@/components/editor/EditorToolbar";
import { RevisionsSheet } from "@/components/editor/RevisionsSheet";
import { MarketingNavPreview } from "@/components/marketing/marketing-nav-preview";
import { MenuLink } from "@/components/marketing/menu-link";
import { MenuTree } from "./MenuTree";
import { MenuItemInspector } from "./MenuItemInspector";
import { menuEditorReducer, type MenuEditorState, type MenuEditorAction } from "./reducer";
import type { MenuChildItem, MenuItem } from "@/lib/menus/schema";
import type { AnchorOption } from "@/lib/menus/anchors";
import { cn } from "@/lib/utils";

export interface MenuEditorProps {
  initialItems: MenuItem[];
  contextLabel: string;
  previewHref: string;
  /** "header" gets the real nav preview; "footer" gets a single footer-column preview. */
  variant: "header" | "footer";
  anchorOptions: AnchorOption[];
  saveDraft: (items: MenuItem[]) => Promise<{ success?: true; error?: string }>;
  publish: () => Promise<{ success?: true; error?: string }>;
  loadRevisions: () => Promise<Array<{ id: string; created_at: string; meta?: Record<string, unknown> }>>;
  restoreRevision: (id: string) => Promise<{ success?: true; error?: string }>;
}

const AUTOSAVE_DELAY_MS = 1500;

function findItem(items: MenuItem[], id: string | null): MenuItem | MenuChildItem | null {
  if (!id) return null;
  for (const item of items) {
    if (item.id === id) return item;
    const child = item.children.find((c) => c.id === id);
    if (child) return child;
  }
  return null;
}

/**
 * Shell for the visual menu tree editor. Mirrors
 * src/components/editor/PageEditor.tsx's structure (reducer, debounced
 * autosave, beforeunload guard, EditorToolbar/RevisionsSheet reuse) but
 * with a two-pane layout (no block palette) and a live preview pane above
 * the tree canvas instead of an inline-rendered canvas.
 */
export function MenuEditor({
  initialItems,
  contextLabel,
  previewHref,
  variant,
  anchorOptions,
  saveDraft,
  publish,
  loadRevisions,
  restoreRevision,
}: MenuEditorProps) {
  const [state, dispatch] = useReducer(menuEditorReducer, {
    items: initialItems,
    selectedId: null,
    saveState: "saved" as SaveState,
  } satisfies MenuEditorState);

  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">("desktop");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);

  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      dispatch({ type: "SET_SAVE_STATE", saveState: "saving" });
      try {
        const result = await saveDraft(state.items);
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
  }, [state.items]);

  useEffect(() => {
    if (state.saveState !== "dirty") return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.saveState]);

  const selectedItem = findItem(state.items, state.selectedId);

  function handleSelect(id: string) {
    dispatch({ type: "SELECT_ITEM", id });
    setInspectorOpen(true);
  }

  /** ADD_ITEM/DUPLICATE_ITEM select the new/cloned item in the reducer — open the inspector to match (mirrors PageEditor's handleAddBlock). */
  function dispatchAndOpenInspector(action: MenuEditorAction) {
    dispatch(action);
    setInspectorOpen(true);
  }

  function handleInspectorChange(patch: Partial<Omit<MenuChildItem, "id">>) {
    if (!selectedItem) return;
    dispatch({ type: "UPDATE_ITEM", id: selectedItem.id, patch });
  }

  async function handlePublish() {
    const result = await publish();
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Published");
    }
  }

  async function handleRestore(id: string) {
    const result = await restoreRevision(id);
    if (result?.error) throw new Error(result.error);
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      <EditorToolbar
        contextLabel={contextLabel}
        saveState={state.saveState}
        previewHref={previewHref}
        viewportMode={viewportMode}
        onViewportModeChange={setViewportMode}
        onPublish={handlePublish}
        onOpenRevisions={() => setRevisionsOpen(true)}
        onOpenInspector={selectedItem ? () => setInspectorOpen(true) : undefined}
      />

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-8">
          <div className="light mx-auto max-w-3xl space-y-6" style={{ colorScheme: "light" }}>
            <div className={cn("mx-auto rounded-md border bg-background", viewportMode === "mobile" && "max-w-[390px]")}>
              {variant === "header" ? (
                <div className="flex h-16 items-center justify-center border-b px-4">
                  <MarketingNavPreview items={state.items} />
                </div>
              ) : (
                <div className="max-w-xs p-6">
                  <ul className="space-y-2.5">
                    {state.items.map((item) => (
                      <li key={item.id}>
                        <MenuLink item={item} className="text-sm text-warm-gray hover:text-foreground" />
                        {item.children.length > 0 && (
                          <ul className="mt-2 space-y-2 pl-3">
                            {item.children.map((child) => (
                              <li key={child.id}>
                                <MenuLink item={child} className="text-xs text-warm-gray hover:text-foreground" />
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <MenuTree
              items={state.items}
              selectedId={state.selectedId}
              onSelect={handleSelect}
              onReorderTopLevel={(items) => dispatch({ type: "REORDER_TOP_LEVEL", items })}
              onReorderChildren={(parentId, children) => dispatch({ type: "REORDER_CHILDREN", parentId, children })}
              onIndent={(id) => dispatch({ type: "INDENT", id })}
              onOutdent={(id) => dispatch({ type: "OUTDENT", id })}
              onDelete={(id) => dispatch({ type: "DELETE_ITEM", id })}
              onDuplicate={(id) => dispatchAndOpenInspector({ type: "DUPLICATE_ITEM", id })}
              onAddItem={(parentId) => dispatchAndOpenInspector({ type: "ADD_ITEM", parentId })}
            />
          </div>
        </main>

        <aside className="hidden w-[320px] shrink-0 border-l lg:block">
          <MenuItemInspector item={selectedItem} anchorOptions={anchorOptions} onChange={handleInspectorChange} />
        </aside>
      </div>

      <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <SheetContent side="right" className="flex w-[320px] flex-col p-0 sm:max-w-sm">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle>{selectedItem ? "Menu item properties" : "Properties"}</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1">
            <MenuItemInspector item={selectedItem} anchorOptions={anchorOptions} onChange={handleInspectorChange} />
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

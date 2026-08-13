"use client";

import { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ListTree, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SortableMenuItemRow } from "./SortableMenuItemRow";
import type { MenuItem } from "@/lib/menus/schema";

interface MenuTreeProps {
  items: MenuItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorderTopLevel: (items: MenuItem[]) => void;
  onReorderChildren: (parentId: string, children: MenuItem["children"]) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddItem: (parentId: string | null) => void;
}

/**
 * Top-level items live in one DndContext/SortableContext (mirrors
 * src/components/editor/EditorCanvas.tsx); each parent's children live in
 * their OWN nested DndContext/SortableContext, so drags never cross levels
 * — matches the plan's decision to use explicit indent/outdent buttons for
 * moving items between levels instead of cross-level drag.
 */
export function MenuTree({
  items,
  selectedId,
  onSelect,
  onReorderTopLevel,
  onReorderChildren,
  onIndent,
  onOutdent,
  onDelete,
  onDuplicate,
  onAddItem,
}: MenuTreeProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const topLevelIds = useMemo(() => items.map((item) => item.id), [items]);

  function handleTopLevelDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorderTopLevel(arrayMove(items, oldIndex, newIndex));
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ListTree}
        title="No items yet"
        description="Add your first menu item to start building this menu."
        action={{ label: "Add item", onClick: () => onAddItem(null) }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTopLevelDragEnd}>
        <SortableContext items={topLevelIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="space-y-2">
                <SortableMenuItemRow
                  item={item}
                  isSelected={item.id === selectedId}
                  onSelect={() => onSelect(item.id)}
                  onDelete={() => onDelete(item.id)}
                  onDuplicate={() => onDuplicate(item.id)}
                  onIndent={() => onIndent(item.id)}
                  indentDisabled={index === 0 || item.children.length > 0}
                />

                <ChildList
                  parentId={item.id}
                  items={item.children}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onReorderChildren={onReorderChildren}
                  onOutdent={onOutdent}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                />

                <div className="pl-8">
                  <Button type="button" variant="ghost" size="sm" onClick={() => onAddItem(item.id)}>
                    <Plus className="h-3.5 w-3.5" />
                    Add sub-item
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button type="button" variant="outline" size="sm" onClick={() => onAddItem(null)}>
        <Plus className="h-4 w-4" />
        Add item
      </Button>
    </div>
  );
}

interface ChildListProps {
  parentId: string;
  items: MenuItem["children"];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorderChildren: (parentId: string, children: MenuItem["children"]) => void;
  onOutdent: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

function ChildList({
  parentId,
  items,
  selectedId,
  onSelect,
  onReorderChildren,
  onOutdent,
  onDelete,
  onDuplicate,
}: ChildListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const childIds = useMemo(() => items.map((child) => child.id), [items]);

  if (items.length === 0) return null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((child) => child.id === active.id);
    const newIndex = items.findIndex((child) => child.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorderChildren(parentId, arrayMove(items, oldIndex, newIndex));
  }

  return (
    <div className="space-y-2 border-l-2 border-border pl-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
          {items.map((child) => (
            <SortableMenuItemRow
              key={child.id}
              item={child}
              isSelected={child.id === selectedId}
              onSelect={() => onSelect(child.id)}
              onDelete={() => onDelete(child.id)}
              onDuplicate={() => onDuplicate(child.id)}
              onOutdent={() => onOutdent(child.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

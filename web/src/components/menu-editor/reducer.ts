import type { MenuChildItem, MenuItem } from "@/lib/menus/schema";
import type { SaveState } from "@/components/editor/EditorToolbar";

export interface MenuEditorState {
  items: MenuItem[];
  selectedId: string | null;
  saveState: SaveState;
}

export type MenuEditorAction =
  | { type: "ADD_ITEM"; parentId: string | null }
  | { type: "UPDATE_ITEM"; id: string; patch: Partial<Omit<MenuChildItem, "id">> }
  | { type: "REORDER_TOP_LEVEL"; items: MenuItem[] }
  | { type: "REORDER_CHILDREN"; parentId: string; children: MenuChildItem[] }
  | { type: "INDENT"; id: string }
  | { type: "OUTDENT"; id: string }
  | { type: "DELETE_ITEM"; id: string }
  | { type: "DUPLICATE_ITEM"; id: string }
  | { type: "SELECT_ITEM"; id: string | null }
  | { type: "SET_SAVE_STATE"; saveState: SaveState };

const MAX_CHILDREN = 12;

function createChildItem(): MenuChildItem {
  return { id: crypto.randomUUID(), label: "New item", kind: "internal", href: "/", style: "link", newTab: false };
}

function createTopLevelItem(): MenuItem {
  return { ...createChildItem(), children: [] };
}

/**
 * Pure state machine for the menu tree editor. Depth is capped at two
 * levels (top-level items + one level of children), mirroring
 * src/lib/menus/schema.ts: INDENT refuses to move a top-level item that
 * itself has children (that would create grandchildren), and only
 * top-level items can be indented at all (a child can't be re-indented —
 * OUTDENT is the only way to move a child, and it always lands at the top
 * level).
 */
export function menuEditorReducer(state: MenuEditorState, action: MenuEditorAction): MenuEditorState {
  switch (action.type) {
    case "ADD_ITEM": {
      if (action.parentId === null) {
        const item = createTopLevelItem();
        return { ...state, items: [...state.items, item], selectedId: item.id, saveState: "dirty" };
      }
      const parent = state.items.find((item) => item.id === action.parentId);
      if (!parent || parent.children.length >= MAX_CHILDREN) return state;

      const child = createChildItem();
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.parentId ? { ...item, children: [...item.children, child] } : item
        ),
        selectedId: child.id,
        saveState: "dirty",
      };
    }

    case "UPDATE_ITEM": {
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id === action.id) return { ...item, ...action.patch };
          if (item.children.some((child) => child.id === action.id)) {
            return {
              ...item,
              children: item.children.map((child) => (child.id === action.id ? { ...child, ...action.patch } : child)),
            };
          }
          return item;
        }),
        saveState: "dirty",
      };
    }

    case "REORDER_TOP_LEVEL": {
      return { ...state, items: action.items, saveState: "dirty" };
    }

    case "REORDER_CHILDREN": {
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.parentId ? { ...item, children: action.children } : item
        ),
        saveState: "dirty",
      };
    }

    case "INDENT": {
      const index = state.items.findIndex((item) => item.id === action.id);
      if (index <= 0) return state; // not a top-level item, or no previous sibling
      const item = state.items[index];
      if (item.children.length > 0) return state; // would create grandchildren

      const prevSibling = state.items[index - 1];
      if (prevSibling.children.length >= MAX_CHILDREN) return state;

      const { children: _discarded, ...childItem } = item;
      void _discarded;
      const items = state.items
        .filter((i) => i.id !== action.id)
        .map((i) => (i.id === prevSibling.id ? { ...i, children: [...i.children, childItem] } : i));
      return { ...state, items, saveState: "dirty" };
    }

    case "OUTDENT": {
      const parentIndex = state.items.findIndex((item) => item.children.some((child) => child.id === action.id));
      if (parentIndex === -1) return state; // not a child item

      const parent = state.items[parentIndex];
      const child = parent.children.find((c) => c.id === action.id) as MenuChildItem;
      const newParent = { ...parent, children: parent.children.filter((c) => c.id !== action.id) };
      const promoted: MenuItem = { ...child, children: [] };

      const items = [...state.items];
      items[parentIndex] = newParent;
      items.splice(parentIndex + 1, 0, promoted);
      return { ...state, items, saveState: "dirty" };
    }

    case "DELETE_ITEM": {
      const items = state.items
        .filter((item) => item.id !== action.id)
        .map((item) => ({ ...item, children: item.children.filter((child) => child.id !== action.id) }));
      return {
        ...state,
        items,
        selectedId: state.selectedId === action.id ? null : state.selectedId,
        saveState: "dirty",
      };
    }

    case "DUPLICATE_ITEM": {
      const topIndex = state.items.findIndex((item) => item.id === action.id);
      if (topIndex !== -1) {
        const source = state.items[topIndex];
        const clone: MenuItem = {
          ...source,
          id: crypto.randomUUID(),
          children: source.children.map((child) => ({ ...child, id: crypto.randomUUID() })),
        };
        const items = [...state.items];
        items.splice(topIndex + 1, 0, clone);
        return { ...state, items, selectedId: clone.id, saveState: "dirty" };
      }

      const parentIndex = state.items.findIndex((item) => item.children.some((child) => child.id === action.id));
      if (parentIndex === -1) return state;

      const parent = state.items[parentIndex];
      const childIndex = parent.children.findIndex((child) => child.id === action.id);
      const clone: MenuChildItem = { ...parent.children[childIndex], id: crypto.randomUUID() };
      const children = [...parent.children];
      children.splice(childIndex + 1, 0, clone);

      const items = [...state.items];
      items[parentIndex] = { ...parent, children };
      return { ...state, items, selectedId: clone.id, saveState: "dirty" };
    }

    case "SELECT_ITEM": {
      return { ...state, selectedId: action.id };
    }

    case "SET_SAVE_STATE": {
      return { ...state, saveState: action.saveState };
    }

    default:
      return state;
  }
}

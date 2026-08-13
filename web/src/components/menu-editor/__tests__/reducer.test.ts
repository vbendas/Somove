import { describe, it, expect } from "vitest";
import { menuEditorReducer, type MenuEditorState } from "@/components/menu-editor/reducer";
import type { MenuItem } from "@/lib/menus/schema";

function topItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: overrides.id ?? "item",
    label: "Item",
    kind: "internal",
    href: "/",
    style: "link",
    newTab: false,
    children: [],
    ...overrides,
  };
}

function baseState(items: MenuItem[]): MenuEditorState {
  return { items, selectedId: null, saveState: "saved" };
}

describe("menuEditorReducer — INDENT", () => {
  it("moves a top-level item under its previous sibling", () => {
    const state = baseState([topItem({ id: "a", label: "A" }), topItem({ id: "b", label: "B" })]);

    const next = menuEditorReducer(state, { type: "INDENT", id: "b" });

    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).toBe("a");
    expect(next.items[0].children).toHaveLength(1);
    expect(next.items[0].children[0].id).toBe("b");
    expect(next.saveState).toBe("dirty");
  });

  it("refuses to indent the first item (no previous sibling)", () => {
    const state = baseState([topItem({ id: "a" }), topItem({ id: "b" })]);
    const next = menuEditorReducer(state, { type: "INDENT", id: "a" });
    expect(next).toBe(state);
  });

  it("refuses to indent an item that itself has children (would create grandchildren)", () => {
    const state = baseState([
      topItem({ id: "a" }),
      topItem({ id: "b", children: [{ id: "b1", label: "B1", kind: "internal", href: "/b1", style: "link", newTab: false }] }),
    ]);
    const next = menuEditorReducer(state, { type: "INDENT", id: "b" });
    expect(next).toBe(state);
  });

  it("refuses to indent a child item (only top-level items can be indented)", () => {
    const state = baseState([
      topItem({ id: "a", children: [{ id: "a1", label: "A1", kind: "internal", href: "/a1", style: "link", newTab: false }] }),
      topItem({ id: "b" }),
    ]);
    const next = menuEditorReducer(state, { type: "INDENT", id: "a1" });
    expect(next).toBe(state);
  });
});

describe("menuEditorReducer — OUTDENT", () => {
  it("promotes a child to a top-level item inserted right after its parent", () => {
    const state = baseState([
      topItem({
        id: "parent",
        children: [
          { id: "child-1", label: "Child 1", kind: "internal", href: "/c1", style: "link", newTab: false },
          { id: "child-2", label: "Child 2", kind: "internal", href: "/c2", style: "link", newTab: false },
        ],
      }),
      topItem({ id: "after" }),
    ]);

    const next = menuEditorReducer(state, { type: "OUTDENT", id: "child-1" });

    expect(next.items.map((i) => i.id)).toEqual(["parent", "child-1", "after"]);
    expect(next.items[0].children.map((c) => c.id)).toEqual(["child-2"]);
    expect(next.items[1].children).toEqual([]);
  });

  it("is a no-op for a top-level item id", () => {
    const state = baseState([topItem({ id: "a" })]);
    const next = menuEditorReducer(state, { type: "OUTDENT", id: "a" });
    expect(next).toBe(state);
  });
});

describe("menuEditorReducer — reorder", () => {
  it("REORDER_TOP_LEVEL replaces the top-level order without touching any children", () => {
    const state = baseState([
      topItem({ id: "a", children: [{ id: "a1", label: "A1", kind: "internal", href: "/a1", style: "link", newTab: false }] }),
      topItem({ id: "b" }),
    ]);
    const reordered = [state.items[1], state.items[0]];
    const next = menuEditorReducer(state, { type: "REORDER_TOP_LEVEL", items: reordered });
    expect(next.items.map((i) => i.id)).toEqual(["b", "a"]);
    expect(next.items[1].children.map((c) => c.id)).toEqual(["a1"]);
  });

  it("REORDER_CHILDREN replaces one parent's children while leaving other top-level items untouched", () => {
    const state = baseState([
      topItem({
        id: "a",
        children: [
          { id: "a1", label: "A1", kind: "internal", href: "/a1", style: "link", newTab: false },
          { id: "a2", label: "A2", kind: "internal", href: "/a2", style: "link", newTab: false },
        ],
      }),
      topItem({ id: "b" }),
    ]);
    const reorderedChildren = [state.items[0].children[1], state.items[0].children[0]];
    const next = menuEditorReducer(state, { type: "REORDER_CHILDREN", parentId: "a", children: reorderedChildren });

    expect(next.items[0].children.map((c) => c.id)).toEqual(["a2", "a1"]);
    expect(next.items[1]).toEqual(state.items[1]);
  });
});

describe("menuEditorReducer — DELETE_ITEM", () => {
  it("deleting a parent removes it along with its children", () => {
    const state = baseState([
      topItem({
        id: "parent",
        children: [{ id: "child-1", label: "Child 1", kind: "internal", href: "/c1", style: "link", newTab: false }],
      }),
      topItem({ id: "other" }),
    ]);
    const next = menuEditorReducer(state, { type: "DELETE_ITEM", id: "parent" });
    expect(next.items.map((i) => i.id)).toEqual(["other"]);
  });

  it("clears selectedId when the deleted item was selected", () => {
    const state: MenuEditorState = { ...baseState([topItem({ id: "a" })]), selectedId: "a" };
    const next = menuEditorReducer(state, { type: "DELETE_ITEM", id: "a" });
    expect(next.selectedId).toBeNull();
  });
});

describe("menuEditorReducer — DUPLICATE_ITEM", () => {
  it("deep-clones a top-level item with fresh ids for itself and its children", () => {
    const state = baseState([
      topItem({
        id: "a",
        label: "A",
        children: [{ id: "a1", label: "A1", kind: "internal", href: "/a1", style: "link", newTab: false }],
      }),
    ]);
    const next = menuEditorReducer(state, { type: "DUPLICATE_ITEM", id: "a" });

    expect(next.items).toHaveLength(2);
    const clone = next.items[1];
    expect(clone.id).not.toBe("a");
    expect(clone.label).toBe("A");
    expect(clone.children).toHaveLength(1);
    expect(clone.children[0].id).not.toBe("a1");
    expect(clone.children[0].label).toBe("A1");
    expect(next.selectedId).toBe(clone.id);
  });

  it("duplicates a child item within its parent with a fresh id", () => {
    const state = baseState([
      topItem({
        id: "parent",
        children: [{ id: "child-1", label: "Child 1", kind: "internal", href: "/c1", style: "link", newTab: false }],
      }),
    ]);
    const next = menuEditorReducer(state, { type: "DUPLICATE_ITEM", id: "child-1" });
    expect(next.items[0].children).toHaveLength(2);
    expect(next.items[0].children[1].id).not.toBe("child-1");
    expect(next.items[0].children[1].label).toBe("Child 1");
  });
});

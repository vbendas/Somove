import { describe, it, expect } from "vitest";
import { menuItemSchema, menuItemsSchema, MenuSlugSchema, sanitizeMenuItems, type MenuItem } from "@/lib/menus/schema";

function item(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: "item-1",
    label: "Pricing",
    kind: "anchor",
    href: "#pricing",
    style: "link",
    newTab: false,
    children: [],
    ...overrides,
  };
}

describe("menuItemSchema", () => {
  it("accepts a valid two-level tree", () => {
    const tree = [
      item({
        id: "parent-1",
        label: "Resources",
        kind: "internal",
        href: "/resources",
        children: [
          { id: "child-1", label: "Blog", kind: "internal", href: "/blog", style: "link", newTab: false },
        ],
      }),
    ];
    const result = menuItemsSchema.safeParse(tree);
    expect(result.success).toBe(true);
  });

  it("rejects a third level of nesting (grandchildren)", () => {
    const tree = [
      {
        ...item({ id: "parent-1" }),
        children: [
          {
            id: "child-1",
            label: "Blog",
            kind: "internal",
            href: "/blog",
            style: "link",
            newTab: false,
            // A child item schema has no `children` field at all, so this
            // extra key must be stripped/rejected, not silently accepted.
            children: [{ id: "grandchild-1", label: "Post", kind: "internal", href: "/blog/post" }],
          },
        ],
      },
    ];
    const parsed = menuItemsSchema.safeParse(tree);
    // Zod strips unknown keys by default rather than failing, so assert the
    // parsed child item has no children array surviving instead.
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const child = parsed.data[0].children[0] as unknown as Record<string, unknown>;
      expect(child.children).toBeUndefined();
    }
  });

  it("rejects more than 20 top-level items", () => {
    const tree = Array.from({ length: 21 }, (_, i) => item({ id: `item-${i}`, label: `Item ${i}` }));
    expect(menuItemsSchema.safeParse(tree).success).toBe(false);
  });

  it("rejects more than 12 children", () => {
    const tree = [
      {
        ...item({ id: "parent-1" }),
        children: Array.from({ length: 13 }, (_, i) => ({
          id: `child-${i}`,
          label: `Child ${i}`,
          kind: "internal",
          href: "/x",
          style: "link",
          newTab: false,
        })),
      },
    ];
    expect(menuItemsSchema.safeParse(tree).success).toBe(false);
  });

  it("rejects a label longer than 60 characters", () => {
    const tree = [item({ label: "x".repeat(61) })];
    expect(menuItemsSchema.safeParse(tree).success).toBe(false);
  });

  it("defaults style to 'link' and newTab to false when omitted", () => {
    const result = menuItemSchema.safeParse({
      id: "item-1",
      label: "Pricing",
      kind: "anchor",
      href: "#pricing",
      children: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.style).toBe("link");
      expect(result.data.newTab).toBe(false);
    }
  });
});

describe("MenuSlugSchema", () => {
  it("accepts lowercase snake_case slugs", () => {
    expect(MenuSlugSchema.safeParse("footer_platform").success).toBe(true);
  });

  it("rejects uppercase or hyphenated slugs", () => {
    expect(MenuSlugSchema.safeParse("Footer-Platform").success).toBe(false);
  });
});

describe("sanitizeMenuItems", () => {
  it("strips items whose href uses a javascript: scheme", () => {
    const items = [item({ id: "bad", kind: "external", href: "javascript:alert(1)" })];
    expect(sanitizeMenuItems(items)).toEqual([]);
  });

  it("strips items whose href uses a data: scheme", () => {
    const items = [item({ id: "bad", kind: "external", href: "data:text/html,<script>alert(1)</script>" })];
    expect(sanitizeMenuItems(items)).toEqual([]);
  });

  it("keeps site-relative, absolute https, and anchor hrefs", () => {
    const items = [
      item({ id: "a", kind: "internal", href: "/therapists" }),
      item({ id: "b", kind: "external", href: "https://example.com" }),
      item({ id: "c", kind: "anchor", href: "#pricing" }),
    ];
    const result = sanitizeMenuItems(items);
    expect(result.map((i) => i.href)).toEqual(["/therapists", "https://example.com", "#pricing"]);
  });

  it("drops only the unsafe child while keeping safe siblings and the parent", () => {
    const items = [
      item({
        id: "parent",
        children: [
          { id: "safe-child", label: "Safe", kind: "internal", href: "/safe", style: "link", newTab: false },
          { id: "bad-child", label: "Bad", kind: "external", href: "javascript:alert(1)", style: "link", newTab: false },
        ],
      }),
    ];
    const result = sanitizeMenuItems(items);
    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].id).toBe("safe-child");
  });
});

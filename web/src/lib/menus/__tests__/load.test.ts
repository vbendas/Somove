import { describe, it, expect } from "vitest";
import { loadPublishedMenus, loadDraftMenus } from "@/lib/menus/load";

function menuItem(overrides: Partial<Record<string, unknown>> = {}) {
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

function fakeSupabase(response: { data: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = () => chain;
  chain.eq = () => chain;
  chain.order = () => Promise.resolve(response);
  return { from: () => chain } as unknown as Parameters<typeof loadPublishedMenus>[0];
}

function fakeSupabaseThatThrows() {
  return {
    from: () => {
      throw new Error("network error");
    },
  } as unknown as Parameters<typeof loadPublishedMenus>[0];
}

describe("loadPublishedMenus", () => {
  it("returns fallback header + footer content when the fetch throws", async () => {
    const result = await loadPublishedMenus(fakeSupabaseThatThrows());
    expect(result.headerItems.length).toBeGreaterThan(0);
    expect(result.footerMenus.length).toBeGreaterThan(0);
  });

  it("returns fallback content when no rows are published", async () => {
    const result = await loadPublishedMenus(fakeSupabase({ data: [] }));
    expect(result.headerItems.map((i) => i.href)).toContain("#how-it-works");
    expect(result.footerMenus.map((m) => m.title)).toContain("Platform");
  });

  it("returns fallback header when the header row's items fail schema validation", async () => {
    const result = await loadPublishedMenus(
      fakeSupabase({
        data: [{ slug: "header", title: "Header", items: [{ invalid: true }], sort_order: 0 }],
      })
    );
    expect(result.headerItems.map((i) => i.href)).toContain("#how-it-works");
  });

  it("parses valid published rows into header items and footer menus", async () => {
    const result = await loadPublishedMenus(
      fakeSupabase({
        data: [
          { slug: "header", title: "Header", items: [menuItem({ id: "h1", label: "Pricing" })], sort_order: 0 },
          {
            slug: "footer_platform",
            title: "Platform",
            items: [menuItem({ id: "f1", label: "Therapists", kind: "internal", href: "/therapists" })],
            sort_order: 0,
          },
        ],
      })
    );
    expect(result.headerItems).toHaveLength(1);
    expect(result.headerItems[0].label).toBe("Pricing");
    expect(result.footerMenus).toEqual([
      { title: "Platform", items: [expect.objectContaining({ label: "Therapists" })] },
    ]);
  });
});

describe("loadDraftMenus", () => {
  it("returns empty arrays (no fallback) when draft rows are empty", () => {
    const result = loadDraftMenus([]);
    expect(result).toEqual({ headerItems: [], footerMenus: [] });
  });

  it("parses draft_items from the given rows without falling back to defaults", () => {
    const result = loadDraftMenus([
      { slug: "header", title: "Header", draft_items: [menuItem({ id: "d1", label: "Draft Item" })] },
    ]);
    expect(result.headerItems).toHaveLength(1);
    expect(result.headerItems[0].label).toBe("Draft Item");
    expect(result.footerMenus).toEqual([]);
  });
});

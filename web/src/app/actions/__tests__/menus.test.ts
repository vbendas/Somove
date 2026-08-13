/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  saveMenuDraft,
  publishMenuDraft,
  createSiteMenu,
  deleteSiteMenu,
} from "@/app/actions/menus";
import { createClient } from "@/lib/supabase/server";

/** A minimal fluent Supabase query-builder mock. Every method returns the
 * chain itself so calls compose in any order; the chain is also "thenable"
 * so `await`-ing it directly (without a trailing `.single()`) resolves to
 * `config.result`. `.single()` and `.insert()` resolve independently via
 * `config.single` / `config.result`. */
function makeChain(config: { single?: unknown; result?: unknown } = {}) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.insert = vi.fn(() => Promise.resolve(config.result ?? { error: null }));
  chain.single = vi.fn(() => Promise.resolve(config.single ?? { data: null }));
  chain.then = (resolve: (v: unknown) => void) => resolve(config.result ?? { data: null, error: null });
  return chain;
}

function mockSupabase(opts: {
  authenticated?: boolean;
  role?: string | null;
  chains?: Record<string, ReturnType<typeof makeChain>>;
} = {}) {
  const { authenticated = true, role = "admin", chains = {} } = opts;
  const usersChain = makeChain({ single: { data: role === null ? null : { role } } });

  const from = vi.fn((table: string) => {
    if (table === "users") return usersChain;
    return chains[table] ?? makeChain();
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(
        authenticated ? { data: { user: { id: "admin-1" } } } : { data: { user: null } }
      ),
    },
    from,
  };
}

describe("menu server actions — auth guards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saveMenuDraft rejects unauthenticated callers", async () => {
    const supabase = mockSupabase({ authenticated: false });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await saveMenuDraft("header", []);
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("saveMenuDraft rejects non-admin callers", async () => {
    const supabase = mockSupabase({ role: "therapist" });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await saveMenuDraft("header", []);
    expect(result).toEqual({ error: "Admin only" });
  });

  it("publishMenuDraft rejects unauthenticated callers", async () => {
    const supabase = mockSupabase({ authenticated: false });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await publishMenuDraft("header");
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("publishMenuDraft rejects non-admin callers", async () => {
    const supabase = mockSupabase({ role: "client" });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await publishMenuDraft("header");
    expect(result).toEqual({ error: "Admin only" });
  });

  it("createSiteMenu rejects unauthenticated callers", async () => {
    const supabase = mockSupabase({ authenticated: false });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await createSiteMenu("footer_extra", "Extra");
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("createSiteMenu rejects non-admin callers", async () => {
    const supabase = mockSupabase({ role: "therapist" });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await createSiteMenu("footer_extra", "Extra");
    expect(result).toEqual({ error: "Admin only" });
  });

  it("deleteSiteMenu rejects unauthenticated callers", async () => {
    const supabase = mockSupabase({ authenticated: false });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await deleteSiteMenu("footer_extra");
    expect(result).toEqual({ error: "Not authenticated" });
  });

  it("deleteSiteMenu rejects non-admin callers", async () => {
    const supabase = mockSupabase({ role: "client" });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await deleteSiteMenu("footer_extra");
    expect(result).toEqual({ error: "Admin only" });
  });
});

describe("saveMenuDraft", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an invalid slug without touching the database", async () => {
    const siteMenusChain = makeChain();
    const supabase = mockSupabase({ chains: { site_menus: siteMenusChain } });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await saveMenuDraft("Not A Valid Slug", []);

    expect(result).toEqual({ error: "Invalid menu slug" });
    expect(siteMenusChain.update).not.toHaveBeenCalled();
  });

  it("returns 'Menu not found' when the update matches zero rows", async () => {
    const siteMenusChain = makeChain({ result: { data: [], error: null } });
    const supabase = mockSupabase({ chains: { site_menus: siteMenusChain } });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await saveMenuDraft("nonexistent_menu", []);
    expect(result).toEqual({ error: "Menu not found" });
  });

  it("strips a javascript: href before writing draft_items", async () => {
    const siteMenusChain = makeChain({ result: { data: [{ id: "menu-1" }], error: null } });
    const supabase = mockSupabase({ chains: { site_menus: siteMenusChain } });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const items = [
      {
        id: "item-1",
        label: "Evil",
        kind: "external",
        href: "javascript:alert(1)",
        style: "link",
        newTab: false,
        children: [],
      },
      {
        id: "item-2",
        label: "Pricing",
        kind: "anchor",
        href: "#pricing",
        style: "link",
        newTab: false,
        children: [],
      },
    ];

    const result = await saveMenuDraft("header", items);

    expect(result).toEqual({ success: true });
    expect(siteMenusChain.update).toHaveBeenCalledTimes(1);
    const payload = siteMenusChain.update.mock.calls[0][0];
    expect(payload.draft_items).toHaveLength(1);
    expect(payload.draft_items[0].id).toBe("item-2");
    expect(payload.draft_items[0].href).toBe("#pricing");
  });
});

describe("reserved 'header' slug", () => {
  beforeEach(() => vi.clearAllMocks());

  it("createSiteMenu refuses to (re)create the header slug", async () => {
    const siteMenusChain = makeChain();
    const supabase = mockSupabase({ chains: { site_menus: siteMenusChain } });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await createSiteMenu("header", "Header");

    expect(result).toEqual({ error: "This slug is reserved" });
    expect(siteMenusChain.insert).not.toHaveBeenCalled();
  });

  it("deleteSiteMenu refuses to delete the header menu", async () => {
    const siteMenusChain = makeChain();
    const supabase = mockSupabase({ chains: { site_menus: siteMenusChain } });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await deleteSiteMenu("header");

    expect(result).toEqual({ error: "The header menu cannot be deleted" });
    expect(siteMenusChain.delete).not.toHaveBeenCalled();
  });
});

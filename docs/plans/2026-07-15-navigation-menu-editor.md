# Plan: Visual Navigation/Menu Editor for the Website Editor

**Goal:** Let admins visually create, edit, organize and reorder the marketing navbar and footer menus — including submenus, drag-and-drop ordering, multiple link types (section anchors, internal pages, external URLs), and the same draft → publish → revisions workflow the block CMS already has.

**Executor notes:** Work phase by phase, in order. Each phase is self-contained: read its "Read first" files before writing code. COPY the cited patterns — do not invent new APIs, helpers, or conventions. All paths are relative to `web/` unless prefixed. Run `npm run typecheck && npm run lint && npm run test` (in `web/`) at the end of every phase.

---

## Phase 0 — Grounding (read, don't write)

Read these files fully before any implementation phase; they are the source of every pattern used below:

| Area | File | What to take from it |
|---|---|---|
| Draft/publish server actions | `src/app/actions/pages.ts` | Inline admin check (lines ~292-300), `saveSectionDraft` (290-325), `publishSectionDraft` (418-466), `recordRevisionAndPrune` (333-361), `SectionKeySchema` (224-228), return shape `{ success?: true; error?: string }` |
| URL/HTML sanitization | `src/lib/sanitize.ts` | `sanitizeBlockUrl` (rejects `javascript:`/`data:`; allows http(s) + `/relative` + `#anchor`? — verify: if `#anchor` is rejected, extend, see Phase 1) |
| CMS schema conventions | `src/blocks/types.ts`, `src/blocks/schemas.ts`, `src/blocks/common.ts` | `FieldConfig` union, `linkSchema`/`LinkValue`, zod-v4 style, React-free schema modules |
| Editor shell | `src/components/editor/PageEditor.tsx` | Reducer + 1500 ms debounced autosave + `beforeunload` guard + Sheet overlays |
| Toolbar | `src/components/editor/EditorToolbar.tsx` | `SaveState` type, props contract — reuse as-is |
| Drag & drop | `src/components/editor/EditorCanvas.tsx` (78-90, 127-156), `src/components/editor/SortableBlock.tsx` | `DndContext`/`SortableContext`/`arrayMove`, drag-handle-only pattern |
| Schema-driven forms | `src/components/editor/Inspector.tsx`, `src/components/editor/fields/FieldRenderer.tsx` | How `FieldConfig[]` becomes a form |
| Existing migrations | `web/supabase/migrations/00025_add_visual_pages.sql` (RLS 76-84), `00027_cms_v2.sql`, `00028_seed_homepage_sections.sql` | Table + policy + seed (`ON CONFLICT (key) DO NOTHING`) patterns |
| Current hardcoded nav | `src/components/marketing/marketing-header.tsx` (NAV_LINKS, 5-9), `src/components/marketing/marketing-footer.tsx` (FOOTER_LINKS, 4-16), `src/app/(marketing)/layout.tsx` | Exact links to seed; components to make DB-driven |
| Public rendering + preview | `src/app/(marketing)/landing/page.tsx` | Anon fetch of published content (82-89), admin-gated `?preview=1` draft path (49-80), `keyToAnchorId` (29-31) |
| Middleware | `src/middleware.ts` | `/landing` → `/` redirect (29-31), `/` → `/landing` rewrite (89-95), admin gate on `/admin` (159-163) |
| Test harnesses | `src/app/actions/__tests__/auth.test.ts`, `src/blocks/__tests__/schemas.test.ts` | vitest mock-supabase chain pattern; schema test pattern |
| Admin list UI | `src/app/(admin)/admin/website/page.tsx`, `new-section-dialog.tsx`, `reorder-buttons.tsx` | Table + dialog + `router.refresh()` patterns |
| Section editor wiring | `src/app/(admin)/admin/website/[key]/page.tsx`, `[key]/section-editor-client.tsx` | How a server page composes the client editor with bound server actions |

**Allowed APIs (verified installed — do not add new deps without need):** `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0`, `@dnd-kit/utilities@^3.2.2`, `zod@^4` (v4 API!), `isomorphic-dompurify`, Radix wrappers in `src/components/ui/` (`accordion.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `dialog.tsx`, `select.tsx`, `tabs.tsx`). **NOT installed:** `@radix-ui/react-navigation-menu`, `@dnd-kit/modifiers` — do not import them. There is no `collapsible.tsx` ui wrapper (the Radix package exists if needed).

**Key architectural decisions (already made — do not re-litigate):**
1. **New `site_menus` table**, not blocks-in-`site_sections` and not a JSON field on `platform_settings`. Menus are trees, not block lists; they need their own draft/publish lifecycle and RLS pair.
2. **Items stored as a JSONB tree** on the menu row (`items` published / `draft_items` working copy), mirroring `content`/`draft_content`. **Max depth = 2** (top level + one submenu level), enforced by schema shape, not recursion.
3. **Revisions reuse `page_revisions`** via a new nullable `menu_slug` column and a widened exactly-one-of-three CHECK — keeps `RevisionsSheet` and the prune logic reusable.
4. **Editor = dedicated tree editor** (WordPress-style), not the block `EditorCanvas`: drag-and-drop reorders items **within a level**; explicit indent/outdent buttons move items between levels. Nested cross-level drag with dnd-kit is fragile — do not attempt it in v1.
5. **Header and footer become DB-driven with hardcoded fallback**: if no published menu rows exist (or fetch fails), render the current static arrays so the public site can never break.
6. **Menu identity = slug** (`header`, `footer_platform`, `footer_support`). Admins can create additional `footer_*` menus (footer columns, ordered by `sort_order`). The `header` slug is fixed/undeletable.

---

## Phase 1 — Data layer: migration, types, schemas, sanitization

### Task 1.1 — Migration `web/supabase/migrations/00029_site_menus.sql`
Copy structure from `00027_cms_v2.sql` + RLS pair from `00025` lines 76-84.

- [ ] 1.1.1 Create `site_menus`:
  ```sql
  CREATE TABLE IF NOT EXISTS site_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,           -- 'header', 'footer_platform', ...
    title TEXT NOT NULL,                 -- display name in admin
    items JSONB NOT NULL DEFAULT '[]',        -- published tree
    draft_items JSONB NOT NULL DEFAULT '[]',  -- working copy
    is_published BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,    -- footer column order
    published_at TIMESTAMPTZ,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```
- [ ] 1.1.2 RLS: enable; add `"Admins manage site menus"` (`FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))`) and `"Public read published site menus"` (`FOR SELECT USING (is_published = true)`) — exact mirror of `00025:76-84`.
- [ ] 1.1.3 `updated_at` trigger: copy the `update_*_updated_at` trigger pattern from `00025:95-101`.
- [ ] 1.1.4 Extend `page_revisions` for menus:
  ```sql
  ALTER TABLE page_revisions
    ADD COLUMN IF NOT EXISTS menu_slug TEXT REFERENCES site_menus(slug) ON DELETE CASCADE;
  ALTER TABLE page_revisions DROP CONSTRAINT IF EXISTS page_revisions_check;
  ALTER TABLE page_revisions ADD CONSTRAINT page_revisions_one_target CHECK (
    (section_key IS NOT NULL)::int + (page_id IS NOT NULL)::int + (menu_slug IS NOT NULL)::int = 1
  );
  ```
  ⚠️ Verify the auto-generated name of the existing CHECK (`\d page_revisions` or `pg_constraint`) — `00027:42` created it inline, so the name is likely `page_revisions_check`; use `DROP CONSTRAINT IF EXISTS` on that name and note it. Add index `idx_page_revisions_menu ON page_revisions(menu_slug, created_at DESC)` and policy `"Admins manage menu revisions"` (`menu_slug IS NOT NULL AND` admin-exists check — mirror `00027:51-55`).
- [ ] 1.1.5 Seed (same `INSERT ... ON CONFLICT (slug) DO NOTHING` pattern as `00028`), `is_published = true`, `published_at = NOW()`, `items` = `draft_items`:
  - `header` (sort_order 0): the three `NAV_LINKS` from `marketing-header.tsx:5-9` (How It Works `#how-it-works`, Pricing `#pricing`, Testimonials `#testimonials`), each `{"id": "<uuid>", "label": ..., "kind": "anchor", "href": ..., "style": "link", "children": []}` — plus a final item `{"label": "Log in", "kind": "internal", "href": "/login", "style": "button", "children": []}`.
  - `footer_platform` (sort_order 0) and `footer_support` (sort_order 1): the exact `FOOTER_LINKS` from `marketing-footer.tsx:4-16`.
  - Use fixed literal UUIDs in the seed (migrations must be deterministic).

### Task 1.2 — Types: `src/types/cms.ts`
- [ ] 1.2.1 Add `SiteMenuRow` interface next to `SiteSectionRow`, matching 1.1.1 columns (`items: unknown[]`, `draft_items: unknown[]`).
- [ ] 1.2.2 Extend `PageRevisionRow` with `menu_slug: string | null`.

### Task 1.3 — Menu item schema: new file `src/lib/menus/schema.ts` (React-free, like `src/blocks/schemas.ts`)
- [ ] 1.3.1 Define with zod v4:
  ```ts
  export const menuChildItemSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1).max(60),
    kind: z.enum(["anchor", "internal", "external"]),
    href: z.string().min(1).max(500),
    style: z.enum(["link", "button"]).default("link"),
    newTab: z.boolean().default(false),
  });
  export const menuItemSchema = menuChildItemSchema.extend({
    children: z.array(menuChildItemSchema).max(12).default([]),
  });
  export const menuItemsSchema = z.array(menuItemSchema).max(20);
  export type MenuItem = z.infer<typeof menuItemSchema>;
  export type MenuChildItem = z.infer<typeof menuChildItemSchema>;
  ```
  The two-level shape (children have no `children`) IS the depth limit — no recursion, no superRefine needed.
- [ ] 1.3.2 `export const MenuSlugSchema` — copy `SectionKeySchema` (`pages.ts:224-228`): `z.string().min(1).max(60).regex(/^[a-z0-9_]+$/)`.
- [ ] 1.3.3 `sanitizeMenuItems(items: MenuItem[]): MenuItem[]` — run every `href` through `sanitizeBlockUrl` from `src/lib/sanitize.ts`; drop items whose href is rejected. **First check** `sanitizeBlockUrl` accepts `#fragment` hrefs (`src/lib/sanitize.ts:28-39` allows only http(s) and `/` paths per discovery) — if it rejects `#...`, add the case to `sanitizeBlockUrl` itself (a one-line prefix allowance) rather than writing a parallel sanitizer.
- [ ] 1.3.4 `flattenAnchorOptions()` helper: given `site_sections` keys, produce `{ value: "#how-it-works", label: "How It Works" }[]` using the `keyToAnchorId` logic from `landing/page.tsx:29-31` (extract that function into `src/lib/menus/anchors.ts` or export it from a shared module and import it in `landing/page.tsx` — do not duplicate it).

### Task 1.4 — Unit tests: `src/lib/menus/__tests__/schema.test.ts`
Copy the style of `src/blocks/__tests__/schemas.test.ts`.
- [ ] 1.4.1 Valid two-level tree parses; item with grandchildren (children inside children) is **rejected**.
- [ ] 1.4.2 Caps enforced: >20 top-level items rejected, >12 children rejected, label >60 rejected.
- [ ] 1.4.3 `sanitizeMenuItems` strips `javascript:alert(1)` and `data:` hrefs, keeps `/therapists`, `https://example.com`, `#pricing`.

**Phase 1 verification:** `npm run test` green; migration applies cleanly against local db (or via the project's `scripts/apply-pending-migrations.sh` flow); `SELECT slug, jsonb_array_length(items) FROM site_menus;` returns 3 seeded rows.
**Anti-pattern guards:** No zod v3 syntax (`.nonempty()` on objects, `z.string().url()` deprecations — check zod v4 docs if unsure). No recursive `z.lazy` schema. No service-role client in seeds/policies.

---

## Phase 2 — Server actions: `src/app/actions/menus.ts` (+ tests)

New `"use server"` file. Copy structure, naming, auth, and return conventions from `pages.ts` verbatim. All actions return `{ success?: true; error?: string }` (or data for getters).

### Task 2.1 — Read actions
- [ ] 2.1.1 `getSiteMenus()` — like `getSiteSections()` (`pages.ts:180-188`): anon-key `createClient()`, select all columns, order by `sort_order`. (Admin pages get all rows via the admin RLS policy; public callers only published rows.)
- [ ] 2.1.2 `getPublishedMenus(slugs?: string[])` — select `slug, title, items, sort_order` where `is_published = true`; used by header/footer.

### Task 2.2 — Write actions (each starts with the inline admin check copied from `pages.ts:292-300`)
- [ ] 2.2.1 `saveMenuDraft(slug, items)` — copy `saveSectionDraft` (`pages.ts:290-325`): validate slug (`MenuSlugSchema`), validate items (`menuItemsSchema.safeParse`), `sanitizeMenuItems`, then **`update` by slug writing only `draft_items`, `updated_by`, `updated_at`** (NOT upsert — menus are created explicitly via 2.2.4; return "Menu not found" if 0 rows matched). No revalidate (draft only).
- [ ] 2.2.2 `publishMenuDraft(slug)` — copy `publishSectionDraft` (`pages.ts:418-466`): copy `draft_items` → `items`, set `is_published`, `published_at`, `updated_at`, `updated_by`; write revision via a menu branch in `recordRevisionAndPrune` (add `menuSlug` to its target param — export it from `pages.ts` or move the helper to `src/lib/cms/revisions.ts` imported by both; prefer the small refactor, and keep `MAX_REVISIONS = 20`); then `revalidatePath("/")` and `revalidatePath("/landing")`.
- [ ] 2.2.3 `restoreMenuRevision(revisionId)` — copy the section branch of `restorePageRevision` (`pages.ts:604-618`): admin check, write revision `content` into `draft_items` (never `items`).
- [ ] 2.2.4 `createSiteMenu(slug, title)` — copy `createSiteSection` (`pages.ts:531-572`) including the `23505` duplicate handling and next-`sort_order` computation. Restrict creatable slugs: must match `MenuSlugSchema` **and** not equal `header` (reserved; seeded).
- [ ] 2.2.5 `deleteSiteMenu(slug)` — admin check; refuse `slug === "header"`; delete row; `revalidatePath("/admin/website/navigation")`, `revalidatePath("/")`, `revalidatePath("/landing")`.
- [ ] 2.2.6 `reorderSiteMenus(order: {slug, sort_order}[])` — copy `reorderSiteSections` (`pages.ts:499-524`).
- [ ] 2.2.7 `getMenuRevisions(slug)` — copy `getPageRevisions` (`pages.ts:474-491`) filtering `menu_slug`.

### Task 2.3 — Tests: `src/app/actions/__tests__/menus.test.ts`
Copy the mock-supabase chain harness from `auth.test.ts:1-36` exactly.
- [ ] 2.3.1 Unauthenticated → `{ error: "Not authenticated" }`; non-admin role → `{ error: "Admin only" }` for save/publish/create/delete.
- [ ] 2.3.2 `saveMenuDraft` rejects invalid slug, three-level nesting, and strips `javascript:` hrefs before the update call (assert on the mock's received payload).
- [ ] 2.3.3 `createSiteMenu("header", ...)` and `deleteSiteMenu("header")` are refused.

**Phase 2 verification:** `npm run test` + `npm run typecheck` green; grep check `grep -n "use server" src/app/actions/menus.ts` (line 1); grep `createAdminClient` in `menus.ts` returns nothing (RLS-enforced anon client only).
**Anti-pattern guards:** No new auth helper abstraction beyond the optional `recordRevisionAndPrune` move; no `upsert` in `saveMenuDraft`; never write to `items` except in `publishMenuDraft`.

---

## Phase 3 — Public rendering: DB-driven header & footer with submenus

### Task 3.1 — Shared menu-fetch + fallback: `src/lib/menus/load.ts`
- [ ] 3.1.1 `loadHeaderMenu()` / `loadFooterMenus()`: call `getPublishedMenus`, parse rows through `menuItemsSchema.safeParse` (skip invalid rows silently — same defensive posture as `BlockRenderer.tsx:61-88`).
- [ ] 3.1.2 Fallback constants: move the current `NAV_LINKS` (`marketing-header.tsx:5-9`) and `FOOTER_LINKS` (`marketing-footer.tsx:4-16`) here as `FALLBACK_HEADER_ITEMS` / `FALLBACK_FOOTER_MENUS` in `MenuItem` shape. Return fallbacks when the fetch errors **or** yields no published menu of that slug/prefix.

### Task 3.2 — Header: rewrite `src/components/marketing/marketing-header.tsx`
- [ ] 3.2.1 Accept `items: MenuItem[]` as a prop (keep logo/platform-name logic as is). The component stays a server component; interactive parts split out below.
- [ ] 3.2.2 Desktop: items without children → `<a>` styled as today; items WITH children → dropdown using the existing `src/components/ui/dropdown-menu.tsx` (trigger = button with label + ChevronDown, `aria-expanded` handled by Radix). `style: "button"` items render via `<Button asChild>` like the current Log in.
- [ ] 3.2.3 Mobile (net-new — currently nothing below `md`): hamburger button (visible `< md`) opening the existing `src/components/ui/sheet.tsx`; items with children render inside `src/components/ui/accordion.tsx`. This is a small `"use client"` component `marketing-mobile-nav.tsx` receiving the same `items` prop.
- [ ] 3.2.4 `newTab: true` → `target="_blank" rel="noopener noreferrer"` (match `sanitizeRichHtml`'s rel convention).

### Task 3.3 — Footer: rewrite `src/components/marketing/marketing-footer.tsx`
- [ ] 3.3.1 Accept `menus: { title: string; items: MenuItem[] }[]`; render one column per `footer_*` menu ordered by `sort_order`, keeping the platform-name and Contact columns as they are. Footer ignores `children` beyond rendering them as flat extra links (footer submenus render inline under their parent, indented — keep it simple).

### Task 3.4 — Wiring + draft preview
⚠️ `MarketingHeader`/`MarketingFooter` are currently rendered by `src/app/(marketing)/layout.tsx`, and **layouts cannot read `searchParams`**, so draft preview (`/landing?preview=1`) could never show a draft menu from the layout.
- [ ] 3.4.1 Confirm the `(marketing)` route group contains only `landing/` (it does per discovery). Move `<MarketingHeader/>`/`<MarketingFooter/>` (and the skip-link + `<main>` wrapper) from `layout.tsx` into `landing/page.tsx`; leave a pass-through layout.
- [ ] 3.4.2 In `landing/page.tsx`, load menus alongside sections: published path uses `items`; the existing admin-gated preview path (lines 49-80) uses `draft_items` (fetch full rows with the authed client — admin RLS grants read). Pass into header/footer.
- [ ] 3.4.3 Publish path cache: `publishMenuDraft` already revalidates `/` and `/landing` (Task 2.2.2); confirm the landing route is `force-dynamic` (line 6) so no extra invalidation is needed.

### Task 3.5 — Tests
- [ ] 3.5.1 `src/lib/menus/__tests__/load.test.ts`: fetch error → fallbacks; invalid row shape → fallback; valid rows → parsed items.

**Phase 3 verification:** `npm run typecheck && npm run lint && npm run test`; then run `npm run dev` and check as an unauthenticated visitor: `/` shows the seeded nav identical to the old hardcoded one (visual no-op), mobile viewport shows hamburger + sheet, keyboard can open/close a dropdown. Truncate `site_menus` locally (or set `is_published=false`) and confirm the fallback renders.
**Anti-pattern guards:** Do not import `@radix-ui/react-navigation-menu` (not installed). No client component fetching from supabase directly — data flows in via server-component props. Do not leave dead `NAV_LINKS`/`FOOTER_LINKS` in the components (they move to `load.ts`).

---

## Phase 4 — Admin editor UI: `/admin/website/navigation`

Middleware already admin-gates `/admin/*` (`middleware.ts:159-163`); RLS backstops it.

### Task 4.1 — Entry points
- [ ] 4.1.1 Add a "Navigation" link/card on `src/app/(admin)/admin/website/page.tsx` (header area next to `NewSectionDialog`) pointing to `/admin/website/navigation`.
- [ ] 4.1.2 `navigation/page.tsx` (server): `getSiteMenus()`, render a menu list styled like the sections table (copy table markup from `website/page.tsx:38-85`): title, slug, Live/Draft badge + "Unsaved changes" badge (same `JSON.stringify` diff as `hasUnpublishedChanges`, line 14-16), reorder arrows for `footer_*` rows (copy `reorder-buttons.tsx` calling `reorderSiteMenus`), Edit link → `/admin/website/navigation/[slug]`, delete button (confirm dialog; hidden for `header`), and a "New menu" dialog (copy `new-section-dialog.tsx` calling `createSiteMenu`; hint text that `footer_*` slugs appear as footer columns).

### Task 4.2 — Menu editor route `navigation/[slug]/page.tsx` + `menu-editor-client.tsx`
Copy the composition pattern of `admin/website/[key]/page.tsx` + `section-editor-client.tsx`: server page fetches the row, client component binds server actions.
- [ ] 4.2.1 Server page: fetch menu by slug (`notFound()` if missing), pass `initialItems = draft_items` (parsed via `menuItemsSchema` with `[]` fallback), `title`, `slug`.
- [ ] 4.2.2 `MenuEditor` client shell — copy `PageEditor.tsx`'s skeleton (reducer, 1500 ms debounced autosave calling `saveMenuDraft`, `beforeunload` guard, `SaveState` plumbing) but with menu-specific state:
  ```ts
  interface MenuEditorState { items: MenuItem[]; selectedId: string | null; saveState: SaveState }
  type Action =
    | { type: "ADD_ITEM"; parentId: string | null }        // appends a new default item at that level
    | { type: "UPDATE_ITEM"; id: string; patch: Partial<MenuChildItem> }
    | { type: "REORDER"; parentId: string | null; items: ... }  // arrayMove within one level
    | { type: "INDENT"; id: string }    // become last child of previous sibling (top-level only, and only if it has no children itself)
    | { type: "OUTDENT"; id: string }   // child → top-level, inserted after its parent
    | { type: "DELETE_ITEM"; id: string } | { type: "DUPLICATE_ITEM"; id: string }
    | { type: "SELECT_ITEM"; id: string | null } | { type: "SET_SAVE_STATE"; saveState: SaveState };
  ```
  New items: `{ id: crypto.randomUUID(), label: "New item", kind: "internal", href: "/", style: "link", newTab: false, children: [] }`.
- [ ] 4.2.3 Reuse `EditorToolbar` as-is: `contextLabel` = menu title, `previewHref = "/landing?preview=1"`, `onPublish` → `publishMenuDraft`, `onOpenRevisions` → revisions sheet. `viewportMode` drives the preview pane (4.4.3).
- [ ] 4.2.4 Revisions: reuse `src/components/editor/RevisionsSheet.tsx` with `loadRevisions` → `getMenuRevisions(slug)` and `restoreRevision` → `restoreMenuRevision`; after a successful restore, re-sync editor state (the server page pattern for this is referenced in `PageEditor.tsx:208-216` — use `router.refresh()` + a `key` remount on the client shell, the simplest correct approach).

### Task 4.3 — Tree canvas: `src/components/menu-editor/MenuTree.tsx`
- [ ] 4.3.1 Top level: one `DndContext` + vertical `SortableContext` copied from `EditorCanvas.tsx:78-90,127-156`; each row a `SortableMenuItem` copied from `SortableBlock.tsx` (drag handle = `GripVertical` button with `{...attributes}{...listeners}`, body click selects).
- [ ] 4.3.2 Children: each parent renders its children in its OWN nested `DndContext`/`SortableContext` (ids never overlap since all ids are uuids; separate contexts prevent cross-level drops by construction). Indented with a left border.
- [ ] 4.3.3 Row affordances: label + kind badge (`anchor`/`internal`/`external`), style badge for `button`, then icon buttons: indent (→, disabled for children and for items with children), outdent (←, children only), duplicate, delete. `Add item` button at the bottom of each level (top-level one in the canvas footer; per-parent "Add sub-item" under each parent's children).
- [ ] 4.3.4 Empty state: copy `EmptyState` usage from `website/page.tsx:31-36`.

### Task 4.4 — Item inspector + live preview
- [ ] 4.4.1 `MenuItemInspector.tsx` — hand-built form (do NOT force this through block `FieldConfig`; menu items aren't blocks) but composed from the same ui primitives: `Input` for label; `Select` (ui/select.tsx) for kind; conditional href control:
  - `anchor` → `Select` populated from `flattenAnchorOptions()` over published sections (server page passes the options down),
  - `internal` → `Select` of known routes (`/therapists`, `/login`, `/emergency`, `/legal/terms`, `/legal/privacy`) plus a free-text `Input` escape hatch,
  - `external` → plain `Input` (validate `https?://` on blur, show inline error);
  `Select` for style (link/button); `Switch` (ui/switch.tsx) for `newTab`. Same layout conventions as `Inspector.tsx` (ScrollArea, empty state when nothing selected).
- [ ] 4.4.2 Layout: 3-pane like `PageEditor.tsx:236-256` — tree canvas center, inspector right `aside` (320 px, `lg:block`), inspector in a `Sheet` below `lg` (copy `PageEditor.tsx:271-280`). No palette pane (left aside omitted).
- [ ] 4.4.3 Live preview pane above the tree: render the real header markup with the current draft items — extract the desktop nav's presentational part from Task 3.2 into a shared `MarketingNavPreview` component so editor and site can't drift. `viewportMode === "mobile"` renders it inside a `max-w-[390px]` frame like `EditorCanvas`'s mobile mode. For `footer_*` menus, preview a single footer column instead.

### Task 4.5 — Editor tests (logic only)
- [ ] 4.5.1 Extract the reducer to `src/components/menu-editor/reducer.ts`; test in `src/components/menu-editor/__tests__/reducer.test.ts`: indent moves item under previous sibling; indent is refused for first item / items with children; outdent inserts after parent; reorder within a level preserves the other level; delete of a parent removes its children; duplicate deep-clones with fresh uuids (children included).

**Phase 4 verification:** `npm run typecheck && npm run lint && npm run test`; manual pass via dev login (`/api/dev-login`, admin user): create a footer menu, drag-reorder header items, indent an item under another, edit it in the inspector, watch autosave state cycle dirty→saving→saved, open `/landing?preview=1` and see the draft nav (published `/` unchanged), publish, confirm `/` updates, restore a revision and see it land in the draft.
**Anti-pattern guards:** No cross-level drag; no editing of `items` (published) anywhere in the editor — drafts only; don't fork `EditorToolbar`/`RevisionsSheet` — reuse them; don't add a `FieldConfig` kind for menus.

---

## Phase 5 — Final verification

- [ ] 5.1 Full suite in `web/`: `npm run typecheck && npm run lint && npm run test && npm run build`.
- [ ] 5.2 Anti-pattern greps (all must return nothing):
  - `grep -rn "react-navigation-menu\|@dnd-kit/modifiers" src/`
  - `grep -rn "createAdminClient" src/app/actions/menus.ts src/lib/menus/`
  - `grep -rn "NAV_LINKS\|FOOTER_LINKS" src/components/marketing/` (constants must have moved to `src/lib/menus/load.ts`)
  - `grep -rn "z.lazy" src/lib/menus/`
- [ ] 5.3 Security spot-checks: `saveMenuDraft` with `href: "javascript:alert(1)"` never reaches the DB (unit test 2.3.2 covers it; also verify once against the live dev DB); anon `curl` to supabase REST for `site_menus` returns only published rows.
- [ ] 5.4 Visual regression: logged-out `/` header/footer byte-identical in content to the pre-change hardcoded nav (the seed reproduces it exactly); mobile hamburger works; keyboard/screen-reader pass on the dropdown (Radix handles aria; verify focus is visible).
- [ ] 5.5 Migration bookkeeping: `00029_site_menus.sql` applied and recorded in the project's migration tracking (see `scripts/apply-pending-migrations.sh` conventions from the Jul 12 session).

---

## Out of scope (v1) — noted for later
- Per-therapist page links as a `kind: "page"` option (needs published `therapist_pages` picker) — schema's `kind` enum is easy to extend.
- Cross-level drag-and-drop (replace indent/outdent) — revisit with `@dnd-kit` tree examples if demanded.
- Menu visibility rules (logged-in vs logged-out variants).
- Locale-aware menus (middleware already strips locales; menus are single-locale today).

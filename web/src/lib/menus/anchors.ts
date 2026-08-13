/**
 * Turns a `site_sections.key` like "homepage_how_it_works" into a stable
 * anchor slug ("how-it-works"). Shared by the landing page (which sets the
 * `id` on each rendered section) and the menu editor (which offers anchors
 * as a link target for header/footer menu items).
 */
export function keyToAnchorId(key: string): string {
  return key.replace(/^homepage_/, "").replace(/_/g, "-");
}

export interface AnchorOption {
  value: string; // e.g. "#how-it-works"
  label: string; // e.g. "How It Works" (from the section's title, falling back to its key)
}

/**
 * Builds the list of section-anchor options offered in the menu item
 * inspector's "anchor" link-kind picker, from published homepage sections.
 */
export function flattenAnchorOptions(
  sections: { key: string; title: string | null }[]
): AnchorOption[] {
  return sections.map((section) => ({
    value: `#${keyToAnchorId(section.key)}`,
    label: section.title || section.key,
  }));
}

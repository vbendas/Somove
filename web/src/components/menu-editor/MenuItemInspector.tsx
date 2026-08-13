"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MenuChildItem, MenuItem } from "@/lib/menus/schema";
import type { AnchorOption } from "@/lib/menus/anchors";

const KNOWN_INTERNAL_ROUTES: { value: string; label: string }[] = [
  { value: "/therapists", label: "Find a Therapist" },
  { value: "/login", label: "Log in" },
  { value: "/emergency", label: "Emergency Resources" },
  { value: "/legal/terms", label: "Terms of Service" },
  { value: "/legal/privacy", label: "Privacy Policy" },
];

export interface MenuItemInspectorProps {
  /** `null` = nothing selected — renders an empty-state message. */
  item: MenuItem | MenuChildItem | null;
  anchorOptions: AnchorOption[];
  onChange: (patch: Partial<Omit<MenuChildItem, "id">>) => void;
}

/**
 * Hand-built property panel for the selected menu item — deliberately not
 * routed through the block CMS's FieldConfig/FieldRenderer system (see
 * src/components/editor/fields/), since menu items aren't blocks and have
 * a fixed, small field set. Reuses the same UI primitives and layout
 * conventions as src/components/editor/Inspector.tsx.
 */
export function MenuItemInspector({ item, anchorOptions, onChange }: MenuItemInspectorProps) {
  if (!item) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Select a menu item to edit its properties.
      </div>
    );
  }

  const externalHrefInvalid = item.kind === "external" && item.href.length > 0 && !/^https?:\/\//.test(item.href);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Menu item
        </h3>

        <div className="space-y-1.5">
          <Label htmlFor="menu-item-label">Label</Label>
          <Input
            id="menu-item-label"
            value={item.label}
            maxLength={60}
            onChange={(e) => onChange({ label: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="menu-item-kind">Link type</Label>
          <Select
            value={item.kind}
            onValueChange={(kind) => onChange({ kind: kind as MenuChildItem["kind"], href: "" })}
          >
            <SelectTrigger id="menu-item-kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anchor">Section on this page</SelectItem>
              <SelectItem value="internal">Page on this site</SelectItem>
              <SelectItem value="external">External URL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {item.kind === "anchor" && (
          <div className="space-y-1.5">
            <Label htmlFor="menu-item-anchor">Section</Label>
            {anchorOptions.length > 0 ? (
              <Select value={item.href} onValueChange={(href) => onChange({ href })}>
                <SelectTrigger id="menu-item-anchor">
                  <SelectValue placeholder="Choose a section" />
                </SelectTrigger>
                <SelectContent>
                  {anchorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-warm-gray">No published homepage sections yet.</p>
            )}
          </div>
        )}

        {item.kind === "internal" && (
          <div className="space-y-1.5">
            <Label htmlFor="menu-item-internal-quick">Quick pick</Label>
            <Select value="" onValueChange={(href) => onChange({ href })}>
              <SelectTrigger id="menu-item-internal-quick">
                <SelectValue placeholder="Choose a page…" />
              </SelectTrigger>
              <SelectContent>
                {KNOWN_INTERNAL_ROUTES.map((route) => (
                  <SelectItem key={route.value} value={route.value}>
                    {route.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="menu-item-internal-path">Path</Label>
            <Input
              id="menu-item-internal-path"
              value={item.href}
              placeholder="/therapists"
              onChange={(e) => onChange({ href: e.target.value })}
            />
          </div>
        )}

        {item.kind === "external" && (
          <div className="space-y-1.5">
            <Label htmlFor="menu-item-external">URL</Label>
            <Input
              id="menu-item-external"
              value={item.href}
              placeholder="https://example.com"
              onChange={(e) => onChange({ href: e.target.value })}
            />
            {externalHrefInvalid && (
              <p className="text-xs text-destructive">External URLs must start with http:// or https://</p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="menu-item-style">Style</Label>
          <Select value={item.style} onValueChange={(style) => onChange({ style: style as MenuChildItem["style"] })}>
            <SelectTrigger id="menu-item-style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="link">Link</SelectItem>
              <SelectItem value="button">Button</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="menu-item-new-tab">Open in new tab</Label>
          <Switch
            id="menu-item-new-tab"
            checked={item.newTab}
            onCheckedChange={(newTab) => onChange({ newTab })}
          />
        </div>
      </div>
    </ScrollArea>
  );
}

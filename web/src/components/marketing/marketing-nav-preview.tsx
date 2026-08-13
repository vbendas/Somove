import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MenuLink } from "@/components/marketing/menu-link";
import type { MenuItem } from "@/lib/menus/schema";

export interface MarketingNavPreviewProps {
  items: MenuItem[];
  className?: string;
}

/**
 * Renders a header item list as nav links/dropdowns plus trailing CTA
 * buttons. Shared by the real `MarketingHeader`'s desktop nav (wrapped in
 * `hidden md:flex` there) and the menu editor's live preview pane, so the
 * two can't visually drift apart.
 */
export function MarketingNavPreview({ items, className }: MarketingNavPreviewProps) {
  const buttonItems = items.filter((item) => item.style === "button" && item.children.length === 0);
  const navItems = items.filter((item) => !(item.style === "button" && item.children.length === 0));

  return (
    <div className={className ?? "flex items-center gap-8"}>
      {navItems.map((item) =>
        item.children.length > 0 ? (
          <DropdownMenu key={item.id}>
            <DropdownMenuTrigger className="flex items-center gap-1 font-body text-sm text-warm-gray outline-none transition-colors hover:text-foreground data-[state=open]:text-foreground">
              {item.label}
              <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {item.children.map((child) => (
                <DropdownMenuItem key={child.id} asChild>
                  <MenuLink item={child} className="w-full cursor-pointer" />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <MenuLink
            key={item.id}
            item={item}
            className="font-body text-sm text-warm-gray transition-colors hover:text-foreground"
          />
        )
      )}
      {buttonItems.map((item) => (
        <Button key={item.id} asChild size="sm">
          <MenuLink item={item} />
        </Button>
      ))}
    </div>
  );
}

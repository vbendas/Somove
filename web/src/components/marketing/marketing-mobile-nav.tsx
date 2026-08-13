"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MenuLink } from "@/components/marketing/menu-link";
import type { MenuItem } from "@/lib/menus/schema";

export interface MarketingMobileNavProps {
  items: MenuItem[];
}

/** Hamburger + slide-out Sheet for the marketing header, shown below `md`. Items with children render as an Accordion. */
export function MarketingMobileNav({ items }: MarketingMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <SheetContent side="right" className="flex w-[280px] flex-col p-0 sm:max-w-xs">
        <SheetHeader className="p-4 pb-0">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-4">
          {items.map((item) =>
            item.children.length > 0 ? (
              <Accordion key={item.id} type="single" collapsible>
                <AccordionItem value={item.id} className="border-none">
                  <AccordionTrigger className="py-2 font-body text-sm text-foreground hover:no-underline">
                    {item.label}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-1 pl-3">
                      {item.children.map((child) => (
                        <MenuLink
                          key={child.id}
                          item={child}
                          className="py-2 font-body text-sm text-warm-gray transition-colors hover:text-foreground"
                          onClick={() => setOpen(false)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : item.style === "button" ? (
              <Button key={item.id} asChild size="sm" className="mt-2" onClick={() => setOpen(false)}>
                <MenuLink item={item} />
              </Button>
            ) : (
              <MenuLink
                key={item.id}
                item={item}
                className="py-2 font-body text-sm text-foreground transition-colors hover:text-warm-gray"
                onClick={() => setOpen(false)}
              />
            )
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

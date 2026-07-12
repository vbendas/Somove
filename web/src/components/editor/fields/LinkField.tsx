"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LinkValue } from "@/blocks/common";

export interface LinkFieldProps {
  fieldKey: string;
  label: string;
  value: unknown;
  onChange: (value: LinkValue) => void;
}

function toLinkValue(value: unknown): LinkValue {
  if (value && typeof value === "object") {
    const v = value as Partial<LinkValue>;
    return {
      label: typeof v.label === "string" ? v.label : "",
      href: typeof v.href === "string" ? v.href : "",
    };
  }
  return { label: "", href: "" };
}

/** Wraps two `Input`s for the `link` field kind (`{ label, href }`). */
export function LinkField({ fieldKey, label, value, onChange }: LinkFieldProps) {
  const linkValue = toLinkValue(value);
  const labelId = `field-${fieldKey}-label`;
  const hrefId = `field-${fieldKey}-href`;

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor={labelId} className="text-xs font-normal text-muted-foreground">
            Button label
          </Label>
          <Input
            id={labelId}
            value={linkValue.label}
            placeholder="Learn more"
            onChange={(e) => onChange({ ...linkValue, label: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={hrefId} className="text-xs font-normal text-muted-foreground">
            Link URL
          </Label>
          <Input
            id={hrefId}
            value={linkValue.href}
            placeholder="https://…"
            onChange={(e) => onChange({ ...linkValue, href: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

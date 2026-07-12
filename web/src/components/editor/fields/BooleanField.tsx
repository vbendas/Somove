"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface BooleanFieldProps {
  fieldKey: string;
  label: string;
  value: unknown;
  onChange: (value: boolean) => void;
}

/** Wraps `Switch` for the `boolean` field kind. */
export function BooleanField({ fieldKey, label, value, onChange }: BooleanFieldProps) {
  const boolValue = value === true;
  const id = `field-${fieldKey}`;

  return (
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={boolValue} onCheckedChange={onChange} />
    </div>
  );
}

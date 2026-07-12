"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface NumberFieldProps {
  fieldKey: string;
  label: string;
  placeholder?: string;
  value: unknown;
  onChange: (value: number) => void;
}

/** Wraps `Input[type=number]` for the `number` field kind. */
export function NumberField({ fieldKey, label, placeholder, value, onChange }: NumberFieldProps) {
  const numberValue = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  const id = `field-${fieldKey}`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={numberValue}
        placeholder={placeholder}
        onChange={(e) => {
          const parsed = e.target.valueAsNumber;
          onChange(Number.isNaN(parsed) ? 0 : parsed);
        }}
      />
    </div>
  );
}

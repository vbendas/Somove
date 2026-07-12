"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectFieldProps {
  fieldKey: string;
  label: string;
  options: { value: string; label: string }[];
  value: unknown;
  onChange: (value: string) => void;
}

/** Wraps the `Select` compound component for the `select` field kind. */
export function SelectField({ fieldKey, label, options, value, onChange }: SelectFieldProps) {
  const stringValue = typeof value === "string" ? value : undefined;
  const id = `field-${fieldKey}`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={stringValue} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

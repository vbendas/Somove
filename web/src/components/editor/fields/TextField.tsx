"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface TextFieldProps {
  fieldKey: string;
  label: string;
  placeholder?: string;
  value: unknown;
  onChange: (value: string) => void;
  /** Renders a `Textarea` instead of a single-line `Input`. */
  multiline?: boolean;
}

/** Wraps `Input`/`Textarea` for the `text` and `textarea` field kinds. */
export function TextField({ fieldKey, label, placeholder, value, onChange, multiline }: TextFieldProps) {
  const stringValue = typeof value === "string" ? value : "";
  const id = `field-${fieldKey}`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          id={id}
          value={stringValue}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          value={stringValue}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

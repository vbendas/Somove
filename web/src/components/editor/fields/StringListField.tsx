"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface StringListFieldProps {
  fieldKey: string;
  label: string;
  value: unknown;
  onChange: (value: string[]) => void;
}

/** Wraps a repeatable list of `Input`s for the `stringList` field kind. */
export function StringListField({ fieldKey, label, value, onChange }: StringListFieldProps) {
  const items = Array.isArray(value) ? (value.filter((v) => typeof v === "string") as string[]) : [];

  const updateItem = (index: number, next: string) => {
    onChange(items.map((item, i) => (i === index ? next : item)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, ""]);
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              id={`field-${fieldKey}-${index}`}
              aria-label={`${label} item ${index + 1}`}
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove item ${index + 1}`}
              onClick={() => removeItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

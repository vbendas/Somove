"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldRenderer } from "@/components/editor/fields/FieldRenderer";
import type { FieldConfig } from "@/blocks/types";

export interface RepeaterFieldProps {
  fieldKey: string;
  label: string;
  itemLabel: string;
  fields: FieldConfig[];
  value: unknown;
  onChange: (value: Record<string, unknown>[]) => void;
}

/** Reasonable empty default for a nested field, used when adding a new repeater item. */
function emptyValueFor(field: FieldConfig): unknown {
  switch (field.kind) {
    case "text":
    case "textarea":
    case "richtext":
      return "";
    case "number":
      return 0;
    case "boolean":
      return false;
    case "select":
      return "";
    case "link":
      return { label: "", href: "" };
    case "image":
      return { url: "", alt: "" };
    case "stringList":
      return [];
    case "repeater":
      return [];
    default:
      return "";
  }
}

function emptyItemFor(fields: FieldConfig[]): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const field of fields) {
    item[field.key] = emptyValueFor(field);
  }
  return item;
}

/** Wraps a list of nested field-groups for the `repeater` field kind. */
export function RepeaterField({ fieldKey, label, itemLabel, fields, value, onChange }: RepeaterFieldProps) {
  const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

  const updateItem = (index: number, nextItemData: Record<string, unknown>) => {
    onChange(items.map((item, i) => (i === index ? nextItemData : item)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, emptyItemFor(fields)]);
  };

  return (
    <div className="space-y-1.5" id={`field-${fieldKey}`}>
      <Label>{label}</Label>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="space-y-3 rounded-card border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {itemLabel} {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${itemLabel} ${index + 1}`}
                onClick={() => removeItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {fields.map((nestedField) => (
                <FieldRenderer
                  key={nestedField.key}
                  field={nestedField}
                  value={item[nestedField.key]}
                  onChange={(nestedValue) => updateItem(index, { ...item, [nestedField.key]: nestedValue })}
                />
              ))}
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4" />
          Add {itemLabel}
        </Button>
      </div>
    </div>
  );
}

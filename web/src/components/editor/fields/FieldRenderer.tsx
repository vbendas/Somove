"use client";

import type { FieldConfig } from "@/blocks/types";
import { TextField } from "@/components/editor/fields/TextField";
import { NumberField } from "@/components/editor/fields/NumberField";
import { BooleanField } from "@/components/editor/fields/BooleanField";
import { SelectField } from "@/components/editor/fields/SelectField";
import { RichTextField } from "@/components/editor/fields/RichTextField";
import { ImageField } from "@/components/editor/fields/ImageField";
import { LinkField } from "@/components/editor/fields/LinkField";
import { StringListField } from "@/components/editor/fields/StringListField";
import { RepeaterField } from "@/components/editor/fields/RepeaterField";

export interface FieldRendererProps {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}

/**
 * Dispatches a `FieldConfig` to its per-`kind` field component, driving the
 * auto-generated property panel (`Inspector.tsx`). Also used recursively by
 * `RepeaterField` to render each nested field of a repeater item.
 */
export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  switch (field.kind) {
    case "text":
      return (
        <TextField
          fieldKey={field.key}
          label={field.label}
          placeholder={field.placeholder}
          value={value}
          onChange={onChange}
        />
      );
    case "textarea":
      return (
        <TextField
          fieldKey={field.key}
          label={field.label}
          placeholder={field.placeholder}
          value={value}
          onChange={onChange}
          multiline
        />
      );
    case "number":
      return (
        <NumberField
          fieldKey={field.key}
          label={field.label}
          placeholder={field.placeholder}
          value={value}
          onChange={onChange}
        />
      );
    case "boolean":
      return <BooleanField fieldKey={field.key} label={field.label} value={value} onChange={onChange} />;
    case "select":
      return (
        <SelectField
          fieldKey={field.key}
          label={field.label}
          options={field.options}
          value={value}
          onChange={onChange}
        />
      );
    case "richtext":
      return <RichTextField fieldKey={field.key} label={field.label} value={value} onChange={onChange} />;
    case "image":
      return <ImageField fieldKey={field.key} label={field.label} value={value} onChange={onChange} />;
    case "link":
      return <LinkField fieldKey={field.key} label={field.label} value={value} onChange={onChange} />;
    case "stringList":
      return <StringListField fieldKey={field.key} label={field.label} value={value} onChange={onChange} />;
    case "repeater":
      return (
        <RepeaterField
          fieldKey={field.key}
          label={field.label}
          itemLabel={field.itemLabel}
          fields={field.fields}
          value={value}
          onChange={onChange}
        />
      );
    default: {
      const exhaustiveCheck: never = field;
      return exhaustiveCheck;
    }
  }
}

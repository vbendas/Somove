"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadPageImage } from "@/app/actions/uploads";
import type { ImgValue } from "@/blocks/common";

export interface ImageFieldProps {
  fieldKey: string;
  label: string;
  value: unknown;
  onChange: (value: ImgValue) => void;
}

function toImgValue(value: unknown): ImgValue {
  if (value && typeof value === "object") {
    const v = value as Partial<ImgValue>;
    return {
      url: typeof v.url === "string" ? v.url : "",
      alt: typeof v.alt === "string" ? v.alt : "",
    };
  }
  return { url: "", alt: "" };
}

/** Wraps an upload control + preview for the `image` field kind (`{ url, alt }`). */
export function ImageField({ fieldKey, label, value, onChange }: ImageFieldProps) {
  const imgValue = toImgValue(value);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const altId = `field-${fieldKey}-alt`;
  const urlId = `field-${fieldKey}-url`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadPageImage(formData);
      if (result.error || !result.url) {
        toast.error(result.error ?? "Failed to upload image");
        return;
      }
      onChange({ ...imgValue, url: result.url });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="space-y-2">
        {imgValue.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- editor preview of arbitrary/in-progress URLs
          <img src={imgValue.url} alt={imgValue.alt} className="max-h-32 rounded-card object-cover" />
        ) : null}

        <div className="space-y-1">
          <Label htmlFor={altId} className="text-xs font-normal text-muted-foreground">
            Alt text
          </Label>
          <Input
            id={altId}
            value={imgValue.alt}
            placeholder="Describe the image"
            onChange={(e) => onChange({ ...imgValue, alt: e.target.value })}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Upload image"}
        </Button>

        <div className="space-y-1">
          <Label htmlFor={urlId} className="text-xs font-normal text-muted-foreground">
            or paste an image URL
          </Label>
          <Input
            id={urlId}
            value={imgValue.url}
            placeholder="https://…"
            onChange={(e) => onChange({ ...imgValue, url: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

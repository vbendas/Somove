"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PageMeta } from "./PageEditor";

interface PageMetaPanelProps {
  meta: PageMeta;
  onChange: (meta: PageMeta) => void;
}

/**
 * Self-contained "page details" form (title/description/SEO fields).
 * Rendered by `PageEditor` above the toolbar whenever the `meta` prop is
 * provided (therapist pages have it, site sections don't).
 */
export function PageMetaPanel({ meta, onChange }: PageMetaPanelProps) {
  function update<K extends keyof PageMeta>(key: K, value: PageMeta[K]) {
    onChange({ ...meta, [key]: value });
  }

  return (
    <Card className="mx-4 mt-4 shrink-0">
      <CardHeader>
        <CardTitle className="text-base">Page details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="page-meta-title">Title</Label>
          <Input
            id="page-meta-title"
            value={meta.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="page-meta-description">Description</Label>
          <Textarea
            id="page-meta-description"
            value={meta.description ?? ""}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="page-meta-seo-title">SEO title</Label>
          <Input
            id="page-meta-seo-title"
            value={meta.seo_title ?? ""}
            onChange={(e) => update("seo_title", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="page-meta-seo-description">SEO description</Label>
          <Textarea
            id="page-meta-seo-description"
            value={meta.seo_description ?? ""}
            onChange={(e) => update("seo_description", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

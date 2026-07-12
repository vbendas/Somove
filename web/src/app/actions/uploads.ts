"use server";

import { createClient } from "@/lib/supabase/server";

// Mirrors the page-images bucket config from
// web/supabase/migrations/00027_cms_v2.sql (allowed_mime_types, file_size_limit).
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Uploads an image used in a visual page/section block (e.g. an `image`
 * block's src, or a hero background) to the `page-images` Supabase Storage
 * bucket, under the uploader's own folder. Mirrors the auth + validation +
 * upload pattern used by `uploadAttachment` in `messaging.ts`.
 */
export async function uploadPageImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const file = formData.get("file");
    if (!(file instanceof File)) return { error: "No file provided" };

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return { error: "Unsupported file type. Please upload a JPEG, PNG, WebP, GIF, or SVG image." };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { error: "File is too large. Maximum size is 5MB." };
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filePath = `${user.id}/${crypto.randomUUID()}-${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from("page-images")
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) return { error: "Failed to upload image" };

    const { data } = supabase.storage.from("page-images").getPublicUrl(filePath);
    return { url: data.publicUrl };
  } catch {
    return { error: "Failed to upload image" };
  }
}

import { supabase } from "@/integrations/supabase/client";

/**
 * Extract the storage path from a Supabase Storage public URL.
 * Returns null if the URL doesn't match the expected pattern (e.g. external URL).
 */
export function extractStoragePath(url: string, bucket: string): string | null {
  const pattern = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(pattern);
  if (idx === -1) return null;
  return decodeURIComponent(url.substring(idx + pattern.length));
}

/**
 * Delete a file from Supabase Storage given its public URL.
 * Silently skips if the URL is external (non-Storage).
 */
export async function deleteStorageFile(bucket: string, url: string): Promise<void> {
  const path = extractStoragePath(url, bucket);
  if (!path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.warn("Storage delete failed:", error.message);
}


# Plan: Add "Remove Media" Buttons to Admin Editors (Month + Day Tasks)

## Overview

Add the ability to delete/clear uploaded images, YouTube video URLs, and audio files from both the Month Macro Editor and the Day Task Editor. For Storage-hosted files (images and audio), also delete from Supabase Storage. For YouTube URLs, simply clear the field.

---

## Approach: Extract Storage Path from Public URL (No Schema Changes)

Instead of adding new `_path` columns to the database, we can extract the storage path from the public URL. All Supabase Storage public URLs follow the pattern:
```
https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
```

A utility function `extractStoragePath(url, bucket)` will parse this and return the path for deletion. If the URL doesn't match (external URL), skip Storage deletion and just clear the field.

---

## Part 1: Storage Deletion Helper

**New file: `src/lib/storage-utils.ts`**

```typescript
export function extractStoragePath(url: string, bucket: string): string | null {
  // Match: .../storage/v1/object/public/{bucket}/{path}
  const pattern = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(pattern);
  if (idx === -1) return null;
  return url.substring(idx + pattern.length);
}

export async function deleteStorageFile(bucket: string, url: string) {
  const path = extractStoragePath(url, bucket);
  if (!path) return; // external URL, skip
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.warn("Storage delete failed:", error.message);
}
```

---

## Part 2: Admin Month Editor (`src/pages/Admin.tsx` -- MonthMacroEditor)

For each media field, when a value exists, add a red "Eliminar" button next to the upload/input:

### Image (lines 338-345)
- When `imageUrl` exists, show:
  - Thumbnail preview (already there)
  - "Eliminar imagen" button (red, Trash2 icon)
  - On click: `window.confirm("Eliminar imagen?...")` then `deleteStorageFile("task_media", imageUrl)` then `setImageUrl("")`

### Video (lines 348-362)
- When `videoUrl` exists, add a small X button next to the input to clear it
  - On click: `setVideoUrl("")` (no Storage deletion needed, it's just a YouTube URL)

### Audio (lines 365-373)
- When `audioUrl` exists (shown via AudioRecorder's `currentUrl`), add:
  - "Eliminar audio" button (red)
  - On click: confirm, then `deleteStorageFile("task_media", audioUrl)`, then `setAudioUrl("")`
- Pass a new `onRemoved` callback to AudioRecorder so it can show the delete button inline

### Save mutation
- No changes needed -- already saves `null` when fields are empty strings (`imageUrl || null`)

---

## Part 3: Admin Day Task Editor (`src/pages/AdminMonthDays.tsx` -- TaskEditor)

Same pattern for each media field:

### Image (lines 401-407)
- When `mediaImage` exists: show preview + "Eliminar imagen" button
- On delete: `deleteStorageFile("task_media", mediaImage)`, `setMediaImage("")`

### Video (lines 410-424)
- When `mediaVideo` exists: show X button to clear URL
- On clear: `setMediaVideo("")`

### Audio (lines 427-435)
- When `mediaAudio` exists: show "Eliminar audio" button
- On delete: `deleteStorageFile("task_media", mediaAudio)`, `setMediaAudio("")`

---

## Part 4: AudioRecorder -- Add `onRemoved` Callback

**File: `src/components/AudioRecorder.tsx`**

Add optional `onRemoved` prop:
```typescript
interface AudioRecorderProps {
  bucket: string;
  pathPrefix: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
  onRemoved?: () => void;  // NEW
}
```

When `currentUrl` exists and `onRemoved` is provided, show a red "Eliminar audio" button below the current audio preview. Clicking it calls `onRemoved()` (the parent handles Storage deletion and state clearing).

---

## Part 5: Confirmation UX

All destructive actions use `window.confirm()` with Spanish text:
- Image: "Eliminar imagen? Esta accion no se puede deshacer."
- Audio: "Eliminar audio? Esta accion no se puede deshacer."
- Video: no confirm needed (just clearing a URL, easily re-entered)

After deletion, UI resets to the "empty" state (upload button visible, no preview).

---

## Files Summary

| File | Action |
|---|---|
| `src/lib/storage-utils.ts` | **CREATE** -- `extractStoragePath` + `deleteStorageFile` helpers |
| `src/components/AudioRecorder.tsx` | **EDIT** -- add `onRemoved` prop + delete button |
| `src/pages/Admin.tsx` | **EDIT** -- add delete buttons for image/video/audio in MonthMacroEditor |
| `src/pages/AdminMonthDays.tsx` | **EDIT** -- add delete buttons for image/video/audio in TaskEditor |

No database migrations needed.

---

## Acceptance Criteria

- CA1: Each media field shows an "Eliminar" button when it has a value
- CA2: Deleting image/audio removes the file from Storage and clears the field
- CA3: Deleting video just clears the YouTube URL
- CA4: After deletion, the UI returns to "empty" state ready for new upload
- CA5: Destructive actions (image/audio) require confirmation dialog
- CA6: External URLs (non-Storage) are handled gracefully -- field cleared without attempting Storage deletion

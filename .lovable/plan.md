
# Plan: Standardize Media (Upload + URL) Across Admin and App + Fix Audio/Video Sources

## Overview

Two interconnected changes:

1. **Fix media sources**: Enforce that video/audio URLs are direct file URLs (mp4/mp3) or uploads to Storage. YouTube is allowed as a video fallback only, with a clear disclaimer. Admin gets validation and preview.
2. **Standardize media fields and display order**: Everywhere (Month editor, Day task editor, App modals) follows the same field order: Title, Image, Video, Audio, Text. Both Upload and URL options exist for each media type.

---

## Part 1: Admin Month Editor -- Standardized Media Fields with Validation

**File: `src/pages/Admin.tsx`** (MonthMacroEditor component, lines 269-348)

Replace the current simple text inputs for `audio_url` and `video_url` with a standardized media section:

### New field order in MonthMacroEditor:
1. **Tema** (theme text input) -- unchanged
2. **Imagen** (new field)
   - Upload image (jpg/png/webp via FileUpload to `task_media` bucket, path `months/{monthId}/image`)
   - OR paste URL
   - Show thumbnail preview if URL exists
3. **Video**
   - Upload mp4 (FileUpload to `task_media` bucket, path `months/{monthId}/video`)
   - OR paste URL (mp4 direct or YouTube)
   - Auto-detect YouTube URLs using the `getYouTubeId` regex
   - If YouTube detected: show warning badge "YouTube -- player limitado"
   - If mp4 URL or upload: show small inline `<video>` preview
4. **Audio**
   - Upload mp3/m4a/wav (FileUpload to `task_media` bucket, path `months/{monthId}/audio`)
   - OR paste URL (must end in .mp3/.m4a/.wav)
   - If URL doesn't match audio extensions: show warning "URL no parece ser audio directo"
   - Show inline `<audio>` preview element if URL exists
5. **Macro Text** (textarea) -- unchanged

### Media URL helper
Create a small utility (inline or extracted):
```typescript
const isDirectVideoUrl = (url: string) => /\.(mp4|webm|m3u8)(\?.*)?$/i.test(url);
const isYouTubeUrl = (url: string) => /youtu\.?be/.test(url);
const isDirectAudioUrl = (url: string) => /\.(mp3|m4a|wav|ogg)(\?.*)?$/i.test(url);
```

Note: Supabase Storage URLs don't end in `.mp4` -- they have the filename in the path. So we also accept any URL from the project's Supabase storage domain as valid.

### DB column for month image
The `months` table currently has `video_url`, `audio_url`, `macro_text`, `theme` but NO image column. We need to add one.

**Migration**: Add `image_url` column to `months` table:
```sql
ALTER TABLE months ADD COLUMN image_url text;
```

---

## Part 2: Admin Day Task Editor -- Standardized Media Fields

**File: `src/pages/AdminMonthDays.tsx`** (TaskEditor component, lines 283-434)

Current state: Has FileUpload for image and audio, plus a text input for video URL. The order is image, video URL, audio -- not standardized.

### Changes:
- Reorder the media section to match standard order: Image, Video, Audio
- For each media type, show BOTH options:
  - **Upload** button (FileUpload component)
  - **URL** text input (paste external URL)
  - If an upload was done, populate the URL field automatically (already happens via `onUploaded`)
- For **Video**:
  - Add FileUpload with `accept="video/mp4"` for direct upload
  - Keep URL input (accepts mp4 or YouTube)
  - Show YouTube warning if detected
  - Show inline preview: if YouTube, small embed; if mp4/upload, `<video>` tag
- For **Audio**:
  - Already has FileUpload -- keep it
  - Add URL input as alternative
  - Show inline `<audio>` preview
- For **Image**:
  - Already has FileUpload -- keep it
  - Add URL input as alternative
  - Show thumbnail preview

### Field order in TaskEditor (top to bottom):
1. Texto (titulo corto) -- the title, unchanged
2. Pilar (category select, activity only) -- unchanged
3. **Media section** (reordered):
   - Imagen: Upload + URL + preview
   - Video: Upload + URL + preview + YouTube warning
   - Audio: Upload + URL + preview
4. Explicacion (description textarea) -- moved AFTER media to match the standard order (Title, Image, Video, Audio, Text)

---

## Part 3: App -- DailyItemCard Drawer (Standardized Display Order)

**File: `src/components/DailyItemCard.tsx`** (Drawer content, lines 124-145)

Current order in the drawer:
1. Title (`task.title`)
2. Description (`task.description`)
3. Image
4. Video (YouTube iframe or native `<video>`)
5. Audio (native `<audio>`)

### New order:
1. Title
2. Image (if exists)
3. Video (if exists) -- use `CustomVideoPlayer` for direct files, YouTube iframe for YouTube URLs
4. Audio (if exists) -- use `AudioPlayer` component instead of native `<audio>`
5. Text/Description
6. "Marcar como hecha" button (unchanged)

### Media rendering improvements:
- **Video**: Replace inline YouTube detection + native `<video>` with:
  - YouTube detected: iframe with `modestbranding=1&rel=0&showinfo=0` + disclaimer text
  - Direct file: `<CustomVideoPlayer src={url} />`
- **Audio**: Replace `<audio controls>` with `<AudioPlayer src={url} />`
- Skip any media block if URL is empty/null (no empty space)

---

## Part 4: MonthDetail -- Already Correct Order, Add Image Support

**File: `src/pages/MonthDetail.tsx`**

Current order is already correct (Video, Audio, Text, CTA). Changes:

- Add **Image** rendering between Header and Video (if `month.image_url` exists):
  ```tsx
  {month.image_url && (
    <img src={month.image_url} alt="" className="w-full rounded-2xl" loading="lazy" />
  )}
  ```
- Final order: Header, Image, Video, Audio, Text, CTA

Since `months` table will have a new `image_url` column (from Part 1 migration), the `month` object fetched with `select("*")` will include it automatically after types regenerate.

---

## Part 5: Database Migration

**Single migration** adding `image_url` to months:

```sql
ALTER TABLE public.months ADD COLUMN IF NOT EXISTS image_url text;
```

No other schema changes needed. The `tasks` table already has `media_image_url`, `media_video_url`, `media_audio_url`.

---

## Part 6: Media Validation Helpers

**New file: `src/lib/media-utils.ts`**

Small utility with:
```typescript
export const isYouTubeUrl = (url: string): boolean => ...
export const getYouTubeId = (url: string): string | null => ...
export const isDirectVideoUrl = (url: string): boolean => ...
export const isDirectAudioUrl = (url: string): boolean => ...
export const getMediaWarning = (url: string, type: 'video' | 'audio'): string | null => ...
```

Used by Admin editors for validation warnings and by MonthDetail/DailyItemCard for choosing the right player.

---

## Files Summary

| File | Action |
|---|---|
| `src/lib/media-utils.ts` | **CREATE** -- media URL detection helpers |
| `src/pages/Admin.tsx` | **EDIT** -- MonthMacroEditor: add image field, reorder to Title/Image/Video/Audio/Text, add upload+URL for each, add previews and YouTube warning |
| `src/pages/AdminMonthDays.tsx` | **EDIT** -- TaskEditor: reorder media to Image/Video/Audio, add upload+URL for video, add previews, move description after media |
| `src/components/DailyItemCard.tsx` | **EDIT** -- Drawer: reorder to Title/Image/Video/Audio/Text, use CustomVideoPlayer and AudioPlayer |
| `src/pages/MonthDetail.tsx` | **EDIT** -- add image rendering before video |
| DB Migration | `ALTER TABLE months ADD COLUMN image_url text` |

---

## Acceptance Criteria

- CA1: In Month editor, Day prayer editor, and Day activity editor: Upload OR URL option exists for image, video, and audio
- CA2: Field order in Admin and App is always: Title, Image, Video, Audio, Text
- CA3: YouTube URLs for video show a warning in Admin ("player limitado") and render as iframe fallback in app
- CA4: Direct mp4 videos use CustomVideoPlayer with full custom controls (no YouTube UI)
- CA5: Direct audio files (mp3/m4a/wav) play correctly in AudioPlayer; non-audio URLs show "Audio no disponible"
- CA6: Admin shows inline preview for image (thumbnail), video (player/embed), and audio (play element)
- CA7: DailyItemCard drawer uses CustomVideoPlayer and AudioPlayer (not native controls)
- CA8: MonthDetail renders image (if exists) before video
- CA9: Invalid/missing media URLs show graceful fallback without breaking the page

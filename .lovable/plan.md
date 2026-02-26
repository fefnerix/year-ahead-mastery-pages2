
# Plan: YouTube PROGRESS Player + Audio Recorder + Premium Media Cards + Media Source Rules

## Overview

This is the combined final plan addressing four requirements:

1. **YouTubeProgressPlayer**: Custom wrapper around YouTube IFrame API with an overlay ("pelicula") blocking all YouTube interaction, plus our own PROGRESS controls bar (play, pause, seek, volume, speed, fullscreen).
2. **AudioRecorder**: In-app audio recording via MediaRecorder API + file upload tab -- the only ways to provide audio (no external URLs).
3. **Media source rules**: Photo = upload only, Video = YouTube URL only, Audio = record/upload only.
4. **Premium design**: Restyle video, audio, and text blocks in MonthDetail (and reusable elsewhere) with dark+gold premium cards.

---

## Part 1: YouTubeProgressPlayer Component

**New file: `src/components/YouTubeProgressPlayer.tsx`**

### Architecture
```text
+-----------------------------------------------+
| containerRef (Fullscreen API target)           |
|  +------------------------------------------+ |
|  | div.aspect-video (relative)              | |
|  |  +-------------------------------------+ | |
|  |  | div#yt-{id} (iframe, pointer-events: | | |
|  |  |  none)                               | | |
|  |  +-------------------------------------+ | |
|  |  +-------------------------------------+ | |
|  |  | OVERLAY ("pelicula")                 | | |
|  |  | inset:0 z-10 transparent             | | |
|  |  | pointer-events:auto                  | | |
|  |  | onClick -> toggle play/pause         | | |
|  |  | onContextMenu -> preventDefault      | | |
|  |  +-------------------------------------+ | |
|  +------------------------------------------+ |
|  +------------------------------------------+ |
|  | PROGRESS CONTROLS BAR                    | |
|  | Play | Seekbar | Time | Vol | Speed | FS | |
|  +------------------------------------------+ |
+-----------------------------------------------+
```

### YouTube IFrame API
- Load `https://www.youtube.com/iframe_api` script once globally (check `window.YT` first)
- Create player via `new YT.Player(elementId, { playerVars, events })`
- playerVars: `controls:0, disablekb:1, fs:0, rel:0, modestbranding:1, iv_load_policy:3, playsinline:1, enablejsapi:1, origin:window.location.origin`
- API methods: `playVideo()`, `pauseVideo()`, `seekTo()`, `setVolume()`, `mute()`, `unMute()`, `setPlaybackRate()`, `getCurrentTime()`, `getDuration()`, `getPlayerState()`

### Overlay
- `position:absolute; inset:0; z-index:10; background:transparent; pointer-events:auto`
- iframe gets `pointer-events:none` via inline style
- onClick toggles play/pause; onContextMenu preventDefault; center Play icon when paused

### Controls Bar
- Sits below the video area (not overlaid), inside the premium card container
- Play/Pause button, seekbar (4px track, gold fill), time display, mute toggle, speed cycling chip (0.5/1/1.25/1.5/2x), fullscreen (Fullscreen API on containerRef)
- Auto-hide after 2s of inactivity when playing

### Keyboard blocking
- Container gets `tabIndex={0}` and `onKeyDown` handler
- Intercept Space, K, J, L, F, M, arrows -- `preventDefault + stopPropagation`
- Space mapped to our play/pause

### State polling
- `setInterval(250ms)` while playing to poll `getCurrentTime()`, `getDuration()`, `getPlayerState()`

### Props
```typescript
interface YouTubeProgressPlayerProps {
  videoId: string;
}
```

### Error handling
- If API fails or video unavailable: show "Video no disponible" fallback

---

## Part 2: YouTube Type Declarations

**New file: `src/types/youtube.d.ts`**

TypeScript declarations for `YT.Player`, `YT.PlayerState`, `YT.PlayerEvent`, `YT.OnStateChangeEvent`, and the `window.onYouTubeIframeAPIReady` callback. Keeps the component type-safe.

---

## Part 3: AudioRecorder Component

**New file: `src/components/AudioRecorder.tsx`**

Two-tab widget: "Grabar" | "Subir archivo"

### Record mode
- `navigator.mediaDevices.getUserMedia({ audio: true })`
- `MediaRecorder` with mime: `audio/webm;codecs=opus` (fallback `audio/mp4` for Safari via `MediaRecorder.isTypeSupported()`)
- UI: Record button (Mic icon, gold circular) / Stop button (Square)
- During recording: elapsed time counter with pulsing dot
- After stop: `<audio>` preview with blob URL
- "Guardar audio" button: uploads blob to Storage bucket at `pathPrefix/{uuid}.webm`, calls `onUploaded(publicUrl)`

### Upload mode
- Reuse existing `FileUpload` component with `accept="audio/*"`
- After upload: show `<audio>` preview

### Props
```typescript
interface AudioRecorderProps {
  bucket: string;
  pathPrefix: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
}
```

If `currentUrl` exists, show current audio preview with "Reemplazar" option.

---

## Part 4: Premium Media Card Components

### 4a. Premium card base style (CSS utility)

Add to `src/index.css` a new utility:
```css
.premium-card {
  background: linear-gradient(
    145deg,
    hsl(230 40% 8% / 0.95),
    hsl(230 40% 5% / 0.98)
  );
  border: 1px solid hsl(43 56% 59% / 0.12);
  box-shadow: 0 2px 12px hsl(0 0% 0% / 0.3),
              inset 0 1px 0 hsl(0 0% 100% / 0.04);
}
```

### 4b. VideoCard wrapper

The `YouTubeProgressPlayer` itself will be wrapped in a premium card container with:
- `premium-card` class
- `rounded-[20px] overflow-hidden`
- No "Este video se reproduce via YouTube" text
- Skeleton placeholder while loading (aspect-video with pulse animation)

### 4c. AudioPlayer redesign (`src/components/AudioPlayer.tsx`)

Restyle the existing AudioPlayer for premium look:
- Card: `premium-card rounded-[20px] p-4`
- Title line: small uppercase label above controls
- Controls in single row: circular gold play button (40px) | thin progress bar (4px, gold gradient fill, small 8px handle on hover/drag) | time in tabular-nums | mute icon | speed chip (rounded-lg, primary/10 bg)
- Error state: premium card with centered icon + "Audio aun no disponible" text, no ugly box
- No major structural change, mostly className updates

### 4d. ExpandableTextCard component

**New file: `src/components/ExpandableTextCard.tsx`**

Replaces the current macro_text section in MonthDetail:
- `premium-card rounded-[20px] p-5`
- Text: `text-[15px] leading-[1.7] text-foreground/90 whitespace-pre-line`
- If text > 12 lines: collapsed with gradient fade at bottom + "Leer mas" button
- "Leer mas" / "Mostrar menos" toggle with chevron icon
- No internal scrollbar
- Empty state: "Contenido del mes aun no fue publicado." in muted italic

---

## Part 5: Admin Month Editor Changes

**File: `src/pages/Admin.tsx`** (MonthMacroEditor section)

Replace current media fields with:

1. **Tema** -- text input (unchanged)
2. **Imagen** -- Upload only via FileUpload. Remove any URL text input. Show thumbnail preview.
3. **Video** -- YouTube URL input only. Remove any FileUpload for MP4. Placeholder: "URL del video (YouTube)". Validate with `isYouTubeUrl()`. Show embed preview if valid. Error text if not YouTube.
4. **Audio** -- Replace FileUpload + URL input with `AudioRecorder` component (record or upload to `task_media` bucket, path `months/{monthId}/audio`).
5. **Macro Text** -- textarea (unchanged)

Save validation: if video URL is truthy and not YouTube, show error and block save.

---

## Part 6: Admin Day Task Editor Changes

**File: `src/pages/AdminMonthDays.tsx`** (TaskEditor section)

Same simplification:

1. **Titulo** (unchanged)
2. **Pilar/Category** (activity only, unchanged)
3. **Imagen** -- Upload only (FileUpload). Remove URL input if any.
4. **Video** -- YouTube URL only. Remove MP4 FileUpload. Validate YouTube. Show embed preview.
5. **Audio** -- Replace with `AudioRecorder` component (record or upload, bucket `task_media`, path `days/{dayId}/{type}/audio`).
6. **Explicacion** -- textarea (moved after media to match standard order)

---

## Part 7: MonthDetail with Premium Cards + YouTubeProgressPlayer

**File: `src/pages/MonthDetail.tsx`**

Replace current rendering with premium components:

1. Header (unchanged)
2. Image (if exists) -- `rounded-[20px]` with subtle border
3. **Video** -- `YouTubeProgressPlayer` inside a premium card container (replaces raw iframe). If `getYouTubeId()` returns null, skip.
4. **Audio** -- `AudioPlayer` (already restyled with premium card in Part 4c)
5. **Text** -- `ExpandableTextCard` component (replaces inline glass-card with scrollbar)
6. CTA button (unchanged)

Spacing: `space-y-4` instead of `space-y-6` for tighter premium feel.

---

## Part 8: DailyItemCard Drawer with YouTubeProgressPlayer

**File: `src/components/DailyItemCard.tsx`** (Drawer content)

Replace inline YouTube iframe with `YouTubeProgressPlayer`:
```tsx
{task.media_video_url && (() => {
  const ytId = getYouTubeId(task.media_video_url!);
  if (ytId) return <YouTubeProgressPlayer videoId={ytId} />;
  return null; // Only YouTube allowed
})()}
```

Replace native `<audio>` with `AudioPlayer` component.

Order enforced: Title, Image, Video, Audio, Text.

---

## Part 9: Update media-utils.ts

**File: `src/lib/media-utils.ts`**

- Update `getMediaWarning` for video: if not YouTube, return "Solo se aceptan URLs de YouTube"
- Remove audio URL warning (audio always from Storage now)
- Keep existing helpers

---

## Files Summary

| File | Action |
|---|---|
| `src/components/YouTubeProgressPlayer.tsx` | **CREATE** -- YouTube player with overlay + PROGRESS controls |
| `src/types/youtube.d.ts` | **CREATE** -- YT IFrame API type declarations |
| `src/components/AudioRecorder.tsx` | **CREATE** -- record audio + upload tab |
| `src/components/ExpandableTextCard.tsx` | **CREATE** -- collapsible text card with premium style |
| `src/index.css` | **EDIT** -- add `.premium-card` utility class |
| `src/components/AudioPlayer.tsx` | **EDIT** -- restyle with premium card design |
| `src/pages/Admin.tsx` | **EDIT** -- image upload only, video YouTube only, audio recorder |
| `src/pages/AdminMonthDays.tsx` | **EDIT** -- same media simplification |
| `src/pages/MonthDetail.tsx` | **EDIT** -- use YouTubeProgressPlayer, AudioPlayer, ExpandableTextCard |
| `src/components/DailyItemCard.tsx` | **EDIT** -- use YouTubeProgressPlayer + AudioPlayer |
| `src/lib/media-utils.ts` | **EDIT** -- simplify warnings |

No database changes needed (image_url column already added in prior migration).

---

## Acceptance Criteria

- CA1: YouTube iframe has `pointer-events:none`; overlay blocks all clicks/touches on YouTube UI
- CA2: Play/Pause only works via our button or clicking the overlay
- CA3: Seek, Volume, Speed (0.5x-2x), Fullscreen only work via our PROGRESS controls bar
- CA4: Mouse hover does not activate YouTube controls or tooltips
- CA5: `setPlaybackRate` works correctly for all 5 speeds
- CA6: Fullscreen uses Fullscreen API on our container div (not YouTube's)
- CA7: Keyboard shortcuts (Space, K, J, L, F, M, arrows) are intercepted
- CA8: Photo fields are upload-only in Admin (no URL input)
- CA9: Video fields are YouTube-URL-only in Admin (no upload)
- CA10: Audio uses AudioRecorder (record in-app or upload file) -- no external URLs
- CA11: Content order everywhere: Title, Image, Video, Audio, Text
- CA12: Video sits in a premium card with subtle gold border and rounded corners (no "iframe solto")
- CA13: Audio player is compact, single-row controls, 4px gold progress bar, circular play button
- CA14: Text uses ExpandableTextCard with "Leer mas" instead of internal scrollbar
- CA15: All cards use consistent premium-card styling (dark gradient + gold border glow)


# Plan: Complete PROGRESS Refactor

## Overview

This is the consolidated implementation covering ALL requested changes:

1. **MonthDetail page** (`/mes/:monthId`) with text, video, audio, CTA "IR A HOY"
2. **Home CTA** changes to "Ver reto del mes" pointing to `/mes/:monthId`
3. **Task media fields** (image, video, audio) in Admin CMS + rendered in app drawer
4. **Complete removal of Weeks/Retos** from Admin UI, routes, and hooks
5. **New month-based day editor** (`/admin/months/:monthId/days`) replacing week-based AdminDayTasks

---

## Part 1: Database Migration (single SQL file)

### A. Update `get_user_progress` RPC
- Add `'month_id', v_month_id` to the JSON return object
- Change the entry point: instead of `SELECT FROM weeks WHERE status = 'active'`, find the active month first via a date-based lookup or a new `is_active` flag on months
- The RPC currently starts from "active week" -- this changes to find the current day by date across all months/weeks, then derive month_id from there

### B. Add media columns to `tasks`
```text
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS media_image_url text,
  ADD COLUMN IF NOT EXISTS media_video_url text,
  ADD COLUMN IF NOT EXISTS media_audio_url text;
```

### C. Create `task_media` storage bucket
Public bucket with RLS policies: admin can upload (INSERT), authenticated users can read (SELECT).

---

## Part 2: New Page -- `src/pages/MonthDetail.tsx`

Route: `/mes/:monthId`

Layout (scrollable, dark premium theme):
- Back arrow + "PROGRESS" header
- Month title (theme) + month name
- Macro text section (conditional on `macro_text`)
- Video player via iframe (conditional on `video_url`) -- YouTube/Vimeo auto-detection
- Audio player reusing existing `AudioPlayer` component (conditional on `audio_url`)
- Gold CTA button "IR A HOY" -- uses `useProgress()` to get `day_id`, navigates to `/day/:dayId`
- BottomNav at bottom

Data source: `supabase.from("months").select("*").eq("id", monthId).single()`

---

## Part 3: Home (`src/pages/Index.tsx`) Changes

### Hero CTA
- Label: "Continuar hoy" becomes **"Ver reto del mes"**
- Link: `/day/${progress.day_id}` becomes **`/mes/${progress.month_id}`**
- Only shows if `progress.month_id` exists

### Remove `useCurrentWeekData` dependency
- Currently used for `weekData?.cover_url` (hero image) and `weekData?.name` (fallback monthTheme)
- Replace with: `monthTheme` from `progress.month_theme` only; hero image becomes gold gradient placeholder
- Remove import of `useCurrentWeekData`

### Keep "Continuar hoy" as `/day/${progress.day_id}` link
- The daily task cards already open drawers, but there's a secondary CTA in the hero -- this specific one changes to month

---

## Part 4: Router (`src/App.tsx`)

### Add new routes
```text
/mes/:monthId -> MonthDetail (auth)
/admin/months/:monthId/days -> AdminMonthDays (admin)
```

### Remove/redirect legacy routes
```text
/admin/retos/:weekId/builder -> redirect to /admin
/admin/retos/:weekId/tareas  -> redirect to /admin
```
Remove imports: `RetoBuilder`, `AdminDayTasks`

### Keep existing safe redirects
```text
/reto/:weekId/dia/:dayNumber -> ResolveLegacyDayRoute (already exists)
/reto/:weekId -> redirect to / (already exists)
/lecturas -> redirect to / (already exists)
```

---

## Part 5: Admin (`src/pages/Admin.tsx`) -- Remove Weeks/Retos

### Remove entirely (lines 237-389)
- The full "Retos / Semanas" section: week form, week cards, expanded actions, asset uploads
- All week-related state variables: `showWeekForm`, `expandedWeek`, `wName`, `wNumber`, `wObjective`, `wStartDate`, `wCover`, `wAudio`, `wScheduleImg`, `wSchedulePdf`, `wDescLong`, `wSpiritualPlaylist`, `wMentalPlaylist`
- Week-related hook calls: `useWeeks`, `useCreateWeekWithDays`, `useUpdateWeekAsset`, `useAdjustWeekDates`, `useActivateWeek`
- `handleCreateWeek` function
- Update subtitle: "Gestion de programas, meses y comunicados"

### Add per-month "Editar dias" button
- Each month card gets a button that navigates to `/admin/months/:monthId/days`

---

## Part 6: New Admin Page -- `src/pages/AdminMonthDays.tsx`

Route: `/admin/months/:monthId/days`

Replaces the old `AdminDayTasks` (which was week-based).

UI:
1. Header: "Tareas del Dia" + subtitle "Mes: {month.theme} -- {month.name}"
2. Day selector: horizontal scroll of all days in the month (fetched via `days JOIN weeks WHERE weeks.month_id = monthId`, ordered by date)
3. TaskEditor per selected day (prayer + activity) with:
   - Title (text input, required, min 5 chars)
   - Description (textarea)
   - Media uploads: 3 `FileUpload` components for image, video, audio (bucket: `task_media`)
   - Alternative text input for external video/audio URL
   - Save button
4. BottomNav

Data queries:
- Days: `SELECT d.* FROM days d JOIN weeks w ON w.id = d.week_id WHERE w.month_id = :monthId ORDER BY d.date`
- Tasks for day: same pattern as current AdminDayTasks
- Save: upsert tasks with media URLs

---

## Part 7: App -- Render Task Media in Drawer

### `src/hooks/useDayTasks.ts`
Add to `TaskWithCheck` interface:
```text
media_image_url?: string | null
media_video_url?: string | null
media_audio_url?: string | null
```
Update the select query to include these 3 columns and map them through.

### `src/components/DailyItemCard.tsx`
In the Drawer content (after description text), conditionally render:
1. Image: `<img>` with rounded corners if `media_image_url` exists
2. Video: iframe embed (YouTube/Vimeo auto-detection) or `<video>` tag if `media_video_url`
3. Audio: inline `<audio>` controls or reuse `AudioPlayer` if `media_audio_url`

---

## Part 8: Cleanup

### `src/hooks/useAdmin.ts`
Remove: `useWeeks`, `useCreateWeekWithDays`, `useUpdateWeekAsset`, `useAdjustWeekDates`, `useActivateWeek`, `ASSET_BLOCK_MAP`
Keep: `useIsAdmin`, `usePrograms`, `useMonths`, `useCreateProgram`, `useCreateMonth`, `uploadFile`

### `src/hooks/useTodayData.ts`
Add `month_id: string | null` to `ProgressData` interface.

### Files that can be deleted (already disconnected from router)
- `src/pages/Reto.tsx`
- `src/pages/Dia.tsx`
- `src/pages/Lecturas.tsx`
- `src/pages/RetoBuilder.tsx`
- `src/pages/AdminDayTasks.tsx`
- `src/hooks/useCurrentWeekData.ts`
- `src/hooks/useRetoData.ts`
- `src/hooks/useWeekBlocks.ts`
- `src/components/blocks/HeroBlock.tsx` (week-specific)

---

## Files Summary

| File | Action |
|---|---|
| SQL Migration | Update RPC (add month_id, remove week dependency), add 3 media columns, create task_media bucket |
| `src/pages/MonthDetail.tsx` | **CREATE** |
| `src/pages/AdminMonthDays.tsx` | **CREATE** |
| `src/App.tsx` | Add 2 new routes, redirect 2 admin routes, remove 2 imports |
| `src/pages/Index.tsx` | Change hero CTA to `/mes/:monthId`, remove `useCurrentWeekData` |
| `src/pages/Admin.tsx` | Remove entire Weeks/Retos section (lines 237-389), add "Editar dias" per month |
| `src/hooks/useAdmin.ts` | Remove 5 week-related hooks + ASSET_BLOCK_MAP |
| `src/hooks/useTodayData.ts` | Add `month_id` to ProgressData |
| `src/hooks/useDayTasks.ts` | Add 3 media fields to TaskWithCheck + select |
| `src/components/DailyItemCard.tsx` | Render media in drawer |
| `src/pages/RetoBuilder.tsx` | **DELETE** |
| `src/pages/AdminDayTasks.tsx` | **DELETE** |
| `src/hooks/useCurrentWeekData.ts` | **DELETE** |
| `src/hooks/useRetoData.ts` | **DELETE** |
| `src/hooks/useWeekBlocks.ts` | **DELETE** |
| `src/pages/Reto.tsx` | **DELETE** |
| `src/pages/Dia.tsx` | **DELETE** |
| `src/pages/Lecturas.tsx` | **DELETE** |

---

## Acceptance Criteria

- CA1: Home hero CTA opens `/mes/:monthId` with label "Ver reto del mes" (NEVER `/reto/:weekId`)
- CA2: MonthDetail shows text + video + audio from CMS
- CA3: All content from CMS only (no mock)
- CA4: CTA "IR A HOY" in MonthDetail navigates to `/day/:dayId`
- CA5: Admin does NOT show "Retos / Semanas" anywhere
- CA6: No route `/admin/retos/*` is accessible (redirects to /admin)
- CA7: Admin edits tasks by selecting Month then Day (not Week)
- CA8: Admin can upload image/video/audio per task
- CA9: App drawer renders task media (image, video, audio)
- CA10: Progress calculations unaffected by media
- CA11: Day listing in admin loads by month_id (via weeks join)
- CA12: No public route references weeks

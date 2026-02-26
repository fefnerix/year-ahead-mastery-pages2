
# Plan: Admin Month Grid + MonthDetail Layout + Home 3 Indicators + Diario Cleanup + Custom Players

## Overview

All pending changes consolidated into one implementation pass:

1. **Admin "Editar dias" -- full month grid** (replace weekly strip with calendar grid)
2. **MonthDetail -- reorder content** (Video, Audio, Text) + CTA "IR A HOY" navigates to "/"
3. **Home -- 3 donuts** (HOY, MES, TOTAL)
4. **Diario -- remove "Semana" grouping**, group by month only, delete old data
5. **Custom video player** (no YouTube UI for direct files)
6. **Enhanced audio player** (volume, 5 speeds, error handling)

---

## Part 1: Admin "Editar dias" -- Full Month Grid

**File: `src/pages/AdminMonthDays.tsx`** (rewrite)

### Replace the horizontal weekly scroll strip with a calendar-style month grid

Current problem: Days are shown as a horizontal scroll of buttons (LUN..DOM style), only showing days that exist in the DB. This looks and feels like a week selector.

New UI:
- 7-column grid with weekday headers: LUN MAR MIE JUE VIE SAB DOM
- Compute the full calendar for the month from `month.name` + program year (or from the `days` data dates)
- Show all calendar days 1..N where N = days in month
- Each cell shows:
  - Day number
  - Status indicator: check mark if both tasks exist (prayer + activity), dot if partial, dash if empty
  - Gold highlight for selected day
  - Muted style for days outside the month (leading/trailing blanks)
- Click a cell to select it and load the TaskEditor below

### Data changes
- Fetch month info including `name` to determine which calendar month it is
- Still fetch days via `weeks` join (unchanged query)
- For days that don't exist in DB yet: show them as empty cells (no click action, or show "Dia no creado" state)
- The task count per day can be derived from a bulk query or computed client-side after selecting

### Day status computation
- After fetching all days, also fetch task counts per day in one query:
  ```
  SELECT day_id, COUNT(*) as task_count 
  FROM tasks WHERE day_id IN (...) AND is_active = true 
  GROUP BY day_id
  ```
- Map: 0 tasks = empty, 1 task = partial, 2+ tasks = complete

### TaskEditor section (below grid) -- unchanged
- Same prayer + activity editors with media uploads
- Same save/validation logic

---

## Part 2: MonthDetail -- Reorder + CTA Fix

**File: `src/pages/MonthDetail.tsx`** (edit)

### Content reorder (currently: text, video, audio)
New order:
1. Header (back, "RETO DEL MES", title, month name) -- unchanged
2. **Video** -- moved up (currently 2nd)
3. **Audio** -- moved up (currently 3rd)  
4. **Macro text** -- moved down (currently 1st content block)
5. **CTA "IR A HOY"** -- always visible at bottom

### Fallbacks
- No video: skip video section
- No audio: skip audio section
- No macro_text: show "Contenido del mes aun no fue publicado."

### CTA behavior
- Change from `navigate(/day/${progress.day_id})` to `navigate("/")`
- Remove conditional rendering (`progress?.day_id &&`) -- button always shows
- Remove `useProgress` import (no longer needed)

### Video: use CustomVideoPlayer for direct files, YouTube iframe as fallback
- Detect YouTube URL with existing `getYouTubeId` helper
- Direct file: `<CustomVideoPlayer src={url} />`
- YouTube: iframe with `modestbranding=1&rel=0&showinfo=0` + disclaimer text

---

## Part 3: Custom Video Player

**New file: `src/components/CustomVideoPlayer.tsx`**

HTML5 `<video>` with custom controls overlay:
- Native controls disabled (`controls={false}`)
- Custom UI overlay at bottom:
  - Play/Pause button
  - Seekbar (clickable progress bar)
  - Current time / Duration
  - Volume toggle (mute/unmute)
  - Speed selector cycling: 0.5x, 1x, 1.25x, 1.5x, 2x
  - Fullscreen toggle
- Auto-hide controls after 2s of inactivity (show on hover/tap)
- Error state: `onError` shows "Video no disponible" fallback
- Icons from lucide-react: Play, Pause, Volume2, VolumeX, Maximize

---

## Part 4: Enhanced Audio Player

**File: `src/components/AudioPlayer.tsx`** (edit)

- Expand `speeds` from `[1, 1.25, 1.5]` to `[0.5, 1, 1.25, 1.5, 2]`
- Add volume toggle button (Volume2/VolumeX icons) that mutes/unmutes
- Add error handling: listen for `error` event on `<audio>`, show "Audio no disponible" fallback

---

## Part 5: Home -- 3 Donuts (HOY, MES, TOTAL)

**File: `src/components/ProgressDonut.tsx`** (edit)

- Add `totalPct` prop
- Render 3 Donut components: Hoy, Mes, Total
- Reduce donut size from 56px to 48px so 3 fit comfortably
- Fix SVG gradient ID collision: use unique IDs per donut (`gold-grad-hoy`, `gold-grad-mes`, `gold-grad-total`)
- Remove `completedCount`/`totalTasks` props

**File: `src/pages/Index.tsx`** (edit)

- Compute `totalPct = Math.min(100, Math.max(0, Math.round(progress?.year_pct ?? 0)))`
- Pass `totalPct` to `ProgressDonut`
- Remove `completedCount` and `totalTasks` props

---

## Part 6: Diario -- Remove "Semana" Grouping

**File: `src/pages/Cuaderno.tsx`** (edit)

- Flatten `groupedNotes`: remove nested `weeks` Map, use `Map<monthKey, { label, notes[] }>`
- Flatten `groupedJournal`: same pattern, `Map<monthKey, { label, entries[] }>`
- Remove `weekLabel`/`weekKey` computation
- Remove `<h3>` headers showing "Semana X -- Name" (lines 256, 289)
- Render notes/entries flat under each month `<h2>` header, sorted by date

### Data cleanup (SQL DELETE)
```sql
DELETE FROM task_notes;
DELETE FROM journal_entries;
```
Clear all legacy mock data. Diario starts empty until users create new entries.

---

## Files Summary

| File | Action |
|---|---|
| `src/pages/AdminMonthDays.tsx` | **REWRITE** -- replace weekly strip with full month calendar grid |
| `src/pages/MonthDetail.tsx` | **EDIT** -- reorder (video, audio, text), CTA -> "/", use CustomVideoPlayer |
| `src/components/CustomVideoPlayer.tsx` | **CREATE** -- custom HTML5 video player |
| `src/components/AudioPlayer.tsx` | **EDIT** -- add volume, 5 speeds, error handling |
| `src/components/ProgressDonut.tsx` | **EDIT** -- add 3rd donut (TOTAL), fix gradient IDs |
| `src/pages/Index.tsx` | **EDIT** -- pass `totalPct` |
| `src/pages/Cuaderno.tsx` | **EDIT** -- flatten grouping, remove week sub-headers |
| Data cleanup | DELETE FROM task_notes; DELETE FROM journal_entries; |

---

## Acceptance Criteria

- CA1: Admin "Editar dias" shows all days of the month in a 7-column grid (not a weekly strip)
- CA2: Each day cell shows status (complete/partial/empty)
- CA3: Clicking a day opens the task editor (prayer + activity) inline below the grid
- CA4: MonthDetail shows Video before Audio before Text
- CA5: "IR A HOY" always navigates to "/" (Home)
- CA6: CTA button always visible (no dependency on day_id)
- CA7: If no macro_text, show fallback text
- CA8: Video plays with custom player (no YouTube UI) for direct file URLs
- CA9: YouTube URLs show iframe with disclaimer
- CA10: Audio plays with volume, seek, and 5 speed options (0.5x-2x)
- CA11: Invalid media URLs show fallback without breaking
- CA12: Home shows 3 indicators: HOY, MES, TOTAL
- CA13: No "Semana" label anywhere in Home, Diario, or MonthDetail
- CA14: Diario groups entries by month only
- CA15: No old mock data in Diario after cleanup
- CA16: SVG gradient IDs don't collide across donuts

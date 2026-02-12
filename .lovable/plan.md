
# PRD Update — Plan Renacer 365 vNext

Incremental update over the existing codebase. No rebuilds, no breaking changes.

---

## Bloque 1 — Database Migrations (new tables + columns)

### 1.1 Alter `weeks` table
Add columns that don't exist yet:
- `description_long` (text, nullable) -- descripcion extendida del reto
- `spiritual_playlist_url` (text, nullable)
- `mental_playlist_url` (text, nullable)
- `status` (text, default 'published') -- draft/published

Note: `cover_url`, `audio_url`, `schedule_image_url`, `schedule_pdf_url` already exist.

### 1.2 Create `task_notes` table (Cuaderno)
- `id` (uuid, PK, default gen_random_uuid())
- `user_id` (uuid, not null)
- `task_id` (uuid, not null, FK -> tasks.id)
- `day_id` (uuid, not null, FK -> days.id)
- `content` (text, not null, default '')
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- Unique constraint: (user_id, task_id)
- RLS: users can CRUD only their own notes

### 1.3 Create `abundance_deposits` table
- `id` (uuid, PK, default gen_random_uuid())
- `user_id` (uuid, not null)
- `amount` (numeric, not null)
- `currency` (text, default 'USD')
- `date` (date, not null, default current_date)
- `note` (text, nullable)
- `created_at` (timestamptz, default now())
- RLS: users can CRUD only their own deposits

### 1.4 Create `announcements` table
- `id` (uuid, PK, default gen_random_uuid())
- `title` (text, not null)
- `body` (text, not null)
- `scope` (text, default 'global') -- global/month/week/day
- `scope_id` (uuid, nullable) -- references month/week/day if scoped
- `pinned` (boolean, default false)
- `created_by` (uuid, not null)
- `created_at` (timestamptz, default now())
- RLS: anyone can read, admin can manage

### 1.5 Create `announcement_reads` table
- `id` (uuid, PK, default gen_random_uuid())
- `user_id` (uuid, not null)
- `announcement_id` (uuid, not null, FK -> announcements.id)
- `read_at` (timestamptz, default now())
- Unique: (user_id, announcement_id)
- RLS: users can CRUD own reads

### 1.6 Update seed data for Reto 1
Update the existing seed week with:
- `description_long`: texto del Jhonny sobre el proposito
- `spiritual_playlist_url`: https://open.spotify.com/playlist/2zOZhUh6lYivxHuzH1gWhU...
- `mental_playlist_url`: https://open.spotify.com/playlist/2ddYsgu9kAwmAujfR7xpty...

---

## Bloque 2 — Home "Hoy" Redesign

### 2.1 Reorganize `src/pages/Index.tsx`
New section order:
1. Header: logo + avatar (keep existing)
2. Greeting: "Hola, {nombre}" (new)
3. Reto banner (hero card with cover, title, CTA "Continuar hoy")
4. Audio player (intro audio from current week)
5. Description colapsable ("Leer mas" with Collapsible)
6. "Tus tareas de hoy" checklist + progress bar (existing, reordered)
7. Playlist cards (spiritual + mental, open Spotify links)
8. Schedule image (from current week, with fullscreen modal)
9. Progress rings (existing, reordered)
10. Ranking semanal (existing, reordered)

### 2.2 Create `src/hooks/useCurrentWeekData.ts`
Fetch the full week data (including new columns) for the current week to power the Home hero, audio, playlists, and schedule.

---

## Bloque 3 — Cuaderno (Task Notes)

### 3.1 Update `src/pages/Dia.tsx`
When a task is checked, show an expandable textarea "Tu cuaderno (opcional)" below the task. Save/update note on blur via upsert to `task_notes`.

### 3.2 Update `src/components/DailyChecklist.tsx`
Add optional note textarea that appears when task is completed.

### 3.3 Create `src/hooks/useTaskNotes.ts`
- `useTaskNotes(dayId)`: fetch notes for all tasks of a day
- `useSaveNote()`: upsert mutation

### 3.4 Create `src/pages/Cuaderno.tsx`
- List all user's notes grouped by week/day
- Search/filter capability
- Each note shows task title, day, date, and content
- Route: `/cuaderno`

---

## Bloque 4 — Playlists (Spotify Links)

### 4.1 Create `src/components/PlaylistCard.tsx`
- Card with Spotify branding (icon)
- Title: "Vibracion Espiritual" or "Vibracion Mental"
- Two buttons: "Abrir playlist" (opens URL) and "Reproducir al azar" (opens same URL with shuffle param or just opens URL)
- Uses `window.open()` with `_blank`

### 4.2 Integrate in Home and Dia pages
- Show playlist cards in Home (between tasks and schedule)
- Show relevant playlist in Dia page context

---

## Bloque 5 — Deposito de Abundancia

### 5.1 Create `src/hooks/useDeposits.ts`
- `useDeposits()`: fetch user's deposits
- `useDepositTotal()`: sum of deposits
- `useCreateDeposit()`: insert mutation
- `useUpdateDeposit()`: update mutation
- `useDeleteDeposit()`: delete mutation

### 5.2 Create deposit card in Home
- Shows total deposited with "x100" indicator
- Button "Registrar deposito" opens modal
- Link "Ver historial" goes to /deposito

### 5.3 Create `src/pages/Deposito.tsx`
- Full history list with edit/delete
- Running total at top
- Modal for new deposit (amount, currency, date, note)
- Route: `/deposito`

---

## Bloque 6 — Admin Upgrades

### 6.1 Update `src/pages/Admin.tsx`
Add sections/tabs:
- Existing: Programs, Months, Weeks (keep)
- New fields for weeks: `description_long`, `spiritual_playlist_url`, `mental_playlist_url`, `status`
- New: Edit tasks (select week -> day -> edit task titles inline)
- New: Duplicate reto button
- New: Announcements CRUD (title, body, scope, pinned)

### 6.2 Create `src/hooks/useAnnouncements.ts`
- `useAnnouncements()`: fetch announcements
- `useCreateAnnouncement()`: insert
- `useAnnouncementReads()`: fetch reads for current user
- `useMarkRead()`: insert read

---

## Bloque 7 — Announcements in Home

### 7.1 Create `src/components/AnnouncementBanner.tsx`
- Shows pinned announcements at top of Home
- Badge for unread count
- Click to expand/read and mark as read

### 7.2 Integrate in Home
- Show between greeting and reto banner

---

## Bloque 8 — PWA Setup

### 8.1 Install `vite-plugin-pwa`
Configure in `vite.config.ts` with:
- `registerType: 'autoUpdate'`
- Manifest: name "Plan Renacer 365", theme_color "#0B0E1A", background_color "#0B0E1A"
- Icons (use existing logo)
- `navigateFallbackDenylist: [/^\/~oauth/]`

### 8.2 Offline fallback
- Cache static assets
- Show offline message when no connection

---

## Bloque 9 — Routing Updates

### 9.1 Update `src/App.tsx`
Add routes:
- `/cuaderno` (protected)
- `/deposito` (protected)

### 9.2 Update BottomNav
Add "Cuaderno" icon (BookOpen) to nav -- or keep as secondary navigation accessible from profile/menu to avoid overcrowding the bottom nav.

---

## Files Summary

### New files to create
```text
src/pages/Cuaderno.tsx
src/pages/Deposito.tsx
src/components/PlaylistCard.tsx
src/components/AnnouncementBanner.tsx
src/components/DepositCard.tsx
src/components/DepositModal.tsx
src/hooks/useTaskNotes.ts
src/hooks/useDeposits.ts
src/hooks/useAnnouncements.ts
src/hooks/useCurrentWeekData.ts
```

### Existing files to modify
```text
src/pages/Index.tsx         -- full Home redesign (layout order)
src/pages/Dia.tsx           -- add cuaderno textarea per task
src/pages/Admin.tsx         -- add week fields, task editing, announcements
src/components/DailyChecklist.tsx -- add note expansion
src/hooks/useAdmin.ts       -- add announcement + task edit mutations
src/App.tsx                 -- add new routes
vite.config.ts              -- add PWA plugin
index.html                  -- PWA meta tags (already partially done)
```

### SQL Migration (single migration)
```text
ALTER TABLE weeks ADD COLUMN description_long, spiritual_playlist_url, mental_playlist_url, status
CREATE TABLE task_notes (...)
CREATE TABLE abundance_deposits (...)
CREATE TABLE announcements (...)
CREATE TABLE announcement_reads (...)
RLS policies for all new tables
UPDATE seed week with playlists + description
```

---

## Recommended execution order

1. Database migration (all new tables + columns + RLS + seed update)
2. Home redesign with current week data hook
3. Cuaderno (task_notes + pages)
4. Playlists (components + integration)
5. Deposits (table + hooks + pages)
6. Admin upgrades (new fields + task editing + announcements CRUD)
7. Announcements in Home
8. PWA setup
9. Route updates + nav adjustments

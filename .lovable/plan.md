

# Plan: Full Data Reset + Ranking Refactor (No Weeks)

## Overview

Two main deliverables:

1. **Global data reset**: Delete all user progress, checks, streaks, leaderboard scores, and seed content. Recreate a clean program structure (12 months, no days/weeks/tasks until admin creates them).
2. **Ranking refactor**: Replace week-based tabs and scoring with HOY/MES/TOTAL model (max 2 tasks per day).

---

## Part 1: Global Data Reset (SQL)

Execute via database migration tool. Order matters due to foreign keys.

```sql
-- 1. Delete all user progress data
DELETE FROM task_checks;
DELETE FROM task_notes;
DELETE FROM journal_entries;
DELETE FROM user_streaks;
DELETE FROM leaderboard_scores;
DELETE FROM abundance_deposits;

-- 2. Delete all content (tasks -> days -> weeks -> months)
DELETE FROM content_items;
DELETE FROM week_blocks;
DELETE FROM tasks;
DELETE FROM days;
DELETE FROM weeks;
DELETE FROM months;

-- 3. Keep the program, re-seed 12 empty months
SELECT seed_program_months('a0000000-0000-0000-0000-000000000001');
```

This leaves:
- 1 program (PROGRESS 2026)
- 12 empty months (Mar-Feb) with no weeks/days/tasks
- Zero checks, zero progress

---

## Part 2: New Leaderboard RPC -- `get_leaderboard_v2`

Replace the existing `get_leaderboard` with a new version that works with scopes `day`, `month`, `total` instead of `week/month/year` period keys.

**New SQL function**: `get_leaderboard_v2(p_scope text, p_program_id uuid)`

- `p_scope`: `'day'` | `'month'` | `'total'`
- Calculates points directly from `task_checks` JOIN `tasks` (where `is_active=true`) JOIN `days` JOIN `weeks` JOIN `months`
- Scope filtering:
  - `day`: `d.date = today (America/Sao_Paulo timezone)`
  - `month`: `m.id = current month for today`
  - `total`: `m.program_id = p_program_id` (all months)
- Returns: `user_id, display_name, points, days_completed, rank`
- Points: 1 per completed task + 1 bonus per complete day (2/2)
- No week-based logic at all

**New SQL function**: `get_my_ranking_summary(p_user_id uuid, p_program_id uuid)`

Returns a single JSON with:
- `today_points` (0-3: up to 2 tasks + 1 bonus)
- `month_points` (sum for current month)
- `total_points` (sum for program)
- `today_pct`, `month_pct`, `total_pct`
- `streak_days` (consecutive days with 2/2 completed)
- `max_streak`
- `position` (rank in total leaderboard)

Both functions use `(now() AT TIME ZONE 'America/Sao_Paulo')::date` for "today".

---

## Part 3: Update `useLeaderboard.ts`

Replace the hook to use the new RPC:

- `useLeaderboard(scope: "day" | "month" | "total")` -- calls `get_leaderboard_v2`
- `useRankingSummary()` -- calls `get_my_ranking_summary`
- Remove `getCurrentPeriodKey` function (no longer needed)
- Remove `useCalculateScore` (points calculated on-the-fly now, no stored scores)

---

## Part 4: Refactor `Ranking.tsx`

### Tabs
Replace `["Semana", "Reto", "General"]` with `["Hoy", "Mes", "Total"]`

### "Mi Progreso" Card
- Show 3 metrics: HOY points, MES points, TOTAL points
- Keep Racha (streak) but label it "Dias consecutivos (2/2)"
- Remove "Semana %" and "Record semanal"
- Keep certification bar but label "Certificacion del ciclo"

### Leaderboard List
- Show position, display_name, points for selected scope
- Same top-10 + current user logic

### Rules Card
Update to:
- Cada tarea completada = 1 punto
- Dia completo (2/2) = +1 punto bono
- Maximo por dia = 3 puntos

---

## Part 5: Update `Index.tsx` -- Remove `useCalculateScore`

Since scoring is now calculated on-the-fly:
- Remove `useCalculateScore` import and usage from `handleCompleteDay`
- Keep `updateStreak` call (streak still calculated on demand)
- The "Concluir Dia" button just calls `updateStreak`

---

## Part 6: Update `useTodayData.ts` -- Remove `useStreak` dependency on stored scores

- `useStreak` stays the same (reads from `user_streaks` table)
- `useUpdateStreak` stays the same (calls `update_user_streak` RPC)

The streak RPC already works correctly with `is_active=true` filter.

---

## Files Summary

| File | Action |
|---|---|
| DB Migration | **CREATE** -- Reset data + new RPCs `get_leaderboard_v2` and `get_my_ranking_summary` |
| `src/hooks/useLeaderboard.ts` | **REWRITE** -- New hooks for v2 RPCs, remove period key logic |
| `src/pages/Ranking.tsx` | **REWRITE** -- HOY/MES/TOTAL tabs, new Mi Progreso card, updated rules |
| `src/pages/Index.tsx` | **EDIT** -- Remove `useCalculateScore` usage |

---

## Acceptance Criteria

- CA1: No task appears as completed after reset (0 checks in DB)
- CA2: HOY/MES/TOTAL show 0% on Home
- CA3: No seed content appears ("Oracion teste", "Ve a misa" all gone)
- CA4: Calendar shows 12 empty months (structure only)
- CA5: Ranking tabs are HOY/MES/TOTAL (no "Semana" or "Reto")
- CA6: Scoring is 1 point per task, +1 bonus for 2/2 day, max 3/day
- CA7: No week-based logic anywhere in Ranking
- CA8: Leaderboard calculates points on-the-fly from task_checks (no stored scores needed)
- CA9: After publishing new content via Admin and completing tasks, ranking updates correctly


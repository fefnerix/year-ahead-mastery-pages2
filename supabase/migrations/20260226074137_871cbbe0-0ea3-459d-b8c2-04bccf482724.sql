
-- 1. Add year column to months
ALTER TABLE public.months ADD COLUMN IF NOT EXISTS year integer;

-- 2. Update existing months with correct years
-- Months 3-12 belong to 2026, month 1 (Jan) belongs to 2027
UPDATE public.months SET year = 2026 WHERE program_id = 'a0000000-0000-0000-0000-000000000001' AND number >= 2;
UPDATE public.months SET year = 2027 WHERE program_id = 'a0000000-0000-0000-0000-000000000001' AND number = 1;

-- 3. Update program dates
UPDATE public.programs SET start_date = '2026-02-01', end_date = '2027-03-31', name = 'PROGRESS 2026' WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- 4. Insert missing months: Feb 2027 and Mar 2027
INSERT INTO public.months (program_id, number, name, year)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 2, 'Febrero', 2027),
  ('a0000000-0000-0000-0000-000000000001', 3, 'Marzo', 2027);

-- 5. Update seed_program_months to handle year-aware cycle (Feb→Mar next year)
CREATE OR REPLACE FUNCTION public.seed_program_months(p_program_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_start_year int;
  v_month_numbers int[] := ARRAY[2,3,4,5,6,7,8,9,10,11,12,1,2,3];
  v_month_names text[] := ARRAY[
    'Febrero','Marzo','Abril','Mayo','Junio','Julio',
    'Agosto','Septiembre','Octubre','Noviembre','Diciembre',
    'Enero','Febrero','Marzo'
  ];
  v_years int[];
  i int;
  v_existing int;
BEGIN
  SELECT p.year INTO v_start_year FROM programs p WHERE p.id = p_program_id;
  IF v_start_year IS NULL THEN v_start_year := 2026; END IF;

  -- months 2-12 belong to start_year, months 1-3 (last 3) belong to start_year+1
  v_years := ARRAY[
    v_start_year, v_start_year, v_start_year, v_start_year, v_start_year,
    v_start_year, v_start_year, v_start_year, v_start_year, v_start_year,
    v_start_year, v_start_year+1, v_start_year+1, v_start_year+1
  ];

  FOR i IN 1..14 LOOP
    SELECT COUNT(*) INTO v_existing
    FROM months
    WHERE program_id = p_program_id 
      AND number = v_month_numbers[i] 
      AND year = v_years[i];
    
    IF v_existing = 0 THEN
      INSERT INTO months (program_id, number, name, year)
      VALUES (p_program_id, v_month_numbers[i], v_month_names[i], v_years[i]);
    END IF;
  END LOOP;
END;
$function$;

-- 6. Update get_year_calendar to use year column and order by cycle
CREATE OR REPLACE FUNCTION public.get_year_calendar(p_user_id uuid, p_year integer)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(row_to_json(r) ORDER BY r.cycle_order) INTO v_result
  FROM (
    SELECT
      m.id AS month_id,
      m.number AS month_number,
      m.name AS month_name,
      COALESCE(m.theme, '') AS month_theme,
      COALESCE(m.year, p_year) AS month_year,
      COALESCE(
        ROUND((COUNT(tc.id)::numeric / NULLIF(COUNT(t.id), 0)) * 100),
        0
      )::int AS month_pct,
      -- Order: Feb2026=0, Mar2026=1, ..., Dec2026=10, Jan2027=11, Feb2027=12, Mar2027=13
      ((COALESCE(m.year, p_year) - p_year) * 12 + m.number - 2) AS cycle_order
    FROM months m
    JOIN programs pr ON pr.id = m.program_id AND pr.year = p_year
    LEFT JOIN weeks w ON w.month_id = m.id
    LEFT JOIN days d ON d.week_id = w.id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    GROUP BY m.id, m.number, m.name, m.theme, m.year
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

-- 7. Update get_my_ranking_summary to find current month by year+number
CREATE OR REPLACE FUNCTION public.get_my_ranking_summary(p_user_id uuid, p_program_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_today date;
  v_current_month_id uuid;
  v_today_points int := 0;
  v_month_points int := 0;
  v_total_points int := 0;
  v_today_max int := 0;
  v_month_max int := 0;
  v_total_max int := 0;
  v_streak int := 0;
  v_max_streak int := 0;
  v_position int := 0;
  v_check_date date;
  v_day_tasks int;
  v_day_checks int;
BEGIN
  v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;

  -- Current month by year+number
  SELECT m.id INTO v_current_month_id
  FROM months m
  WHERE m.program_id = p_program_id 
    AND m.number = EXTRACT(MONTH FROM v_today)::int
    AND m.year = EXTRACT(YEAR FROM v_today)::int
  LIMIT 1;

  -- Today points
  SELECT COALESCE(SUM(checks), 0)::int + COALESCE(SUM(CASE WHEN checks = total AND total > 0 THEN 1 ELSE 0 END), 0)::int
  INTO v_today_points
  FROM (
    SELECT d.id, COUNT(tc.id)::int AS checks,
      (SELECT COUNT(*) FROM tasks t2 WHERE t2.day_id = d.id AND t2.is_active = true)::int AS total
    FROM days d JOIN weeks w ON w.id = d.week_id JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.date = v_today GROUP BY d.id
  ) x;

  SELECT COALESCE(SUM(total), 0)::int + COALESCE(SUM(CASE WHEN total > 0 THEN 1 ELSE 0 END), 0)::int
  INTO v_today_max
  FROM (
    SELECT d.id, COUNT(t.id)::int AS total
    FROM days d JOIN weeks w ON w.id = d.week_id JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    WHERE d.date = v_today GROUP BY d.id
  ) x;

  -- Month points
  SELECT COALESCE(SUM(checks), 0)::int + COALESCE(SUM(CASE WHEN checks = total AND total > 0 THEN 1 ELSE 0 END), 0)::int
  INTO v_month_points
  FROM (
    SELECT d.id, COUNT(tc.id)::int AS checks,
      (SELECT COUNT(*) FROM tasks t2 WHERE t2.day_id = d.id AND t2.is_active = true)::int AS total
    FROM days d JOIN weeks w ON w.id = d.week_id JOIN months m ON m.id = w.month_id AND m.id = v_current_month_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.date <= v_today GROUP BY d.id
  ) x;

  SELECT COALESCE(SUM(total), 0)::int + COALESCE(SUM(CASE WHEN total > 0 THEN 1 ELSE 0 END), 0)::int
  INTO v_month_max
  FROM (
    SELECT d.id, COUNT(t.id)::int AS total
    FROM days d JOIN weeks w ON w.id = d.week_id JOIN months m ON m.id = w.month_id AND m.id = v_current_month_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    WHERE d.date <= v_today GROUP BY d.id
  ) x;

  -- Total points
  SELECT COALESCE(SUM(checks), 0)::int + COALESCE(SUM(CASE WHEN checks = total AND total > 0 THEN 1 ELSE 0 END), 0)::int
  INTO v_total_points
  FROM (
    SELECT d.id, COUNT(tc.id)::int AS checks,
      (SELECT COUNT(*) FROM tasks t2 WHERE t2.day_id = d.id AND t2.is_active = true)::int AS total
    FROM days d JOIN weeks w ON w.id = d.week_id JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.date <= v_today GROUP BY d.id
  ) x;

  SELECT COALESCE(SUM(total), 0)::int + COALESCE(SUM(CASE WHEN total > 0 THEN 1 ELSE 0 END), 0)::int
  INTO v_total_max
  FROM (
    SELECT d.id, COUNT(t.id)::int AS total
    FROM days d JOIN weeks w ON w.id = d.week_id JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    WHERE d.date <= v_today GROUP BY d.id
  ) x;

  -- Streak
  v_check_date := v_today;
  LOOP
    SELECT
      COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.day_id = d.id AND t.is_active = true), 0)::int,
      COALESCE((SELECT COUNT(*) FROM task_checks tc JOIN tasks t ON t.id = tc.task_id AND t.is_active = true WHERE tc.day_id = d.id AND tc.user_id = p_user_id), 0)::int
    INTO v_day_tasks, v_day_checks
    FROM days d JOIN weeks w ON w.id = d.week_id JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
    WHERE d.date = v_check_date LIMIT 1;
    IF NOT FOUND OR v_day_tasks = 0 OR v_day_checks < v_day_tasks THEN EXIT; END IF;
    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  SELECT COALESCE(us.max_streak, 0) INTO v_max_streak FROM user_streaks us WHERE us.user_id = p_user_id;
  IF NOT FOUND THEN v_max_streak := 0; END IF;
  IF v_streak > v_max_streak THEN v_max_streak := v_streak; END IF;

  -- Position
  SELECT COALESCE(pos, 0)::int INTO v_position
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY points DESC) AS pos
    FROM (
      SELECT tc.user_id,
        COUNT(tc.id)::int + COUNT(DISTINCT CASE
          WHEN (SELECT COUNT(*) FROM task_checks tc2 JOIN tasks t3 ON t3.id = tc2.task_id AND t3.is_active = true WHERE tc2.day_id = tc.day_id AND tc2.user_id = tc.user_id)
             = (SELECT COUNT(*) FROM tasks t4 WHERE t4.day_id = tc.day_id AND t4.is_active = true)
          AND (SELECT COUNT(*) FROM tasks t5 WHERE t5.day_id = tc.day_id AND t5.is_active = true) > 0
          THEN tc.day_id END)::int AS points
      FROM task_checks tc JOIN tasks t ON t.id = tc.task_id AND t.is_active = true
      JOIN days d ON d.id = tc.day_id JOIN weeks w ON w.id = d.week_id
      JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
      GROUP BY tc.user_id
    ) scores
  ) ranked WHERE user_id = p_user_id;
  IF NOT FOUND THEN v_position := 0; END IF;

  RETURN json_build_object(
    'today_points', v_today_points, 'month_points', v_month_points, 'total_points', v_total_points,
    'today_pct', CASE WHEN v_today_max > 0 THEN ROUND((v_today_points::numeric / v_today_max) * 100) ELSE 0 END,
    'month_pct', CASE WHEN v_month_max > 0 THEN ROUND((v_month_points::numeric / v_month_max) * 100) ELSE 0 END,
    'total_pct', CASE WHEN v_total_max > 0 THEN ROUND((v_total_points::numeric / v_total_max) * 100) ELSE 0 END,
    'streak', v_streak, 'max_streak', v_max_streak, 'position', v_position
  );
END;
$function$;

-- 8. Update get_leaderboard_v2 to find current month by year+number
CREATE OR REPLACE FUNCTION public.get_leaderboard_v2(p_scope text, p_program_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
  v_today date;
  v_current_month_id uuid;
BEGIN
  v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;

  IF p_scope IN ('day', 'month') THEN
    SELECT m.id INTO v_current_month_id
    FROM months m
    WHERE m.program_id = p_program_id
      AND m.number = EXTRACT(MONTH FROM v_today)::int
      AND m.year = EXTRACT(YEAR FROM v_today)::int
    LIMIT 1;
  END IF;

  SELECT json_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT sub.user_id, COALESCE(p.display_name, 'Anónimo') AS display_name,
      sub.points, sub.days_completed,
      ROW_NUMBER() OVER (ORDER BY sub.points DESC, sub.days_completed DESC) AS position
    FROM (
      SELECT tc.user_id, COUNT(tc.id)::int AS raw_checks,
        COUNT(tc.id)::int + COUNT(DISTINCT CASE
          WHEN day_total.total_tasks > 0 AND day_total.total_tasks = day_done.done_tasks THEN tc.day_id END)::int AS points,
        COUNT(DISTINCT CASE
          WHEN day_total.total_tasks > 0 AND day_total.total_tasks = day_done.done_tasks THEN tc.day_id END)::int AS days_completed
      FROM task_checks tc
      JOIN tasks t ON t.id = tc.task_id AND t.is_active = true
      JOIN days d ON d.id = tc.day_id
      JOIN weeks w ON w.id = d.week_id
      JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
      LEFT JOIN LATERAL (SELECT COUNT(t2.id)::int AS total_tasks FROM tasks t2 WHERE t2.day_id = tc.day_id AND t2.is_active = true) day_total ON true
      LEFT JOIN LATERAL (SELECT COUNT(tc2.id)::int AS done_tasks FROM task_checks tc2 JOIN tasks t3 ON t3.id = tc2.task_id AND t3.is_active = true WHERE tc2.day_id = tc.day_id AND tc2.user_id = tc.user_id) day_done ON true
      WHERE CASE
        WHEN p_scope = 'day' THEN d.date = v_today
        WHEN p_scope = 'month' THEN m.id = v_current_month_id
        ELSE true
      END
      GROUP BY tc.user_id
    ) sub
    LEFT JOIN profiles p ON p.user_id = sub.user_id
    ORDER BY sub.points DESC, sub.days_completed DESC
    LIMIT 20
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

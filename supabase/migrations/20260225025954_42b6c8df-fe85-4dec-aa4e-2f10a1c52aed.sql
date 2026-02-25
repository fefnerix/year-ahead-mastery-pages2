
-- Phase 1: Fix get_month_calendar - remove /5 hardcode, filter is_active
CREATE OR REPLACE FUNCTION public.get_month_calendar(p_user_id uuid, p_month_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
  v_today date;
BEGIN
  v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;

  SELECT json_agg(row_to_json(r) ORDER BY r.day_number) INTO v_result
  FROM (
    SELECT
      d.id AS day_id,
      d.date,
      d.week_id,
      d.number AS day_number,
      w.name AS week_name,
      w.number AS week_number,
      COALESCE(
        ROUND((COUNT(tc.id)::numeric / NULLIF(COUNT(t.id), 0)) * 100),
        0
      )::int AS day_pct,
      CASE
        WHEN d.date > v_today THEN 'future'
        WHEN COUNT(t.id) > 0 AND COUNT(tc.id) = COUNT(t.id) THEN 'complete'
        WHEN COUNT(tc.id) > 0 THEN 'partial'
        ELSE 'pending'
      END AS status
    FROM days d
    JOIN weeks w ON w.id = d.week_id AND w.month_id = p_month_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    GROUP BY d.id, d.date, d.week_id, d.number, w.name, w.number
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

-- Phase 1: Fix get_user_progress - filter is_active
CREATE OR REPLACE FUNCTION public.get_user_progress(p_user_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_day_id UUID;
  v_week_id UUID;
  v_month_id UUID;
  v_program_id UUID;
  v_day_pct NUMERIC := 0;
  v_week_pct NUMERIC := 0;
  v_month_pct NUMERIC := 0;
  v_year_pct NUMERIC := 0;
  v_day_number INTEGER := 0;
  v_week_name TEXT := '';
  v_month_theme TEXT := '';
BEGIN
  SELECT w.id, w.month_id, COALESCE(w.name, '')
    INTO v_week_id, v_month_id, v_week_name
  FROM weeks w WHERE w.status = 'active' LIMIT 1;

  IF v_week_id IS NULL THEN
    RETURN json_build_object('day_id', NULL, 'day_pct', 0, 'week_pct', 0, 'month_pct', 0, 'year_pct', 0, 'day_number', 0, 'week_name', '', 'month_theme', '');
  END IF;

  SELECT d.id, d.number INTO v_day_id, v_day_number
  FROM days d WHERE d.week_id = v_week_id AND d.unlock_date <= p_date
  ORDER BY d.number DESC LIMIT 1;

  IF v_day_id IS NULL THEN
    SELECT d.id, d.number INTO v_day_id, v_day_number
    FROM days d WHERE d.week_id = v_week_id ORDER BY d.number ASC LIMIT 1;
  END IF;

  IF v_day_id IS NULL THEN
    RETURN json_build_object('day_id', NULL, 'day_pct', 0, 'week_pct', 0, 'month_pct', 0, 'year_pct', 0, 'day_number', 0, 'week_name', v_week_name, 'month_theme', '');
  END IF;

  SELECT m.program_id, COALESCE(m.theme, '') INTO v_program_id, v_month_theme
  FROM months m WHERE m.id = v_month_id;

  -- Day pct (active tasks only)
  SELECT COALESCE(ROUND((COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id),0)) * 100), 0)
    INTO v_day_pct
  FROM tasks t
  LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
  WHERE t.day_id = v_day_id AND t.is_active = true;

  -- Week pct (active tasks only)
  WITH day_progress AS (
    SELECT d.id AS day_id,
           COALESCE(ROUND((COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id),0)) * 100), 0) AS day_pct
    FROM days d
    JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.week_id = v_week_id AND d.unlock_date <= p_date
    GROUP BY d.id
  )
  SELECT COALESCE(ROUND(AVG(day_pct)), v_day_pct) INTO v_week_pct FROM day_progress;

  -- Month pct (active tasks only)
  WITH week_progress AS (
    SELECT w.id AS week_id,
           COALESCE(ROUND(AVG(dp.day_pct)), 0) AS week_pct
    FROM weeks w
    JOIN (
      SELECT d.week_id, d.id AS day_id,
             COALESCE(ROUND((COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id),0)) * 100), 0) AS day_pct
      FROM days d
      JOIN tasks t ON t.day_id = d.id AND t.is_active = true
      LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
      WHERE d.unlock_date <= p_date
      GROUP BY d.week_id, d.id
    ) dp ON dp.week_id = w.id
    WHERE w.month_id = v_month_id
    GROUP BY w.id
  )
  SELECT COALESCE(ROUND(AVG(week_pct)), 0) INTO v_month_pct FROM week_progress;

  -- Year pct (active tasks only)
  WITH month_progress AS (
    SELECT m.id AS month_id,
           COALESCE(ROUND(AVG(wp.week_pct)), 0) AS month_pct
    FROM months m
    LEFT JOIN (
      SELECT w.month_id,
             COALESCE(ROUND(AVG(dp.day_pct)), 0) AS week_pct
      FROM weeks w
      JOIN (
        SELECT d.week_id, d.id AS day_id,
               COALESCE(ROUND((COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id),0)) * 100), 0) AS day_pct
        FROM days d
        JOIN tasks t ON t.day_id = d.id AND t.is_active = true
        LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
        WHERE d.unlock_date <= p_date
        GROUP BY d.week_id, d.id
      ) dp ON dp.week_id = w.id
      GROUP BY w.month_id
    ) wp ON wp.month_id = m.id
    WHERE m.program_id = v_program_id
    GROUP BY m.id
  )
  SELECT COALESCE(ROUND(AVG(month_pct)), 0) INTO v_year_pct FROM month_progress;

  RETURN json_build_object(
    'day_id', v_day_id, 'day_pct', v_day_pct, 'week_pct', v_week_pct,
    'month_pct', v_month_pct, 'year_pct', v_year_pct,
    'day_number', v_day_number, 'week_name', v_week_name, 'month_theme', v_month_theme
  );
END;
$function$;

-- Phase 1: Fix get_year_calendar - filter is_active
CREATE OR REPLACE FUNCTION public.get_year_calendar(p_user_id uuid, p_year integer)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(row_to_json(r) ORDER BY r.month_number) INTO v_result
  FROM (
    SELECT
      m.id AS month_id,
      m.number AS month_number,
      m.name AS month_name,
      COALESCE(m.theme, '') AS month_theme,
      COALESCE(
        ROUND((COUNT(tc.id)::numeric / NULLIF(COUNT(t.id), 0)) * 100),
        0
      )::int AS month_pct
    FROM months m
    JOIN programs pr ON pr.id = m.program_id AND pr.year = p_year
    LEFT JOIN weeks w ON w.month_id = m.id
    LEFT JOIN days d ON d.week_id = w.id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    GROUP BY m.id, m.number, m.name, m.theme
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

-- Phase 2: Unique constraint on task_checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'task_checks_user_task_unique'
  ) THEN
    -- Remove duplicates first keeping the earliest
    DELETE FROM public.task_checks tc1
    USING public.task_checks tc2
    WHERE tc1.user_id = tc2.user_id
      AND tc1.task_id = tc2.task_id
      AND tc1.checked_at > tc2.checked_at;

    ALTER TABLE public.task_checks
      ADD CONSTRAINT task_checks_user_task_unique UNIQUE (user_id, task_id);
  END IF;
END $$;

-- Phase 3: New RPC get_week_days_progress
CREATE OR REPLACE FUNCTION public.get_week_days_progress(p_user_id uuid, p_week_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
  v_today date;
BEGIN
  v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;

  SELECT json_agg(row_to_json(r) ORDER BY r.number) INTO v_result
  FROM (
    SELECT
      d.id,
      d.number,
      d.date,
      d.unlock_date,
      COUNT(t.id)::int AS tasks_total,
      COUNT(tc.id)::int AS tasks_completed,
      (d.unlock_date <= v_today) AS is_unlocked,
      (d.date = v_today) AS is_today
    FROM days d
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.week_id = p_week_id
    GROUP BY d.id, d.number, d.date, d.unlock_date
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

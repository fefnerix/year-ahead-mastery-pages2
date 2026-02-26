
-- Rewrite get_user_progress to find current month/day by year+month_number matching today
CREATE OR REPLACE FUNCTION public.get_user_progress(p_user_id uuid, p_date date DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_today date;
  v_month_id UUID;
  v_day_id UUID;
  v_program_id UUID;
  v_day_pct NUMERIC := 0;
  v_week_pct NUMERIC := 0;
  v_month_pct NUMERIC := 0;
  v_year_pct NUMERIC := 0;
  v_day_number INTEGER := 0;
  v_week_name TEXT := '';
  v_month_theme TEXT := '';
BEGIN
  v_today := COALESCE(p_date, (now() AT TIME ZONE 'America/Sao_Paulo')::date);

  -- Find the current month by matching year + month_number to today's date
  SELECT m.id, m.program_id, COALESCE(m.theme, '')
    INTO v_month_id, v_program_id, v_month_theme
  FROM months m
  WHERE m.year = EXTRACT(YEAR FROM v_today)::int
    AND m.number = EXTRACT(MONTH FROM v_today)::int
  LIMIT 1;

  IF v_month_id IS NULL THEN
    RETURN json_build_object(
      'day_id', NULL, 'month_id', NULL, 'day_pct', 0, 'week_pct', 0,
      'month_pct', 0, 'year_pct', 0, 'day_number', 0, 'week_name', '', 'month_theme', ''
    );
  END IF;

  -- Find today's day by date match (through weeks -> days)
  SELECT d.id, d.number
    INTO v_day_id, v_day_number
  FROM days d
  JOIN weeks w ON w.id = d.week_id AND w.month_id = v_month_id
  WHERE d.date = v_today
  LIMIT 1;

  -- Get week name if day found
  IF v_day_id IS NOT NULL THEN
    SELECT COALESCE(w.name, '') INTO v_week_name
    FROM days d JOIN weeks w ON w.id = d.week_id
    WHERE d.id = v_day_id;
  END IF;

  -- Day pct
  IF v_day_id IS NOT NULL THEN
    SELECT COALESCE(ROUND((COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id),0)) * 100), 0)
      INTO v_day_pct
    FROM tasks t
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE t.day_id = v_day_id AND t.is_active = true;
  END IF;

  -- Month pct (all days in this month up to today)
  SELECT COALESCE(ROUND(AVG(day_pct)), 0) INTO v_month_pct
  FROM (
    SELECT d.id,
      COALESCE(ROUND((COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id),0)) * 100), 0) AS day_pct
    FROM days d
    JOIN weeks w ON w.id = d.week_id AND w.month_id = v_month_id
    JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.date <= v_today
    GROUP BY d.id
  ) dp;

  -- Year pct (all months in program up to today)
  SELECT COALESCE(ROUND(AVG(mp)), 0) INTO v_year_pct
  FROM (
    SELECT m2.id,
      COALESCE(ROUND(AVG(day_pct)), 0) AS mp
    FROM months m2
    LEFT JOIN (
      SELECT w.month_id, d.id AS day_id,
        COALESCE(ROUND((COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id),0)) * 100), 0) AS day_pct
      FROM days d
      JOIN weeks w ON w.id = d.week_id
      JOIN tasks t ON t.day_id = d.id AND t.is_active = true
      LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
      WHERE d.date <= v_today
      GROUP BY w.month_id, d.id
    ) dp ON dp.month_id = m2.id
    WHERE m2.program_id = v_program_id
    GROUP BY m2.id
    HAVING COUNT(dp.day_id) > 0
  ) mp_sub;

  -- Week pct (days in same week as today's day)
  IF v_day_id IS NOT NULL THEN
    SELECT COALESCE(ROUND(AVG(day_pct)), v_day_pct) INTO v_week_pct
    FROM (
      SELECT d.id,
        COALESCE(ROUND((COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id),0)) * 100), 0) AS day_pct
      FROM days d
      JOIN tasks t ON t.day_id = d.id AND t.is_active = true
      LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
      WHERE d.week_id = (SELECT d2.week_id FROM days d2 WHERE d2.id = v_day_id)
        AND d.date <= v_today
      GROUP BY d.id
    ) wp;
  END IF;

  RETURN json_build_object(
    'day_id', v_day_id, 'month_id', v_month_id, 'day_pct', v_day_pct, 'week_pct', v_week_pct,
    'month_pct', v_month_pct, 'year_pct', v_year_pct,
    'day_number', COALESCE(v_day_number, 0), 'week_name', v_week_name, 'month_theme', v_month_theme
  );
END;
$function$;

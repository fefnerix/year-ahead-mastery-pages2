
CREATE OR REPLACE FUNCTION public.get_user_progress(p_user_id UUID, p_date date DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date;
  v_month_id UUID;
  v_day_id UUID;
  v_program_id UUID;
  v_day_pct NUMERIC := 0;
  v_month_pct NUMERIC := 0;
  v_year_pct NUMERIC := 0;
  v_day_number INTEGER := 0;
  v_week_name TEXT := '';
  v_month_theme TEXT := '';
  v_today_done INT := 0;
  v_month_done INT := 0;
  v_total_done INT := 0;
BEGIN
  v_today := COALESCE(p_date, (now() AT TIME ZONE 'America/Sao_Paulo')::date);

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

  SELECT d.id, d.number INTO v_day_id, v_day_number
  FROM days d JOIN weeks w ON w.id = d.week_id AND w.month_id = v_month_id
  WHERE d.date = v_today LIMIT 1;

  IF v_day_id IS NOT NULL THEN
    SELECT COALESCE(w.name, '') INTO v_week_name
    FROM days d JOIN weeks w ON w.id = d.week_id WHERE d.id = v_day_id;
  END IF;

  -- HOY: done / 2
  IF v_day_id IS NOT NULL THEN
    SELECT COUNT(DISTINCT tc.task_id)::int INTO v_today_done
    FROM task_checks tc
    JOIN tasks t ON t.id = tc.task_id AND t.is_active = true
    WHERE tc.day_id = v_day_id AND tc.user_id = p_user_id;

    v_day_pct := LEAST(100, ROUND((v_today_done::numeric / 2) * 100));
  END IF;

  -- MES: done / 60 (30 days * 2)
  SELECT COUNT(DISTINCT tc.task_id)::int INTO v_month_done
  FROM task_checks tc
  JOIN tasks t ON t.id = tc.task_id AND t.is_active = true
  JOIN days d ON d.id = tc.day_id
  JOIN weeks w ON w.id = d.week_id AND w.month_id = v_month_id
  WHERE tc.user_id = p_user_id;

  v_month_pct := LEAST(100, ROUND((v_month_done::numeric / 60) * 100, 1));

  -- TOTAL: done / 730 (365 days * 2)
  SELECT COUNT(DISTINCT tc.task_id)::int INTO v_total_done
  FROM task_checks tc
  JOIN tasks t ON t.id = tc.task_id AND t.is_active = true
  JOIN days d ON d.id = tc.day_id
  JOIN weeks w ON w.id = d.week_id
  JOIN months m ON m.id = w.month_id AND m.program_id = v_program_id
  WHERE tc.user_id = p_user_id;

  v_year_pct := LEAST(100, ROUND((v_total_done::numeric / 730) * 100, 1));

  RETURN json_build_object(
    'day_id', v_day_id, 'month_id', v_month_id, 'day_pct', v_day_pct, 'week_pct', 0,
    'month_pct', v_month_pct, 'year_pct', v_year_pct,
    'day_number', COALESCE(v_day_number, 0), 'week_name', v_week_name, 'month_theme', v_month_theme
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_progress(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  -- 1) pega a WEEK ativa (single source of truth)
  SELECT w.id, w.month_id, w.name
    INTO v_week_id, v_month_id, v_week_name
  FROM weeks w
  WHERE w.status = 'active'
  LIMIT 1;

  IF v_week_id IS NULL THEN
    RETURN json_build_object(
      'day_id', NULL, 'day_pct', 0, 'week_pct', 0, 'month_pct', 0, 'year_pct', 0,
      'day_number', 0, 'week_name', '', 'month_theme', ''
    );
  END IF;

  -- 2) pega o dia atual como o ÚLTIMO desbloqueado dentro da week ativa
  SELECT d.id, d.number
    INTO v_day_id, v_day_number
  FROM days d
  WHERE d.week_id = v_week_id
    AND d.unlock_date <= p_date
  ORDER BY d.number DESC
  LIMIT 1;

  IF v_day_id IS NULL THEN
    RETURN json_build_object(
      'day_id', NULL, 'day_pct', 0, 'week_pct', 0, 'month_pct', 0, 'year_pct', 0,
      'day_number', 0, 'week_name', v_week_name, 'month_theme', ''
    );
  END IF;

  -- month/program
  SELECT m.program_id, m.theme INTO v_program_id, v_month_theme
  FROM months m
  WHERE m.id = v_month_id;

  -- 3) Day progress
  SELECT COALESCE(
    ROUND(COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id), 0) * 100),
    0
  ) INTO v_day_pct
  FROM tasks t
  LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
  WHERE t.day_id = v_day_id;

  -- 4) Week progress (somente dias desbloqueados)
  SELECT COALESCE(ROUND(AVG(day_pct)), 0) INTO v_week_pct
  FROM (
    SELECT d.id,
      COALESCE(ROUND(COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id), 0) * 100), 0) AS day_pct
    FROM days d
    JOIN tasks t ON t.day_id = d.id
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.week_id = v_week_id AND d.unlock_date <= p_date
    GROUP BY d.id
  ) sub;

  -- 5) Month progress
  SELECT COALESCE(ROUND(AVG(week_pct)), 0) INTO v_month_pct
  FROM (
    SELECT w.id,
      COALESCE(ROUND(AVG(day_pct)), 0) AS week_pct
    FROM weeks w
    JOIN days d ON d.week_id = w.id AND d.unlock_date <= p_date
    JOIN tasks t ON t.day_id = d.id
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE w.month_id = v_month_id
    GROUP BY w.id
  ) sub;

  -- 6) Year progress
  SELECT COALESCE(ROUND(AVG(month_pct)), 0) INTO v_year_pct
  FROM (
    SELECT m.id,
      COALESCE(ROUND(AVG(
        COALESCE((
          SELECT ROUND(AVG(day_pct))
          FROM (
            SELECT COALESCE(ROUND(COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id), 0) * 100), 0) AS day_pct
            FROM days d2
            JOIN tasks t ON t.day_id = d2.id
            LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
            WHERE d2.week_id = w.id AND d2.unlock_date <= p_date
            GROUP BY d2.id
          ) wd
        ), 0)
      )), 0) AS month_pct
    FROM months m
    JOIN weeks w ON w.month_id = m.id
    WHERE m.program_id = v_program_id
    GROUP BY m.id
  ) sub;

  RETURN json_build_object(
    'day_id', v_day_id,
    'day_pct', v_day_pct,
    'week_pct', v_week_pct,
    'month_pct', v_month_pct,
    'year_pct', v_year_pct,
    'day_number', v_day_number,
    'week_name', v_week_name,
    'month_theme', v_month_theme
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_year_calendar(p_user_id UUID, p_year INT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      LEAST(100, ROUND(
        (COUNT(DISTINCT tc.task_id)::numeric / 60) * 100, 1
      ))::numeric AS month_pct,
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
$$;
